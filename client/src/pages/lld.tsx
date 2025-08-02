import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Cpu, Database, Network, Settings, FileText, GitBranch } from "lucide-react";
import type { Pipeline } from "@shared/schema";

export default function LLD() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Load selected project from localStorage and listen for changes
  useEffect(() => {
    const updateProject = () => {
      const savedProjectId = localStorage.getItem('selectedProjectId');
      if (savedProjectId) {
        const newProjectId = parseInt(savedProjectId);
        setSelectedProjectId(newProjectId);
        // Reset pipeline selection when project changes
        setSelectedPipelineId("");
      }
    };

    // Initial load
    updateProject();

    // Listen for storage changes (when project selector changes in other components)
    window.addEventListener('storage', updateProject);
    
    // Also listen for custom event when project changes in the same tab
    window.addEventListener('projectChanged', updateProject);

    return () => {
      window.removeEventListener('storage', updateProject);
      window.removeEventListener('projectChanged', updateProject);
    };
  }, []);

  // Reset pipeline selection when project pipelines change
  useEffect(() => {
    if (selectedPipelineId && !projectPipelines.find(p => p.id.toString() === selectedPipelineId)) {
      setSelectedPipelineId("");
    }
  }, [projectPipelines, selectedPipelineId]);

  const { data: pipelines, isLoading } = useQuery<Pipeline[]>({
    queryKey: ["/api/pipelines"],
  });

  // Filter pipelines by selected project
  const projectPipelines = pipelines?.filter(pipeline => 
    selectedProjectId ? pipeline.projectId === selectedProjectId : false
  ) || [];

  const selectedPipeline = projectPipelines?.find(p => p.id.toString() === selectedPipelineId);

  const getComponentsByCategory = (components: any[]) => {
    const categories = {
      compute: [] as any[],
      storage: [] as any[],
      database: [] as any[],
      networking: [] as any[],
      other: [] as any[],
    };

    components?.forEach((component) => {
      const type = component.type;
      if (type.includes("ec2") || type.includes("vm") || type.includes("lambda") || type.includes("functions")) {
        categories.compute.push(component);
      } else if (type.includes("s3") || type.includes("storage") || type.includes("blob")) {
        categories.storage.push(component);
      } else if (type.includes("rds") || type.includes("sql") || type.includes("dynamodb") || type.includes("firestore")) {
        categories.database.push(component);
      } else if (type.includes("vpc") || type.includes("vnet") || type.includes("alb") || type.includes("lb")) {
        categories.networking.push(component);
      } else {
        categories.other.push(component);
      }
    });

    return categories;
  };

  const getConnectionDetails = (connections: any[], components: any[]) => {
    return connections?.map((connection) => ({
      id: connection.id,
      source: connection.source,
      target: connection.target,
      sourceNode: components.find(c => c.id === connection.source)?.name || connection.source,
      targetNode: components.find(c => c.id === connection.target)?.name || connection.target,
    })) || [];
  };

  const formatConfigValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderComponentSection = (title: string, icon: any, components: any[], borderColor: string) => {
    const Icon = icon;
    
    if (components.length === 0) return null;

    return (
      <Card key={title}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {components.map((component) => (
            <div key={component.id} className={`border-l-2 ${borderColor} pl-3`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{component.name || `${component.type}-${component.id}`}</p>
                <Badge variant="outline" className="text-xs">{component.type}</Badge>
              </div>
              
              {component.position && (
                <div className="text-xs text-gray-500 mb-2">
                  Position: ({Math.round(component.position.x)}, {Math.round(component.position.y)})
                </div>
              )}
              
              {component.config && Object.keys(component.config).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Configuration:</p>
                  {Object.entries(component.config).map(([key, value]) => (
                    <div key={key} className="text-xs pl-2">
                      <span className="text-gray-500">{key}:</span>
                      <span className="ml-1 text-gray-700 font-mono break-all">
                        {formatConfigValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
        <div className="flex-1 p-8">
          <div className="text-center">Loading pipelines...</div>
        </div>
    );
  }

  const components = selectedPipeline?.components || [];
  const connections = selectedPipeline?.connections || [];
  const categories = getComponentsByCategory(components);
  const connectionDetails = getConnectionDetails(connections, components);

  return (
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Code className="w-8 h-8" />
                Low Level Document (LLD)
              </h1>
              <p className="text-gray-600 mt-2">Technical specifications and implementation details</p>
            </div>
          </div>

          {/* Pipeline Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a pipeline to generate LLD" />
                </SelectTrigger>
                <SelectContent>
                  {projectPipelines.length === 0 ? (
                    <SelectItem value="no-pipelines" disabled>No pipelines available for selected project</SelectItem>
                  ) : (
                    projectPipelines.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                        {pipeline.name} - {pipeline.provider}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {!selectedPipeline ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pipeline Selected</h3>
                <p className="text-gray-600">Select a pipeline above to generate the Low Level Document</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Architecture Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5" />
                    Architecture Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Pipeline ID</p>
                    <p className="text-xs text-gray-600 font-mono">{selectedPipeline.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Provider</p>
                    <p className="text-sm text-gray-600">{selectedPipeline.provider}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Region</p>
                    <p className="text-sm text-gray-600">{selectedPipeline.region}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <Badge variant={selectedPipeline.status === 'active' ? 'default' : 'secondary'}>
                      {selectedPipeline.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Version</p>
                    <p className="text-sm text-gray-600">v{selectedPipeline.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Components</p>
                    <p className="text-sm text-gray-600">{components.length} total, {connections.length} connections</p>
                  </div>
                </CardContent>
              </Card>

              {/* Component Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderComponentSection(
                  "Compute Resources",
                  Cpu,
                  categories.compute,
                  "border-blue-200"
                )}
                
                {renderComponentSection(
                  "Storage Resources",
                  Database,
                  categories.storage,
                  "border-green-200"
                )}
                
                {renderComponentSection(
                  "Database Resources",
                  Database,
                  categories.database,
                  "border-purple-200"
                )}
                
                {renderComponentSection(
                  "Network Resources",
                  Network,
                  categories.networking,
                  "border-indigo-200"
                )}
                
                {renderComponentSection(
                  "Other Resources",
                  Settings,
                  categories.other,
                  "border-gray-200"
                )}
              </div>

              {/* Component Connections */}
              {connectionDetails.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      Component Connections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {connectionDetails.map((connection) => (
                        <div key={connection.id} className="text-sm p-3 bg-gray-50 rounded-lg">
                          <div className="font-mono">
                            <span className="text-blue-600 font-medium">{connection.sourceNode}</span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span className="text-green-600 font-medium">{connection.targetNode}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Connection ID: {connection.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Raw Data Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Pipeline Data Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 w-full rounded-md border p-4">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(selectedPipeline, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              {components.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Components Configured</h3>
                    <p className="text-gray-600">This pipeline doesn't have any components configured yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
  );
}