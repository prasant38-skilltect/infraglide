import * as React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Project } from "@shared/schema";

interface SavePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  pipelineName: string;
  setPipelineName: (name: string) => void;
}

export default function SavePipelineModal({
  isOpen,
  onClose,
  onSave,
  pipelineName,
  setPipelineName,
}: SavePipelineModalProps) {
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("1");
  const [makeTemplate, setMakeTemplate] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const handleSave = () => {
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Pipeline</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Pipeline Name</Label>
            <Input
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what this pipeline does..."
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="template"
              checked={makeTemplate}
              onCheckedChange={(checked) => setMakeTemplate(checked as boolean)}
            />
            <Label htmlFor="template" className="text-sm text-gray-700">
              Save as template for reuse
            </Label>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Pipeline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
