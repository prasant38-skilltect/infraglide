import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Folder, Plus, Settings, Users, ChevronDown } from "lucide-react";
import type { Project } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateProjectModal from "@/components/modals/create-project-modal";

interface ProjectSelectorProps {
  selectedProjectId?: number;
  onProjectChange: (projectId: number) => void;
  className?: string;
}

export default function ProjectSelector({
  selectedProjectId,
  onProjectChange,
  className = "",
}: ProjectSelectorProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { name: string; description: string }) => {
      return await apiRequest("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onProjectChange(newProject.id);
      setShowCreateModal(false);
      toast({
        title: "Project Created",
        description: `"${newProject.name}" has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const selectedProject = allProjects.find(p => p.id === selectedProjectId);

  const handleCreateProject = async (data: { name: string; description: string }) => {
    await createProjectMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md ${className}`}>
        <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
        <div className="w-24 h-4 bg-gray-300 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative">
          <Select
            value={selectedProjectId?.toString()}
            onValueChange={(value) => onProjectChange(parseInt(value, 10))}
          >
            <SelectTrigger className="w-[200px] bg-white border-gray-200 hover:bg-gray-50">
              <SelectValue>
                {selectedProject ? (
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-purple-600" />
                    <span className="truncate">{selectedProject.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Select Project</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  <div className="flex items-center gap-2 py-1">
                    <Folder className="h-4 w-4 text-purple-600" />
                    <div className="flex-1">
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-gray-500 truncate max-w-[150px]">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
              <SelectItem value="__create_new__" className="border-t">
                <div 
                  className="flex items-center gap-2 py-1 text-purple-600 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateModal(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Create New Project</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Project stats if a project is selected */}
      {selectedProject && (
        <div className="flex items-center gap-2 ml-4">
          <Badge variant="secondary" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Owner
          </Badge>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        isSubmitting={createProjectMutation.isPending}
      />
    </>
  );
}