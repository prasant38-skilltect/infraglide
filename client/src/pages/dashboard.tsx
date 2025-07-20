import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectSelector from "@/components/ui/project-selector";
import { apiRequest } from "@/lib/queryClient";

import { Plus, Rocket, Clock, CheckCircle, XCircle, Projector, Users, Server, Globe, Layers, Activity, TrendingUp, Database, Cloud, Shield, Zap } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import type { Pipeline, Deployment, Credential, Project } from "@shared/schema";

export default function Dashboard() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();

  // Get user's projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Set the first project as default if none selected
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Fetch project-specific data only if a project is selected
  const { data: pipelines = [], isLoading: pipelinesLoading } = useQuery<Pipeline[]>({
    queryKey: ["/api/pipelines", { projectId: selectedProjectId }],
    queryFn: selectedProjectId ? async () => {
      const res = await apiRequest(`/api/pipelines?projectId=${selectedProjectId}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } : undefined,
    enabled: !!selectedProjectId,
  });

  const { data: deployments = [], isLoading: deploymentsLoading } = useQuery<Deployment[]>({
    queryKey: ["/api/deployments", { projectId: selectedProjectId }],
    queryFn: selectedProjectId ? async () => {
      const res = await apiRequest(`/api/deployments?projectId=${selectedProjectId}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } : undefined,
    enabled: !!selectedProjectId,
  });

  const { data: credentials = [], isLoading: credentialsLoading } = useQuery<Credential[]>({
    queryKey: ["/api/credentials", { projectId: selectedProjectId }],
    queryFn: selectedProjectId ? async () => {
      const res = await apiRequest(`/api/credentials?projectId=${selectedProjectId}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } : undefined,
    enabled: !!selectedProjectId,
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Calculate metrics - ensure pipelines is always an array
  const pipelinesArray = Array.isArray(pipelines) ? pipelines : [];
  const credentialsArray = Array.isArray(credentials) ? credentials : [];
  const deploymentsArray = Array.isArray(deployments) ? deployments : [];
  
  const totalPipelines = pipelinesArray.length;
  const activePipelines = pipelinesArray.filter(p => p.status === "deployed" || p.status === "running").length;
  const totalUsers = credentialsArray.length; // Using credentials as user proxy
  
  // Calculate services and components
  const allComponents = pipelinesArray.flatMap(p => 
    Array.isArray(p.components) ? p.components : []
  );
  const totalServices = allComponents.length;
  
  // Get cloud providers from pipelines
  const getCloudProvider = (pipeline: Pipeline) => {
    if (!Array.isArray(pipeline.components) || pipeline.components.length === 0) return 'Unknown';
    const component = pipeline.components[0];
    if (typeof component === 'object' && component !== null && 'type' in component) {
      const type = component.type as string;
      if (['ec2', 's3', 'rds', 'lambda', 'vpc', 'alb'].includes(type)) return 'AWS';
      if (['vm', 'storage', 'database', 'function', 'network'].includes(type)) return 'Azure';
      if (['compute', 'bucket', 'sql', 'cloud-function', 'vpc-network'].includes(type)) return 'GCP';
    }
    return 'Unknown';
  };

  // Provider distribution
  const providerData = pipelinesArray.reduce((acc, pipeline) => {
    const provider = getCloudProvider(pipeline);
    acc[provider] = (acc[provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const providerChartData = Object.entries(providerData).map(([provider, count]) => ({
    name: provider,
    value: count,
    color: provider === 'AWS' ? '#FF9900' : provider === 'Azure' ? '#0078D4' : provider === 'GCP' ? '#4285F4' : '#6B7280'
  }));

  // Service type distribution
  const serviceTypes = allComponents.reduce((acc, component) => {
    if (typeof component === 'object' && component !== null && 'type' in component) {
      const type = component.type as string;
      let category = 'Other';
      if (['ec2', 'vm', 'compute'].includes(type)) category = 'Compute';
      else if (['s3', 'storage', 'bucket'].includes(type)) category = 'Storage';
      else if (['rds', 'database', 'sql'].includes(type)) category = 'Database';
      else if (['lambda', 'function', 'cloud-function'].includes(type)) category = 'Functions';
      else if (['vpc', 'network', 'vpc-network'].includes(type)) category = 'Networking';
      else if (['alb'].includes(type)) category = 'Load Balancing';
      
      acc[category] = (acc[category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const serviceTypeChartData = Object.entries(serviceTypes).map(([type, count]) => ({
    name: type,
    value: count
  }));

  // Region distribution
  const regionData = pipelinesArray.reduce((acc, pipeline) => {
    const region = pipeline.region || 'Unknown';
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const regionChartData = Object.entries(regionData).map(([region, count]) => ({
    name: region,
    value: count
  }));

  // Deployment trends (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const deploymentTrends = last7Days.map(date => {
    const dayDeployments = deploymentsArray.filter(d => {
      const deployDate = new Date(d.createdAt);
      return deployDate.toDateString() === date.toDateString();
    });

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      deployments: dayDeployments.length,
      successful: dayDeployments.filter(d => d.status === 'success').length
    };
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedProject 
                  ? `Managing infrastructure for project: ${selectedProject.name}`
                  : "Select a project to view your infrastructure pipelines"
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ProjectSelector
                selectedProjectId={selectedProjectId}
                onProjectChange={setSelectedProjectId}
              />
              <Link href="/pipeline">
                <Button className="bg-primary hover:bg-blue-600" disabled={!selectedProjectId}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Pipeline
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 shadow-md hover:shadow-lg transition-all duration-200" style={{
                borderLeftColor: 'rgb(138, 83, 214)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pipelines</CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(138, 83, 214, 0.1)' }}>
                    <Projector className="h-4 w-4" style={{ color: 'rgb(138, 83, 214)' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPipelines}</div>
                  <p className="text-xs text-muted-foreground">
                    {activePipelines} active
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 shadow-md hover:shadow-lg transition-all duration-200" style={{
                borderLeftColor: 'rgb(34, 197, 94)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Pipelines</CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                    <Activity className="h-4 w-4" style={{ color: 'rgb(34, 197, 94)' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activePipelines}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((activePipelines / Math.max(totalPipelines, 1)) * 100)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 shadow-md hover:shadow-lg transition-all duration-200" style={{
                borderLeftColor: 'rgb(59, 130, 246)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                    <Users className="h-4 w-4" style={{ color: 'rgb(59, 130, 246)' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Credential accounts
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 shadow-md hover:shadow-lg transition-all duration-200" style={{
                borderLeftColor: 'rgb(249, 115, 22)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                    <Server className="h-4 w-4" style={{ color: 'rgb(249, 115, 22)' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalServices}</div>
                  <p className="text-xs text-muted-foreground">
                    Cloud components
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 shadow-md hover:shadow-lg transition-all duration-200" style={{
                borderLeftColor: 'rgb(16, 185, 129)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                    <CheckCircle className="h-4 w-4" style={{ color: 'rgb(16, 185, 129)' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {deployments.length > 0 
                      ? Math.round((deployments.filter(d => d.status === "success").length / deployments.length) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">All deployments</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 shadow-md hover:shadow-lg transition-all duration-200" style={{
                borderLeftColor: 'rgb(168, 85, 247)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Running Deployments</CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                    <Rocket className="h-4 w-4" style={{ color: 'rgb(168, 85, 247)' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {deployments.filter(d => d.status === "running").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {deployments.filter(d => d.status === "pending").length} pending
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 shadow-md hover:shadow-lg transition-all duration-200" style={{
                borderLeftColor: 'rgb(14, 165, 233)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Regions</CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)' }}>
                    <Globe className="h-4 w-4" style={{ color: 'rgb(14, 165, 233)' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(regionData).length}</div>
                  <p className="text-xs text-muted-foreground">
                    Deployment regions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 shadow-md hover:shadow-lg transition-all duration-200" style={{
                borderLeftColor: 'rgb(245, 101, 101)'
              }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Service Types</CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(245, 101, 101, 0.1)' }}>
                    <Layers className="h-4 w-4" style={{ color: 'rgb(245, 101, 101)' }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(serviceTypes).length}</div>
                  <p className="text-xs text-muted-foreground">
                    Different categories
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cloud Provider Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cloud className="w-5 h-5" />
                    <span>Cloud Provider Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {providerChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={providerChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {providerChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <Cloud className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p>No provider data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Types Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Layers className="w-5 h-5" />
                    <span>Service Types</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {serviceTypeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={serviceTypeChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <Layers className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p>No service data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Regional Distribution and Deployment Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regional Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>Regional Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {regionChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={regionChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <Globe className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p>No regional data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Deployment Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Deployment Trends (Last 7 Days)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={deploymentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="deployments" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Total Deployments"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="successful" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Successful"
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
  );
}
