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
import SavePipelineModal from "@/components/modals/save-pipeline-modal";
import DeployPipelineModal from "@/components/modals/deploy-pipeline-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Rocket, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { AWSComponentNode } from "@/components/pipeline/aws-components";
import type { Pipeline, ComponentConfig } from "@shared/schema";

const nodeTypes: NodeTypes = {
  awsComponent: AWSComponentNode,
};

export default function PipelineDesigner() {
  const params = useParams();
  const pipelineId = params.id ? parseInt(params.id) : null;
  const { toast } = useToast();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [pipelineName, setPipelineName] = useState("New Pipeline");
  const [pipelineRegion, setPipelineRegion] = useState("us-east-1");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Load existing pipeline if editing
  const { data: pipeline } = useQuery<Pipeline>({
    queryKey: ["/api/pipelines", pipelineId],
    enabled: !!pipelineId,
  });

  // Load pipeline data into the canvas
  useEffect(() => {
    if (pipeline) {
      setPipelineName(pipeline.name);
      setPipelineRegion(pipeline.region);
      
      if (Array.isArray(pipeline.components)) {
        const loadedNodes = pipeline.components.map((component: ComponentConfig) => ({
          id: component.id,
          type: "awsComponent",
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
      setShowSaveModal(false);
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
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
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
        type: "awsComponent",
        position,
        data: {
          type,
          name: `${type.toUpperCase()}-${Math.random().toString(36).substr(2, 6)}`,
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleSavePipeline = () => {
    const pipelineData = {
      name: pipelineName,
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
        type: edge.type,
      })),
      projectId: 1, // Default project
    };

    savePipelineMutation.mutate(pipelineData);
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
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pipeline Designer</h2>
              <p className="text-sm text-gray-600 mt-1">Design and deploy your AWS infrastructure</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setShowSaveModal(true)}
                disabled={savePipelineMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {savePipelineMutation.isPending ? "Saving..." : "Save Pipeline"}
              </Button>
              <Button 
                onClick={() => setShowDeployModal(true)}
                disabled={!pipelineId || createDeploymentMutation.isPending}
              >
                <Rocket className="w-4 h-4 mr-2" />
                {createDeploymentMutation.isPending ? "Deploying..." : "Deploy Pipeline"}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <ComponentLibrary />
          
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            {/* Canvas Toolbar */}
            <div className="bg-gray-100 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Input
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    placeholder="Pipeline Name"
                    className="w-64"
                  />
                  <Select value={pipelineRegion} onValueChange={setPipelineRegion}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">us-east-1</SelectItem>
                      <SelectItem value="us-west-2">us-west-2</SelectItem>
                      <SelectItem value="eu-west-1">eu-west-1</SelectItem>
                      <SelectItem value="ap-southeast-1">ap-southeast-1</SelectItem>
                    </SelectContent>
                  </Select>
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

          {selectedNode && (
            <PropertiesPanel
              node={selectedNode}
              onUpdateConfig={updateNodeConfig}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      </div>

      <SavePipelineModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSavePipeline}
        pipelineName={pipelineName}
        setPipelineName={setPipelineName}
      />

      <DeployPipelineModal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
        onDeploy={handleDeployPipeline}
        pipelineId={pipelineId}
      />
    </div>
  );
}
