import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Globe, 
  Upload, 
  Star, 
  Download, 
  GitBranch, 
  Eye, 
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Pipeline } from "@shared/schema";

interface HubPipeline {
  id: string;
  name: string;
  description: string;
  author: string;
  provider: string;
  region: string;
  components: any[];
  connections: any[];
  stars: number;
  downloads: number;
  publishedAt: string;
  version: string;
  tags: string[];
  status: 'published' | 'pending' | 'rejected';
  githubUrl?: string;
}

export default function Hub() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [publishDescription, setPublishDescription] = useState("");
  const [publishTags, setPublishTags] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get selected project from localStorage
  const selectedProjectId = parseInt(localStorage.getItem('selectedProjectId') || '1');

  // Fetch user's pipelines for publishing from selected project
  const { data: userPipelines } = useQuery<Pipeline[]>({
    queryKey: ["/api/pipelines", { projectId: selectedProjectId }],
    queryFn: () => apiRequest(`/api/pipelines?projectId=${selectedProjectId}`),
  });

  // Hub pipelines (empty - all demo resources removed)
  const hubPipelines: HubPipeline[] = [];

  const publishMutation = useMutation({
    mutationFn: async (data: { pipelineId: string; description: string; tags: string[] }) => {
      return apiRequest(`/api/hub/publish`, {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Pipeline Published",
        description: "Your pipeline has been published to the Hub and pushed to GitHub!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hub/pipelines"] });
      setShowPublishModal(false);
      setSelectedPipelineId("");
      setPublishDescription("");
      setPublishTags("");
    },
    onError: () => {
      toast({
        title: "Publish Failed",
        description: "Failed to publish pipeline. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePublish = () => {
    if (!selectedPipelineId || !publishDescription) {
      toast({
        title: "Missing Information",
        description: "Please select a pipeline and provide a description.",
        variant: "destructive",
      });
      return;
    }

    const tags = publishTags.split(",").map(tag => tag.trim()).filter(Boolean);
    publishMutation.mutate({
      pipelineId: selectedPipelineId,
      description: publishDescription,
      tags
    });
  };

  const handleImportFromHub = (hubPipeline: HubPipeline) => {
    // Create a new pipeline from hub data
    const newPipeline = {
      name: `${hubPipeline.name} (Imported)`,
      description: hubPipeline.description,
      provider: hubPipeline.provider,
      region: hubPipeline.region,
      components: hubPipeline.components,
      connections: hubPipeline.connections,
      status: "draft" as const,
      version: 1
    };

    // Store in sessionStorage and navigate to pipeline designer
    sessionStorage.setItem('importedPipeline', JSON.stringify(newPipeline));
    window.open('/pipeline', '_blank');

    toast({
      title: "Pipeline Imported",
      description: `${hubPipeline.name} has been imported and opened in Pipeline Designer`,
    });
  };

  const filteredPipelines = hubPipelines.filter(pipeline => {
    const matchesSearch = pipeline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pipeline.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pipeline.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProvider = selectedProvider === "all" || 
                           pipeline.provider.toLowerCase() === selectedProvider.toLowerCase();
    
    return matchesSearch && matchesProvider;
  });

  return (
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Globe className="w-8 h-8" />
                Pipeline Hub
              </h1>
              <p className="text-gray-600 mt-2">Discover and share infrastructure pipelines with the community</p>
            </div>
            
            <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Publish Pipeline
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Publish to Hub</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Pipeline</label>
                    <select 
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      value={selectedPipelineId}
                      onChange={(e) => setSelectedPipelineId(e.target.value)}
                    >
                      <option value="">Choose a pipeline...</option>
                      {userPipelines?.map((pipeline) => (
                        <option key={pipeline.id} value={pipeline.id}>
                          {pipeline.name} - {pipeline.provider}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Describe what this pipeline does and its use cases..."
                      value={publishDescription}
                      onChange={(e) => setPublishDescription(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Tags (comma-separated)</label>
                    <Input
                      placeholder="web-app, microservices, production"
                      value={publishTags}
                      onChange={(e) => setPublishTags(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handlePublish}
                      disabled={publishMutation.isPending}
                      className="flex-1"
                    >
                      {publishMutation.isPending ? "Publishing..." : "Publish to GitHub"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPublishModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search pipelines by name, description, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                  >
                    <option value="all">All Providers</option>
                    <option value="aws">AWS</option>
                    <option value="azure">Azure</option>
                    <option value="gcp">GCP</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPipelines.map((pipeline) => (
              <Card key={pipeline.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{pipeline.provider}</Badge>
                        <Badge variant={pipeline.status === 'published' ? 'default' : 'secondary'}>
                          {pipeline.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <User className="w-3 h-3" />
                      {pipeline.author}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {pipeline.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {pipeline.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {pipeline.stars}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {pipeline.downloads}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(pipeline.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">
                      {pipeline.components.length} components, v{pipeline.version}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleImportFromHub(pipeline)}
                        className="flex-1"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Import
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(pipeline.githubUrl, '_blank')}
                        className="flex-1"
                      >
                        <GitBranch className="w-3 h-3 mr-1" />
                        GitHub
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPipelines.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pipelines Found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedProvider !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Be the first to publish a pipeline to the Hub!"
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{hubPipelines.length}</div>
                <div className="text-sm text-gray-600">Total Pipelines</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {hubPipelines.reduce((sum, p) => sum + p.downloads, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Downloads</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {hubPipelines.reduce((sum, p) => sum + p.stars, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Stars</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(hubPipelines.map(p => p.author)).size}
                </div>
                <div className="text-sm text-gray-600">Contributors</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}