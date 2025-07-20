import { History, Play, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pipelines = [
  {
    name: "Production Deploy",
    lastRun: "2 hours ago",
    status: "Success",
    statusColor: "bg-green-500",
    icon: Play,
  },
  {
    name: "Staging Deploy",
    lastRun: "1 day ago",
    status: "Running",
    statusColor: "bg-orange-500",
    icon: Square,
  },
  {
    name: "Development Deploy",
    lastRun: "3 hours ago",
    status: "Failed",
    statusColor: "bg-red-500",
    icon: RotateCcw,
  },
];

export default function RecentPipelines() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Recent Pipelines</CardTitle>
          <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium">
            View All
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pipelines.map((pipeline, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <History className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{pipeline.name}</p>
                  <p className="text-sm text-muted-foreground">Last run {pipeline.lastRun}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  className={`${pipeline.statusColor} text-white text-xs`}
                >
                  {pipeline.status}
                </Badge>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-600">
                  <pipeline.icon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
