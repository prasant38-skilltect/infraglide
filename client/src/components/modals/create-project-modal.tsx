import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Folder, Users, Shield } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  isSubmitting?: boolean;
  isSignupFlow?: boolean;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  isSignupFlow = false,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
    });

    if (!isSignupFlow) {
      setName("");
      setDescription("");
    }
  };

  const canSubmit = name.trim().length > 0 && !isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-purple-600" />
            {isSignupFlow ? "Create Your First Project" : "Create New Project"}
          </DialogTitle>
          <DialogDescription>
            {isSignupFlow 
              ? "Set up your first project to organize your infrastructure resources. All pipelines and credentials will be organized within projects."
              : "Create a new project to organize your infrastructure resources."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName" className="text-sm font-medium">
                Project Name *
              </Label>
              <Input
                id="projectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Production Infrastructure"
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="projectDescription" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="projectDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this project's purpose..."
                rows={3}
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>

            {isSignupFlow && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-2">
                  <Shield className="h-4 w-4" />
                  Project Features
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Complete resource isolation from other users
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Share access with team members via email
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    Role-based permissions (Owner, Editor, Viewer)
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            {!isSignupFlow && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Project...
                </>
              ) : (
                <>
                  <Folder className="mr-2 h-4 w-4" />
                  {isSignupFlow ? "Create Project & Continue" : "Create Project"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}