import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Node, Edge } from "reactflow";
import { Code, Cpu, Database, Network, Settings, FileText, GitBranch } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LLDPanelProps {
  pipelineName: string;
  pipelineDescription: string;
  nodes: Node[];
  edges: Edge[];
  region: string;
}

export default function LLDPanel({
  pipelineName,
  pipelineDescription,
  nodes,
  edges,
  region,
}: LLDPanelProps) {
  const getNodeDetails = (node: Node) => {
    const config = node.data.config || {};
    const type = node.data.type;
    
    return {
      id: node.id,
      name: node.data.name || `${type}-${node.id}`,
      type: type,
      position: node.position,
      config: config,
    };
  };

  const getConnectionDetails = () => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceNode: nodes.find(n => n.id === edge.source)?.data.name || edge.source,
      targetNode: nodes.find(n => n.id === edge.target)?.data.name || edge.target,
    }));
  };

  const getComponentsByCategory = () => {
    const categories = {
      compute: [] as Node[],
      storage: [] as Node[],
      database: [] as Node[],
      networking: [] as Node[],
      other: [] as Node[],
    };

    nodes.forEach((node) => {
      const type = node.data.type;
      if (type.includes("ec2") || type.includes("vm") || type.includes("lambda") || type.includes("functions")) {
        categories.compute.push(node);
      } else if (type.includes("s3") || type.includes("storage") || type.includes("blob")) {
        categories.storage.push(node);
      } else if (type.includes("rds") || type.includes("sql") || type.includes("dynamodb") || type.includes("firestore")) {
        categories.database.push(node);
      } else if (type.includes("vpc") || type.includes("vnet") || type.includes("alb") || type.includes("lb")) {
        categories.networking.push(node);
      } else {
        categories.other.push(node);
      }
    });

    return categories;
  };

  const formatConfigValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (nodes.length === 0) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Low Level Document
          </h3>
          <p className="text-sm text-gray-600 mt-1">Technical Specifications</p>
        </div>
        
        <div className="flex-1 p-4">
          <div className="text-center text-gray-500 mt-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No technical specifications available</p>
            <p className="text-xs mt-2">Add and configure components to generate technical documentation</p>
          </div>
        </div>
      </div>
    );
  }

  const categories = getComponentsByCategory();
  const connections = getConnectionDetails();

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Code className="w-5 h-5" />
          Low Level Document
        </h3>
        <p className="text-sm text-gray-600 mt-1">Technical Specifications</p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Architecture Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Architecture Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Pipeline ID</p>
                <p className="text-xs text-gray-600 font-mono">{pipelineName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Region</p>
                <p className="text-xs text-gray-600 font-mono">{region}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Components</p>
                <p className="text-xs text-gray-600">{nodes.length} total, {edges.length} connections</p>
              </div>
            </CardContent>
          </Card>

          {/* Compute Resources */}
          {categories.compute.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Compute Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.compute.map((node) => {
                  const details = getNodeDetails(node);
                  return (
                    <div key={node.id} className="border-l-2 border-blue-200 pl-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{details.name}</p>
                        <Badge variant="outline" className="text-xs">{details.type}</Badge>
                      </div>
                      {Object.keys(details.config).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(details.config).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-500">{key}:</span>
                              <span className="ml-1 text-gray-700 font-mono">
                                {formatConfigValue(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Storage Resources */}
          {categories.storage.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Storage Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.storage.map((node) => {
                  const details = getNodeDetails(node);
                  return (
                    <div key={node.id} className="border-l-2 border-green-200 pl-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{details.name}</p>
                        <Badge variant="outline" className="text-xs">{details.type}</Badge>
                      </div>
                      {Object.keys(details.config).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(details.config).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-500">{key}:</span>
                              <span className="ml-1 text-gray-700 font-mono">
                                {formatConfigValue(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Database Resources */}
          {categories.database.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Database Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.database.map((node) => {
                  const details = getNodeDetails(node);
                  return (
                    <div key={node.id} className="border-l-2 border-purple-200 pl-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{details.name}</p>
                        <Badge variant="outline" className="text-xs">{details.type}</Badge>
                      </div>
                      {Object.keys(details.config).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(details.config).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-500">{key}:</span>
                              <span className="ml-1 text-gray-700 font-mono">
                                {formatConfigValue(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Network Resources */}
          {categories.networking.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Network Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.networking.map((node) => {
                  const details = getNodeDetails(node);
                  return (
                    <div key={node.id} className="border-l-2 border-indigo-200 pl-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{details.name}</p>
                        <Badge variant="outline" className="text-xs">{details.type}</Badge>
                      </div>
                      {Object.keys(details.config).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(details.config).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-500">{key}:</span>
                              <span className="ml-1 text-gray-700 font-mono">
                                {formatConfigValue(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Component Connections */}
          {connections.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Component Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {connections.map((connection) => (
                  <div key={connection.id} className="text-xs p-2 bg-gray-50 rounded">
                    <div className="font-mono">
                      <span className="text-blue-600">{connection.sourceNode}</span>
                      <span className="mx-2 text-gray-400">→</span>
                      <span className="text-green-600">{connection.targetNode}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Other Resources */}
          {categories.other.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Other Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.other.map((node) => {
                  const details = getNodeDetails(node);
                  return (
                    <div key={node.id} className="border-l-2 border-gray-200 pl-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{details.name}</p>
                        <Badge variant="outline" className="text-xs">{details.type}</Badge>
                      </div>
                      {Object.keys(details.config).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(details.config).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-gray-500">{key}:</span>
                              <span className="ml-1 text-gray-700 font-mono">
                                {formatConfigValue(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}