import * as React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const renderComponents = (components: typeof awsComponents) => (
    <div className="space-y-4">
      {components.map((category) => (
        <div key={category.category}>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {category.category}
          </h4>
          <div className="space-y-2">
            {category.items.map((component) => {
              const Icon = component.icon;
              return (
                <div
                  key={component.type}
                  className="p-3 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 hover:border-gray-300 transition-all bg-white"
                  draggable
                  onDragStart={(event) => onDragStart(event, component.type)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <div className="text-sm font-medium text-gray-900">
                      {component.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="w-80 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Cloud Components
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Drag components to the canvas
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Tabs
            value={selectedTab}
            onValueChange={handleTabChange}
            className="w-full"
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