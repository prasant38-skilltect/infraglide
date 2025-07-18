import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Node, Edge } from "reactflow";
import { Users, Cloud, DollarSign, Calendar, Shield, TrendingUp } from "lucide-react";

interface HLDPanelProps {
  pipelineName: string;
  pipelineDescription: string;
  nodes: Node[];
  edges: Edge[];
  region: string;
}

export default function HLDPanel({
  pipelineName,
  pipelineDescription,
  nodes,
  edges,
  region,
}: HLDPanelProps) {
  const getCloudProvider = () => {
    if (nodes.length === 0) return "Not specified";
    const firstNode = nodes[0];
    const nodeType = firstNode.data.type;
    
    if (nodeType.startsWith("azure-")) return "Microsoft Azure";
    if (nodeType.startsWith("gcp-")) return "Google Cloud Platform";
    return "Amazon Web Services";
  };

  const getComponentCounts = () => {
    const counts = {
      compute: 0,
      storage: 0,
      database: 0,
      networking: 0,
      other: 0,
    };

    nodes.forEach((node) => {
      const type = node.data.type;
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

  const getBusinessValue = () => {
    const componentCount = nodes.length;
    if (componentCount === 0) return "No infrastructure defined";
    if (componentCount <= 3) return "Basic infrastructure setup";
    if (componentCount <= 6) return "Standard production environment";
    return "Enterprise-grade infrastructure";
  };

  const getEstimatedCost = () => {
    const componentCount = nodes.length;
    const provider = getCloudProvider();
    const baseCost = componentCount * 50; // Rough estimate per component
    
    let multiplier = 1;
    if (provider.includes("Azure")) multiplier = 0.95;
    if (provider.includes("Google")) multiplier = 0.9;
    
    return Math.round(baseCost * multiplier);
  };

  const componentCounts = getComponentCounts();

  if (nodes.length === 0) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            High Level Document
          </h3>
          <p className="text-sm text-gray-600 mt-1">Executive Summary</p>
        </div>
        
        <div className="flex-1 p-4">
          <div className="text-center text-gray-500 mt-8">
            <Cloud className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No pipeline components to analyze</p>
            <p className="text-xs mt-2">Add components to the canvas to generate documentation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          High Level Document
        </h3>
        <p className="text-sm text-gray-600 mt-1">Executive Summary</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Project Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Pipeline Name</p>
              <p className="text-sm text-gray-600">{pipelineName}</p>
            </div>
            {pipelineDescription && (
              <div>
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="text-sm text-gray-600">{pipelineDescription}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">Cloud Provider</p>
              <Badge variant="outline" className="mt-1">
                {getCloudProvider()}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Region</p>
              <p className="text-sm text-gray-600">{region}</p>
            </div>
          </CardContent>
        </Card>

        {/* Business Value */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Business Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{getBusinessValue()}</p>
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700">Infrastructure Scale</p>
              <p className="text-sm text-gray-600">{nodes.length} components, {edges.length} connections</p>
            </div>
          </CardContent>
        </Card>

        {/* Resource Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Resource Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {componentCounts.compute > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Compute Services</span>
                <Badge variant="secondary">{componentCounts.compute}</Badge>
              </div>
            )}
            {componentCounts.storage > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Storage Services</span>
                <Badge variant="secondary">{componentCounts.storage}</Badge>
              </div>
            )}
            {componentCounts.database > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database Services</span>
                <Badge variant="secondary">{componentCounts.database}</Badge>
              </div>
            )}
            {componentCounts.networking > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Network Services</span>
                <Badge variant="secondary">{componentCounts.networking}</Badge>
              </div>
            )}
            {componentCounts.other > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Other Services</span>
                <Badge variant="secondary">{componentCounts.other}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Estimation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Cost Estimation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${getEstimatedCost()}/month
            </div>
            <p className="text-xs text-gray-500 mt-1">
              *Estimated based on component count and provider
            </p>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Implementation Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Planning & Design</span>
              <span className="text-sm font-medium">1-2 weeks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Infrastructure Setup</span>
              <span className="text-sm font-medium">1-3 weeks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Testing & Validation</span>
              <span className="text-sm font-medium">1 week</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium text-gray-700">Total Estimate</span>
              <span className="text-sm font-bold">3-6 weeks</span>
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Complexity</span>
              <Badge variant={nodes.length > 6 ? "destructive" : nodes.length > 3 ? "default" : "secondary"}>
                {nodes.length > 6 ? "High" : nodes.length > 3 ? "Medium" : "Low"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dependencies</span>
              <Badge variant={edges.length > 5 ? "destructive" : edges.length > 2 ? "default" : "secondary"}>
                {edges.length > 5 ? "High" : edges.length > 2 ? "Medium" : "Low"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Security Impact</span>
              <Badge variant="default">Medium</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}