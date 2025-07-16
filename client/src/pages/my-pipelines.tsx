import * as React from "react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Upload, Trash2, Edit3, Eye, Plus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pipeline } from "@shared/schema";

type SortField = 'name' | 'provider' | 'description' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function MyPipelines() {
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data: pipelines = [], isLoading } = useQuery<Pipeline[]>({
    queryKey: ["/api/pipelines"],
  });

  const handleExport = (pipeline: Pipeline) => {
    const dataStr = JSON.stringify(pipeline, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${pipeline.name.replace(/\s+/g, '_')}_v${pipeline.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Pipeline exported",
      description: `${pipeline.name} has been exported successfully.`,
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedPipeline = JSON.parse(e.target?.result as string);
            // TODO: Implement import logic
            toast({
              title: "Import functionality",
              description: "Import functionality will be implemented soon.",
            });
          } catch (error) {
            toast({
              title: "Import failed",
              description: "Invalid pipeline file format.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleDelete = (pipelineId: number) => {
    // TODO: Implement delete with confirmation
    toast({
      title: "Delete functionality",
      description: "Delete functionality will be implemented soon.",
    });
  };

  const getCloudProvider = (pipeline: Pipeline) => {
    if (!Array.isArray(pipeline.components) || pipeline.components.length === 0) {
      return 'Unknown';
    }
    
    const firstComponent = pipeline.components[0];
    const componentType = firstComponent.type;
    
    if (componentType.startsWith('gcp-')) return 'GCP';
    if (componentType.startsWith('azure-')) return 'Azure';
    return 'AWS';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-gray-700" /> : 
      <ChevronDown className="w-4 h-4 text-gray-700" />;
  };

  const sortedAndPaginatedPipelines = useMemo(() => {
    // Sort pipelines
    const sorted = [...pipelines].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'provider':
          aValue = getCloudProvider(a);
          bValue = getCloudProvider(b);
          break;
        case 'description':
          aValue = (a.description || '').toLowerCase();
          bValue = (b.description || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Paginate
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      paginatedPipelines: sorted.slice(startIndex, endIndex),
      totalPages: Math.ceil(sorted.length / itemsPerPage),
      totalItems: sorted.length
    };
  }, [pipelines, sortField, sortDirection, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'AWS':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Azure':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'GCP':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pipelines...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Pipelines</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and organize your cloud infrastructure pipelines
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Link href="/pipeline-designer">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Pipeline
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Overview</CardTitle>
              <CardDescription>
                {sortedAndPaginatedPipelines.totalItems} total pipelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('name')}
                          className="h-auto p-0 font-semibold justify-start"
                        >
                          Pipeline Name
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('provider')}
                          className="h-auto p-0 font-semibold justify-start"
                        >
                          Provider
                          {getSortIcon('provider')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('description')}
                          className="h-auto p-0 font-semibold justify-start"
                        >
                          Description
                          {getSortIcon('description')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[180px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('createdAt')}
                          className="h-auto p-0 font-semibold justify-start"
                        >
                          Created At
                          {getSortIcon('createdAt')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndPaginatedPipelines.paginatedPipelines.map((pipeline) => {
                      const provider = getCloudProvider(pipeline);
                      return (
                        <TableRow key={pipeline.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">
                                {pipeline.name}
                                {pipeline.version > 1 && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    v{pipeline.version}
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-gray-500">
                                ID: {pipeline.id}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getProviderBadgeColor(provider)}
                            >
                              {provider}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-700">
                              {pipeline.description || "No description"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-600">
                              {formatDate(pipeline.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExport(pipeline)}
                                title="Export pipeline"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Link href={`/pipeline-designer?id=${pipeline.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Edit pipeline"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(pipeline.id)}
                                title="Delete pipeline"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, sortedAndPaginatedPipelines.totalItems)} of{' '}
                    {sortedAndPaginatedPipelines.totalItems} pipelines
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: sortedAndPaginatedPipelines.totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === sortedAndPaginatedPipelines.totalPages || 
                      Math.abs(page - currentPage) <= 1
                    )
                    .map((page, index, array) => {
                      const showEllipsis = index > 0 && page - array[index - 1] > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      );
                    })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === sortedAndPaginatedPipelines.totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}