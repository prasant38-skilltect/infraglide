import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PipelineCanvas() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Pipeline Canvas</CardTitle>
          <div className="flex space-x-2">
            <Button className="bg-primary text-white hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Pipeline
            </Button>
            <Button variant="outline">
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 rounded-lg h-96 relative bg-gray-50 overflow-hidden">
          {/* Pipeline Nodes */}
          <div className="absolute top-6 left-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-32">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AWS</span>
              </div>
              <span className="text-sm font-medium">EC2 Deploy</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-green-500 h-1 rounded-full w-3/4"></div>
            </div>
          </div>

          <div className="absolute top-6 right-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-32">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">GCP</span>
              </div>
              <span className="text-sm font-medium">GKE Deploy</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-orange-500 h-1 rounded-full w-1/2"></div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-32">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AZ</span>
              </div>
              <span className="text-sm font-medium">AKS Deploy</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-green-500 h-1 rounded-full w-full"></div>
            </div>
          </div>

          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full">
            <path d="M 102 50 Q 200 100 298 50" stroke="#E5E7EB" strokeWidth="2" fill="none" strokeDasharray="5,5"/>
            <path d="M 102 80 Q 200 200 298 320" stroke="#E5E7EB" strokeWidth="2" fill="none" strokeDasharray="5,5"/>
            <path d="M 298 80 Q 350 200 298 320" stroke="#E5E7EB" strokeWidth="2" fill="none" strokeDasharray="5,5"/>
          </svg>

          {/* Drop Zone Indicator */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-400 text-center">
              <Plus className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Drag components here to build your pipeline</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
