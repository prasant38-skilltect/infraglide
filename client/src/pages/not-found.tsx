import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, FileText, Layers, Settings, Zap } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";

export default function NotFound() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CloudFlow</h1>
              <p className="text-sm text-gray-600">Cloud Infrastructure Pipeline Designer</p>
            </div>
          </div>
        </div>

        {/* 404 Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
              <p className="text-gray-600 mb-6">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            {/* Quick Navigation */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Navigation</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full h-16 flex flex-col">
                    <Home className="w-5 h-5 mb-1" />
                    <span className="text-sm">Dashboard</span>
                  </Button>
                </Link>
                <Link href="/pipeline-designer">
                  <Button variant="outline" className="w-full h-16 flex flex-col">
                    <Zap className="w-5 h-5 mb-1" />
                    <span className="text-sm">Designer</span>
                  </Button>
                </Link>
                <Link href="/my-pipelines">
                  <Button variant="outline" className="w-full h-16 flex flex-col">
                    <Layers className="w-5 h-5 mb-1" />
                    <span className="text-sm">My Pipelines</span>
                  </Button>
                </Link>
                <Link href="/credentials">
                  <Button variant="outline" className="w-full h-16 flex flex-col">
                    <Settings className="w-5 h-5 mb-1" />
                    <span className="text-sm">Credentials</span>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button className="w-full sm:w-auto">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
