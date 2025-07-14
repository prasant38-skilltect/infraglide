import * as React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Upload, Trash2, Edit3, Eye, Plus, Layers } from "lucide-react";
import { Link } from "wouter";

import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Pipeline } from "@shared/schema";

export default function MyPipelines() {
  const { toast } = useToast();

  const { data: pipelines = [], isLoading } = useQuery<Pipeline[]>({
    queryKey: ["/api/pipelines"],
  });

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
              <Link href="/pipeline">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Pipeline
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded mb-4"></div>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pipelines.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pipelines yet</h3>
              <p className="text-gray-600 mb-6">Create your first pipeline to get started</p>
              <Link href="/pipeline">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Pipeline
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pipelines.map((pipeline) => (
                <Card key={pipeline.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {pipeline.description || "No description"}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {getVersionName(pipeline)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Pipeline Info */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Region:</span>
                          <span className="font-medium">{pipeline.region}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Components:</span>
                          <span className="font-medium">
                            {Array.isArray(pipeline.components) ? pipeline.components.length : 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Created:</span>
                          <span className="font-medium">
                            {pipeline.createdAt ? formatDate(pipeline.createdAt) : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Link href={`/pipeline/${pipeline.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleExport(pipeline)}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(pipeline.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}