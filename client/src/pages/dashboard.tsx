import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/layout/sidebar";
import { Plus, Rocket, Clock, CheckCircle, XCircle, Projector } from "lucide-react";
import type { Pipeline, Deployment } from "@shared/schema";

export default function Dashboard() {
  const { data: pipelines = [], isLoading: pipelinesLoading } = useQuery<Pipeline[]>({
    queryKey: ["/api/pipelines"],
  });

  const { data: deployments = [], isLoading: deploymentsLoading } = useQuery<Deployment[]>({
    queryKey: ["/api/deployments"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "running": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4" />;
      case "failed": return <XCircle className="w-4 h-4" />;
      case "running": return <Rocket className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="transition-all duration-300 ease-in-out">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">Manage your AWS infrastructure pipelines</p>
            </div>
            <Link href="/pipeline">
              <Button className="bg-primary hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                New Pipeline
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pipelines</CardTitle>
                  <Projector className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pipelines.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {pipelines.filter(p => p.status === "deployed").length} deployed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Deployments</CardTitle>
                  <Rocket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {deployments.filter(d => d.status === "running").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {deployments.filter(d => d.status === "success").length} completed today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {deployments.length > 0 
                      ? Math.round((deployments.filter(d => d.status === "success").length / deployments.length) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Last 30 deployments</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Pipelines */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Pipelines</CardTitle>
              </CardHeader>
              <CardContent>
                {pipelinesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : pipelines.length === 0 ? (
                  <div className="text-center py-8">
                    <Projector className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pipelines</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new pipeline.</p>
                    <div className="mt-6">
                      <Link href="/pipeline">
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          New Pipeline
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pipelines.slice(0, 5).map((pipeline) => (
                      <div key={pipeline.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <Link href={`/pipeline/${pipeline.id}`}>
                            <h3 className="font-medium text-gray-900 hover:text-primary cursor-pointer">
                              {pipeline.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-500">{pipeline.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500">Region: {pipeline.region}</span>
                            <span className="text-xs text-gray-500">
                              Components: {Array.isArray(pipeline.components) ? pipeline.components.length : 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(pipeline.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(pipeline.status)}
                              <span className="capitalize">{pipeline.status}</span>
                            </div>
                          </Badge>
                          <Link href={`/pipeline/${pipeline.id}`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Deployments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                {deploymentsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : deployments.length === 0 ? (
                  <div className="text-center py-8">
                    <Rocket className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No deployments</h3>
                    <p className="mt-1 text-sm text-gray-500">Deployments will appear here once you deploy a pipeline.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deployments.slice(0, 5).map((deployment) => (
                      <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            Pipeline ID: {deployment.pipelineId}
                          </h3>
                          <p className="text-sm text-gray-500">Environment: {deployment.environment}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(deployment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(deployment.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(deployment.status)}
                            <span className="capitalize">{deployment.status}</span>
                          </div>
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
