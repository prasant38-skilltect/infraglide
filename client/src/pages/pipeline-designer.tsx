import * as React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
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
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import Sidebar from "@/components/layout/sidebar";
import ComponentLibrary from "@/components/pipeline/component-library";
import PropertiesPanel from "@/components/pipeline/properties-panel";

import DeployPipelineModal from "@/components/modals/deploy-pipeline-modal";
import EditPipelineModal from "@/components/modals/edit-pipeline-modal";
import VersionConflictModal from "@/components/modals/version-conflict-modal";
import CredentialSelectionModal from "@/components/modals/credential-selection-modal";
import AddCredentialModal from "@/components/modals/add-credential-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Rocket,
  ZoomIn,
  ZoomOut,
  Maximize,
  Edit3,
  Trash2,
  Upload,
  Download,
  CheckCircle,
  Eye,
  Plus,
  Zap,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { CloudComponentNode } from "@/components/pipeline/cloud-components";
import { validateComponent, getValidationErrors } from "@/lib/pipeline-utils";
import type { Pipeline, ComponentConfig, Credential } from "@shared/schema";

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
  const [showVersionConflictModal, setShowVersionConflictModal] =
    useState(false);
  const [showCredentialSelectionModal, setShowCredentialSelectionModal] =
    useState(false);
  const [showAddCredentialModal, setShowAddCredentialModal] = useState(false);
  const [conflictData, setConflictData] = useState<{
    exists: boolean;
    latestVersion: number;
    nextVersion: number;
  } | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(
    new Set(),
  );
  
  // Track if we've imported data to prevent auto-generation from overriding it
  const hasImportedData = useRef(false);

  // Generate automatic pipeline name with current date and time
  const generatePipelineName = () => {
    const now = new Date();
    const dateTime = now
      .toISOString()
      .slice(0, 19)
      .replace(/[T:]/g, "-")
      .replace(/-/g, "");
    return `newPipeline_${dateTime}`;
  };

  // Capture the canvas as an image
  const captureCanvasSnapshot = useCallback(async (): Promise<
    string | null
  > => {
    if (!reactFlowInstance) return null;

    try {
      // Get the viewport element
      const viewportElement = document.querySelector(".react-flow__viewport");
      if (!viewportElement) return null;

      // Use html2canvas to capture the canvas
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(viewportElement as HTMLElement, {
        backgroundColor: "#ffffff",
        scale: 0.5, // Reduce size for storage efficiency
        useCORS: true,
        allowTaint: true,
      });

      // Convert to base64
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Failed to capture canvas:", error);
      return null;
    }
  }, [reactFlowInstance]);

  // Always hide the sidebar when entering pipeline designer
  useEffect(() => {
    setIsSidebarCollapsed(true);
  }, []);

  // Check for imported pipeline data from sessionStorage
  useEffect(() => {
    const importedData = sessionStorage.getItem("importedPipelineData");

    if (importedData && !pipelineId) {
      // Only load if not editing an existing pipeline
      try {
        const pipelineData = JSON.parse(importedData);

        // Set pipeline metadata
        setPipelineName(pipelineData.name);
        setPipelineDescription(pipelineData.description || "");
        setPipelineRegion(pipelineData.region || "us-east-1");
        
        // Mark that we've imported data
        hasImportedData.current = true;

        // Load components to canvas
        if (
          Array.isArray(pipelineData.components) &&
          pipelineData.components.length > 0
        ) {
          const loadedNodes = pipelineData.components.map(
            (component: ComponentConfig) => ({
              id: component.id,
              type: "cloudComponent",
              position: component.position,
              data: {
                type: component.type,
                name: component.name,
                config: component.config,
                validationError: false,
              },
            }),
          );
          setNodes(loadedNodes);
        }

        // Load connections
        if (
          Array.isArray(pipelineData.connections) &&
          pipelineData.connections.length > 0
        ) {
          const loadedEdges = pipelineData.connections.map(
            (connection: any) => ({
              id: connection.id,
              source: connection.source,
              target: connection.target,
              type: "smoothstep",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: "#6b7280",
              },
              style: {
                strokeWidth: 2,
                stroke: "#6b7280",
              },
            }),
          );
          setEdges(loadedEdges);
        }

        // Clear validation errors
        setValidationErrors(new Set());

        // Clear sessionStorage to prevent reloading on refresh
        sessionStorage.removeItem("importedPipelineData");

        toast({
          title: "Pipeline imported successfully",
          description: `${pipelineData.name} has been loaded in the designer.`,
        });
      } catch (error) {
        console.error("Failed to load imported pipeline:", error);
        sessionStorage.removeItem("importedPipelineData");
        toast({
          title: "Import failed",
          description: "Failed to load imported pipeline data.",
          variant: "destructive",
        });
      }
    }
  }, [pipelineId, toast]);

  // Load existing pipeline if editing
  const { data: pipeline } = useQuery<Pipeline>({
    queryKey: ["/api/pipelines", pipelineId],
    enabled: !!pipelineId,
  });

  // Load credentials for validation
  const { data: credentials = [] } = useQuery<Credential[]>({
    queryKey: ["/api/credentials"],
  });

  // Load pipeline data into the canvas
  useEffect(() => {
    if (pipeline) {
      setPipelineName(pipeline.name);
      console.log("Line No 200:", pipeline.name);
      setPipelineDescription(pipeline.description || "");
      setPipelineRegion(pipeline.region);

      if (Array.isArray(pipeline.components)) {
        const loadedNodes = pipeline.components.map(
          (component: ComponentConfig) => ({
            id: component.id,
            type: "cloudComponent",
            position: component.position,
            data: {
              type: component.type,
              name: component.name,
              config: component.config,
              validationError: false, // Don't show validation errors until validate is clicked
            },
          }),
        );
        setNodes(loadedNodes);

        // Clear validation errors for loaded components
        setValidationErrors(new Set());
      }

      if (Array.isArray(pipeline.connections)) {
        const loadedEdges = pipeline.connections.map((connection: any) => ({
          id: connection.id,
          source: connection.source,
          target: connection.target,
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: "#6b7280",
          },
          style: {
            strokeWidth: 2,
            stroke: "#6b7280",
          },
        }));
        setEdges(loadedEdges);
      }
    } else if (!pipelineId && pipelineName === "New Pipeline" && !hasImportedData.current) {
      // Auto-generate name for new pipelines (only if still using default name and haven't imported)
      setPipelineName(generatePipelineName());
    }
  }, [pipeline, setNodes, setEdges]);

  const checkPipelineNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest(
        "GET",
        `/api/pipelines/check-name/${encodeURIComponent(name)}`,
      );
      return response.json();
    },
  });

  const savePipelineMutation = useMutation({
    mutationFn: async (pipelineData: any) => {
      const url = pipelineId
        ? `/api/pipelines/${pipelineId}`
        : "/api/pipelines";
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
      const response = await apiRequest(
        "POST",
        "/api/deployments",
        deploymentData,
      );
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
      // Add arrow marker to all new connections
      const connectionWithArrow = {
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#6b7280",
        },
        style: {
          strokeWidth: 2,
          stroke: "#6b7280",
        },
        type: "smoothstep",
      };
      setEdges((eds) => addEdge(connectionWithArrow, eds));
      setHasUnsavedChanges(true);
    },
    [setEdges],
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
          validationError: false, // New nodes don't show validation error until validate is clicked
        },
      };

      setNodes((nds) => nds.concat(newNode));

      setHasUnsavedChanges(true);
    },
    [reactFlowInstance, setNodes],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowPropertiesPanel(true);
  }, []);

  const onUpdateNodeConfig = useCallback(
    (nodeId: string, config: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, config } };
          }
          return node;
        }),
      );
      setHasUnsavedChanges(true);
    },
    [setNodes],
  );

  const onClosePropertiesPanel = useCallback(() => {
    setShowPropertiesPanel(false);
    setSelectedNode(null);
  }, []);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
      setSelectedNode(null);
      setHasUnsavedChanges(true);
    },
    [setNodes, setEdges],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Delete" && selectedNode) {
        handleDeleteNode(selectedNode.id);
      }
    },
    [selectedNode, handleDeleteNode],
  );

  const validateAllComponents = useCallback(() => {
    const errors = new Set<string>();
    const invalidComponents: string[] = [];

    // Validate all nodes
    nodes.forEach((node) => {
      const componentConfig = {
        id: node.id,
        type: node.data.type,
        name: node.data.name,
        config: node.data.config || {},
        position: node.position,
      };

      const isValid = validateComponent(componentConfig);
      if (!isValid) {
        errors.add(node.id);
        invalidComponents.push(node.data.name);
      }
    });

    // Update validation errors state
    setValidationErrors(errors);

    // Update nodes with validation error flags
    setNodes((prevNodes) =>
      prevNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          validationError: errors.has(node.id),
        },
      })),
    );

    // Show toast message
    if (errors.size > 0) {
      toast({
        title: "Validation Failed",
        description: `Please fill mandatory fields for: ${invalidComponents.join(", ")}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Validation Successful",
        description: "All components are properly configured.",
      });
    }
  }, [nodes, setNodes, toast]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Listen for custom delete events from context menu
  useEffect(() => {
    const handleDeleteEvent = (event: CustomEvent) => {
      const { nodeId } = event.detail;
      handleDeleteNode(nodeId);
    };

    window.addEventListener("deleteNode", handleDeleteEvent as EventListener);
    return () =>
      window.removeEventListener(
        "deleteNode",
        handleDeleteEvent as EventListener,
      );
  }, [handleDeleteNode]);

  const getCloudProvider = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) return "Unknown";

    const firstNode = nodes[0];
    const componentType = firstNode.data.type;

    if (componentType.startsWith("gcp-")) return "GCP";
    if (componentType.startsWith("azure-")) return "Azure";
    return "AWS";
  };

  const handleSavePipeline = async () => {
    // If editing existing pipeline, save directly
    if (pipelineId) {
      // Capture canvas snapshot
      const snapshot = await captureCanvasSnapshot();

      const pipelineData = {
        name: pipelineName,
        description: pipelineDescription,
        region: pipelineRegion,
        snapshot: snapshot,
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
          type: edge.type || "default",
        })),
      };
      savePipelineMutation.mutate(pipelineData);
      return;
    }

    // For new pipelines, first check name conflicts
    try {
      const checkResult =
        await checkPipelineNameMutation.mutateAsync(pipelineName);

      if (checkResult.exists) {
        // Show conflict modal
        setConflictData(checkResult);
        setShowVersionConflictModal(true);
      } else {
        // Name is unique, now check credentials
        await handleCredentialValidation();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check pipeline name. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCredentialValidation = async () => {
    const provider = getCloudProvider(nodes);
    const providerCredentials = credentials.filter(
      (cred) => cred.provider === provider,
    );

    if (providerCredentials.length > 0) {
      // Show credential selection modal
      setShowCredentialSelectionModal(true);
    } else {
      // Show add credential modal
      setShowAddCredentialModal(true);
    }
  };

  const handleCredentialSelected = (credential: Credential) => {
    setShowCredentialSelectionModal(false);
    savePipelineWithCredential(credential);
  };

  const handleCredentialAdded = (credential: Credential) => {
    setShowAddCredentialModal(false);
    savePipelineWithCredential(credential);
  };

  const savePipelineWithCredential = async (credential: Credential) => {
    // Capture canvas snapshot
    const snapshot = await captureCanvasSnapshot();

    const pipelineData = {
      name: pipelineName,
      description: pipelineDescription,
      region: pipelineRegion,
      version: 1,
      snapshot: snapshot,
      credentialName: credential.name,
      credentialUsername: credential.username,
      credentialPassword: credential.password,
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
        type: edge.type || "default",
      })),
    };
    savePipelineMutation.mutate(pipelineData);
  };

  // Update the credential handlers to use the correct save function
  const [isVersionConflictFlow, setIsVersionConflictFlow] = useState(false);

  const handleCredentialValidationWrapper = async () => {
    await handleCredentialValidation();
  };

  const handleCredentialSelectedWrapper = (credential: Credential) => {
    setShowCredentialSelectionModal(false);
    if (isVersionConflictFlow) {
      saveNewVersionWithCredential(credential);
      setIsVersionConflictFlow(false);
    } else {
      savePipelineWithCredential(credential);
    }
  };

  const handleCredentialAddedWrapper = (credential: Credential) => {
    setShowAddCredentialModal(false);
    if (isVersionConflictFlow) {
      saveNewVersionWithCredential(credential);
      setIsVersionConflictFlow(false);
    } else {
      savePipelineWithCredential(credential);
    }
  };

  const handleEditPipeline = (name: string, description: string) => {
    setPipelineName(name);
    console.log("Line No 609:", name);
    setPipelineDescription(description);
  };

  const handleEditName = () => {
    setShowEditModal(true);
  };

  const handleSaveNewVersion = async () => {
    if (!conflictData) return;

    // Close version conflict modal first
    setShowVersionConflictModal(false);
    setIsVersionConflictFlow(true);

    // Now proceed with credential validation
    await handleCredentialValidation();
  };

  const saveNewVersionWithCredential = async (credential: Credential) => {
    if (!conflictData) return;

    // Capture canvas snapshot
    const snapshot = await captureCanvasSnapshot();

    const pipelineData = {
      name: pipelineName,
      description: pipelineDescription,
      region: pipelineRegion,
      version: conflictData.nextVersion,
      snapshot: snapshot,
      credentialName: credential.name,
      credentialUsername: credential.username,
      credentialPassword: credential.password,
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
        type: edge.type || "default",
      })),
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
        node.id === nodeId ? { ...node, data: { ...node.data, config } } : node,
      ),
    );
  };



  const handleExportPipeline = async () => {
    try {
      // Capture canvas snapshot
      const snapshot = await captureCanvasSnapshot();

      // Convert nodes to ComponentConfig format
      const components = nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        name: node.data.name || node.data.type,
        position: node.position,
        config: node.data.config || {},
      }));

      // Convert edges to connection format
      const connections = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || "default",
      }));

      // Create pipeline object matching database schema
      const pipelineData = {
        id: null, // Will be set when saved to database
        name: pipelineName || "",
        description: pipelineDescription || "",
        version: 1,
        projectId: null,
        region: pipelineRegion || "",
        components: components,
        connections: connections,
        snapshot: snapshot || "",
        credentialName: "",
        credentialUsername: "",
        credentialPassword: "",
        isTemplate: false,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(pipelineData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `${(pipelineName || "pipeline").replace(/\s+/g, "_")}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      toast({
        title: "Pipeline exported",
        description: `${pipelineName || "Pipeline"} has been exported successfully.`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "Failed to export pipeline. Please try again.",
        variant: "destructive",
      });
    }
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
                <h2 className="text-2xl font-bold text-gray-900">
                  Pipeline Designer
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Design and deploy your multi-cloud infrastructure
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {showComponentLibrary && <ComponentLibrary />}

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            {/* Canvas Toolbar */}
            <div className="bg-gray-100 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {pipelineName}
                      </span>
                      {pipelineDescription && (
                        <span className="text-sm text-gray-600">
                          {pipelineDescription}
                        </span>
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
                      onClick={() =>
                        toast({
                          title: "Publish",
                          description: "Publishing functionality coming soon",
                        })
                      }
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Publish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPipeline}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast({
                          title: "Import",
                          description: "Import functionality coming soon",
                        })
                      }
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Import
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={validateAllComponents}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Validate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast({
                          title: "Preview",
                          description: "Preview functionality coming soon",
                        })
                      }
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSavePipeline}
                      disabled={savePipelineMutation.isPending}
                    >
                      {savePipelineMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-1" />
                      )}
                      {savePipelineMutation.isPending
                        ? "Creating..."
                        : "Create"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeployModal(true)}
                      disabled={
                        !pipelineId || createDeploymentMutation.isPending
                      }
                    >
                      <Rocket className="w-4 h-4 mr-1" />
                      {createDeploymentMutation.isPending
                        ? "Deploying..."
                        : "Deploy"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        toast({
                          title: "Destroy",
                          description: "Destroy functionality coming soon",
                        })
                      }
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
                    onClick={() =>
                      setShowComponentLibrary(!showComponentLibrary)
                    }
                    title={
                      showComponentLibrary
                        ? "Hide components"
                        : "Show components"
                    }
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
                  backgroundImage:
                    "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <Controls />
                <Background />
              </ReactFlow>
            </div>
          </div>

          {showPropertiesPanel && selectedNode && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <PropertiesPanel
                  node={selectedNode}
                  onUpdateConfig={onUpdateNodeConfig}
                  onClose={onClosePropertiesPanel}
                />
              </div>
            </div>
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

      <VersionConflictModal
        isOpen={showVersionConflictModal}
        onClose={() => setShowVersionConflictModal(false)}
        pipelineName={pipelineName}
        latestVersion={conflictData?.latestVersion || 0}
        nextVersion={conflictData?.nextVersion || 1}
        onEditName={handleEditName}
        onSaveNewVersion={handleSaveNewVersion}
      />

      <CredentialSelectionModal
        open={showCredentialSelectionModal}
        onClose={() => setShowCredentialSelectionModal(false)}
        onSelect={handleCredentialSelectedWrapper}
        credentials={credentials.filter(
          (cred) => cred.provider === getCloudProvider(nodes),
        )}
        provider={getCloudProvider(nodes)}
      />

      <AddCredentialModal
        open={showAddCredentialModal}
        onClose={() => setShowAddCredentialModal(false)}
        onAdd={handleCredentialAddedWrapper}
        provider={getCloudProvider(nodes)}
      />
    </div>
  );
}
