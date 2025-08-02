import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
  X,
  MessageCircle,
  Minimize2,
  Maximize2
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

export default function AskJaneChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Jane, your infrastructure assistant. I can help you with Terraform configurations for AWS, Azure, and GCP. Try asking \"Create an AWS S3 bucket\" or \"Show me Google Compute Engine\"!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const askJaneMutation = useMutation({
    mutationFn: async (message: string) => {
	    alert("2")
      const response = await apiRequest("/api/ask-jane", {
        method: "POST",
        body: { message },
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      console.log('Ask Jane API response:', data);
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response || 'No response received',
        timestamp: new Date(),
        terraformJson: data.terraformJson,
        hasError: data.hasError || false
      };
      console.log('Adding assistant message:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: () => {
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
      connections: [],
      fromJane: true
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
    const components: any[] = [];
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

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-[99999]" style={{zIndex: 99999}}>
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-2xl hover:shadow-3xl transition-all duration-300 border-4 border-white animate-bounce hover:animate-none"
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </Button>
        {/* Tooltip */}
        <div className="absolute bottom-24 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg opacity-90 whitespace-nowrap pointer-events-none">
          💬 Ask Jane - Your AI Assistant
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[99999]" style={{zIndex: 99999}}>
      <Card className={`w-96 shadow-2xl transition-all duration-200 border-2 border-blue-200 ${isMinimized ? 'h-16' : 'h-[600px]'}`}>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="w-5 h-5" />
              Ask Jane
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-blue-600 p-1 h-8 w-8"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-600 p-1 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex flex-col h-[calc(100%-4rem)] p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-2" ref={scrollAreaRef}>
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-3 h-3 text-blue-600" />
                      </div>
                    )}
                    
                    <div className={`max-w-xs ${message.role === 'user' ? 'order-1' : ''}`}>
                      <div
                        className={`rounded-lg p-3 text-sm ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : message.hasError
                            ? 'bg-red-50 border border-red-200 text-red-800'
                            : 'bg-gray-100'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        
                        {message.terraformJson && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-1">
                              <Code className="w-3 h-3" />
                              <span className="text-xs font-medium">Terraform Config</span>
                            </div>
                            
                            <div className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono overflow-x-auto max-h-32">
                              <pre>{JSON.stringify(message.terraformJson, null, 1)}</pre>
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(JSON.stringify(message.terraformJson, null, 2))}
                                className="text-xs h-6 px-2"
                              >
                                <Copy className="w-2 h-2 mr-1" />
                                Copy
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => openInPipelineDesigner(message.terraformJson)}
                                className="text-xs h-6 px-2 bg-blue-600 hover:bg-blue-700"
                              >
                                <ExternalLink className="w-2 h-2 mr-1" />
                                Open in Designer
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-3 h-3 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                
                {askJaneMutation.isPending && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                        <span className="text-xs text-gray-600 ml-1">Jane is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t">
              <div className="flex flex-wrap gap-1 mb-2">
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100 text-xs py-0 px-2 h-5" 
                  onClick={() => setInputMessage("Create an AWS S3 bucket")}
                >
                  AWS S3
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100 text-xs py-0 px-2 h-5" 
                  onClick={() => setInputMessage("Show me Google Compute Engine")}
                >
                  GCP Compute
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100 text-xs py-0 px-2 h-5" 
                  onClick={() => setInputMessage("Create Azure SQL Database")}
                >
                  Azure SQL
                </Badge>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask Jane about infrastructure..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={askJaneMutation.isPending}
                  className="text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || askJaneMutation.isPending}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
