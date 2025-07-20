import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Shield, 
  Users, 
  UserPlus, 
  Settings, 
  Lock, 
  Unlock, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Key,
  Database,
  Cloud,
  GitBranch,
  Share
} from "lucide-react";

const RESOURCES = [
  { id: 'pipelines', name: 'Pipelines', icon: GitBranch, color: 'blue' },
  { id: 'credentials', name: 'Credentials', icon: Key, color: 'green' },
  { id: 'hub', name: 'Hub', icon: Share, color: 'purple' },
  { id: 'deployments', name: 'Deployments', icon: Cloud, color: 'orange' },
  { id: 'users', name: 'Users', icon: Users, color: 'red' }
];

const ACTIONS = [
  { id: 'read', name: 'Read', description: 'View resources', icon: Eye },
  { id: 'write', name: 'Write', description: 'Create and edit resources', icon: Edit },
  { id: 'execute', name: 'Execute', description: 'Run deployments and operations', icon: Settings },
  { id: 'delete', name: 'Delete', description: 'Remove resources', icon: Trash2 },
  { id: 'share', name: 'Share', description: 'Share resources with others', icon: Share },
  { id: 'publish', name: 'Publish', description: 'Publish to Hub', icon: Cloud }
];

export default function AccessManagement() {
  const [selectedTab, setSelectedTab] = useState("roles");
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showAssignRole, setShowAssignRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch data
  const { data: roles = [] } = useQuery({
    queryKey: ["/api/rbac/roles"],
    refetchOnWindowFocus: false,
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ["/api/rbac/permissions"],
    refetchOnWindowFocus: false,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      const response = await apiRequest("/api/rbac/roles", {
        method: "POST",
        body: JSON.stringify(roleData),
      });
      if (!response.ok) throw new Error("Failed to create role");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rbac/roles"] });
      setShowCreateRole(false);
      toast({ title: "Role created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create role", variant: "destructive" });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      const response = await apiRequest("/api/rbac/user-roles", {
        method: "POST",
        body: JSON.stringify({ userId, roleId }),
      });
      if (!response.ok) throw new Error("Failed to assign role");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rbac/user-roles"] });
      setShowAssignRole(false);
      toast({ title: "Role assigned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to assign role", variant: "destructive" });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const response = await apiRequest(`/api/rbac/roles/${roleId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete role");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rbac/roles"] });
      toast({ title: "Role deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete role", variant: "destructive" });
    },
  });

  const handleCreateRole = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const roleData = {
      name: formData.get("name"),
      description: formData.get("description"),
      isSystem: false
    };
    createRoleMutation.mutate(roleData);
  };

  const handleAssignRole = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userId = parseInt(formData.get("userId") as string);
    const roleId = parseInt(formData.get("roleId") as string);
    assignRoleMutation.mutate({ userId, roleId });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-purple-600" />
            Access Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user roles and permissions for infrastructure resources
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="users">User Access</TabsTrigger>
          <TabsTrigger value="resources">Resource Permissions</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">System Roles</h2>
            <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Define a new role with specific permissions for your organization.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRole} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Role Name</Label>
                    <Input id="name" name="name" placeholder="e.g., Developer, Manager" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" placeholder="Brief description of the role" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateRole(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      Create Role
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {roles.map((role: any) => (
              <Card key={role.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {role.isSystem && (
                      <Badge variant="secondary">System Role</Badge>
                    )}
                    {!role.isSystem && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRoleMutation.mutate(role.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <h2 className="text-xl font-semibold">Permission Matrix</h2>
          
          <div className="grid gap-6">
            {RESOURCES.map((resource) => {
              const ResourceIcon = resource.icon;
              return (
                <Card key={resource.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ResourceIcon className="h-5 w-5" style={{ color: `var(--${resource.color}-500)` }} />
                      {resource.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {ACTIONS.map((action) => {
                        const ActionIcon = action.icon;
                        return (
                          <div key={action.id} className="flex flex-col items-center p-3 border rounded-lg">
                            <ActionIcon className="h-6 w-6 mb-2 text-muted-foreground" />
                            <span className="text-sm font-medium">{action.name}</span>
                            <span className="text-xs text-muted-foreground text-center">{action.description}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* User Access Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">User Access Control</h2>
            <Dialog open={showAssignRole} onOpenChange={setShowAssignRole}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Role to User</DialogTitle>
                  <DialogDescription>
                    Grant a role to a user to provide specific permissions.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAssignRole} className="space-y-4">
                  <div>
                    <Label htmlFor="userId">Select User</Label>
                    <Select name="userId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName} (@{user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="roleId">Select Role</Label>
                    <Select name="roleId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role: any) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAssignRole(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      Assign Role
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.isAdmin && (
                            <Badge variant="destructive">Admin</Badge>
                          )}
                          <Badge variant="outline">User</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resource Permissions Tab */}
        <TabsContent value="resources" className="space-y-4">
          <h2 className="text-xl font-semibold">Resource-Level Permissions</h2>
          
          <div className="grid gap-4">
            {RESOURCES.map((resource) => {
              const ResourceIcon = resource.icon;
              return (
                <Card key={resource.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ResourceIcon className="h-5 w-5" style={{ color: `var(--${resource.color}-500)` }} />
                      {resource.name} Access Control
                    </CardTitle>
                    <CardDescription>
                      Manage specific permissions for individual {resource.name.toLowerCase()} resources
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Grant specific users access to individual resources without changing their overall role
                        </div>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Grant Access
                        </Button>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">
                          No specific resource permissions configured for {resource.name.toLowerCase()}.
                          All access is currently managed through user roles.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}