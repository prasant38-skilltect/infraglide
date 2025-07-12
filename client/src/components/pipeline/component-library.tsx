import { Server, Zap, Folder, Database, Table, Network, Scale } from "lucide-react";

const awsComponents = [
  {
    category: "Compute",
    items: [
      {
        type: "ec2",
        name: "EC2 Instance",
        description: "Virtual server",
        icon: Server,
        gradient: "from-orange-50 to-orange-100",
        border: "border-orange-200",
        iconBg: "bg-orange-500",
      },
      {
        type: "lambda",
        name: "Lambda Function", 
        description: "Serverless compute",
        icon: Zap,
        gradient: "from-yellow-50 to-yellow-100",
        border: "border-yellow-200", 
        iconBg: "bg-yellow-500",
      },
    ],
  },
  {
    category: "Storage",
    items: [
      {
        type: "s3",
        name: "S3 Bucket",
        description: "Object storage",
        icon: Folder,
        gradient: "from-green-50 to-green-100",
        border: "border-green-200",
        iconBg: "bg-green-500",
      },
    ],
  },
  {
    category: "Database",
    items: [
      {
        type: "rds",
        name: "RDS Database",
        description: "Managed database",
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
        description: "Virtual network",
        icon: Network,
        gradient: "from-indigo-50 to-indigo-100",
        border: "border-indigo-200",
        iconBg: "bg-indigo-500",
      },
      {
        type: "alb",
        name: "Load Balancer",
        description: "Traffic distribution",
        icon: Scale,
        gradient: "from-red-50 to-red-100",
        border: "border-red-200",
        iconBg: "bg-red-500",
      },
    ],
  },
];

export default function ComponentLibrary() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">AWS Components</h3>
        <p className="text-sm text-gray-600 mt-1">Drag components to the canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {awsComponents.map((category) => (
          <div key={category.category}>
            <h4 className="text-sm font-medium text-gray-700 mb-3">{category.category}</h4>
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
                      <div className={`w-8 h-8 ${component.iconBg} rounded flex items-center justify-center`}>
                        <Icon className="text-white w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{component.name}</p>
                        <p className="text-xs text-gray-600">{component.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
