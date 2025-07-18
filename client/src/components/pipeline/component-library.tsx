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
import * as React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProviderSwitchModal from "@/components/modals/provider-switch-modal";
import { Node } from "reactflow";


const awsComponents = [
  {
    category: "Compute",
    items: [
      {
        type: "ec2",
        name: "EC2",
        description: "Elastic Compute Cloud",
        icon: Server,
        gradient: "from-orange-50 to-orange-100",
        border: "border-orange-200",
        iconBg: "bg-orange-500",
      },
      {
        type: "lambda",
        name: "Lambda",
        description: "Serverless functions",
        icon: Zap,
        gradient: "from-yellow-50 to-yellow-100",
        border: "border-yellow-200",
        iconBg: "bg-yellow-500",
      },
      {
        type: "ecs",
        name: "ECS",
        description: "Container service",
        icon: Cpu,
        gradient: "from-amber-50 to-amber-100",
        border: "border-amber-200",
        iconBg: "bg-amber-500",
      },
    ],
  },
  {
    category: "Storage",
    items: [
      {
        type: "s3",
        name: "S3",
        description: "Simple Storage Service",
        icon: Folder,
        gradient: "from-green-50 to-green-100",
        border: "border-green-200",
        iconBg: "bg-green-500",
      },
      {
        type: "ebs",
        name: "EBS",
        description: "Elastic Block Store",
        icon: HardDrive,
        gradient: "from-emerald-50 to-emerald-100",
        border: "border-emerald-200",
        iconBg: "bg-emerald-500",
      },
    ],
  },
  {
    category: "Database",
    items: [
      {
        type: "rds",
        name: "RDS",
        description: "Relational Database Service",
        icon: Database,
        gradient: "from-blue-50 to-blue-100",
        border: "border-blue-200",
        iconBg: "bg-blue-500",
      },
      {
        type: "dynamodb",
        name: "DynamoDB",
        description: "NoSQL database",
        icon: Table,
        gradient: "from-purple-50 to-purple-100",
        border: "border-purple-200",
        iconBg: "bg-purple-500",
      },
    ],
  },
  {
    category: "Networking",
    items: [
      {
        type: "vpc",
        name: "VPC",
        description: "Virtual Private Cloud",
        icon: Network,
        gradient: "from-indigo-50 to-indigo-100",
        border: "border-indigo-200",
        iconBg: "bg-indigo-500",
      },
      {
        type: "alb",
        name: "ALB",
        description: "Application Load Balancer",
        icon: Scale,
        gradient: "from-red-50 to-red-100",
        border: "border-red-200",
        iconBg: "bg-red-500",
      },
      {
        type: "cloudfront",
        name: "CloudFront",
        description: "Content Delivery Network",
        icon: Globe,
        gradient: "from-pink-50 to-pink-100",
        border: "border-pink-200",
        iconBg: "bg-pink-500",
      },
    ],
  },
  {
    category: "Security & Management",
    items: [
      {
        type: "iam",
        name: "IAM",
        description: "Identity & Access Management",
        icon: Shield,
        gradient: "from-slate-50 to-slate-100",
        border: "border-slate-200",
        iconBg: "bg-slate-500",
      },
      {
        type: "cloudwatch",
        name: "CloudWatch",
        description: "Monitoring & Logging",
        icon: Monitor,
        gradient: "from-teal-50 to-teal-100",
        border: "border-teal-200",
        iconBg: "bg-teal-500",
      },
    ],
  },
];

const azureComponents = [
  {
    category: "Compute",
    items: [
      {
        type: "azure-vm",
        name: "Virtual Machines",
        description: "Scalable compute resources",
        icon: Server,
        gradient: "from-blue-50 to-blue-100",
        border: "border-blue-200",
        iconBg: "bg-blue-600",
      },
      {
        type: "azure-functions",
        name: "Functions",
        description: "Serverless compute platform",
        icon: Zap,
        gradient: "from-cyan-50 to-cyan-100",
        border: "border-cyan-200",
        iconBg: "bg-cyan-600",
      },
      {
        type: "azure-container",
        name: "Container Instances",
        description: "Serverless containers",
        icon: Cpu,
        gradient: "from-sky-50 to-sky-100",
        border: "border-sky-200",
        iconBg: "bg-sky-600",
      },
    ],
  },
  {
    category: "Storage",
    items: [
      {
        type: "azure-storage",
        name: "Storage Accounts",
        description: "Scalable cloud storage",
        icon: Folder,
        gradient: "from-teal-50 to-teal-100",
        border: "border-teal-200",
        iconBg: "bg-teal-600",
      },
      {
        type: "azure-blob",
        name: "Blob Storage",
        description: "Object storage service",
        icon: HardDrive,
        gradient: "from-emerald-50 to-emerald-100",
        border: "border-emerald-200",
        iconBg: "bg-emerald-600",
      },
    ],
  },
  {
    category: "Database",
    items: [
      {
        type: "azure-sql",
        name: "SQL Database",
        description: "Managed relational database",
        icon: Database,
        gradient: "from-indigo-50 to-indigo-100",
        border: "border-indigo-200",
        iconBg: "bg-indigo-600",
      },
      {
        type: "azure-cosmos",
        name: "Cosmos DB",
        description: "Globally distributed NoSQL",
        icon: Table,
        gradient: "from-violet-50 to-violet-100",
        border: "border-violet-200",
        iconBg: "bg-violet-600",
      },
    ],
  },
  {
    category: "Networking",
    items: [
      {
        type: "azure-vnet",
        name: "Virtual Network",
        description: "Private network in Azure",
        icon: Network,
        gradient: "from-slate-50 to-slate-100",
        border: "border-slate-200",
        iconBg: "bg-slate-600",
      },
      {
        type: "azure-lb",
        name: "Load Balancer",
        description: "High availability load balancer",
        icon: Scale,
        gradient: "from-gray-50 to-gray-100",
        border: "border-gray-200",
        iconBg: "bg-gray-600",
      },
    ],
  },
  {
    category: "Security & Management",
    items: [
      {
        type: "azure-keyvault",
        name: "Key Vault",
        description: "Secrets management",
        icon: Shield,
        gradient: "from-rose-50 to-rose-100",
        border: "border-rose-200",
        iconBg: "bg-rose-600",
      },
      {
        type: "azure-monitor",
        name: "Monitor",
        description: "Full-stack monitoring",
        icon: Monitor,
        gradient: "from-orange-50 to-orange-100",
        border: "border-orange-200",
        iconBg: "bg-orange-600",
      },
    ],
  },
];

const gcpComponents = [
  {
    category: "Compute",
    items: [
      {
        type: "gcp-compute",
        name: "Compute Engine",
        description: "Scalable virtual machines",
        icon: Server,
        gradient: "from-red-50 to-red-100",
        border: "border-red-200",
        iconBg: "bg-red-600",
      },
      {
        type: "gcp-functions",
        name: "Cloud Functions",
        description: "Event-driven serverless",
        icon: Zap,
        gradient: "from-orange-50 to-orange-100",
        border: "border-orange-200",
        iconBg: "bg-orange-600",
      },
      {
        type: "gcp-run",
        name: "Cloud Run",
        description: "Fully managed containers",
        icon: Cpu,
        gradient: "from-amber-50 to-amber-100",
        border: "border-amber-200",
        iconBg: "bg-amber-600",
      },
    ],
  },
  {
    category: "Storage",
    items: [
      {
        type: "gcp-storage",
        name: "Cloud Storage",
        description: "Object storage service",
        icon: Folder,
        gradient: "from-emerald-50 to-emerald-100",
        border: "border-emerald-200",
        iconBg: "bg-emerald-600",
      },
      {
        type: "gcp-disk",
        name: "Persistent Disk",
        description: "Block storage for VMs",
        icon: HardDrive,
        gradient: "from-green-50 to-green-100",
        border: "border-green-200",
        iconBg: "bg-green-600",
      },
    ],
  },
  {
    category: "Database",
    items: [
      {
        type: "gcp-sql",
        name: "Cloud SQL",
        description: "Fully managed relational",
        icon: Database,
        gradient: "from-lime-50 to-lime-100",
        border: "border-lime-200",
        iconBg: "bg-lime-600",
      },
      {
        type: "gcp-firestore",
        name: "Firestore",
        description: "NoSQL document database",
        icon: Table,
        gradient: "from-yellow-50 to-yellow-100",
        border: "border-yellow-200",
        iconBg: "bg-yellow-600",
      },
      {
        type: "gcp-bigquery",
        name: "BigQuery",
        description: "Serverless data warehouse",
        icon: Database,
        gradient: "from-cyan-50 to-cyan-100",
        border: "border-cyan-200",
        iconBg: "bg-cyan-600",
      },
    ],
  },
  {
    category: "Networking",
    items: [
      {
        type: "gcp-vpc",
        name: "VPC Network",
        description: "Global virtual network",
        icon: Network,
        gradient: "from-blue-50 to-blue-100",
        border: "border-blue-200",
        iconBg: "bg-blue-600",
      },
      {
        type: "gcp-lb",
        name: "Load Balancing",
        description: "Global load balancer",
        icon: Scale,
        gradient: "from-indigo-50 to-indigo-100",
        border: "border-indigo-200",
        iconBg: "bg-indigo-600",
      },
    ],
  },
  {
    category: "Security & Management",
    items: [
      {
        type: "gcp-iam",
        name: "Cloud IAM",
        description: "Identity & access management",
        icon: Shield,
        gradient: "from-purple-50 to-purple-100",
        border: "border-purple-200",
        iconBg: "bg-purple-600",
      },
      {
        type: "gcp-monitoring",
        name: "Cloud Monitoring",
        description: "Infrastructure monitoring",
        icon: Monitor,
        gradient: "from-pink-50 to-pink-100",
        border: "border-pink-200",
        iconBg: "bg-pink-600",
      },
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
                  className={`p-3 bg-gradient-to-r ${component.gradient} border ${component.border} rounded-lg cursor-move hover:shadow-md transition-shadow`}
                  draggable
                  onDragStart={(event) => onDragStart(event, component.type)}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 ${component.iconBg} rounded flex items-center justify-center`}
                    >
                      <Icon className="text-white w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {component.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {component.description}
                      </p>
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
