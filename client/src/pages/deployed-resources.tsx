import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Server, 
  RefreshCw, 
  Search, 
  Filter, 
  Database, 
  HardDrive, 
  Network,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Credential } from "@shared/schema";

interface CloudResource {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'pending' | 'error';
  region: string;
  cost?: number;
  tags?: Record<string, string>;
  createdAt: string;
  lastModified: string;
  provider: 'AWS' | 'Azure' | 'GCP';
  resourceGroup?: string;
  project?: string;
  account?: string;
}

export default function DeployedResources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Get selected project from localStorage
  const selectedProjectId = parseInt(localStorage.getItem('selectedProjectId') || '1');

  // Fetch available credentials for account selection - filtered by selected project
  const { data: credentials } = useQuery<Credential[]>({
    queryKey: ["/api/credentials", { projectId: selectedProjectId }],
    queryFn: () => fetch(`/api/credentials?projectId=${selectedProjectId}`).then(res => res.json()),
  });

  // Filter credentials based on selected provider
  const getCredentialsByProvider = () => {
    if (!credentials) return [];
    if (selectedProvider === "all") return credentials;
    return credentials.filter(cred => cred.provider === selectedProvider);
  };

  // Fetch deployed resources
  const { data: deployedResources, isLoading, refetch } = useQuery<CloudResource[]>({
    queryKey: ["/api/deployed-resources", selectedAccount],
    queryFn: () => {
      if (selectedAccount === "all") return [];
      const params = new URLSearchParams({ credentialId: selectedAccount });
      return fetch(`/api/deployed-resources?${params}`).then(res => res.json());
    },
    enabled: selectedAccount !== "all",
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Resources Refreshed",
        description: "Successfully updated deployed resources inventory",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh resources. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getResourcesByProvider = (provider: string) => {
    if (!deployedResources) return [];
    return deployedResources.filter(resource => 
      provider === "all" || resource.provider === provider
    );
  };

  // Reset account selection when provider changes
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    setSelectedAccount("all"); // Reset account when provider changes
  };

  const filteredResources = (resources: CloudResource[]) => {
    return resources.filter(resource => {
      const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProvider = selectedProvider === "all" || 
                             resource.provider === selectedProvider;
      
      const matchesStatus = selectedStatus === "all" || 
                           resource.status === selectedStatus;
      
      return matchesSearch && matchesProvider && matchesStatus;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'default';
      case 'stopped': return 'secondary';
      case 'pending': return 'outline';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getResourceIcon = (type: string) => {
    if (type.includes('compute') || type.includes('vm') || type.includes('ec2')) {
      return Server;
    } else if (type.includes('database') || type.includes('sql') || type.includes('rds')) {
      return Database;
    } else if (type.includes('storage') || type.includes('s3') || type.includes('blob')) {
      return HardDrive;
    } else if (type.includes('network') || type.includes('vpc') || type.includes('vnet')) {
      return Network;
    }
    return Settings;
  };

  const ResourceCard = ({ resource }: { resource: CloudResource }) => {
    const Icon = getResourceIcon(resource.type);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-gray-600" />
              <div>
                <CardTitle className="text-base">{resource.name}</CardTitle>
                <p className="text-sm text-gray-500">{resource.type}</p>
              </div>
            </div>
            <Badge variant={getStatusColor(resource.status)}>
              {resource.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Region</p>
              <p className="font-medium">{resource.region}</p>
            </div>
            <div>
              <p className="text-gray-500">Provider</p>
              <Badge variant="outline">{resource.provider}</Badge>
            </div>
          </div>
          
          {resource.cost && (
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">
                ${resource.cost}/month
              </span>
            </div>
          )}
          
          {resource.tags && Object.keys(resource.tags).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(resource.tags).slice(0, 3).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-gray-500">
              Created: {new Date(resource.createdAt).toLocaleDateString()}
            </span>
            <Button size="sm" variant="ghost">
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const awsResources = filteredResources(getResourcesByProvider("AWS"));
  const azureResources = filteredResources(getResourcesByProvider("Azure"));
  const gcpResources = filteredResources(getResourcesByProvider("GCP"));
  const allResources = filteredResources(deployedResources || []);

  if (!credentials || credentials.length === 0) {
    return (
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Cloud Credentials</h2>
              <p className="text-gray-600 mb-4">
                You need to add cloud provider credentials to view deployed resources.
              </p>
              <Button onClick={() => window.open('/credentials', '_self')}>
                Add Credentials
              </Button>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Server className="w-8 h-8" />
                Deployed Resources
              </h1>
              <p className="text-gray-600 mt-2">Monitor and manage your cloud infrastructure inventory</p>
            </div>
            
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing || selectedAccount === "all"}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Search Box - First */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Provider Dropdown - Second Position */}
                <Select value={selectedProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Providers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    <SelectItem value="AWS">AWS</SelectItem>
                    <SelectItem value="Azure">Azure</SelectItem>
                    <SelectItem value="GCP">GCP</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Account Dropdown - Third Position, enabled after provider selection */}
                <Select 
                  value={selectedAccount} 
                  onValueChange={setSelectedAccount}
                  disabled={selectedProvider === "all"}
                >
                  <SelectTrigger className={selectedProvider === "all" ? "opacity-50" : ""}>
                    <SelectValue placeholder="All Accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {getCredentialsByProvider().map((credential) => (
                      <SelectItem key={credential.id} value={credential.id.toString()}>
                        {credential.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Status Dropdown - Fourth Position */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="stopped">Stopped</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Resource Count - Fifth Position */}
                <div className="text-sm text-gray-500 flex items-center">
                  <Filter className="w-4 h-4 mr-1" />
                  {allResources.length} resources
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedAccount === "all" ? (
            <Card>
              <CardContent className="text-center py-12">
                <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Account</h3>
                <p className="text-gray-600">Choose a cloud account to view deployed resources</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="text-center py-12">
                <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Resources</h3>
                <p className="text-gray-600">Fetching your deployed infrastructure...</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Resources ({allResources.length})</TabsTrigger>
                <TabsTrigger value="aws">AWS ({awsResources.length})</TabsTrigger>
                <TabsTrigger value="azure">Azure ({azureResources.length})</TabsTrigger>
                <TabsTrigger value="gcp">GCP ({gcpResources.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {allResources.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Found</h3>
                      <p className="text-gray-600">
                        {searchTerm || selectedStatus !== "all" 
                          ? "Try adjusting your search or filter criteria"
                          : "No deployed resources found for this account"
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allResources.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="aws" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {awsResources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="azure" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {azureResources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="gcp" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gcpResources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Summary Statistics */}
          {deployedResources && deployedResources.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {deployedResources.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Resources</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {deployedResources.filter(r => r.status === 'running').length}
                  </div>
                  <div className="text-sm text-gray-600">Running</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {deployedResources.filter(r => r.status === 'stopped').length}
                  </div>
                  <div className="text-sm text-gray-600">Stopped</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${deployedResources.reduce((sum, r) => sum + (r.cost || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Est. Monthly Cost</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
  );
}