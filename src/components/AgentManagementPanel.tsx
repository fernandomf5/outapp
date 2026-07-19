import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, BarChart3, ArrowLeft, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import AgentCustomersPanel from "./AgentCustomersPanel";
import AgentConversationsPanel from "./AgentConversationsPanel";
import AgentAnalyticsPanel from "./AgentAnalyticsPanel";

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
    { id: "ai", label: "Agente IA", icon: <Brain /> },
    { id: "customers", label: "Clientes", icon: <Users /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "conversations":
        return <AgentConversationsPanel agentId={agentId} />;
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

  // Mobile/Tablet layout: grid de ícones ou conteúdo
  if (isMobile) {
    if (activeTab) {
      return (
        <div className="space-y-4 pb-20">
          <div className="flex items-center gap-3 px-1">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setActiveTab(null)}
              className="rounded-xl h-10 w-10 border-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold leading-none">
                {menuOptions.find(opt => opt.id === activeTab)?.label}
              </h2>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{agentName}</span>
            </div>
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderContent()}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 py-2">
        <div className="px-1">
          <Badge className="mb-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">Painel do Agente</Badge>
          <h2 className="text-3xl font-black mb-2 tracking-tight">{agentName}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Central de comando para suas automações e atendimentos.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {menuOptions.map((option) => (
            <Card 
              key={option.id}
              className="p-5 cursor-pointer hover:bg-accent/50 transition-all active:scale-95 border-2 hover:border-primary/30 group relative overflow-hidden bg-card/50 backdrop-blur-sm shadow-none hover:shadow-lg rounded-2xl"
              onClick={() => setActiveTab(option.id)}
            >
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors" />
              <div className="flex flex-col items-center gap-3 text-center relative z-10">
                <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  {React.cloneElement(option.icon as React.ReactElement, { className: "w-6 h-6" })}
                </div>
                <span className="text-sm font-bold tracking-tight">{option.label}</span>
                {option.badge && option.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-background"
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-6 px-1">
        {activeTab && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setActiveTab(null)}
            className="shrink-0 h-12 w-12 rounded-2xl border-2 hover:bg-muted transition-all active:scale-95"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        )}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">Painel de Gestão</Badge>
            {activeTab && <span className="text-muted-foreground">/</span>}
            {activeTab && <span className="text-muted-foreground font-medium text-sm">{agentName}</span>}
          </div>
          <h2 className="text-4xl font-black tracking-tight">
            {activeTab 
              ? menuOptions.find(opt => opt.id === activeTab)?.label 
              : `Gestão: ${agentName}`}
          </h2>
          {!activeTab && (
            <p className="text-muted-foreground mt-2 text-lg">
              Gerencie conversas, treinamentos e clientes com ferramentas de inteligência artificial de alta performance.
            </p>
          )}
        </div>
      </div>

      {!activeTab ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {menuOptions.map((option) => (
            <Card 
              key={option.id}
              className="aspect-square flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-card hover:border-primary/50 transition-all hover:scale-[1.03] active:scale-95 group relative border-2 rounded-3xl shadow-none hover:shadow-2xl bg-card/40 backdrop-blur-sm"
              onClick={() => setActiveTab(option.id)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              <div className="p-5 rounded-[2rem] bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm relative z-10">
                {React.cloneElement(option.icon as React.ReactElement, { className: "w-10 h-10" })}
              </div>
              <span className="text-lg font-bold tracking-tight relative z-10">{option.label}</span>
              {option.badge && option.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute top-4 right-4 h-6 min-w-6 flex items-center justify-center rounded-full text-xs font-bold ring-4 ring-background shadow-lg"
                >
                  {option.badge}
                </Badge>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-2 pb-12">
          {renderContent()}
        </div>
      )}
    </div>
  );
}
