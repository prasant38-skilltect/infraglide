import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PipelineDesigner from "@/pages/pipeline-designer";
import Credentials from "@/pages/credentials";
import MyPipelines from "@/pages/my-pipelines";
import HLD from "@/pages/hld";
import LLD from "@/pages/lld";
import Architecture from "@/pages/architecture";
import Hub from "@/pages/hub";
import DeployedResources from "@/pages/deployed-resources";
import CostOptimization from "@/pages/cost-optimization";
import SettingsPage from "@/pages/settings";
import AccessManagement from "@/pages/access-management";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";


function ProtectedRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  // If not authenticated and not on auth pages, redirect to login
  if (!isAuthenticated && location !== "/login" && location !== "/signup") {
    window.location.href = "/login";
    return null;
  }

  // If authenticated and on auth pages, redirect to dashboard
  if (isAuthenticated && (location === "/login" || location === "/signup")) {
    window.location.href = "/";
    return null;
  }

  // Show auth pages without sidebar
  if (location === "/login" || location === "/signup") {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
      </Switch>
    );
  }

  // Check if current route is pipeline designer (hide sidebar for full-screen canvas)
  const isPipelinePage = location.startsWith('/pipeline');
  
  // Show pipeline designer without sidebar for full-screen canvas experience
  if (isPipelinePage) {
    return (
      <div className="flex h-screen bg-background">
        <main className="flex-1 overflow-y-auto">
          <Route path="/pipeline/:id?" component={PipelineDesigner} />
        </main>
      </div>
    );
  }

  // Show main app with sidebar for all other authenticated pages
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/my-pipelines" component={MyPipelines} />
          <Route path="/credentials" component={Credentials} />
          <Route path="/hub" component={Hub} />
          <Route path="/architecture" component={Architecture} />
          <Route path="/hld" component={HLD} />
          <Route path="/lld" component={LLD} />
          <Route path="/deployed-resources" component={DeployedResources} />
          <Route path="/cost-optimization" component={CostOptimization} />
          <Route path="/access-management" component={AccessManagement} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <ProtectedRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
