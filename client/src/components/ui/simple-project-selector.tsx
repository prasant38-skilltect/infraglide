import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Folder, Users } from "lucide-react";
import type { Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function SimpleProjectSelector() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load selected project from localStorage on mount
  useEffect(() => {
    const savedProjectId = localStorage.getItem('selectedProjectId');
    if (savedProjectId) {
      setSelectedProjectId(parseInt(savedProjectId));
    }
  }, []);

  // Fetch user's projects and shared projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: sharedProjects = [], isLoading: sharedLoading } = useQuery<Project[]>({
    queryKey: ["/api/shared/projects"],
  });

  const isLoading = projectsLoading || sharedLoading;
  const allProjects = [...projects, ...sharedProjects];

  // Set default project if none selected
  useEffect(() => {
    if (!selectedProjectId && allProjects.length > 0) {
      const firstProjectId = allProjects[0].id;
      setSelectedProjectId(firstProjectId);
      localStorage.setItem('selectedProjectId', firstProjectId.toString());
    }
  }, [selectedProjectId, allProjects]);

  const selectedProject = allProjects.find(p => p.id === selectedProjectId);

  const handleProjectChange = (projectId: string) => {
    const id = parseInt(projectId);
    setSelectedProjectId(id);
    localStorage.setItem('selectedProjectId', id.toString());
    
    // Invalidate all project-specific queries to refetch data
    queryClient.invalidateQueries({ queryKey: ["/api/pipelines"] });
    queryClient.invalidateQueries({ queryKey: ["/api/shared/pipelines"] });
    queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
    queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
    
    // Trigger a page refresh to update all components
    window.location.reload();
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
        </SelectContent>
      </Select>
    </div>
  );
}