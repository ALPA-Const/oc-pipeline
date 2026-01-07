// =====================================================
// OEOC Layout - Shared layout with sub-navigation
// =====================================================

import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Brain,
  Bot,
  LayoutDashboard,
  ListChecks,
  Play,
  FileCode,
  Shield,
  MessageSquare,
} from "lucide-react";

const navItems = [
  { to: "/oeoc", icon: LayoutDashboard, label: "Command Center", end: true },
  { to: "/oeoc/ai-chat", icon: MessageSquare, label: "AI Chat" },
  { to: "/oeoc/orchestrators", icon: Brain, label: "Orchestrators" },
  { to: "/oeoc/swarm", icon: Bot, label: "The Swarm" },
  { to: "/oeoc/workflows", icon: ListChecks, label: "Workflows" },
  { to: "/oeoc/executions", icon: Play, label: "Executions" },
  { to: "/oeoc/prompts", icon: FileCode, label: "Prompt Lab" },
  { to: "/oeoc/audit", icon: Shield, label: "Audit Vault" },
];

export function OEOCLayout() {
  return (
    <div className="flex flex-col h-full">
      {/* Sub Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}

export default OEOCLayout;
