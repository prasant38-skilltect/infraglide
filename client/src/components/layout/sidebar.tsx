import { Link, useLocation } from "wouter";
import { Cloud, Home, GitBranch, History, Settings, User, Key, Layers, Users, Code, Network, Globe, Server, Bot, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AskJaneContent from "@/components/ask-jane-content";

export default function Sidebar() {
  const [location] = useLocation();
  const [showAskJane, setShowAskJane] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Pipelines", href: "/my-pipelines", icon: Layers },
    { name: "Deployments", href: "/deployments", icon: History },
    { name: "Credentials", href: "/credentials", icon: Key },
    { name: "Hub", href: "/hub", icon: Globe },
    { name: "Architecture", href: "/architecture", icon: Network },
    { name: "HLD", href: "/hld", icon: Users },
    { name: "LLD", href: "/lld", icon: Code },
    { name: "Deployed Resources", href: "/deployed-resources", icon: Server },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Cloud className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">InfraGlide</h1>
          </div>
          <Button
            onClick={() => setShowAskJane(true)}
            size="sm"
            className="rounded-full w-10 h-10 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 p-0"
            title="Ask Jane - AI Assistant"
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
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
      <div className="p-4 border-t border-gray-200">
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

      {/* Ask Jane Dialog */}
      <Dialog open={showAskJane} onOpenChange={setShowAskJane}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Ask Jane - AI Infrastructure Assistant
            </DialogTitle>
          </DialogHeader>
          <AskJaneContent />
        </DialogContent>
      </Dialog>
    </div>
  );
}
