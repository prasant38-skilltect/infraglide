import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  TrendingDown, 
  Lightbulb, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Zap,
  ShieldCheck,
  Database,
  Server,
  HardDrive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CostRecommendation {
  id: string;
  type: 'savings' | 'efficiency' | 'security' | 'performance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentCost: number;
  potentialSavings: number;
  implementationEffort: 'easy' | 'medium' | 'complex';
  timeToImplement: string;
  impact: string;
  steps: string[];
  component: string;
  provider: string;
  region: string;
  applied: boolean;
}

interface CostAnalysis {
  totalMonthlyCost: number;
  potentialSavings: number;
  savingsPercentage: number;
  recommendations: CostRecommendation[];
  breakdown: {
    compute: number;
    storage: number;
    networking: number;
    database: number;
    other: number;
  };
}

export default function CostOptimization() {
  const [selectedPipeline, setSelectedPipeline] = useState<string>("");
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch pipelines for selection
  const { data: pipelines = [] } = useQuery({
    queryKey: ["/api/pipelines"],
  });

  // Fetch cost analysis for selected pipeline
  const { data: costAnalysis, isLoading, refetch } = useQuery({
    queryKey: ["/api/cost-optimization", selectedPipeline],
    enabled: !!selectedPipeline,
  });

  const handleApplyRecommendation = async (recommendationId: string) => {
    try {
      const response = await fetch('/api/cost-optimization/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pipelineId: selectedPipeline, 
          recommendationId 
        }),
      });

      if (response.ok) {
        setAppliedRecommendations(prev => new Set(prev).add(recommendationId));
        toast({
          title: "Optimization Applied!",
          description: "The cost optimization recommendation has been applied to your pipeline.",
        });
        refetch();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to apply cost optimization recommendation.",
      });
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'savings': return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'efficiency': return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'security': return <ShieldCheck className="h-5 w-5 text-blue-500" />;
      case 'performance': return <TrendingDown className="h-5 w-5 text-purple-500" />;
      default: return <Lightbulb className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cost Optimization</h1>
          <p className="text-muted-foreground">
            One-click recommendations to optimize your cloud infrastructure costs
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a pipeline to analyze" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline: any) => (
                <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {pipeline.provider.toUpperCase()}
                    </Badge>
                    {pipeline.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedPipeline && costAnalysis && (
        <>
          {/* Cost Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Monthly Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${costAnalysis.totalMonthlyCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Based on current configuration</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
                <TrendingDown className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${costAnalysis.potentialSavings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {costAnalysis.savingsPercentage.toFixed(1)}% reduction possible
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                <Lightbulb className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{costAnalysis.recommendations.length}</div>
                <p className="text-xs text-muted-foreground">Optimization opportunities</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applied</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appliedRecommendations.size}</div>
                <p className="text-xs text-muted-foreground">Optimizations implemented</p>
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown by Service Type</CardTitle>
              <CardDescription>Monthly spending distribution across service categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(costAnalysis.breakdown).map(([category, cost]) => {
                const percentage = (cost / costAnalysis.totalMonthlyCost) * 100;
                const icons = {
                  compute: <Server className="h-4 w-4" />,
                  storage: <HardDrive className="h-4 w-4" />,
                  database: <Database className="h-4 w-4" />,
                  networking: <Zap className="h-4 w-4" />,
                  other: <DollarSign className="h-4 w-4" />
                };

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 capitalize">
                        {icons[category as keyof typeof icons]}
                        {category}
                      </div>
                      <div className="font-medium">
                        ${cost.toFixed(2)} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Optimization Recommendations */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Optimization Recommendations</h2>
            
            {costAnalysis.recommendations.map((recommendation) => (
              <Card key={recommendation.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getRecommendationIcon(recommendation.type)}
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(recommendation.priority)}>
                            {recommendation.priority} priority
                          </Badge>
                          <Badge variant="outline">
                            {recommendation.provider.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {recommendation.component}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm text-muted-foreground">Potential Savings</div>
                      <div className="text-xl font-bold text-green-600">
                        ${recommendation.potentialSavings.toFixed(2)}/mo
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{recommendation.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Implementation Effort</div>
                      <Badge className={getEffortColor(recommendation.implementationEffort)}>
                        {recommendation.implementationEffort}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Time to Implement</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {recommendation.timeToImplement}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Expected Impact</div>
                      <div className="text-sm text-muted-foreground">
                        {recommendation.impact}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Implementation Steps</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {recommendation.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="min-w-[1.25rem] h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center mt-0.5">
                            {index + 1}
                          </div>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Current: </span>
                      <span className="font-medium">${recommendation.currentCost.toFixed(2)}/mo</span>
                    </div>
                    
                    {appliedRecommendations.has(recommendation.id) ? (
                      <Button disabled className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Applied
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleApplyRecommendation(recommendation.id)}
                        className="gap-2"
                      >
                        Apply Optimization
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {selectedPipeline && !costAnalysis && !isLoading && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No cost analysis available for this pipeline. Make sure the pipeline has components configured.
          </AlertDescription>
        </Alert>
      )}

      {!selectedPipeline && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pipeline Selected</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Select a pipeline from the dropdown above to view cost optimization recommendations and potential savings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}