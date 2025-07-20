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
import ConsoleLog from "@/components/ui/console-log";

import DeployPipelineModal from "@/components/modals/deploy-pipeline-modal";
import EditPipelineModal from "@/components/modals/edit-pipeline-modal";
import VersionConflictModal from "@/components/modals/version-conflict-modal";
import CredentialSelectionModal from "@/components/modals/credential-selection-modal";
import AddCredentialModal from "@/components/modals/add-credential-modal";
import ImportPipelineModal from "@/components/modals/import-pipeline-modal";
import PipelineVersionDialog from "@/components/pipeline-version-dialog";
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

  const [nodes, setNodes, originalOnNodesChange] = useNodesState([]);
  const [edges, setEdges, originalOnEdgesChange] = useEdgesState([]);

  // Wrap onNodesChange to track changes
  const onNodesChange = useCallback((changes: any) => {
    originalOnNodesChange(changes);
    // Only track changes if we're not loading initial data
    if (!hasImportedData.current && nodes.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [originalOnNodesChange, nodes.length]);

  // Wrap onEdgesChange to track changes  
  const onEdgesChange = useCallback((changes: any) => {
    originalOnEdgesChange(changes);
    // Only track changes if we're not loading initial data
    if (!hasImportedData.current && edges.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [originalOnEdgesChange, edges.length]);
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [conflictData, setConflictData] = useState<{
    exists: boolean;
    latestVersion: number;
    nextVersion: number;
  } | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentPipelineId, setCurrentPipelineId] = useState<number | null>(null);
  const [currentCredentialId, setCurrentCredentialId] = useState<number | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const [validationErrors, setValidationErrors] = useState<Set<string>>(
    new Set(),
  );
  
  // Console log states
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [consoleTitle, setConsoleTitle] = useState("");
  const [consoleLoading, setConsoleLoading] = useState(false);
  
  // Track if we've imported data to prevent auto-generation from overriding it
  const hasImportedData = useRef(false);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

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

  // Check for imported pipeline data from sessionStorage (My Pipelines or Ask Jane)
  useEffect(() => {
    const importedData = sessionStorage.getItem("importedPipelineData");
    const importedPipeline = sessionStorage.getItem('importedPipeline');

    if ((importedData || importedPipeline) && !pipelineId) {
      // Only load if not editing an existing pipeline
      try {
        const pipelineData = JSON.parse(importedData || importedPipeline);

        // Set pipeline metadata
        setPipelineName(pipelineData.name);
        setPipelineDescription(pipelineData.description || "");
        setPipelineRegion(pipelineData.region || "us-east-1");
        
        // Mark that we've imported data
        hasImportedData.current = true;
        
        // Show success message for Jane imports
        if (pipelineData.fromJane) {
          toast({
            title: "Pipeline Imported",
            description: "Terraform configuration loaded from Jane's recommendation",
          });
        }

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
      
      // Set the current credential ID for existing pipelines
      if (pipeline.credentialId) {
        setCurrentCredentialId(pipeline.credentialId);
      }

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
      const url = currentPipelineId
        ? `/api/pipelines/${currentPipelineId}`
        : "/api/pipelines";
      const method = currentPipelineId ? "PUT" : "POST";
      const response = await apiRequest(method, url, pipelineData);
      return response.json();
    },
    onSuccess: (data) => {
      if (!currentPipelineId && data.id) {
        setCurrentPipelineId(data.id);
      }
      
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

  // Auto-save mutation (silent, no toast notifications)
  const autoSaveMutation = useMutation({
    mutationFn: async (pipelineData: any) => {
      const url = currentPipelineId
        ? `/api/pipelines/${currentPipelineId}`
        : "/api/pipelines";
      const method = currentPipelineId ? "PUT" : "POST";
      const response = await apiRequest(method, url, pipelineData);
      return response.json();
    },
    onSuccess: (data) => {
      if (!currentPipelineId && data.id) {
        setCurrentPipelineId(data.id);
      }
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      console.error("Auto-save failed:", error);
    },
  });

  // Create new version mutation
  const createVersionMutation = useMutation({
    mutationFn: async (pipelineData: any) => {
      if (!pipelineId) throw new Error("No pipeline ID available");
      const response = await apiRequest("POST", `/api/pipelines/${pipelineId}/versions`, pipelineData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "New Version Created",
        description: `Version ${data.version} has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines"] });
      setHasUnsavedChanges(false);
      // Update current pipeline ID to the new version
      setCurrentPipelineId(data.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new version. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-save function
  const triggerAutoSave = useCallback(async () => {
    if (!autoSaveEnabled || hasImportedData.current || autoSaveMutation.isPending) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    // Set new timeout for 2 seconds after changes
    autoSaveTimeout.current = setTimeout(async () => {
      try {
        const snapshot = await captureCanvasSnapshot();
        
        const pipelineData = {
          name: pipelineName,
          description: pipelineDescription,
          region: pipelineRegion,
          snapshot: snapshot,
          credentialId: currentCredentialId,
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
        
        autoSaveMutation.mutate(pipelineData);
      } catch (error) {
        console.error("Auto-save preparation failed:", error);
      }
    }, 2000);
  }, [autoSaveEnabled, pipelineName, pipelineDescription, pipelineRegion, nodes, edges, captureCanvasSnapshot, autoSaveMutation, hasImportedData]);

  // Trigger auto-save when pipeline state changes
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      triggerAutoSave();
    }
  }, [nodes, edges, triggerAutoSave]);

  // Trigger auto-save when pipeline name changes (and rename directory)
  useEffect(() => {
    if (pipelineName !== "New Pipeline" && !hasImportedData.current) {
      triggerAutoSave();
    }
  }, [pipelineName, triggerAutoSave]);



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
    // If editing existing pipeline and there are changes, show version dialog
    if (pipelineId && hasUnsavedChanges) {
      setShowVersionDialog(true);
      return;
    }
    
    // If editing existing pipeline without changes, save directly
    if (pipelineId) {
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
      credentialId: credential.id,
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
    
    // Set the current credential ID for use in properties panel
    setCurrentCredentialId(credential.id);
    
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

  const handleVersionSave = async (saveOption: 'existing' | 'new', versionNotes?: string) => {
    if (!pipelineId) return;

    const snapshot = await captureCanvasSnapshot();
    const pipelineData = {
      name: pipelineName,
      description: pipelineDescription,
      region: pipelineRegion,
      versionNotes: versionNotes || '',
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

    if (saveOption === 'new') {
      // Create new version
      createVersionMutation.mutate(pipelineData);
    } else {
      // Update existing version
      savePipelineMutation.mutate(pipelineData);
    }
    
    setHasUnsavedChanges(false);
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
      credentialId: credential.id,
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

  const handleDeployPipeline = async () => {
    if (!pipelineName) {
      toast({
        title: "Error",
        description: "Please save the pipeline before deploying.",
        variant: "destructive",
      });
      return;
    }

    // Initialize console
    setConsoleTitle("Terraform Deploy");
    setConsoleLogs([]);
    setShowConsole(true);
    setConsoleLoading(true);

    try {
      setConsoleLogs(prev => [...prev, "[INFO] Starting deployment process..."]);
      setConsoleLogs(prev => [...prev, "[INFO] Running terraform init..."]);

      // Execute terraform init
      const initResponse = await apiRequest("POST", "/api/terraform/execute", {
        pipelineName: pipelineName,
        command: "init"
      });

      if (!initResponse.ok) {
        throw new Error("Terraform init failed");
      }

      const initResult = await initResponse.json();
      setConsoleLogs(prev => [...prev, "[INIT] " + initResult.output]);

      setConsoleLogs(prev => [...prev, "[INFO] Running terraform apply -auto-approve..."]);

      // Execute terraform apply with auto-approve
      const applyResponse = await apiRequest("POST", "/api/terraform/execute", {
        pipelineName: pipelineName,
        command: "apply -auto-approve"
      });

      if (!applyResponse.ok) {
        throw new Error("Terraform apply failed");
      }

      const applyResult = await applyResponse.json();
      setConsoleLogs(prev => [...prev, "[APPLY] " + applyResult.output]);
      setConsoleLogs(prev => [...prev, "[SUCCESS] Deployment completed successfully!"]);

      toast({
        title: "Deployment Successful",
        description: "Infrastructure has been deployed successfully!",
      });

    } catch (error) {
      console.error("Deployment failed:", error);
      setConsoleLogs(prev => [...prev, "[ERROR] " + (error instanceof Error ? error.message : "Failed to deploy infrastructure")]);
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy infrastructure",
        variant: "destructive",
      });
    } finally {
      setConsoleLoading(false);
    }
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, config } } : node,
      ),
    );
  };

  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setValidationErrors(new Set());
    setSelectedNode(null);
    setShowPropertiesPanel(false);
  };

  const handleDestroyPipeline = async () => {
    if (!pipelineName) {
      toast({
        title: "Error",
        description: "No pipeline selected for destruction.",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      "⚠️ WARNING: This operation will DESTROY all resources created by this pipeline.\n\n" +
      "This action cannot be undone and will permanently delete:\n" +
      "• All cloud infrastructure resources\n" +
      "• Associated data and configurations\n" +
      "• Network components and security groups\n\n" +
      "Are you sure you want to proceed with destruction?"
    );

    if (!confirmed) {
      return;
    }

    // Initialize console
    setConsoleTitle("Terraform Destroy");
    setConsoleLogs([]);
    setShowConsole(true);
    setConsoleLoading(true);

    try {
      setConsoleLogs(prev => [...prev, "[WARNING] Starting destruction process..."]);
      setConsoleLogs(prev => [...prev, "[INFO] Running terraform init..."]);

      // Execute terraform init
      const initResponse = await apiRequest("POST", "/api/terraform/execute", {
        pipelineName: pipelineName,
        command: "init"
      });

      if (!initResponse.ok) {
        throw new Error("Terraform init failed");
      }

      const initResult = await initResponse.json();
      setConsoleLogs(prev => [...prev, "[INIT] " + initResult.output]);

      setConsoleLogs(prev => [...prev, "[WARNING] Running terraform destroy -auto-approve..."]);

      // Execute terraform destroy -auto-approve
      const destroyResponse = await apiRequest("POST", "/api/terraform/execute", {
        pipelineName: pipelineName,
        command: "destroy -auto-approve"
      });

      if (!destroyResponse.ok) {
        throw new Error("Terraform destroy failed");
      }

      const destroyResult = await destroyResponse.json();
      setConsoleLogs(prev => [...prev, "[DESTROY] " + destroyResult.output]);
      setConsoleLogs(prev => [...prev, "[SUCCESS] Destruction completed successfully!"]);

      toast({
        title: "Destruction Complete",
        description: "Infrastructure destroyed successfully!",
        variant: "destructive",
      });

    } catch (error) {
      console.error("Destruction failed:", error);
      setConsoleLogs(prev => [...prev, "[ERROR] " + (error instanceof Error ? error.message : "Failed to destroy infrastructure")]);
      toast({
        title: "Destruction Failed",
        description: error instanceof Error ? error.message : "Failed to destroy infrastructure",
        variant: "destructive",
      });
    } finally {
      setConsoleLoading(false);
    }
  };

  const handlePreviewPipeline = async () => {
    if (!pipelineName) {
      toast({
        title: "Error",
        description: "No pipeline selected for preview.",
        variant: "destructive",
      });
      return;
    }

    // Initialize console
    setConsoleTitle("Terraform Preview");
    setConsoleLogs([]);
    setShowConsole(true);
    setConsoleLoading(true);

    try {
      setConsoleLogs(prev => [...prev, "[INFO] Starting preview process..."]);
      setConsoleLogs(prev => [...prev, "[INFO] Running terraform init..."]);

      // Execute terraform init
      const initResponse = await apiRequest("POST", "/api/terraform/execute", {
        pipelineName: pipelineName,
        command: "init"
      });

      if (!initResponse.ok) {
        throw new Error("Terraform init failed");
      }

      const initResult = await initResponse.json();
      setConsoleLogs(prev => [...prev, "[INIT] " + initResult.output]);

      setConsoleLogs(prev => [...prev, "[INFO] Running terraform plan..."]);

      // Execute terraform plan
      const planResponse = await apiRequest("POST", "/api/terraform/execute", {
        pipelineName: pipelineName,
        command: "plan"
      });

      if (!planResponse.ok) {
        throw new Error("Terraform plan failed");
      }

      const planResult = await planResponse.json();
      setConsoleLogs(prev => [...prev, "[PLAN] " + planResult.output]);
      setConsoleLogs(prev => [...prev, "[SUCCESS] Preview completed successfully!"]);

      toast({
        title: "Preview Complete",
        description: "Infrastructure plan generated successfully!",
      });

    } catch (error) {
      console.error("Preview failed:", error);
      setConsoleLogs(prev => [...prev, "[ERROR] " + (error instanceof Error ? error.message : "Failed to generate infrastructure plan")]);
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Failed to generate infrastructure plan",
        variant: "destructive",
      });
    } finally {
      setConsoleLoading(false);
    }
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

  const handleImportPipeline = (pipelineData: any) => {
    try {
      // Set pipeline metadata
      setPipelineName(pipelineData.name || "Imported Pipeline");
      setPipelineDescription(pipelineData.description || "");
      setPipelineRegion(pipelineData.region || "us-east-1");
      
      // Mark that we've imported data
      hasImportedData.current = true;

      // Load components to canvas
      if (Array.isArray(pipelineData.components) && pipelineData.components.length > 0) {
        const loadedNodes = pipelineData.components.map((component: any) => ({
          id: component.id,
          type: "cloudComponent",
          position: component.position,
          data: {
            type: component.type,
            name: component.name,
            config: component.config,
            validationError: false,
          },
        }));
        setNodes(loadedNodes);
      }

      // Load connections
      if (Array.isArray(pipelineData.connections) && pipelineData.connections.length > 0) {
        const loadedEdges = pipelineData.connections.map((connection: any) => ({
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

      // Clear validation errors
      setValidationErrors(new Set());
    } catch (error) {
      console.error("Failed to import pipeline:", error);
      toast({
        title: "Import failed",
        description: "Failed to load pipeline data. Please check the file format.",
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
          {showComponentLibrary && <ComponentLibrary nodes={nodes} onClearCanvas={handleClearCanvas} />}

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
                      onClick={() => setShowImportModal(true)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Import
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPipeline}
                      className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all duration-200"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={validateAllComponents}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Validate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviewPipeline}
                      disabled={!pipelineName}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200 disabled:opacity-50"
                      style={!pipelineName ? {} : {
                        borderColor: 'rgb(138, 83, 214)',
                        color: 'rgb(138, 83, 214)'
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeployPipeline}
                      disabled={!pipelineName}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                      <Rocket className="w-4 h-4 mr-1" />
                      Deploy
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDestroyPipeline}
                      disabled={!pipelineName}
                      className="bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Destroy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/hub', '_blank')}
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Publish
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
                  onUpdateConfig={updateNodeConfig}
                  onClose={onClosePropertiesPanel}
                  pipelineName={pipelineName}
                  allNodes={nodes}
                  credentialId={currentCredentialId}
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

      <PipelineVersionDialog
        isOpen={showVersionDialog}
        onClose={() => setShowVersionDialog(false)}
        onSave={handleVersionSave}
        pipelineName={pipelineName}
        currentVersion={pipeline?.version || 1}
        hasChanges={hasUnsavedChanges}
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

      <ImportPipelineModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportPipeline}
      />

      <ConsoleLog
        isOpen={showConsole}
        onClose={() => setShowConsole(false)}
        title={consoleTitle}
        logs={consoleLogs}
        isLoading={consoleLoading}
      />
    </div>
  );
}
