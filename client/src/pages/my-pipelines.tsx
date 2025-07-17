import * as React from "react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Trash2, Edit3, Eye, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Pipeline } from "@shared/schema";

type SortField = 'name' | 'provider' | 'description' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function MyPipelines() {
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedProvider, setSelectedProvider] = useState<string>("All");

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

  const handleDelete = (pipelineId: number) => {
    // TODO: Implement delete with confirmation
    toast({
      title: "Delete functionality",
      description: "Delete functionality will be implemented soon.",
    });
  };

  const toggleRowExpansion = (pipelineName: string) => {
    if (expandedRows.has(pipelineName)) {
      // If clicking on the already expanded row, collapse it
      setExpandedRows(new Set());
    } else {
      // Expand only the clicked row, collapse all others
      setExpandedRows(new Set([pipelineName]));
    }
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

  const groupedPipelines = useMemo(() => {
    // Group pipelines by name
    const grouped = pipelines.reduce((acc, pipeline) => {
      if (!acc[pipeline.name]) {
        acc[pipeline.name] = [];
      }
      acc[pipeline.name].push(pipeline);
      return acc;
    }, {} as Record<string, Pipeline[]>);

    // Sort versions within each group (highest version first)
    Object.keys(grouped).forEach(name => {
      grouped[name].sort((a, b) => b.version - a.version);
    });

    return grouped;
  }, [pipelines]);

  const sortedAndPaginatedPipelines = useMemo(() => {
    // Get the main pipeline (latest version) for each group for sorting
    const mainPipelines = Object.entries(groupedPipelines).map(([name, versions]) => ({
      name,
      pipeline: versions[0], // Latest version
      versions,
      totalVersions: versions.length
    }));

    // Filter by provider
    const filtered = selectedProvider === "All" 
      ? mainPipelines 
      : mainPipelines.filter(group => getCloudProvider(group.pipeline) === selectedProvider);

    // Sort main pipelines
    const sorted = filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'provider':
          aValue = getCloudProvider(a.pipeline);
          bValue = getCloudProvider(b.pipeline);
          break;
        case 'description':
          aValue = (a.pipeline.description || '').toLowerCase();
          bValue = (b.pipeline.description || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.pipeline.createdAt).getTime();
          bValue = new Date(b.pipeline.createdAt).getTime();
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
      paginatedGroups: sorted.slice(startIndex, endIndex),
      totalPages: Math.ceil(sorted.length / itemsPerPage),
      totalItems: sorted.length
    };
  }, [groupedPipelines, sortField, sortDirection, currentPage, itemsPerPage, getCloudProvider, selectedProvider]);

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
              <div className="flex items-center space-x-2">
                <Label htmlFor="provider-filter" className="text-sm font-medium text-gray-700">
                  Filter:
                </Label>
                <Select value={selectedProvider} onValueChange={(value) => {
                  setSelectedProvider(value);
                  setCurrentPage(1); // Reset to first page when filtering
                }}>
                  <SelectTrigger id="provider-filter" className="w-32">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="AWS">AWS</SelectItem>
                    <SelectItem value="Azure">Azure</SelectItem>
                    <SelectItem value="GCP">GCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndPaginatedPipelines.paginatedGroups.flatMap((group) => {
                      const { name, pipeline, versions, totalVersions } = group;
                      const provider = getCloudProvider(pipeline);
                      const isExpanded = expandedRows.has(name);
                      
                      const rows = [
                        // Main row
                        <TableRow 
                          key={name}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleRowExpansion(name)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-6 w-6"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                              <div className="flex flex-col">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-gray-900">
                                    {name}
                                  </span>
                                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                    {totalVersions} version{totalVersions > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  Latest: v{pipeline.version} (ID: {pipeline.id})
                                </span>
                              </div>
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
                        </TableRow>
                      ];
                      
                      // Add expanded version rows if expanded
                      if (isExpanded) {
                        versions.forEach((version) => {
                          rows.push(
                            <TableRow key={`${name}-${version.id}`} className="bg-gray-50">
                              <TableCell className="pl-12">
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">
                                      Version {version.version}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ID: {version.id} • Created: {formatDate(version.createdAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleExport(version);
                                      }}
                                      className="h-8 px-2"
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Export
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(version.id);
                                      }}
                                      className="h-8 px-2 text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-gray-500">v{version.version}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-gray-600 text-sm">
                                  {version.description || "No description"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-gray-500 text-sm">
                                  {formatDate(version.createdAt)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      }
                      
                      return rows;
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
                        <div key={page} className="flex items-center">
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
                        </div>
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