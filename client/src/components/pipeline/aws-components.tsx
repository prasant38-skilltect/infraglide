import { Handle, Position } from "reactflow";
import {
  Server,
  Zap,
  Folder,
  Database,
  Table,
  Network,
  Scale,
} from "lucide-react";

const componentIcons = {
  ec2: Server,
  lambda: Zap,
  s3: Folder,
  rds: Database,
  dynamodb: Table,
  vpc: Network,
  alb: Scale,
};

const componentColors = {
  ec2: { bg: "bg-orange-500", border: "border-orange-300" },
  lambda: { bg: "bg-yellow-500", border: "border-yellow-300" },
  s3: { bg: "bg-green-500", border: "border-green-300" },
  rds: { bg: "bg-blue-500", border: "border-blue-300" },
  dynamodb: { bg: "bg-purple-500", border: "border-purple-300" },
  vpc: { bg: "bg-indigo-500", border: "border-indigo-300" },
  alb: { bg: "bg-red-500", border: "border-red-300" },
};

interface AWSComponentNodeProps {
  data: {
    type: string;
    name: string;
    config?: any;
  };
  selected?: boolean;
}

export function AWSComponentNode({ data, selected }: AWSComponentNodeProps) {
  const Icon =
    componentIcons[data.type as keyof typeof componentIcons] || Server;
  const colors =
    componentColors[data.type as keyof typeof componentColors] ||
    componentColors.ec2;

  const getDisplayInfo = () => {
    switch (data.type) {
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
      default:
        return "";
    }
  };

  return (
    <div
      className={`min-w-32 bg-white border-2 ${colors.border} rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2" />

      <div className="flex items-center space-x-2 mb-2">
        <div
          className={`w-6 h-6 ${colors.bg} rounded flex items-center justify-center`}
        >
          <Icon className="text-white w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-900 truncate">
          {data.name}
        </span>
      </div>

      <p className="text-xs text-gray-600 truncate">{getDisplayInfo()}</p>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
}
