import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Folder, Users, Plus } from "lucide-react";
import type { Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CreateProjectModal from "@/components/modals/create-project-modal";

export default function SimpleProjectSelector() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user's projects and shared projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: sharedProjects = [], isLoading: sharedLoading } = useQuery<Project[]>({
    queryKey: ["/api/shared/projects"],
  });

  const isLoading = projectsLoading || sharedLoading;
  const allProjects = [...projects, ...sharedProjects];

  // Initialize project selection once projects are loaded
  useEffect(() => {
    if (!hasInitialized && allProjects.length > 0) {
      const savedProjectId = localStorage.getItem('selectedProjectId');
      
      if (savedProjectId) {
        const savedId = parseInt(savedProjectId);
        // Verify the saved project still exists
        const projectExists = allProjects.some(p => p.id === savedId);
        
        if (projectExists) {
          setSelectedProjectId(savedId);
        } else {
          // Saved project no longer exists, select first available
          const firstProjectId = allProjects[0].id;
          setSelectedProjectId(firstProjectId);
          localStorage.setItem('selectedProjectId', firstProjectId.toString());
        }
      } else {
        // No saved project, select first available
        const firstProjectId = allProjects[0].id;
        setSelectedProjectId(firstProjectId);
        localStorage.setItem('selectedProjectId', firstProjectId.toString());
      }
      
      setHasInitialized(true);
    }
  }, [allProjects, hasInitialized]);

  const selectedProject = allProjects.find(p => p.id === selectedProjectId);

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (newProject: Project) => {
      // Invalidate projects query to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Select the new project
      setSelectedProjectId(newProject.id);
      localStorage.setItem('selectedProjectId', newProject.id.toString());
      
      // Close modal and show success message
      setShowCreateModal(false);
      toast({
        title: "Project Created",
        description: `${newProject.name} has been created successfully.`,
      });
      
      // Refresh to update all components with new project
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProjectChange = (projectId: string) => {
    if (projectId === "__create_new__") {
      setShowCreateModal(true);
      return;
    }
    
    const id = parseInt(projectId);
    setSelectedProjectId(id);
    localStorage.setItem('selectedProjectId', id.toString());
    
    // Emit custom event for same-tab components to listen
    window.dispatchEvent(new CustomEvent('projectChanged'));
    
    // Invalidate all project-specific queries to refetch data
    queryClient.invalidateQueries({ queryKey: ["/api/pipelines"] });
    queryClient.invalidateQueries({ queryKey: ["/api/shared/pipelines"] });
    queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
    queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
    
    // Trigger a page refresh to update all components
    window.location.reload();
  };

  const handleCreateProject = async (data: { name: string; description: string }) => {
    await createProjectMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-purple-200">Project</div>
        <div className="h-8 bg-purple-600/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-purple-200">Project</div>
      <Select value={selectedProjectId?.toString()} onValueChange={handleProjectChange}>
        <SelectTrigger className="bg-purple-600/20 border-purple-400/30 text-white">
          <SelectValue placeholder="Select a project">
            {selectedProject && (
              <div className="flex items-center space-x-2">
                <Folder className="w-4 h-4" />
                <span className="truncate">{selectedProject.name}</span>
                {sharedProjects.some(p => p.id === selectedProjectId) && (
                  <Badge variant="secondary" className="text-xs bg-purple-500/30">
                    <Users className="w-3 h-3 mr-1" />
                    Shared
                  </Badge>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {projects.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                My Projects
              </div>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <Folder className="w-4 h-4" />
                    <span>{project.name}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
          
          {sharedProjects.length > 0 && (
            <>
              {projects.length > 0 && <div className="border-t my-1" />}
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Shared with Me
              </div>
              {sharedProjects.map((project) => (
                <SelectItem key={`shared-${project.id}`} value={project.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{project.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      Shared
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
          
          {/* Create New Project Option */}
          <div className="border-t my-1" />
          <SelectItem value="__create_new__" className="text-purple-600">
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span className="font-medium">Create New Project</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        isSubmitting={createProjectMutation.isPending}
      />
    </div>
  );
}