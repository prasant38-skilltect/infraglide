import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Share2, Trash2, Users, Mail, Eye, Edit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SharePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: number;
  pipelineName: string;
}

interface ResourcePermission {
  id: number;
  userId: number;
  userEmail: string;
  permission: string;
  grantedBy: number;
  createdAt: string;
}

export default function SharePipelineModal({
  isOpen,
  onClose,
  pipelineId,
  pipelineName,
}: SharePipelineModalProps) {
  const [userEmail, setUserEmail] = useState("");
  const [permission, setPermission] = useState("viewer");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch existing shares for this pipeline
  const { data: shares = [], isLoading } = useQuery<ResourcePermission[]>({
    queryKey: [`/api/resources/pipelines/${pipelineId}/shares`],
    enabled: isOpen,
  });

  // Share pipeline mutation
  const shareMutation = useMutation({
    mutationFn: async (data: { userEmail: string; permission: string }) => {
      return await apiRequest(`/api/resources/pipelines/${pipelineId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/resources/pipelines/${pipelineId}/shares`] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines"] });
      setUserEmail("");
      setPermission("viewer");
      toast({
        title: "Pipeline Shared",
        description: `"${pipelineName}" has been shared successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Sharing Failed",
        description: error instanceof Error ? error.message : "Failed to share pipeline",
        variant: "destructive",
      });
    },
  });

  // Remove share mutation
  const removeMutation = useMutation({
    mutationFn: async (shareId: number) => {
      return await apiRequest(`/api/resources/pipelines/${pipelineId}/shares/${shareId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/resources/pipelines/${pipelineId}/shares`] 
      });
      toast({
        title: "Access Removed",
        description: "User access has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Remove Access",
        description: error instanceof Error ? error.message : "Failed to remove access",
        variant: "destructive",
      });
    },
  });

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    await shareMutation.mutateAsync({ userEmail, permission });
  };

  const handleRemoveShare = (shareId: number) => {
    if (confirm("Are you sure you want to remove this user's access?")) {
      removeMutation.mutate(shareId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-purple-600" />
            Share Pipeline
          </DialogTitle>
          <DialogDescription>
            Share "{pipelineName}" with other users by entering their email addresses.
          </DialogDescription>
        </DialogHeader>

        {/* Share Form */}
        <form onSubmit={handleShare} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="userEmail">User Email</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="permission">Permission</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Viewer
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Editor
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={shareMutation.isPending || !userEmail.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {shareMutation.isPending ? "Sharing..." : "Share Pipeline"}
          </Button>
        </form>

        {/* Permission Info */}
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            <strong>Viewer:</strong> Can view and export the pipeline<br />
            <strong>Editor:</strong> Can view, edit, and modify the pipeline
          </AlertDescription>
        </Alert>

        {/* Existing Shares */}
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : shares.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Shared with ({shares.length})</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Shared On</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shares.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{share.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={share.permission === 'editor' ? 'default' : 'secondary'}>
                        {share.permission === 'editor' ? (
                          <><Edit className="h-3 w-3 mr-1" />Editor</>
                        ) : (
                          <><Eye className="h-3 w-3 mr-1" />Viewer</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(share.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveShare(share.id)}
                        disabled={removeMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">This pipeline hasn't been shared yet</p>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}