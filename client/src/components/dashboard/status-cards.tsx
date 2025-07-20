import { CheckCircle, Cloud, AlertTriangle, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusData = [
  {
    title: "Running Pipelines",
    value: "24",
    status: "Active",
    icon: CheckCircle,
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
    statusColor: "success",
  },
  {
    title: "Cloud Providers",
    value: "3",
    status: "Connected",
    icon: Cloud,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    statusColor: "primary",
  },
  {
    title: "Failed Deployments",
    value: "2",
    status: "Attention",
    icon: AlertTriangle,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
    statusColor: "warning",
  },
  {
    title: "Total Resources",
    value: "156",
    status: "Managed",
    icon: Database,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    statusColor: "purple",
  },
];

export default function StatusCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statusData.map((item, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${item.iconBg} rounded-lg flex items-center justify-center`}>
                <item.icon className={`h-6 w-6 ${item.iconColor}`} />
              </div>
              <Badge 
                variant="secondary" 
                className={`
                  ${item.statusColor === 'success' ? 'text-green-700 bg-green-50' : ''}
                  ${item.statusColor === 'primary' ? 'text-blue-700 bg-blue-50' : ''}
                  ${item.statusColor === 'warning' ? 'text-orange-700 bg-orange-50' : ''}
                  ${item.statusColor === 'purple' ? 'text-purple-700 bg-purple-50' : ''}
                `}
              >
                {item.status}
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{item.value}</h3>
            <p className="text-sm text-muted-foreground">{item.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
