
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Wrench, User, Palette, Database, Cloud, Shield, Bell, Info } from "lucide-react";
import { Link } from "wouter";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(138, 83, 214, 0.1)' }}>
                <Settings className="h-6 w-6" style={{ color: 'rgb(138, 83, 214)' }} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>
            <p className="text-gray-600">Configure your InfraGlide experience and manage your preferences.</p>
          </div>

          {/* Coming Soon Notice */}
          <Card className="border-l-4 shadow-md mb-8" style={{ borderLeftColor: 'rgb(138, 83, 214)' }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5" style={{ color: 'rgb(138, 83, 214)' }} />
                <span>Settings Coming Soon</span>
                <Badge variant="outline" className="ml-2" style={{ 
                  borderColor: 'rgb(138, 83, 214)', 
                  color: 'rgb(138, 83, 214)' 
                }}>
                  Under Development
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                We're working hard to bring you comprehensive settings to customize your InfraGlide experience. 
                The settings page will be available in an upcoming release.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/my-pipelines">
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    My Pipelines
                  </Button>
                </Link>
                <Link href="/pipeline">
                  <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
                    Pipeline Designer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Planned Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>User Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Customize your profile, display name, and personal preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Palette className="h-4 w-4 text-purple-600" />
                  <span>Theme & Appearance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Choose dark/light mode, customize colors, and adjust interface settings.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Cloud className="h-4 w-4 text-orange-600" />
                  <span>Cloud Defaults</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Set default cloud providers, regions, and resource configurations.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Database className="h-4 w-4 text-green-600" />
                  <span>Data Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Configure data retention, backup settings, and export options.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span>Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Manage security settings, API access, and authentication preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Bell className="h-4 w-4 text-yellow-600" />
                  <span>Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Configure email alerts, deployment notifications, and system updates.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <Card className="mt-8 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span>Need Help?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                While we're building the settings page, you can still access all core features of InfraGlide.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/credentials">
                  <Button variant="outline" size="sm">
                    Manage Credentials
                  </Button>
                </Link>
                <Link href="/hub">
                  <Button variant="outline" size="sm">
                    Browse Hub
                  </Button>
                </Link>
                <Link href="/deployed-resources">
                  <Button variant="outline" size="sm">
                    View Resources
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}