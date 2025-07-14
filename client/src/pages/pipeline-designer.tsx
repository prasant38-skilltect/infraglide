import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

import Sidebar from "@/components/layout/sidebar";
import ComponentLibrary from "@/components/pipeline/component-library";
import PropertiesPanel from "@/components/pipeline/properties-panel";

import DeployPipelineModal from "@/components/modals/deploy-pipeline-modal";
import EditPipelineModal from "@/components/modals/edit-pipeline-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Rocket, ZoomIn, ZoomOut, Maximize, Edit3, Trash2, Upload, Download, CheckCircle, Eye, Plus, Zap, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { CloudComponentNode } from "@/components/pipeline/cloud-components";
import type { Pipeline, ComponentConfig } from "@shared/schema";

const nodeTypes: NodeTypes = {
  cloudComponent: CloudComponentNode,
};

export default function PipelineDesigner() {
  const params = useParams();
  const pipelineId = params.id ? parseInt(params.id) : null;
  const { toast } = useToast();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [pipelineName, setPipelineName] = useState("New Pipeline");
  const [pipelineDescription, setPipelineDescription] = useState("");
  const [pipelineRegion, setPipelineRegion] = useState("us-east-1");

  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Generate automatic pipeline name with current date and time
  const generatePipelineName = () => {
    const now = new Date();
    const dateTime = now.toISOString().slice(0, 19).replace(/[T:]/g, '-').replace(/-/g, '');
    return `newPipeline_${dateTime}`;
  };

  // Always hide the sidebar when entering pipeline designer
  useEffect(() => {
    setIsSidebarCollapsed(true);
  }, []);



  // Load existing pipeline if editing
  const { data: pipeline } = useQuery<Pipeline>({
    queryKey: ["/api/pipelines", pipelineId],
    enabled: !!pipelineId,
  });

  // Load pipeline data into the canvas
  useEffect(() => {
    if (pipeline) {
      setPipelineName(pipeline.name);
      setPipelineDescription(pipeline.description || "");
      setPipelineRegion(pipeline.region);
      
      if (Array.isArray(pipeline.components)) {
        const loadedNodes = pipeline.components.map((component: ComponentConfig) => ({
          id: component.id,
          type: "cloudComponent",
          position: component.position,
          data: {
            type: component.type,
            name: component.name,
            config: component.config,
          },
        }));
        setNodes(loadedNodes);
      }

      if (Array.isArray(pipeline.connections)) {
        const loadedEdges = pipeline.connections.map((connection: any) => ({
          id: connection.id,
          source: connection.source,
          target: connection.target,
          type: "default",
        }));
        setEdges(loadedEdges);
      }
    } else if (!pipelineId) {
      // Auto-generate name for new pipelines
      setPipelineName(generatePipelineName());
    }
  }, [pipeline, setNodes, setEdges]);

  const savePipelineMutation = useMutation({
    mutationFn: async (pipelineData: any) => {
      const url = pipelineId ? `/api/pipelines/${pipelineId}` : "/api/pipelines";
      const method = pipelineId ? "PUT" : "POST";
      const response = await apiRequest(method, url, pipelineData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pipeline saved",
        description: "Your pipeline has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines"] });

      setHasUnsavedChanges(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save pipeline. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createDeploymentMutation = useMutation({
    mutationFn: async (deploymentData: any) => {
      const response = await apiRequest("POST", "/api/deployments", deploymentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deployment started",
        description: "Your pipeline deployment has been initiated.",
      });
      setShowDeployModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start deployment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      setHasUnsavedChanges(true);
    },
    [setEdges]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      const type = event.dataTransfer.getData("application/reactflow");
      
      if (typeof type === "undefined" || !type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: "cloudComponent",
        position,
        data: {
          type,
          name: `${type.toUpperCase()}-${Math.random().toString(36).substr(2, 6)}`,
          config: {},
        },
      };

      setNodes((nds) => {
        const updatedNodes = nds.concat(newNode);
        // Auto-save after adding component
        setTimeout(() => autoSavePipeline(updatedNodes, edges), 1000);
        return updatedNodes;
      });
      setHasUnsavedChanges(true);
    },
    [reactFlowInstance, setNodes, edges, pipelineName, pipelineRegion]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowPropertiesPanel(true);
  }, []);

  const onUpdateNodeConfig = useCallback((nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, config } } : node
      )
    );
    setHasUnsavedChanges(true);
  }, [setNodes]);

  const onClosePropertiesPanel = useCallback(() => {
    setShowPropertiesPanel(false);
    setSelectedNode(null);
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    setHasUnsavedChanges(true);
  }, [setNodes, setEdges]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' && selectedNode) {
      handleDeleteNode(selectedNode.id);
    }
  }, [selectedNode, handleDeleteNode]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Listen for custom delete events from context menu
  useEffect(() => {
    const handleDeleteEvent = (event: CustomEvent) => {
      const { nodeId } = event.detail;
      handleDeleteNode(nodeId);
    };

    window.addEventListener('deleteNode', handleDeleteEvent as EventListener);
    return () => window.removeEventListener('deleteNode', handleDeleteEvent as EventListener);
  }, [handleDeleteNode]);

  const autoSavePipeline = (currentNodes: Node[], currentEdges: any[]) => {
    if (currentNodes.length === 0) return; // Don't save empty pipelines
    
    const cloudProvider = getCloudProvider(currentNodes);
    const versionNumber = Date.now(); // Use timestamp for unique versions
    
    const pipelineData = {
      name: `${cloudProvider}_Pipeline_${versionNumber}`,
      description: `Auto-saved ${cloudProvider} pipeline - ${new Date().toLocaleString()}`,
      region: pipelineRegion,
      components: currentNodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        name: node.data.name,
        position: node.position,
        config: node.data.config || {},
      })),
      connections: currentEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default',
      })),
    };

    // Use the mutation to save pipeline
    savePipelineMutation.mutate(pipelineData);
  };

  const getCloudProvider = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) return 'Unknown';
    
    const firstNode = nodes[0];
    const componentType = firstNode.data.type;
    
    if (componentType.startsWith('gcp-')) return 'GCP';
    if (componentType.startsWith('azure-')) return 'Azure';
    return 'AWS';
  };

  const handleSavePipeline = () => {
    const pipelineData = {
      name: pipelineName,
      description: pipelineDescription,
      region: pipelineRegion,
      components: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        name: node.data.name,
        position: node.position,
        config: node.data.config || {},
      })),
      connections: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default',
      })),
    };

    savePipelineMutation.mutate(pipelineData);
  };

  const handleEditPipeline = (name: string, description: string) => {
    setPipelineName(name);
    setPipelineDescription(description);
  };

  const handleDeployPipeline = (deploymentData: any) => {
    if (!pipelineId) {
      toast({
        title: "Error",
        description: "Please save the pipeline before deploying.",
        variant: "destructive",
      });
      return;
    }

    createDeploymentMutation.mutate({
      pipelineId,
      ...deploymentData,
    });
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {!isSidebarCollapsed && <Sidebar />}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isSidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarCollapsed(false)}
                >
                  <Menu className="w-4 h-4" />
                </Button>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Pipeline Designer</h2>
                <p className="text-sm text-gray-600 mt-1">Design and deploy your multi-cloud infrastructure</p>
              </div>
            </div>

          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {showComponentLibrary && (
            <ComponentLibrary 
              hasUnsavedChanges={hasUnsavedChanges}
              onSavePrompt={() => handleSavePipeline()}
            />
          )}
          
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            {/* Canvas Toolbar */}
            <div className="bg-gray-100 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{pipelineName}</span>
                      {pipelineDescription && (
                        <span className="text-sm text-gray-600">{pipelineDescription}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast({ title: "Publish", description: "Publishing functionality coming soon" })}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Publish
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast({ title: "Export", description: "Export functionality coming soon" })}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast({ title: "Import", description: "Import functionality coming soon" })}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Import
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast({ title: "Validate", description: "Validation functionality coming soon" })}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Validate
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast({ title: "Preview", description: "Preview functionality coming soon" })}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast({ title: "Create", description: "Create functionality coming soon" })}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Create
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDeployModal(true)}
                      disabled={!pipelineId || createDeploymentMutation.isPending}
                    >
                      <Rocket className="w-4 h-4 mr-1" />
                      {createDeploymentMutation.isPending ? "Deploying..." : "Deploy"}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => toast({ title: "Destroy", description: "Destroy functionality coming soon" })}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Destroy
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reactFlowInstance?.zoomOut()}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    {Math.round((reactFlowInstance?.getZoom() || 1) * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reactFlowInstance?.zoomIn()}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reactFlowInstance?.fitView()}
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                  {selectedNode && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteNode(selectedNode.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComponentLibrary(!showComponentLibrary)}
                    title={showComponentLibrary ? "Hide components" : "Show components"}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  {!isSidebarCollapsed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSidebarCollapsed(true)}
                      title="Hide sidebar"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* React Flow Canvas */}
            <div className="flex-1 bg-gray-50">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-gray-50"
                style={{
                  backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <Controls />
                <Background />
              </ReactFlow>
            </div>
          </div>

          {showPropertiesPanel && selectedNode && (
            <PropertiesPanel
              node={selectedNode}
              onUpdateConfig={onUpdateNodeConfig}
              onClose={onClosePropertiesPanel}
            />
          )}
        </div>
      </div>



      <DeployPipelineModal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
        onDeploy={handleDeployPipeline}
        pipelineId={pipelineId}
      />

      <EditPipelineModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditPipeline}
        initialName={pipelineName}
        initialDescription={pipelineDescription}
      />
    </div>
  );
}
