import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Network, Camera, Download, FileImage, Calendar, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Pipeline } from "@shared/schema";

export default function Architecture() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const { toast } = useToast();

  const { data: pipelines, isLoading } = useQuery<Pipeline[]>({
    queryKey: ["/api/pipelines"],
  });

  const selectedPipeline = pipelines?.find(p => p.id.toString() === selectedPipelineId);

  const getCloudProvider = (components: any[]) => {
    if (!components || components.length === 0) return "Not specified";
    const firstComponent = components[0];
    const nodeType = firstComponent.type;
    
    if (nodeType.startsWith("azure-")) return "Microsoft Azure";
    if (nodeType.startsWith("gcp-")) return "Google Cloud Platform";
    return "Amazon Web Services";
  };

  const getComponentCounts = (components: any[]) => {
    const counts = {
      compute: 0,
      storage: 0,
      database: 0,
      networking: 0,
      other: 0,
    };

    components?.forEach((component) => {
      const type = component.type;
      if (type.includes("ec2") || type.includes("vm") || type.includes("lambda") || type.includes("functions")) {
        counts.compute++;
      } else if (type.includes("s3") || type.includes("storage") || type.includes("blob")) {
        counts.storage++;
      } else if (type.includes("rds") || type.includes("sql") || type.includes("dynamodb") || type.includes("firestore")) {
        counts.database++;
      } else if (type.includes("vpc") || type.includes("vnet") || type.includes("alb") || type.includes("lb")) {
        counts.networking++;
      } else {
        counts.other++;
      }
    });

    return counts;
  };

  const captureAndStoreScreenshot = async () => {
    if (!selectedPipeline) {
      toast({
        title: "Error",
        description: "Please select a pipeline first",
        variant: "destructive",
      });
      return;
    }

    setIsCapturingScreenshot(true);

    try {
      // Navigate to pipeline designer in a new window/tab to capture the canvas
      const pipelineUrl = `/pipeline/${selectedPipeline.id}`;
      const newWindow = window.open(pipelineUrl, '_blank', 'width=1200,height=800');
      
      if (!newWindow) {
        throw new Error("Could not open pipeline designer window");
      }

      // Wait for the window to load, then capture
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Use html2canvas to capture the pipeline canvas
      const { default: html2canvas } = await import("html2canvas");
      
      // Try to find the canvas in the new window
      const canvasElement = newWindow.document.querySelector(".react-flow__viewport");
      
      if (!canvasElement) {
        newWindow.close();
        throw new Error("Could not find pipeline canvas to capture");
      }

      const canvas = await html2canvas(canvasElement as HTMLElement, {
        backgroundColor: "#ffffff",
        scale: 1,
        useCORS: true,
        allowTaint: true,
      });

      // Convert to base64
      const screenshotData = canvas.toDataURL("image/png");
      
      // Close the window
      newWindow.close();

      // Create download link for the screenshot
      const link = document.createElement('a');
      link.download = `${selectedPipeline.name}_architecture.png`;
      link.href = screenshotData;
      link.click();

      toast({
        title: "Screenshot Captured",
        description: `Architecture diagram saved as ${selectedPipeline.name}_architecture.png`,
      });

    } catch (error) {
      console.error("Screenshot capture failed:", error);
      toast({
        title: "Capture Failed",
        description: "Could not capture pipeline architecture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const openPipelineDesigner = () => {
    if (!selectedPipeline) {
      toast({
        title: "Error",
        description: "Please select a pipeline first",
        variant: "destructive",
      });
      return;
    }

    window.open(`/pipeline/${selectedPipeline.id}`, '_blank');
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
  const componentCounts = getComponentCounts(components);
  const provider = getCloudProvider(components);

  return (
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Network className="w-8 h-8" />
                Architecture Diagrams
              </h1>
              <p className="text-gray-600 mt-2">Visual architecture screenshots and pipeline diagrams</p>
            </div>
          </div>

          {/* Pipeline Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a pipeline to view architecture" />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelines?.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                          {pipeline.name} - {pipeline.provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={openPipelineDesigner}
                  disabled={!selectedPipeline}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Open Designer
                </Button>
              </div>
            </CardContent>
          </Card>

          {!selectedPipeline ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pipeline Selected</h3>
                <p className="text-gray-600">Select a pipeline above to view and capture architecture diagrams</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Pipeline Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pipeline Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Name</p>
                      <p className="text-gray-900">{selectedPipeline.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Provider</p>
                      <Badge variant="outline">{provider}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Region</p>
                      <p className="text-gray-600">{selectedPipeline.region}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <Badge variant={selectedPipeline.status === 'active' ? 'default' : 'secondary'}>
                        {selectedPipeline.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Architecture Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Components</span>
                      <Badge variant="secondary">{components.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connections</span>
                      <Badge variant="secondary">{connections.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version</span>
                      <Badge variant="outline">v{selectedPipeline.version}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Complexity</span>
                      <Badge variant={components.length > 6 ? "destructive" : components.length > 3 ? "default" : "secondary"}>
                        {components.length > 6 ? "High" : components.length > 3 ? "Medium" : "Low"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Component Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {componentCounts.compute > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Compute</span>
                        <Badge variant="secondary">{componentCounts.compute}</Badge>
                      </div>
                    )}
                    {componentCounts.storage > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Storage</span>
                        <Badge variant="secondary">{componentCounts.storage}</Badge>
                      </div>
                    )}
                    {componentCounts.database > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Database</span>
                        <Badge variant="secondary">{componentCounts.database}</Badge>
                      </div>
                    )}
                    {componentCounts.networking > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Network</span>
                        <Badge variant="secondary">{componentCounts.networking}</Badge>
                      </div>
                    )}
                    {componentCounts.other > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Other</span>
                        <Badge variant="secondary">{componentCounts.other}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Screenshot Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Architecture Capture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Capture a high-quality screenshot of the pipeline architecture diagram. 
                      The image will be saved with the pipeline name for documentation purposes.
                    </p>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={captureAndStoreScreenshot}
                        disabled={isCapturingScreenshot || components.length === 0}
                        className="flex items-center gap-2"
                      >
                        {isCapturingScreenshot ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Capturing...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4" />
                            Capture Architecture
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={openPipelineDesigner}
                      >
                        <Network className="w-4 h-4 mr-2" />
                        View in Designer
                      </Button>
                    </div>

                    {components.length === 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          This pipeline has no components to capture. Add components in the Pipeline Designer first.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Architecture Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5" />
                    Architecture Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Component Summary</h4>
                      <div className="space-y-2 text-sm">
                        {components.length > 0 ? (
                          components.map((component, index) => (
                            <div key={component.id} className="flex justify-between items-center">
                              <span className="text-gray-600">
                                {component.name || `Component ${index + 1}`}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {component.type}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No components configured</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Connection Flow</h4>
                      <div className="space-y-2 text-sm">
                        {connections.length > 0 ? (
                          connections.map((connection, index) => (
                            <div key={connection.id} className="text-gray-600 font-mono text-xs">
                              {components.find(c => c.id === connection.source)?.name || connection.source}
                              <span className="mx-2 text-gray-400">→</span>
                              {components.find(c => c.id === connection.target)?.name || connection.target}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No connections defined</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Pipeline ID</p>
                      <p className="text-gray-600 font-mono">{selectedPipeline.id}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Created</p>
                      <p className="text-gray-600">
                        {selectedPipeline.createdAt ? new Date(selectedPipeline.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Last Modified</p>
                      <p className="text-gray-600">
                        {selectedPipeline.updatedAt ? new Date(selectedPipeline.updatedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
  );
}