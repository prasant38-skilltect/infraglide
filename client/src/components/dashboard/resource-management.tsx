import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const resources = [
  {
    name: "EC2 Instances",
    provider: "EC2",
    providerColor: "bg-orange-500",
    region: "us-east-1",
    count: "8 Running",
    cost: "$142.50/day",
  },
  {
    name: "GKE Clusters",
    provider: "GKE",
    providerColor: "bg-blue-500",
    region: "us-central1",
    count: "2 Clusters",
    cost: "$89.30/day",
  },
  {
    name: "AKS Clusters",
    provider: "AKS",
    providerColor: "bg-blue-600",
    region: "East US",
    count: "1 Cluster",
    cost: "$67.20/day",
  },
];

export default function ResourceManagement() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Resource Management</CardTitle>
          <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {resources.map((resource, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${resource.providerColor} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{resource.provider}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{resource.name}</p>
                  <p className="text-xs text-muted-foreground">{resource.region}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{resource.count}</p>
                <p className="text-xs text-muted-foreground">{resource.cost}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Total Daily Cost</p>
            <p className="text-lg font-bold text-gray-900">$299.00</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
