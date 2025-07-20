import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare, Calendar, User, FileText, Layers, Link as LinkIcon } from "lucide-react";

interface PipelineDiffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineName: string;
}

interface PipelineVersion {
  id: number;
  version: number;
  description: string;
  versionNotes: string;
  components: any[];
  connections: any[];
  createdAt: string;
  isLatestVersion: boolean;
}

export default function PipelineDiffDialog({ isOpen, onClose, pipelineName }: PipelineDiffDialogProps) {
  const [version1, setVersion1] = useState<string>("");
  const [version2, setVersion2] = useState<string>("");
  const [selectedVersions, setSelectedVersions] = useState<{v1?: PipelineVersion, v2?: PipelineVersion}>({});

  // Fetch all versions of the pipeline
  const { data: versions = [] } = useQuery({
    queryKey: ["/api/pipelines/versions", pipelineName],
    enabled: isOpen && !!pipelineName,
    refetchOnWindowFocus: false,
  });

  const handleVersionSelect = (versionId: string, isFirstVersion: boolean) => {
    const selectedVersion = versions.find((v: PipelineVersion) => v.id.toString() === versionId);
    if (isFirstVersion) {
      setVersion1(versionId);
      setSelectedVersions(prev => ({ ...prev, v1: selectedVersion }));
    } else {
      setVersion2(versionId);
      setSelectedVersions(prev => ({ ...prev, v2: selectedVersion }));
    }
  };

  const generateDiff = () => {
    if (!selectedVersions.v1 || !selectedVersions.v2) return null;

    const v1 = selectedVersions.v1;
    const v2 = selectedVersions.v2;

    // Compare components
    const v1ComponentIds = new Set(v1.components.map(c => c.id));
    const v2ComponentIds = new Set(v2.components.map(c => c.id));
    
    const addedComponents = v2.components.filter(c => !v1ComponentIds.has(c.id));
    const removedComponents = v1.components.filter(c => !v2ComponentIds.has(c.id));
    const modifiedComponents = v2.components.filter(c => {
      const v1Component = v1.components.find(comp => comp.id === c.id);
      return v1Component && JSON.stringify(v1Component) !== JSON.stringify(c);
    });

    // Compare connections
    const v1Connections = v1.connections || [];
    const v2Connections = v2.connections || [];
    const connectionsChanged = JSON.stringify(v1Connections) !== JSON.stringify(v2Connections);

    return {
      addedComponents,
      removedComponents,
      modifiedComponents,
      connectionsChanged,
      v1Connections,
      v2Connections
    };
  };

  const diff = generateDiff();

  useEffect(() => {
    if (versions.length >= 2) {
      // Auto-select latest two versions
      const sortedVersions = [...versions].sort((a, b) => b.version - a.version);
      setVersion1(sortedVersions[1]?.id.toString() || "");
      setVersion2(sortedVersions[0]?.id.toString() || "");
      setSelectedVersions({
        v1: sortedVersions[1],
        v2: sortedVersions[0]
      });
    }
  }, [versions]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-purple-600" />
            Pipeline Version Comparison
          </DialogTitle>
          <DialogDescription>
            Compare different versions of "{pipelineName}" to see what changed between them.
          </DialogDescription>
        </DialogHeader>

        {/* Version Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Version 1 (Base)</label>
            <Select value={version1} onValueChange={(value) => handleVersionSelect(value, true)}>
              <SelectTrigger>
                <SelectValue placeholder="Select base version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version: PipelineVersion) => (
                  <SelectItem key={version.id} value={version.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>v{version.version}</span>
                      {version.isLatestVersion && <Badge variant="default" className="text-xs">Latest</Badge>}
                      <span className="text-muted-foreground">
                        - {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Version 2 (Compare)</label>
            <Select value={version2} onValueChange={(value) => handleVersionSelect(value, false)}>
              <SelectTrigger>
                <SelectValue placeholder="Select version to compare" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version: PipelineVersion) => (
                  <SelectItem key={version.id} value={version.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>v{version.version}</span>
                      {version.isLatestVersion && <Badge variant="default" className="text-xs">Latest</Badge>}
                      <span className="text-muted-foreground">
                        - {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Results */}
        {diff && selectedVersions.v1 && selectedVersions.v2 && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Version 1 Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Version {selectedVersions.v1.version}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedVersions.v1.createdAt).toLocaleDateString()}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-2">
                      <div>Components: {selectedVersions.v1.components.length}</div>
                      <div>Connections: {selectedVersions.v1.connections.length}</div>
                      {selectedVersions.v1.versionNotes && (
                        <div className="p-2 bg-muted rounded">
                          <div className="font-medium text-xs mb-1">Notes:</div>
                          <div className="text-xs">{selectedVersions.v1.versionNotes}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Version 2 Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Version {selectedVersions.v2.version}
                      {selectedVersions.v2.isLatestVersion && (
                        <Badge variant="default" className="ml-2 text-xs">Latest</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedVersions.v2.createdAt).toLocaleDateString()}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-2">
                      <div>Components: {selectedVersions.v2.components.length}</div>
                      <div>Connections: {selectedVersions.v2.connections.length}</div>
                      {selectedVersions.v2.versionNotes && (
                        <div className="p-2 bg-muted rounded">
                          <div className="font-medium text-xs mb-1">Notes:</div>
                          <div className="text-xs">{selectedVersions.v2.versionNotes}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary of Changes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Change Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{diff.addedComponents.length}</div>
                      <div className="text-muted-foreground">Added Components</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{diff.modifiedComponents.length}</div>
                      <div className="text-muted-foreground">Modified Components</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{diff.removedComponents.length}</div>
                      <div className="text-muted-foreground">Removed Components</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Added Components */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-green-600 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Added ({diff.addedComponents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {diff.addedComponents.length > 0 ? (
                      <div className="space-y-2">
                        {diff.addedComponents.map((component, index) => (
                          <div key={index} className="p-2 bg-green-50 rounded text-xs">
                            <div className="font-medium">{component.type || 'Unknown'}</div>
                            <div className="text-muted-foreground">{component.data?.label || component.id}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No components added</div>
                    )}
                  </CardContent>
                </Card>

                {/* Modified Components */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-orange-600 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Modified ({diff.modifiedComponents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {diff.modifiedComponents.length > 0 ? (
                      <div className="space-y-2">
                        {diff.modifiedComponents.map((component, index) => (
                          <div key={index} className="p-2 bg-orange-50 rounded text-xs">
                            <div className="font-medium">{component.type || 'Unknown'}</div>
                            <div className="text-muted-foreground">{component.data?.label || component.id}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No components modified</div>
                    )}
                  </CardContent>
                </Card>

                {/* Removed Components */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Removed ({diff.removedComponents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {diff.removedComponents.length > 0 ? (
                      <div className="space-y-2">
                        {diff.removedComponents.map((component, index) => (
                          <div key={index} className="p-2 bg-red-50 rounded text-xs">
                            <div className="font-medium">{component.type || 'Unknown'}</div>
                            <div className="text-muted-foreground">{component.data?.label || component.id}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No components removed</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="connections" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Connection Changes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {diff.connectionsChanged ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Version {selectedVersions.v1.version} Connections:</div>
                        <div className="text-xs bg-red-50 p-2 rounded">
                          {diff.v1Connections.length} connections
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Version {selectedVersions.v2.version} Connections:</div>
                        <div className="text-xs bg-green-50 p-2 rounded">
                          {diff.v2Connections.length} connections
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No connection changes between versions</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Version {selectedVersions.v1.version} Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <div><strong>Description:</strong> {selectedVersions.v1.description || 'No description'}</div>
                    <div><strong>Created:</strong> {new Date(selectedVersions.v1.createdAt).toLocaleString()}</div>
                    <div><strong>Version Notes:</strong> {selectedVersions.v1.versionNotes || 'No notes'}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Version {selectedVersions.v2.version} Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <div><strong>Description:</strong> {selectedVersions.v2.description || 'No description'}</div>
                    <div><strong>Created:</strong> {new Date(selectedVersions.v2.createdAt).toLocaleString()}</div>
                    <div><strong>Version Notes:</strong> {selectedVersions.v2.versionNotes || 'No notes'}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}