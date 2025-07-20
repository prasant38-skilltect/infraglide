import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import StatusCards from "@/components/dashboard/status-cards";
import PipelineCanvas from "@/components/dashboard/pipeline-canvas";
import CloudProviders from "@/components/dashboard/cloud-providers";
import RecentPipelines from "@/components/dashboard/recent-pipelines";
import ResourceManagement from "@/components/dashboard/resource-management";
import TerraformIntegration from "@/components/dashboard/terraform-integration";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className={`flex-1 p-6 transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-0'}`}>
          {/* Dashboard Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">Dashboard</h2>
            <p className="text-gray-600">Manage your multi-cloud infrastructure and deployment pipelines</p>
          </div>

          {/* Status Cards */}
          <StatusCards />

          {/* Pipeline Canvas and Cloud Providers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <PipelineCanvas />
            </div>
            <div>
              <CloudProviders />
            </div>
          </div>

          {/* Recent Pipelines and Resources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <RecentPipelines />
            <ResourceManagement />
          </div>

          {/* Terraform Integration Panel */}
          <TerraformIntegration />
        </main>
      </div>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
