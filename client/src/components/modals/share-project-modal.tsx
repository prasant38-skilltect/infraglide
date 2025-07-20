import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Users, Crown, Eye, Edit } from "lucide-react";
import type { ProjectShare } from "@shared/schema";

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
}

export default function ShareProjectModal({ isOpen, onClose, projectId, projectName }: ShareProjectModalProps) {
  const [userEmail, setUserEmail] = useState("");
  const [permission, setPermission] = useState<"editor" | "viewer">("viewer");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current shares
  const { data: shares = [], isLoading: sharesLoading } = useQuery<ProjectShare[]>({
    queryKey: ["/api/projects", projectId, "shares"],
    queryFn: async () => {
      const res = await apiRequest(`/api/projects/${projectId}/shares`);
      return await res.json();
    },
    enabled: isOpen,
  });

  // Share project mutation
  const shareMutation = useMutation({
    mutationFn: async (data: { userEmail: string; permission: string }) => {
      const res = await apiRequest(`/api/projects/${projectId}/share`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Project shared successfully",
        description: `${userEmail} now has ${permission} access to ${projectName}`,
      });
      setUserEmail("");
      setPermission("viewer");
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "shares"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to share project",
        description: error.message || "Please check the email address and try again",
        variant: "destructive",
      });
    },
  });

  // Remove share mutation
  const removeMutation = useMutation({
    mutationFn: async (shareId: number) => {
      await apiRequest(`/api/projects/${projectId}/shares/${shareId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Access removed",
        description: "User access has been revoked successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "shares"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove access",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    shareMutation.mutate({ userEmail: userEmail.trim(), permission });
  };

  const getPermissionIcon = (perm: string) => {
    switch (perm) {
      case "owner": return <Crown className="w-4 h-4" />;
      case "editor": return <Edit className="w-4 h-4" />;
      case "viewer": return <Eye className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getPermissionColor = (perm: string) => {
    switch (perm) {
      case "owner": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "editor": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "viewer": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Share Project
          </DialogTitle>
          <DialogDescription>
            Share "{projectName}" with other users by their email address
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleShare} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Permission Level</label>
            <Select value={permission} onValueChange={(value: "editor" | "viewer") => setPermission(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Viewer - Can view project and resources
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Editor - Can view and edit project resources
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={shareMutation.isPending || !userEmail.trim()}
          >
            {shareMutation.isPending ? "Sharing..." : "Share Project"}
          </Button>
        </form>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Current Access</h4>
          
          {sharesLoading ? (
            <div className="text-sm text-muted-foreground">Loading shares...</div>
          ) : shares.length === 0 ? (
            <div className="text-sm text-muted-foreground">No users have been granted access yet</div>
          ) : (
            <div className="space-y-2">
              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {getPermissionIcon(share.permission)}
                      <span className="text-sm">{share.sharedWithEmail}</span>
                    </div>
                    <Badge className={getPermissionColor(share.permission)}>
                      {share.permission}
                    </Badge>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMutation.mutate(share.id)}
                    disabled={removeMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}