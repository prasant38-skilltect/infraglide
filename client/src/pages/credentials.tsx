import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Plus, Edit, Trash2, Key, Cloud, Database, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Credential } from "@shared/schema";

export default function Credentials() {
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    provider: "",
  });

  const { data: credentials = [], isLoading } = useQuery<Credential[]>({
    queryKey: ["/api/credentials"],
  });

  const createCredentialMutation = useMutation({
    mutationFn: async (credentialData: any) => {
      const response = await apiRequest("/api/credentials", {
        method: "POST",
        body: JSON.stringify(credentialData),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credential created",
        description: "Your credential has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create credential. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCredentialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(`/api/credentials/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credential updated",
        description: "Your credential has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      setShowEditModal(false);
      setEditingCredential(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update credential. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/credentials/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Credential deleted",
        description: "Your credential has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete credential. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      provider: "",
    });
    setShowPassword(false);
    setShowEditPassword(false);
  };

  const handleCreate = () => {
    createCredentialMutation.mutate(formData);
  };

  const handleEdit = (credential: Credential) => {
    setEditingCredential(credential);
    setFormData({
      name: credential.name,
      username: credential.username,
      password: credential.password,
      provider: credential.provider,
    });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (editingCredential) {
      updateCredentialMutation.mutate({
        id: editingCredential.id,
        data: formData,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this credential?")) {
      deleteCredentialMutation.mutate(id);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "aws":
        return <Cloud className="w-4 h-4 text-orange-500" />;
      case "gcp":
        return <Database className="w-4 h-4 text-blue-500" />;
      case "azure":
        return <Cloud className="w-4 h-4 text-cyan-500" />;
      default:
        return <Key className="w-4 h-4 text-gray-500" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "aws":
        return "bg-orange-100 text-orange-800";
      case "gcp":
        return "bg-blue-100 text-blue-800";
      case "azure":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Pagination logic
  const totalItems = credentials.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCredentials = credentials.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Credentials</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your cloud provider credentials</p>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Single Credentials Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : credentials.length === 0 ? (
                  <div className="text-center py-12">
                    <Key className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No credentials</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding your first credential.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Credential
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Provider/Type</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentCredentials.map((credential) => (
                          <TableRow key={credential.id}>
                            <TableCell className="font-medium">{credential.name}</TableCell>
                            <TableCell>
                              <Badge className={getProviderColor(credential.provider)}>
                                {credential.provider}
                              </Badge>
                            </TableCell>
                            <TableCell>{credential.username}</TableCell>
                            <TableCell>{formatDate(credential.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(credential)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(credential.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-700">
                          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} credentials
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronsLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-sm text-gray-700">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(totalPages)}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronsRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Credential Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Credential</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Production AWS Account"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="access-key-id or username"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="secret-access-key or password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Provider</Label>
              <Select 
                value={formData.provider} 
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AWS">AWS</SelectItem>
                  <SelectItem value="GCP">Google Cloud Platform</SelectItem>
                  <SelectItem value="Azure">Microsoft Azure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              className="flex-1"
              disabled={!formData.name || !formData.username || !formData.password || !formData.provider}
            >
              Create Credential
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Credential Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Credential</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showEditPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                >
                  {showEditPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Provider</Label>
              <Select 
                value={formData.provider} 
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AWS">AWS</SelectItem>
                  <SelectItem value="GCP">Google Cloud Platform</SelectItem>
                  <SelectItem value="Azure">Microsoft Azure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditModal(false);
                setEditingCredential(null);
                resetForm();
              }} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              className="flex-1"
              disabled={!formData.name || !formData.username || !formData.password || !formData.provider}
            >
              Update Credential
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}