import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, GitBranch, Calendar, User, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Pipeline } from "@shared/schema";

interface PublishPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPipelineId?: number;
  currentPipelineName?: string;
  currentVersion?: number;
}

export default function PublishPipelineModal({
  isOpen,
  onClose,
  currentPipelineId,
  currentPipelineName,
  currentVersion
}: PublishPipelineModalProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [publishDescription, setPublishDescription] = useState("");
  const [publishTags, setPublishTags] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all versions of the current pipeline
  const { data: pipelineVersions = [] } = useQuery<Pipeline[]>({
    queryKey: ["/api/pipelines/versions", currentPipelineName],
    enabled: isOpen && !!currentPipelineName,
  });

  // Fetch all user pipelines if no current pipeline is selected
  const { data: userPipelines = [] } = useQuery<Pipeline[]>({
    queryKey: ["/api/pipelines"],
    enabled: isOpen && !currentPipelineId,
  });

  const publishMutation = useMutation({
    mutationFn: async (data: { 
      pipelineId: string; 
      description: string; 
      tags: string[]; 
      githubRepo: string;
      version: number;
    }) => {
      const response = await apiRequest("POST", "/api/hub/publish", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pipeline Published",
        description: "Your pipeline version has been published to the Hub and pushed to GitHub!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hub/pipelines"] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Publish Failed",
        description: "Failed to publish pipeline version. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedVersionId("");
    setPublishDescription("");
    setPublishTags("");
    setGithubRepo("");
  };

  const handlePublish = () => {
    if (!selectedVersionId || !publishDescription || !githubRepo) {
      toast({
        title: "Missing Information",
        description: "Please select a version, provide a description, and GitHub repository.",
        variant: "destructive",
      });
      return;
    }

    const selectedVersion = currentPipelineId 
      ? pipelineVersions.find(v => v.id.toString() === selectedVersionId)
      : userPipelines.find(p => p.id.toString() === selectedVersionId);

    if (!selectedVersion) {
      toast({
        title: "Version Not Found",
        description: "Selected pipeline version could not be found.",
        variant: "destructive",
      });
      return;
    }

    const tags = publishTags.split(",").map(tag => tag.trim()).filter(Boolean);
    publishMutation.mutate({
      pipelineId: selectedVersionId,
      description: publishDescription,
      tags,
      githubRepo: githubRepo.trim(),
      version: selectedVersion.version
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Get the selected version details for preview
  const selectedVersion = currentPipelineId 
    ? pipelineVersions.find(v => v.id.toString() === selectedVersionId)
    : userPipelines.find(p => p.id.toString() === selectedVersionId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Publish Pipeline to Hub
          </DialogTitle>
          <DialogDescription>
            Publish a specific version of your pipeline to the community Hub with GitHub integration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Version Selection */}
          <div className="space-y-2">
            <Label>Select Pipeline Version</Label>
            {currentPipelineId ? (
              <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a version to publish..." />
                </SelectTrigger>
                <SelectContent>
                  {pipelineVersions.map((version) => (
                    <SelectItem key={version.id} value={version.id.toString()}>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-3 w-3" />
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
            ) : (
              <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pipeline to publish..." />
                </SelectTrigger>
                <SelectContent>
                  {userPipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{pipeline.name}</span>
                        <Badge variant="outline" className="text-xs">{pipeline.provider}</Badge>
                        <span className="text-muted-foreground">v{pipeline.version}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Version Preview */}
          {selectedVersion && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{selectedVersion.name}</h4>
                    <Badge variant="secondary">v{selectedVersion.version}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedVersion.description || "No description provided"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Provider: {selectedVersion.provider}
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Region: {selectedVersion.region}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selectedVersion.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Components: {selectedVersion.components?.length || 0} | 
                    Connections: {selectedVersion.connections?.length || 0}
                  </div>
                  {selectedVersion.versionNotes && (
                    <div className="mt-2 p-2 bg-background rounded text-xs">
                      <strong>Version Notes:</strong> {selectedVersion.versionNotes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* GitHub Repository */}
          <div className="space-y-2">
            <Label htmlFor="github-repo">GitHub Repository</Label>
            <Input
              id="github-repo"
              placeholder="username/repository-name"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The GitHub repository where this pipeline will be published
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this pipeline does, its use cases, and any special features..."
              value={publishDescription}
              onChange={(e) => setPublishDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="web-app, microservices, production, scalable"
              value={publishTags}
              onChange={(e) => setPublishTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Help others discover your pipeline with relevant tags
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handlePublish}
              disabled={publishMutation.isPending || !selectedVersionId || !publishDescription || !githubRepo}
              className="flex-1"
            >
              {publishMutation.isPending ? "Publishing..." : "Publish to GitHub Hub"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}