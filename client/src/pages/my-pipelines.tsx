import * as React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Upload, Trash2, Edit3, Eye, Plus, Layers, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";

import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Pipeline } from "@shared/schema";

export default function MyPipelines() {
  const { toast } = useToast();
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({
    AWS: true,
    Azure: true,
    GCP: true,
  });

  const { data: pipelines = [], isLoading } = useQuery<Pipeline[]>({
    queryKey: ["/api/pipelines"],
  });

  const toggleProvider = (provider: string) => {
    setExpandedProviders(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleExport = (pipeline: Pipeline) => {
    const dataStr = JSON.stringify(pipeline, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${pipeline.name.replace(/\s+/g, '_')}_v${pipeline.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Pipeline exported",
      description: `${pipeline.name} has been exported successfully.`,
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedPipeline = JSON.parse(e.target?.result as string);
            // TODO: Implement import logic
            toast({
              title: "Import functionality",
              description: "Import functionality will be implemented soon.",
            });
          } catch (error) {
            toast({
              title: "Import failed",
              description: "Invalid pipeline file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleDelete = (pipelineId: number) => {
    // TODO: Implement delete with confirmation
    toast({
      title: "Delete functionality",
      description: "Delete functionality will be implemented soon.",
    });
  };

  const getVersionName = (pipeline: Pipeline) => {
    return `Version ${pipeline.id}`;
  };

  const getCloudProvider = (pipeline: Pipeline) => {
    if (!Array.isArray(pipeline.components) || pipeline.components.length === 0) {
      return 'Unknown';
    }
    
    const firstComponent = pipeline.components[0];
    const componentType = firstComponent.type;
    
    if (componentType.startsWith('gcp-')) return 'GCP';
    if (componentType.startsWith('azure-')) return 'Azure';
    return 'AWS';
  };

  const groupPipelinesByProvider = (pipelines: Pipeline[]) => {
    const groups = {
      AWS: [] as Pipeline[],
      Azure: [] as Pipeline[],
      GCP: [] as Pipeline[]
    };
    
    pipelines.forEach(pipeline => {
      const provider = getCloudProvider(pipeline);
      if (provider in groups) {
        groups[provider as keyof typeof groups].push(pipeline);
      }
    });
    
    return groups;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Pipelines</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your saved pipeline versions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={handleImport} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Pipeline
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="space-y-6">
              {['AWS', 'Azure', 'GCP'].map((provider) => (
                <div key={provider} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <ChevronDown className="w-5 h-5 text-gray-500 animate-pulse" />
                        <span className={`w-3 h-3 rounded-full animate-pulse ${
                          provider === 'AWS' ? 'bg-orange-300' : 
                          provider === 'Azure' ? 'bg-blue-300' : 
                          'bg-red-300'
                        }`}></span>
                      </div>
                      <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 p-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <CardHeader className="pb-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                            <div className="flex space-x-1">
                              <div className="h-8 bg-gray-200 rounded flex-1"></div>
                              <div className="h-8 bg-gray-200 rounded flex-1"></div>
                              <div className="h-8 bg-gray-200 rounded w-8"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pipelines.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pipelines yet</h3>
              <p className="text-gray-600 mb-6">Drag and drop components on the canvas to automatically save pipelines</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupPipelinesByProvider(pipelines)).map(([provider, providerPipelines]) => (
                <div key={provider} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                  {/* Provider Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleProvider(provider)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {expandedProviders[provider] ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <span className={`w-3 h-3 rounded-full ${
                          provider === 'AWS' ? 'bg-orange-500' : 
                          provider === 'Azure' ? 'bg-blue-500' : 
                          'bg-red-500'
                        }`}></span>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">{provider}</h2>
                      <Badge variant="secondary" className="ml-2">
                        {providerPipelines.length} {providerPipelines.length === 1 ? 'pipeline' : 'pipelines'}
                      </Badge>
                    </div>
                  </div>

                  {/* Provider Content */}
                  {expandedProviders[provider] && (
                    <div className="border-t border-gray-200 p-4">
                      {providerPipelines.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Layers className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-sm">No {provider} pipelines yet</p>
                          <p className="text-gray-400 text-xs mt-1">
                            Drag {provider} components to the canvas to create pipelines
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {providerPipelines.map((pipeline) => (
                            <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm font-medium truncate">
                                      {getVersionName(pipeline)}
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                      {pipeline.components && Array.isArray(pipeline.components) ? 
                                        `${pipeline.components.length} components` : 
                                        "No components"}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="text-xs text-gray-500 mb-3">
                                  {pipeline.createdAt ? formatDate(pipeline.createdAt) : 'N/A'}
                                </div>
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleExport(pipeline)}
                                    className="flex-1 text-xs h-8"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Export
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    asChild
                                    className="flex-1 text-xs h-8"
                                  >
                                    <Link href={`/pipeline-designer?id=${pipeline.id}`}>
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Link>
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDelete(pipeline.id)}
                                    className="h-8 w-8 p-0 text-red-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}