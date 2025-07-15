import { Link, useLocation } from "wouter";
import { Cloud, Home, GitBranch, FolderOpen, History, Settings, User, Key, Layers, ArrowLeft } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  showPipelineMode?: boolean;
  onPipelineModeChange?: (enabled: boolean) => void;
  onProviderSelect?: (provider: string) => void;
  isPipelineDesigner?: boolean;
}

export default function Sidebar({ showPipelineMode = false, onPipelineModeChange, onProviderSelect, isPipelineDesigner = false }: SidebarProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Pipelines", href: "/pipeline", icon: GitBranch, isPipelineEntry: true },
    { name: "My Pipelines", href: "/my-pipelines", icon: Layers },
    { name: "Projects", href: "/projects", icon: FolderOpen },
    { name: "Deployments", href: "/deployments", icon: History },
    { name: "Credentials", href: "/credentials", icon: Key },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const cloudProviders = [
    { name: "AWS", value: "aws", description: "Amazon Web Services", color: "bg-orange-500" },
    { name: "Azure", value: "azure", description: "Microsoft Azure", color: "bg-blue-500" },
    { name: "GCP", value: "gcp", description: "Google Cloud Platform", color: "bg-red-500" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  const handleNavigationClick = (item: any, event: React.MouseEvent) => {
    if (item.isPipelineEntry && isPipelineDesigner && onPipelineModeChange) {
      event.preventDefault();
      onPipelineModeChange(true);
    }
    // For non-pipeline designer pages, let the Link handle navigation normally
  };

  const handleProviderClick = (provider: string) => {
    if (onProviderSelect) {
      onProviderSelect(provider);
    }
  };

  const handleBackClick = () => {
    if (onPipelineModeChange) {
      onPipelineModeChange(false);
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col relative overflow-hidden">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Cloud className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">CloudFlow</h1>
        </div>
      </div>

      {/* Main Navigation Panel */}
      <div 
        className={`absolute inset-x-0 top-[80px] bottom-0 bg-white transition-transform duration-300 ease-in-out ${
          showPipelineMode ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isCurrentActive = isActive(item.href);
            
            if (item.isPipelineEntry && isPipelineDesigner) {
              return (
                <div
                  key={item.name}
                  onClick={(e) => handleNavigationClick(item, e)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    isCurrentActive
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
              );
            }
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isCurrentActive
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">John Developer</p>
              <p className="text-xs text-gray-500">john@company.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Mode Panel */}
      <div 
        className={`absolute inset-x-0 top-[80px] bottom-0 bg-white transition-transform duration-300 ease-in-out ${
          showPipelineMode ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Back Button Header */}
        <div className="px-4 py-4 border-b border-gray-200">
          <button
            onClick={handleBackClick}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Menu</span>
          </button>
        </div>

        {/* Cloud Providers */}
        <div className="flex-1 px-4 py-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Select Cloud Provider</h3>
          <div className="space-y-3">
            {cloudProviders.map((provider) => (
              <div
                key={provider.value}
                onClick={() => handleProviderClick(provider.value)}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={`w-10 h-10 ${provider.color} rounded-lg flex items-center justify-center`}>
                  <Cloud className="text-white w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{provider.name}</p>
                  <p className="text-xs text-gray-600">{provider.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
