import { 
  LayoutDashboard, 
  History, 
  Cloud, 
  Database, 
  Code, 
  Plus, 
  Rocket 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
}

const navigation = [
  { name: "Dashboard", href: "#", icon: LayoutDashboard, current: true },
  { name: "Pipelines", href: "#", icon: History, current: false },
  { name: "Cloud Providers", href: "#", icon: Cloud, current: false },
  { name: "Resources", href: "#", icon: Database, current: false },
  { name: "Terraform", href: "#", icon: Code, current: false },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <nav 
      className={cn(
        "bg-card border-r border-border w-60 h-screen fixed overflow-y-auto transition-transform duration-300 z-40",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-4">
        <div className="space-y-2">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 font-medium transition-colors duration-200",
                item.current
                  ? "text-primary bg-blue-50"
                  : "text-gray-700 hover:bg-accent"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </a>
          ))}
        </div>
        
        <div className="mt-8">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Quick Actions
          </h3>
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 text-gray-700 hover:bg-accent"
          >
            <Plus className="h-5 w-5" />
            <span>New Pipeline</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 text-gray-700 hover:bg-accent"
          >
            <Rocket className="h-5 w-5" />
            <span>Deploy Resources</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
