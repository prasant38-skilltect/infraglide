import { Handle, Position } from "reactflow";
import { Server, Zap, Folder, Database, Table, Network, Scale, Trash2 } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const componentIcons = {
  // AWS
  ec2: Server,
  lambda: Zap,
  s3: Folder,
  rds: Database,
  dynamodb: Table,
  vpc: Network,
  alb: Scale,
  // Azure
  "azure-vm": Server,
  "azure-functions": Zap,
  "azure-storage": Folder,
  "azure-sql": Database,
  "azure-cosmos": Table,
  "azure-vnet": Network,
  "azure-lb": Scale,
  // GCP
  "gcp-vm": Server,
  "gcp-functions": Zap,
  "gcp-storage": Folder,
  "gcp-sql": Database,
  "gcp-firestore": Table,
  "gcp-vpc": Network,
  "gcp-lb": Scale,
};

const componentColors = {
  // AWS (Orange/Yellow theme)
  ec2: { bg: "bg-orange-500", border: "border-orange-300" },
  lambda: { bg: "bg-yellow-500", border: "border-yellow-300" },
  s3: { bg: "bg-green-500", border: "border-green-300" },
  rds: { bg: "bg-blue-500", border: "border-blue-300" },
  dynamodb: { bg: "bg-purple-500", border: "border-purple-300" },
  vpc: { bg: "bg-indigo-500", border: "border-indigo-300" },
  alb: { bg: "bg-red-500", border: "border-red-300" },
  // Azure (Blue theme)
  "azure-vm": { bg: "bg-blue-600", border: "border-blue-300" },
  "azure-functions": { bg: "bg-cyan-600", border: "border-cyan-300" },
  "azure-storage": { bg: "bg-teal-600", border: "border-teal-300" },
  "azure-sql": { bg: "bg-indigo-600", border: "border-indigo-300" },
  "azure-cosmos": { bg: "bg-violet-600", border: "border-violet-300" },
  "azure-vnet": { bg: "bg-sky-600", border: "border-sky-300" },
  "azure-lb": { bg: "bg-slate-600", border: "border-slate-300" },
  // GCP (Red/Multi-color theme)
  "gcp-vm": { bg: "bg-red-600", border: "border-red-300" },
  "gcp-functions": { bg: "bg-orange-600", border: "border-orange-300" },
  "gcp-storage": { bg: "bg-emerald-600", border: "border-emerald-300" },
  "gcp-sql": { bg: "bg-lime-600", border: "border-lime-300" },
  "gcp-firestore": { bg: "bg-green-600", border: "border-green-300" },
  "gcp-vpc": { bg: "bg-yellow-600", border: "border-yellow-300" },
  "gcp-lb": { bg: "bg-amber-600", border: "border-amber-300" },
};

interface CloudComponentNodeProps {
  data: {
    type: string;
    name: string;
    config?: any;
  };
  selected?: boolean;
  id?: string;
}

export function CloudComponentNode({ data, selected, id }: CloudComponentNodeProps) {
  const Icon = componentIcons[data.type as keyof typeof componentIcons] || Server;
  const colors = componentColors[data.type as keyof typeof componentColors] || componentColors.ec2;

  const getDisplayInfo = () => {
    switch (data.type) {
      // AWS
      case "ec2":
        return data.config?.instanceType || "t3.micro";
      case "s3":
        return data.config?.bucketName || "bucket-name";
      case "rds":
        return data.config?.engine || "PostgreSQL";
      case "lambda":
        return "Serverless";
      case "vpc":
        return "Virtual Network";
      case "alb":
        return "Load Balancer";
      case "dynamodb":
        return "NoSQL DB";
      // Azure
      case "azure-vm":
        return data.config?.vmSize || "Standard_B1s";
      case "azure-functions":
        return "Serverless";
      case "azure-storage":
        return data.config?.accountName || "storage-account";
      case "azure-sql":
        return data.config?.edition || "Basic";
      case "azure-cosmos":
        return "NoSQL DB";
      case "azure-vnet":
        return "Virtual Network";
      case "azure-lb":
        return "Load Balancer";
      // GCP
      case "gcp-vm":
        return data.config?.machineType || "e2-micro";
      case "gcp-functions":
        return "Serverless";
      case "gcp-storage":
        return data.config?.bucketName || "storage-bucket";
      case "gcp-sql":
        return data.config?.tier || "db-f1-micro";
      case "gcp-firestore":
        return "NoSQL DB";
      case "gcp-vpc":
        return "Virtual Network";
      case "gcp-lb":
        return "Load Balancer";
      default:
        return "";
    }
  };

  const getProviderBadge = () => {
    if (data.type.startsWith("azure-")) return "Azure";
    if (data.type.startsWith("gcp-")) return "GCP";
    return "AWS";
  };

  const handleDelete = () => {
    // Dispatch a custom event for parent component to handle deletion
    if (id) {
      window.dispatchEvent(new CustomEvent('deleteNode', { detail: { nodeId: id } }));
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div 
          className={`min-w-32 bg-white border-2 ${colors.border} rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${
            selected ? "ring-2 ring-blue-500" : ""
          }`}
        >
          <Handle type="target" position={Position.Top} className="w-2 h-2" />
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 ${colors.bg} rounded flex items-center justify-center`}>
                <Icon className="text-white w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-gray-900 truncate">
                {data.name}
              </span>
            </div>
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
              {getProviderBadge()}
            </span>
          </div>
          
          <p className="text-xs text-gray-600 truncate">
            {getDisplayInfo()}
          </p>
          
          <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Component
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}