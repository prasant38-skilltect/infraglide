import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Send, 
  Copy, 
  ExternalLink,
  User,
  Sparkles,
  Code,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  terraformJson?: any;
  hasError?: boolean;
}

export default function AskJane() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Jane, your infrastructure assistant. I can help you with:\n\n• Terraform configurations for AWS, Azure, and GCP\n• Cloud architecture best practices\n• Infrastructure deployment guidance\n• Pipeline design recommendations\n\nJust ask me something like \"Create an AWS S3 bucket\" or \"Show me Terraform for Google Compute Engine\"!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const askJaneMutation = useMutation({
    mutationFn: async (message: string) => {
      console.log("Sending message to Ask Jane:", message);
      const response = await apiRequest("/api/ask-jane", {
        method: "POST",
        body: { message }, // Let apiRequest handle the JSON.stringify
      });
      console.log("Ask Jane response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Ask Jane response data:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Processing successful response:", data);
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response || "No response content",
        timestamp: new Date(),
        terraformJson: data.terraformJson,
        hasError: data.hasError
      };
      console.log("Created assistant message:", assistantMessage);
      setMessages(prev => {
        console.log("Previous messages:", prev);
        const newMessages = [...prev, assistantMessage];
        console.log("New messages array:", newMessages);
        return newMessages;
      });
    },
    onError: (error) => {
      console.error("Ask Jane error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
        hasError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    askJaneMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  const openInPipelineDesigner = (terraformJson: any) => {
    // Convert Terraform JSON to pipeline format
    const pipelineData = {
      name: `Generated Pipeline ${new Date().toLocaleDateString()}`,
      description: "Generated from Jane's Terraform configuration",
      provider: detectProvider(terraformJson),
      region: detectRegion(terraformJson),
      components: convertTerraformToPipelineComponents(terraformJson),
      connections: []
    };

    sessionStorage.setItem('importedPipeline', JSON.stringify(pipelineData));
    window.open('/pipeline', '_blank');
    
    toast({
      title: "Pipeline Opened",
      description: "Terraform configuration loaded in Pipeline Designer",
    });
  };

  const detectProvider = (terraformJson: any): string => {
    if (!terraformJson?.resource) return "AWS";
    
    const resources = Object.keys(terraformJson.resource);
    if (resources.some(r => r.startsWith('aws_'))) return "AWS";
    if (resources.some(r => r.startsWith('azurerm_'))) return "Azure";
    if (resources.some(r => r.startsWith('google_'))) return "GCP";
    
    return "AWS";
  };

  const detectRegion = (terraformJson: any): string => {
    if (!terraformJson?.resource) return "us-east-1";
    
    const provider = detectProvider(terraformJson);
    switch (provider) {
      case "AWS": return "us-east-1";
      case "Azure": return "eastus";
      case "GCP": return "us-central1";
      default: return "us-east-1";
    }
  };

  const convertTerraformToPipelineComponents = (terraformJson: any): any[] => {
    const components = [];
    let index = 0;

    if (!terraformJson?.resource) return components;

    Object.entries(terraformJson.resource).forEach(([resourceType, resources]: [string, any]) => {
      Object.entries(resources).forEach(([resourceName, config]: [string, any]) => {
        const component = {
          id: `node-${index++}`,
          type: 'cloudComponent',
          position: { x: 100 + (index * 200), y: 100 + (Math.floor(index / 3) * 150) },
          data: {
            type: mapTerraformTypeToComponent(resourceType),
            label: resourceName,
            config: config,
            provider: detectProvider(terraformJson)
          }
        };
        components.push(component);
      });
    });

    return components;
  };

  const mapTerraformTypeToComponent = (terraformType: string): string => {
    const mapping: Record<string, string> = {
      'aws_s3_bucket': 'aws-s3',
      'aws_instance': 'aws-ec2',
      'aws_db_instance': 'aws-rds',
      'aws_vpc': 'aws-vpc',
      'aws_lb': 'aws-alb',
      'azurerm_storage_account': 'azure-storage',
      'azurerm_virtual_machine': 'azure-vm',
      'azurerm_sql_database': 'azure-sql',
      'azurerm_virtual_network': 'azure-vnet',
      'azurerm_lb': 'azure-load-balancer',
      'google_storage_bucket': 'gcp-storage',
      'google_compute_instance': 'gcp-compute',
      'google_sql_database_instance': 'gcp-sql',
      'google_compute_network': 'gcp-vpc',
      'google_compute_url_map': 'gcp-load-balancer'
    };

    return mapping[terraformType] || 'aws-ec2';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bot className="w-8 h-8 text-blue-600" />
              Ask Jane
            </h1>
            <p className="text-gray-600 mt-2">Your AI infrastructure assistant for Terraform and cloud architecture</p>
          </div>

          {/* Chat Container */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Conversation
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
                <div className="space-y-4 pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      
                      <div className={`max-w-2xl ${message.role === 'user' ? 'order-1' : ''}`}>
                        <div
                          className={`rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.hasError
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-gray-100'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          
                          {message.terraformJson && (
                            <div className="mt-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                <span className="font-medium">Terraform Configuration</span>
                              </div>
                              
                              <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                                <pre>{JSON.stringify(message.terraformJson, null, 2)}</pre>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(JSON.stringify(message.terraformJson, null, 2))}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy JSON
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => openInPipelineDesigner(message.terraformJson)}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Open in Pipeline Designer
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          {message.role === 'assistant' && message.hasError && (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          )}
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>

                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {askJaneMutation.isPending && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                          <span className="text-sm text-gray-600 ml-2">Jane is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask Jane about infrastructure, Terraform, or cloud services..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={askJaneMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || askJaneMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setInputMessage("Create an AWS S3 bucket with versioning")}>
              AWS S3 Example
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setInputMessage("Show me Terraform for Google Compute Engine")}>
              GCP Compute Example
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setInputMessage("Create Azure SQL Database")}>
              Azure SQL Example
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setInputMessage("Best practices for cloud architecture")}>
              Architecture Tips
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}