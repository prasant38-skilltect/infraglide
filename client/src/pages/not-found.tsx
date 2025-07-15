import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="transition-all duration-300 ease-in-out">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Page Not Found</h2>
              <p className="text-sm text-gray-600 mt-1">The page you're looking for doesn't exist</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4 gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <h1 className="text-2xl font-bold text-gray-900">404 - Page Not Found</h1>
              </div>

              <p className="mt-4 text-sm text-gray-600 mb-6">
                The page you're looking for doesn't exist or has been moved.
              </p>

              <div className="flex gap-3">
                <Link href="/dashboard">
                  <Button className="flex items-center">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/pipeline">
                  <Button variant="outline">
                    Create Pipeline
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
