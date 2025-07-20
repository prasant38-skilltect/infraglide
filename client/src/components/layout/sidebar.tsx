import { Link, useLocation } from "wouter";
import { Cloud, Home, GitBranch, Settings, User, Key, Layers, Users, Code, Network, Globe, Server, Bot, MessageCircle, X, LogOut, Shield, DollarSign } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AskJaneContent from "@/components/ask-jane-content";

export default function Sidebar() {
  const [location] = useLocation();
  const [showAskJane, setShowAskJane] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Pipelines", href: "/my-pipelines", icon: Layers },
    { name: "Credentials", href: "/credentials", icon: Key },
    { name: "Hub", href: "/hub", icon: Globe },
    { name: "Architecture", href: "/architecture", icon: Network },
    { name: "HLD", href: "/hld", icon: Users },
    { name: "LLD", href: "/lld", icon: Code },
    { name: "Deployed Resources", href: "/deployed-resources", icon: Server },
    { name: "Cost Optimization", href: "/cost-optimization", icon: DollarSign },
    { name: "Access Management", href: "/access-management", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  return (
    <div className="w-64 shadow-lg border-r border-purple-200 flex flex-col" style={{
      background: 'linear-gradient(to bottom, #0a1423, #1e1d48)'
    }}>
      {/* Logo and Brand */}
      <div className="p-6 border-b border-purple-400/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
              background: 'rgb(138, 83, 214)'
            }}>
              <Cloud className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white">InfraGlide</h1>
          </div>
          <Button
            onClick={() => setShowAskJane(true)}
            size="sm"
            className="rounded-full w-10 h-10 shadow-md hover:shadow-lg transition-all duration-200 p-0"
            style={{
              background: 'rgb(138, 83, 214)',
              color: 'white'
            }}
            title="Ask Jane - AI Assistant"
          >
            <MessageCircle className="w-5 h-5" />
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
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? "text-white shadow-md"
                    : "text-purple-100 hover:text-white"
                }`}
                style={isActive(item.href) ? {
                  background: 'rgb(138, 83, 214)',
                  boxShadow: '0 4px 12px rgba(138, 83, 214, 0.3)'
                } : {}}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.background = 'rgba(138, 83, 214, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.background = '';
                  }
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-purple-400/30">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
            background: 'rgba(138, 83, 214, 0.3)'
          }}>
            <User className="w-5 h-5 text-purple-200" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-100">
              {user ? user.fullName : "User"}
            </p>
            <p className="text-xs text-purple-300">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </div>
        
        {/* Logout Button */}
        <Button
          onClick={async () => {
            try {
              await logout();
              toast({
                title: "Logged out successfully",
                description: "You have been signed out of your account.",
              });
            } catch (error) {
              toast({
                title: "Logout failed", 
                description: "An error occurred while logging out.",
                variant: "destructive",
              });
            }
          }}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-purple-200 hover:text-white hover:bg-purple-600/20"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Ask Jane Dialog */}
      <Dialog open={showAskJane} onOpenChange={setShowAskJane}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" style={{ color: 'rgb(138, 83, 214)' }} />
              Ask Jane - AI Infrastructure Assistant
            </DialogTitle>
          </DialogHeader>
          <AskJaneContent />
        </DialogContent>
      </Dialog>
    </div>
  );
}
