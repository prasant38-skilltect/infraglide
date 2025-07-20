import { Code, Eye, Rocket, CheckCircle, Database, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const terraformStats = [
  {
    title: "State Synced",
    description: "Last sync: 5 minutes ago",
    icon: CheckCircle,
    iconColor: "text-green-600",
  },
  {
    title: "Remote Backend",
    description: "S3 Backend configured",
    icon: Database,
    iconColor: "text-blue-600",
  },
  {
    title: "Pending Changes",
    description: "3 resources to update",
    icon: Clock,
    iconColor: "text-orange-600",
  },
];

export default function TerraformIntegration() {
  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Code className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">Terraform Integration</CardTitle>
              <p className="text-sm text-muted-foreground">Infrastructure as Code management</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Plan
            </Button>
            <Button className="bg-primary text-white hover:bg-primary/90">
              <Rocket className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {terraformStats.map((stat, index) => (
            <div key={index} className="bg-accent rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                <span className="text-sm font-medium text-gray-900">{stat.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
