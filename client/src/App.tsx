import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PipelineDesigner from "@/pages/pipeline-designer";
import Credentials from "@/pages/credentials";
import MyPipelines from "@/pages/my-pipelines";
import HLD from "@/pages/hld";
import LLD from "@/pages/lld";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/pipeline/:id?" component={PipelineDesigner} />
      <Route path="/my-pipelines" component={MyPipelines} />
      <Route path="/credentials" component={Credentials} />
      <Route path="/hld" component={HLD} />
      <Route path="/lld" component={LLD} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
