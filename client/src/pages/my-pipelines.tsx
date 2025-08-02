import * as React from "react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Trash2,
  Edit3,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  GitCompare,
} from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Pipeline } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Add the throwIfResNotOk function
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
import PipelineDiffDialog from "@/components/pipeline-diff-dialog";

type SortField = "name" | "provider" | "description" | "createdAt";
type SortDirection = "asc" | "desc";

export default function MyPipelines() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get selected project from localStorage
  const selectedProjectId = parseInt(
    localStorage.getItem("selectedProjectId") || "1",
  );
  const [location, setLocation] = useLocation();
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedProvider, setSelectedProvider] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [showDeleteDialog, setShowDeleteDialog] = useState<number | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState<Pipeline | null>(
    null,
  );
  const [newPipelineName, setNewPipelineName] = useState("");
  const [newPipelineDescription, setNewPipelineDescription] = useState("");
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [diffPipelineName, setDiffPipelineName] = useState<string>("");

  // Fetch both owned and shared pipelines filtered by selected project
  const { data: ownedPipelines = [], isLoading: isLoadingOwned } = useQuery<
    Pipeline[]
  >({
    queryKey: ["/api/pipelines", { projectId: selectedProjectId }],
    queryFn: async () => {
      const res = await apiRequest(
        `/api/pipelines?projectId=${selectedProjectId}`,
      );
      return await res.json(); // ✅ Convert ReadableStream to JSON here
    },
  });

  const { data: sharedPipelines = [], isLoading: isLoadingShared } = useQuery<
    Pipeline[]
  >({
    queryKey: ["/api/shared/pipelines", { projectId: selectedProjectId }],
    queryFn: async () => {
      const res = await apiRequest(
        `/api/shared/pipelines?projectId=${selectedProjectId}`,
      );
      return await res.json(); // ✅ Convert to usable JSON here
    },
  });

  console.log("Owned Pipelines:", ownedPipelines);
  console.log("Shared Pipelines:", sharedPipelines);
  // Combine pipelines with ownership indicators
  const pipelines = useMemo(() => {
    const owned = ownedPipelines.map((p) => ({
      ...p,
      isOwned: true,
      isShared: false,
    }));
    const shared = sharedPipelines.map((p) => ({
      ...p,
      isOwned: false,
      isShared: true,
    }));
    return [...owned, ...shared];
  }, [ownedPipelines, sharedPipelines]);

  const isLoading = isLoadingOwned || isLoadingShared;

  // Delete pipeline mutation
  const deletePipelineMutation = useMutation({
    mutationFn: async (pipelineId: number) => {
      const response = await apiRequest(`/api/pipelines/${pipelineId}`, {
        method: "DELETE",
      });
      await throwIfResNotOk(response);
      return response;
    },
    onSuccess: () => {
      // Invalidate all query variations and force fresh data fetch
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared/pipelines"] });
      
      // Also invalidate project-specific queries
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines", { projectId: selectedProjectId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared/pipelines", { projectId: selectedProjectId }] });
      
      // Force immediate refetch by removing from cache
      queryClient.removeQueries({ queryKey: ["/api/pipelines"] });
      queryClient.removeQueries({ queryKey: ["/api/shared/pipelines"] });
      
      toast({
        title: "Pipeline deleted",
        description: "Pipeline has been successfully deleted.",
      });
      setShowDeleteDialog(null);
    },
    onError: (error) => {
      console.error("Delete pipeline error:", error);
      toast({
        title: "Error",
        description: `Failed to delete pipeline: ${error instanceof Error ? error.message : "Please try again."}`,
        variant: "destructive",
      });
    },
  });

  // Create pipeline mutation
  const createPipelineMutation = useMutation({
    mutationFn: async (pipelineData: any) => {
      const response = await apiRequest("POST", "/api/pipelines", {
        ...pipelineData,
        projectId: selectedProjectId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines", { projectId: selectedProjectId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared/pipelines", { projectId: selectedProjectId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared/pipelines"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create pipeline. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Rename pipeline mutation
  const renamePipelineMutation = useMutation({
    mutationFn: async ({
      pipelineId,
      name,
      description,
    }: {
      pipelineId: number;
      name: string;
      description: string;
    }) => {
      const response = await apiRequest("PUT", `/api/pipelines/${pipelineId}`, {
        name,
        description,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines", { projectId: selectedProjectId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared/pipelines", { projectId: selectedProjectId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared/pipelines"] });
      toast({
        title: "Pipeline updated",
        description: "Pipeline name and description have been updated.",
      });
      setShowRenameDialog(null);
      setNewPipelineName("");
      setNewPipelineDescription("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update pipeline. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExport = (pipeline: Pipeline) => {
    const dataStr = JSON.stringify(pipeline, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${pipeline.name.replace(/\s+/g, "_")}_v${pipeline.id}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Pipeline exported",
      description: `${pipeline.name} has been exported successfully.`,
    });
  };

  const handleImportToPipelineDesigner = (pipeline: Pipeline) => {
    // Navigate to pipeline designer with the specific pipeline ID for editing
    setLocation(`/pipeline/${pipeline.id}`);

    toast({
      title: "Pipeline opened in canvas",
      description: `${pipeline.name} is now open for editing in the canvas.`,
    });
  };

  // Keep the old import functionality for file imports (if needed)
  const handleImportFromFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedPipeline = JSON.parse(e.target?.result as string);

            // Create a new pipeline with imported data
            const newPipelineData = {
              name: `${importedPipeline.name || "Imported Pipeline"}_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "-")}`,
              description: importedPipeline.description || "Imported pipeline",
              components: importedPipeline.components || [],
              connections: importedPipeline.connections || [],
              region: importedPipeline.region || "us-east-1",
              status: "draft",
              version: 1,
            };

            createPipelineMutation.mutate(newPipelineData, {
              onSuccess: () => {
                toast({
                  title: "Pipeline imported successfully",
                  description: `${newPipelineData.name} has been imported and created.`,
                });
              },
              onError: () => {
                toast({
                  title: "Import failed",
                  description: "Failed to create pipeline from imported data.",
                  variant: "destructive",
                });
              },
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
    setShowDeleteDialog(pipelineId);
  };

  const handleDeleteConfirm = () => {
    if (showDeleteDialog) {
      deletePipelineMutation.mutate(showDeleteDialog);
    }
  };

  const handleRename = (pipeline: Pipeline) => {
    setShowRenameDialog(pipeline);
    setNewPipelineName(pipeline.name);
    setNewPipelineDescription(pipeline.description || "");
  };

  const handlePipelineDiff = (pipelineName: string) => {
    setDiffPipelineName(pipelineName);
    setDiffDialogOpen(true);
  };

  const handleRenameConfirm = () => {
    if (showRenameDialog && newPipelineName.trim()) {
      renamePipelineMutation.mutate({
        pipelineId: showRenameDialog.id,
        name: newPipelineName.trim(),
        description: newPipelineDescription.trim(),
      });
    }
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
    if (
      !Array.isArray(pipeline.components) ||
      pipeline.components.length === 0
    ) {
      return "Unknown";
    }

    const firstComponent = pipeline.components[0];
    const componentType = firstComponent.type;

    if (componentType.startsWith("gcp-")) return "GCP";
    if (componentType.startsWith("azure-")) return "Azure";
    return "AWS";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-gray-700" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gray-700" />
    );
  };

  const groupedPipelines = useMemo(() => {
    // Group pipelines by name
    const grouped = pipelines.reduce(
      (acc, pipeline) => {
        if (!acc[pipeline.name]) {
          acc[pipeline.name] = [];
        }
        acc[pipeline.name].push(pipeline);
        return acc;
      },
      {} as Record<string, Pipeline[]>,
    );

    // Sort versions within each group (highest version first)
    Object.keys(grouped).forEach((name) => {
      grouped[name].sort((a, b) => b.version - a.version);
    });

    return grouped;
  }, [pipelines]);

  const sortedAndPaginatedPipelines = useMemo(() => {
    // Get the main pipeline (latest version) for each group for sorting
    const mainPipelines = Object.entries(groupedPipelines).map(
      ([name, versions]) => ({
        name,
        pipeline: versions[0], // Latest version
        versions,
        totalVersions: versions.length,
      }),
    );

    // Filter by search query
    const searchFiltered = searchQuery
      ? mainPipelines.filter((group) => {
          const pipeline = group.pipeline;
          const searchLower = searchQuery.toLowerCase();

          // Search in name
          if (group.name.toLowerCase().includes(searchLower)) return true;

          // Search in description
          if (
            pipeline.description &&
            pipeline.description.toLowerCase().includes(searchLower)
          )
            return true;

          // Search in creation date (formatted)
          const createdDate = new Date(pipeline.createdAt).toLocaleDateString();
          if (createdDate.includes(searchLower)) return true;

          return false;
        })
      : mainPipelines;

    // Filter by provider
    const filtered =
      selectedProvider === "All"
        ? searchFiltered
        : searchFiltered.filter(
            (group) => getCloudProvider(group.pipeline) === selectedProvider,
          );

    // Sort main pipelines
    const sorted = filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "provider":
          aValue = getCloudProvider(a.pipeline);
          bValue = getCloudProvider(b.pipeline);
          break;
        case "description":
          aValue = (a.pipeline.description || "").toLowerCase();
          bValue = (b.pipeline.description || "").toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.pipeline.createdAt).getTime();
          bValue = new Date(b.pipeline.createdAt).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortDirection === "asc") {
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
      totalItems: sorted.length,
    };
  }, [
    groupedPipelines,
    sortField,
    sortDirection,
    currentPage,
    itemsPerPage,
    getCloudProvider,
    selectedProvider,
    searchQuery,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case "AWS":
        return "text-white shadow-sm font-medium";
      case "Azure":
        return "text-white shadow-sm font-medium";
      case "GCP":
        return "text-white shadow-sm font-medium";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getProviderBadgeStyle = (provider: string) => {
    switch (provider) {
      case "AWS":
        return { backgroundColor: "rgb(255, 153, 0)" };
      case "Azure":
        return { backgroundColor: "rgb(0, 120, 215)" };
      case "GCP":
        return { backgroundColor: "rgb(52, 168, 83)" };
      default:
        return {};
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pipelines...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Pipelines</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and organize your cloud infrastructure pipelines
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search pipelines..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="pl-10 w-64"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="provider-filter"
                  className="text-sm font-medium text-gray-700"
                >
                  Filter:
                </Label>
                <Select
                  value={selectedProvider}
                  onValueChange={(value) => {
                    setSelectedProvider(value);
                    setCurrentPage(1); // Reset to first page when filtering
                  }}
                >
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
                {searchQuery
                  ? `${sortedAndPaginatedPipelines.totalItems} pipeline${sortedAndPaginatedPipelines.totalItems !== 1 ? "s" : ""} found for "${searchQuery}"`
                  : `${sortedAndPaginatedPipelines.totalItems} total pipelines`}
                {selectedProvider !== "All" && ` (${selectedProvider} only)`}
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
                          onClick={() => handleSort("name")}
                          className="h-auto p-0 font-semibold justify-start"
                        >
                          Pipeline Name
                          {getSortIcon("name")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[120px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("provider")}
                          className="h-auto p-0 font-semibold justify-start"
                        >
                          Provider
                          {getSortIcon("provider")}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("description")}
                          className="h-auto p-0 font-semibold justify-start"
                        >
                          Description
                          {getSortIcon("description")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[180px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("createdAt")}
                          className="h-auto p-0 font-semibold justify-start"
                        >
                          Created At
                          {getSortIcon("createdAt")}
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndPaginatedPipelines.paginatedGroups.flatMap(
                      (group) => {
                        const { name, pipeline, versions, totalVersions } =
                          group;
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
                                      {totalVersions} version
                                      {totalVersions > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    Latest: v{pipeline.version} (ID:{" "}
                                    {pipeline.id})
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getProviderBadgeColor(provider)}
                                style={getProviderBadgeStyle(provider)}
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
                          </TableRow>,
                        ];

                        // Add expanded version rows if expanded
                        if (isExpanded) {
                          versions.forEach((version) => {
                            rows.push(
                              <TableRow
                                key={`${name}-${version.id}`}
                                className="bg-gray-50"
                              >
                                <TableCell className="pl-12">
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-800">
                                        Version {version.version}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        ID: {version.id} • Created:{" "}
                                        {formatDate(version.createdAt)}
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
                                          handleImportToPipelineDesigner(
                                            version,
                                          );
                                        }}
                                        className="h-8 px-2 text-blue-600 hover:text-blue-800"
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Open in Canvas
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRename(version);
                                        }}
                                        className="h-8 px-2 text-amber-600 hover:text-amber-800"
                                      >
                                        <Edit3 className="w-3 h-3 mr-1" />
                                        Rename
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePipelineDiff(version.name);
                                        }}
                                        className="h-8 px-2 text-purple-600 hover:text-purple-800"
                                      >
                                        <GitCompare className="w-3 h-3 mr-1" />
                                        Pipeline Diff
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
                                  <span className="text-xs text-gray-500">
                                    v{version.version}
                                  </span>
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
                              </TableRow>,
                            );
                          });
                        }

                        return rows;
                      },
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      sortedAndPaginatedPipelines.totalItems,
                    )}{" "}
                    of {sortedAndPaginatedPipelines.totalItems} pipelines
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
                  {Array.from(
                    { length: sortedAndPaginatedPipelines.totalPages },
                    (_, i) => i + 1,
                  )
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === sortedAndPaginatedPipelines.totalPages ||
                        Math.abs(page - currentPage) <= 1,
                    )
                    .map((page, index, array) => {
                      const showEllipsis =
                        index > 0 && page - array[index - 1] > 1;
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
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
                    disabled={
                      currentPage === sortedAndPaginatedPipelines.totalPages
                    }
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteDialog !== null}
        onOpenChange={() => setShowDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pipeline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pipeline? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePipelineMutation.isPending}
            >
              {deletePipelineMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Pipeline Dialog */}
      <Dialog
        open={showRenameDialog !== null}
        onOpenChange={() => setShowRenameDialog(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Pipeline</DialogTitle>
            <DialogDescription>
              Update the name and description for this pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pipeline-name" className="text-right">
                Name
              </Label>
              <Input
                id="pipeline-name"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                className="col-span-3"
                placeholder="Enter pipeline name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pipeline-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="pipeline-description"
                value={newPipelineDescription}
                onChange={(e) => setNewPipelineDescription(e.target.value)}
                className="col-span-3"
                placeholder="Enter pipeline description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRenameDialog(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRenameConfirm}
              disabled={
                !newPipelineName.trim() || renamePipelineMutation.isPending
              }
            >
              {renamePipelineMutation.isPending
                ? "Updating..."
                : "Update Pipeline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pipeline Diff Dialog */}
      <PipelineDiffDialog
        isOpen={diffDialogOpen}
        onClose={() => setDiffDialogOpen(false)}
        pipelineName={diffPipelineName}
      />
    </>
  );
}
