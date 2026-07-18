import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ShoppingBag, MessageSquare, Users, Package, Wrench, Clock, BarChart3, ArrowLeft, Workflow, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import AgentCustomersPanel from "./AgentCustomersPanel";
import AgentConversationsPanel from "./AgentConversationsPanel";
import AgentAnalyticsPanel from "./AgentAnalyticsPanel";
import AgentFlowsPanel from "./AgentFlowsPanel";
import AgentAIPanel from "./AgentAIPanel";

interface AgentManagementPanelProps {
  agentId: string;
  agentName: string;
}

interface MenuOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function AgentManagementPanel({ agentId, agentName }: AgentManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const menuOptions: MenuOption[] = [
    { id: "conversations", label: "Conversas", icon: <MessageSquare /> },
    { id: "flows", label: "Fluxos", icon: <Workflow /> },
    { id: "ai", label: "Agente IA", icon: <Brain /> },
    { id: "customers", label: "Clientes", icon: <Users /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "conversations":
        return <AgentConversationsPanel agentId={agentId} />;
      case "flows":
        return <AgentFlowsPanel agentId={agentId} />;
      case "ai":
        return <AgentAIPanel agentId={agentId} />;
      case "customers":
        return <AgentCustomersPanel agentId={agentId} />;
      case "analytics":
        return <AgentAnalyticsPanel agentId={agentId} />;
      default:
        return null;
    }
  };

  // Mobile layout: grid de ícones ou conteúdo
  if (isMobile) {
    if (activeTab) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setActiveTab(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold">
              {menuOptions.find(opt => opt.id === activeTab)?.label}
            </h2>
          </div>
          {renderContent()}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gestão: {agentName}</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie conversas, fluxos e clientes do seu agente IA
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {menuOptions.map((option) => (
            <Card 
              key={option.id}
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors active:scale-95"
              onClick={() => setActiveTab(option.id)}
            >
              <div className="flex flex-col items-center gap-2 text-center relative">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  {option.icon}
                </div>
                <span className="text-sm font-medium">{option.label}</span>
                {option.badge && option.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full text-xs"
                  >
                    {option.badge}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Desktop layout: cards quadradas quando nenhuma aba está selecionada, conteúdo quando está
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {activeTab && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActiveTab(null)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h2 className="text-3xl font-bold mb-1">
            {activeTab 
              ? menuOptions.find(opt => opt.id === activeTab)?.label 
              : `Gestão: ${agentName}`}
          </h2>
          {!activeTab && (
            <p className="text-muted-foreground">
              Gerencie conversas, fluxos e clientes do seu agente IA
            </p>
          )}
        </div>
      </div>

      {!activeTab ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {menuOptions.map((option) => (
            <Card 
              key={option.id}
              className="aspect-square flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-all hover:scale-[1.02] active:scale-95 group relative border-2"
              onClick={() => setActiveTab(option.id)}
            >
              <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 shadow-sm">
                {React.cloneElement(option.icon as React.ReactElement, { className: "w-8 h-8" })}
              </div>
              <span className="text-sm font-semibold tracking-tight">{option.label}</span>
              {option.badge && option.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute top-3 right-3 h-6 min-w-6 flex items-center justify-center rounded-full text-xs font-bold border-2 border-background"
                >
                  {option.badge}
                </Badge>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {renderContent()}
        </div>
      )}
    </div>
  );
}
