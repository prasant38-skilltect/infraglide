import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Cloud, DollarSign, Calendar, Shield, TrendingUp, FileText } from "lucide-react";
import type { Pipeline } from "@shared/schema";

export default function HLD() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");

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

  const getBusinessValue = (componentCount: number) => {
    if (componentCount === 0) return "No infrastructure defined";
    if (componentCount <= 3) return "Basic infrastructure setup";
    if (componentCount <= 6) return "Standard production environment";
    return "Enterprise-grade infrastructure";
  };

  const getEstimatedCost = (componentCount: number, provider: string) => {
    const baseCost = componentCount * 50; // Rough estimate per component
    
    let multiplier = 1;
    if (provider.includes("Azure")) multiplier = 0.95;
    if (provider.includes("Google")) multiplier = 0.9;
    
    return Math.round(baseCost * multiplier);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center">Loading pipelines...</div>
        </div>
      </div>
    );
  }

  const components = selectedPipeline?.components || [];
  const connections = selectedPipeline?.connections || [];
  const componentCounts = getComponentCounts(components);
  const provider = getCloudProvider(components);
  const estimatedCost = getEstimatedCost(components.length, provider);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8" />
                High Level Document (HLD)
              </h1>
              <p className="text-gray-600 mt-2">Executive summary and business overview for managers</p>
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
                  <SelectValue placeholder="Choose a pipeline to generate HLD" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines?.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                      {pipeline.name} - {pipeline.provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {!selectedPipeline ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pipeline Selected</h3>
                <p className="text-gray-600">Select a pipeline above to generate the High Level Document</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5" />
                    Project Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Pipeline Name</p>
                    <p className="text-gray-900">{selectedPipeline.name}</p>
                  </div>
                  {selectedPipeline.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Description</p>
                      <p className="text-gray-600">{selectedPipeline.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cloud Provider</p>
                    <Badge variant="outline" className="mt-1">{provider}</Badge>
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

              {/* Business Value */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Business Value
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Assessment</p>
                    <p className="text-gray-600">{getBusinessValue(components.length)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Infrastructure Scale</p>
                    <p className="text-gray-600">{components.length} components, {connections.length} connections</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Version</p>
                    <p className="text-gray-600">v{selectedPipeline.version}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Resource Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5" />
                    Resource Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {componentCounts.compute > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Compute Services</span>
                      <Badge variant="secondary">{componentCounts.compute}</Badge>
                    </div>
                  )}
                  {componentCounts.storage > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage Services</span>
                      <Badge variant="secondary">{componentCounts.storage}</Badge>
                    </div>
                  )}
                  {componentCounts.database > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Database Services</span>
                      <Badge variant="secondary">{componentCounts.database}</Badge>
                    </div>
                  )}
                  {componentCounts.networking > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network Services</span>
                      <Badge variant="secondary">{componentCounts.networking}</Badge>
                    </div>
                  )}
                  {componentCounts.other > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Other Services</span>
                      <Badge variant="secondary">{componentCounts.other}</Badge>
                    </div>
                  )}
                  {components.length === 0 && (
                    <p className="text-gray-500 text-center">No components configured</p>
                  )}
                </CardContent>
              </Card>

              {/* Cost Estimation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Cost Estimation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      ${estimatedCost}/month
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      *Estimated based on component count and provider
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Calculation:</strong> {components.length} components × $50 base cost</p>
                    <p><strong>Provider multiplier:</strong> {provider.includes("Azure") ? "0.95" : provider.includes("Google") ? "0.9" : "1.0"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Implementation Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Implementation Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Planning & Design</span>
                    <span className="font-medium">1-2 weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Infrastructure Setup</span>
                    <span className="font-medium">{components.length > 6 ? "2-4 weeks" : "1-3 weeks"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Testing & Validation</span>
                    <span className="font-medium">1 week</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium text-gray-700">Total Estimate</span>
                    <span className="font-bold">{components.length > 6 ? "4-7 weeks" : "3-6 weeks"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Complexity</span>
                    <Badge variant={components.length > 6 ? "destructive" : components.length > 3 ? "default" : "secondary"}>
                      {components.length > 6 ? "High" : components.length > 3 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Dependencies</span>
                    <Badge variant={connections.length > 5 ? "destructive" : connections.length > 2 ? "default" : "secondary"}>
                      {connections.length > 5 ? "High" : connections.length > 2 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Security Impact</span>
                    <Badge variant="default">Medium</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Provider Lock-in</span>
                    <Badge variant="default">Medium</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}