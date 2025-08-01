import * as React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ProviderSwitchModal from "@/components/modals/provider-switch-modal";
import { Node } from "reactflow";
import {
  Server,
  Zap,
  Folder,
  Database,
  Table,
  Network,
  Scale,
  Cloud,
  Monitor,
  Shield,
  HardDrive,
  Cpu,
  Globe,
  LayoutGrid,
  List,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const awsComponents = [
  {
    category: "Compute",
    items: [
      { type: "ec2", name: "EC2", icon: Server },
      { type: "lambda", name: "Lambda", icon: Zap },
      { type: "ecs", name: "ECS", icon: Cpu },
    ],
  },
  {
    category: "Storage",
    items: [
      { type: "s3", name: "S3", icon: Folder },
      { type: "ebs", name: "EBS", icon: HardDrive },
    ],
  },
  {
    category: "Database",
    items: [
      { type: "rds", name: "RDS", icon: Database },
      { type: "dynamodb", name: "DynamoDB", icon: Table },
    ],
  },
  {
    category: "Networking",
    items: [
      { type: "vpc", name: "VPC", icon: Network },
      { type: "alb", name: "ALB", icon: Scale },
      { type: "cloudfront", name: "CloudFront", icon: Globe },
    ],
  },
  {
    category: "Security & Management",
    items: [
      { type: "iam", name: "IAM", icon: Shield },
      { type: "cloudwatch", name: "CloudWatch", icon: Monitor },
    ],
  },
];

const azureComponents = [
  {
    category: "Compute",
    items: [
      { type: "azure-vm", name: "Virtual Machines", icon: Server },
      { type: "azure-functions", name: "Functions", icon: Zap },
      { type: "azure-container", name: "Container Instances", icon: Cpu },
    ],
  },
  {
    category: "Storage",
    items: [
      { type: "azure-storage", name: "Storage Accounts", icon: Folder },
      { type: "azure-blob", name: "Blob Storage", icon: HardDrive },
    ],
  },
  {
    category: "Database",
    items: [
      { type: "azure-sql", name: "SQL Database", icon: Database },
      { type: "azure-cosmos", name: "Cosmos DB", icon: Table },
    ],
  },
  {
    category: "Networking",
    items: [
      { type: "azure-vnet", name: "Virtual Network", icon: Network },
      { type: "azure-lb", name: "Load Balancer", icon: Scale },
    ],
  },
  {
    category: "Security & Management",
    items: [
      { type: "azure-keyvault", name: "Key Vault", icon: Shield },
      { type: "azure-monitor", name: "Monitor", icon: Monitor },
    ],
  },
];

const gcpComponents = [
  {
    category: "Compute",
    items: [
      { type: "gcp-compute", name: "Compute Engine", icon: Server },
      { type: "gcp-functions", name: "Cloud Functions", icon: Zap },
      { type: "gcp-run", name: "Cloud Run", icon: Cpu },
    ],
  },
  {
    category: "Storage",
    items: [
      { type: "gcp-storage", name: "Cloud Storage", icon: Folder },
      { type: "gcp-disk", name: "Persistent Disk", icon: HardDrive },
    ],
  },
  {
    category: "Database",
    items: [
      { type: "gcp-sql", name: "Cloud SQL", icon: Database },
      { type: "gcp-firestore", name: "Firestore", icon: Table },
      { type: "gcp-bigquery", name: "BigQuery", icon: Database },
    ],
  },
  {
    category: "Networking",
    items: [
      { type: "gcp-vpc", name: "VPC Network", icon: Network },
      { type: "gcp-lb", name: "Load Balancing", icon: Scale },
    ],
  },
  {
    category: "Security & Management",
    items: [
      { type: "gcp-iam", name: "Cloud IAM", icon: Shield },
      { type: "gcp-monitoring", name: "Cloud Monitoring", icon: Monitor },
    ],
  },
];

interface ComponentLibraryProps {
  nodes?: Node[];
  onClearCanvas?: () => void;
}

export default function ComponentLibrary({ nodes = [], onClearCanvas }: ComponentLibraryProps) {
  const [selectedTab, setSelectedTab] = useState("aws");
  const [showProviderSwitchModal, setShowProviderSwitchModal] = useState(false);
  const [targetProvider, setTargetProvider] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleTabChange = (newTab: string) => {
    // Check if canvas is empty (no nodes)
    if (nodes.length === 0) {
      // Canvas is empty, allow switching
      setSelectedTab(newTab);
      return;
    }

    // Canvas has components, show confirmation modal
    setTargetProvider(newTab);
    setShowProviderSwitchModal(true);
  };

  const handleConfirmSwitch = () => {
    setSelectedTab(targetProvider);
    setShowProviderSwitchModal(false);
    setTargetProvider("");
    
    // Clear the canvas when switching providers
    if (onClearCanvas) {
      onClearCanvas();
    }
  };

  const handleCancelSwitch = () => {
    setShowProviderSwitchModal(false);
    setTargetProvider("");
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'aws': return { bg: 'rgba(255, 153, 0, 0.1)', border: 'rgb(255, 153, 0)', icon: 'rgb(255, 153, 0)' };
      case 'azure': return { bg: 'rgba(0, 120, 215, 0.1)', border: 'rgb(0, 120, 215)', icon: 'rgb(0, 120, 215)' };
      case 'gcp': return { bg: 'rgba(52, 168, 83, 0.1)', border: 'rgb(52, 168, 83)', icon: 'rgb(52, 168, 83)' };
      default: return { bg: 'rgba(138, 83, 214, 0.1)', border: 'rgb(138, 83, 214)', icon: 'rgb(138, 83, 214)' };
    }
  };

  const filteredComponents = (components: typeof awsComponents) => {
    return components.map(category => ({
      ...category,
      items: category.items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || 
                              category.category.toLowerCase().includes(selectedCategory.toLowerCase());
        return matchesSearch && matchesCategory;
      })
    })).filter(category => category.items.length > 0);
  };

  const renderComponents = (components: typeof awsComponents) => {
    const colors = getProviderColor(selectedTab);
    const filtered = filteredComponents(components);
    
    if (viewMode === "list") {
      return (
        <div className="space-y-2">
          {filtered.map((category) => (
            category.items.map((component) => {
              const Icon = component.icon;
              return (
                <div
                  key={component.type}
                  className="p-2 rounded-md cursor-move transition-all duration-200 bg-white shadow-sm hover:shadow-md flex items-center gap-3 border-l-4"
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderLeftColor: colors.border,
                    backgroundColor: colors.bg
                  }}
                  draggable
                  onDragStart={(event) => onDragStart(event, component.type)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: colors.icon }} />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {component.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.category}
                    </div>
                  </div>
                </div>
              );
            })
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filtered.map((category) => {
          const isCollapsed = collapsedCategories.has(category.category);
          const toggleCollapse = () => {
            const newCollapsed = new Set(collapsedCategories);
            if (isCollapsed) {
              newCollapsed.delete(category.category);
            } else {
              newCollapsed.add(category.category);
            }
            setCollapsedCategories(newCollapsed);
          };

          return (
            <div key={category.category}>
              <button
                onClick={toggleCollapse}
                className="w-full text-sm font-medium mb-3 flex items-center gap-2 hover:opacity-70 transition-opacity"
                style={{ color: colors.icon }}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {category.category}
                <Badge variant="secondary" className="text-xs">
                  {category.items.length}
                </Badge>
              </button>
              {!isCollapsed && (
                <div className="grid grid-cols-1 gap-2">
                  {category.items.map((component) => {
                    const Icon = component.icon;
                    return (
                      <div
                        key={component.type}
                        className="p-3 rounded-lg cursor-move transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                        style={{
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.bg
                        }}
                        draggable
                        onDragStart={(event) => onDragStart(event, component.type)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = `0 4px 12px ${colors.border}20`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = '';
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color: colors.icon }} />
                          <div className="text-sm font-medium text-gray-800">
                            {component.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getCategories = (components: typeof awsComponents) => {
    return ["all", ...components.map(c => c.category.toLowerCase())];
  };

  return (
    <>
      <div className="w-96 bg-white flex flex-col shadow-lg">
        <div className="p-4 border-b" style={{
          background: 'linear-gradient(to right, rgba(138, 83, 214, 0.1), rgba(138, 83, 214, 0.05))',
          borderBottomColor: 'rgb(138, 83, 214)'
        }}>
          <h3 className="text-lg font-semibold" style={{ color: 'rgb(138, 83, 214)' }}>
            Cloud Components
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Drag components to the canvas
          </p>
        </div>

        <div className="p-3 border-b space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          {/* View Toggle and Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                className="h-7 px-2"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                className="h-7 px-2"
                onClick={() => setViewMode("list")}
              >
                <List className="w-3 h-3" />
              </Button>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-gray-600"
              onClick={() => setSelectedCategory(selectedCategory === "all" ? "compute" : "all")}
            >
              <Filter className="w-3 h-3 mr-1" />
              Filter
            </Button>
          </div>
        </div>

        <div className="flex-2 overflow-y-auto">
          <Tabs
            value={selectedTab}
            onValueChange={handleTabChange}
            className="w-full"
            style={{width: "90%"}}
          >
            <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
              <TabsTrigger value="aws">AWS</TabsTrigger>
              <TabsTrigger value="azure">Azure</TabsTrigger>
              <TabsTrigger value="gcp">GCP</TabsTrigger>
            </TabsList>

            <TabsContent value="aws" className="p-4 pt-4">
              {renderComponents(awsComponents)}
            </TabsContent>

            <TabsContent value="azure" className="p-4 pt-4">
              {renderComponents(azureComponents)}
            </TabsContent>

            <TabsContent value="gcp" className="p-4 pt-4">
              {renderComponents(gcpComponents)}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ProviderSwitchModal
        isOpen={showProviderSwitchModal}
        onClose={handleCancelSwitch}
        onConfirm={handleConfirmSwitch}
        targetProvider={targetProvider}
      />
    </>
  );
}