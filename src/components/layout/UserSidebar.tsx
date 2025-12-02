import { useLocation, useNavigate, Link } from "react-router-dom";
import { Bot, Sparkles, Volume2, MessageSquare, Wrench, Link2, Copy, LifeBuoy, Gift, CreditCard, TrendingUp, Users, ExternalLink, QrCode, Calendar, BarChart3, ShoppingBag, DollarSign, Clock, Zap, Star, Bell, FileText, FileCheck, Database, Target, Globe, HelpCircle, Lightbulb, UserCog, Megaphone, Brain } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationNotificationBell } from "@/components/ConversationNotificationBell";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserFeatures } from "@/hooks/useUserFeatures";
import { useLanguage } from "@/contexts/LanguageContext";

interface MenuItem {
  title: string;
  icon: any;
  path: string;
  tab?: string;
  feature?: string;
  badge?: number;
  inDevelopment?: boolean;
  superscript?: string;
}

export function UserSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasFeature } = useUserFeatures();
  const { t } = useLanguage();
  const { user } = useAuth();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';
  const collapsed = state === "collapsed";

  const isActive = (path: string, tab?: string) => {
    if (tab) {
      return currentPath === path && currentTab === tab;
    }
    return currentPath === path;
  };

  const handleNavigation = (path: string, tab?: string) => {
    if (tab) {
      navigate(`${path}?tab=${tab}`);
    } else {
      navigate(path);
    }
  };

  const mainItems: MenuItem[] = [
    { title: t('overview'), icon: TrendingUp, path: "/dashboard", tab: "overview" },
    { title: "Gerenciador de Domínios", icon: Globe, path: "/dashboard", tab: "dominios" },
    { title: "Blog", icon: FileText, path: "/blog" },
  ];

  const managementItems: MenuItem[] = [
    { title: "Gestão de Clientes", icon: Users, path: "/dashboard", tab: "clientes" },
    { title: "Gestão Financeira", icon: DollarSign, path: "/dashboard", tab: "financeiro" },
    { title: "Gestão de Equipe", icon: UserCog, path: "/dashboard", tab: "equipe" },
    { title: "Gestão de Anúncios", icon: Megaphone, path: "/dashboard", tab: "anuncios" },
    { title: "Organizador de Tarefas", icon: Target, path: "/dashboard", tab: "tarefas" },
  ];

  const crmItems: MenuItem[] = [
    { title: "CRM Geral", icon: Database, path: "/dashboard", tab: "crm-geral" },
  ];

  const basicResourcesItems: MenuItem[] = [
    { title: "Gerador de Link Whats", icon: Wrench, path: "/dashboard", tab: "tools" },
    { title: "Botão Flutuante Multi-Links", icon: Zap, path: "/dashboard", tab: "floating-button" },
    { title: t('link_shortener_title'), icon: Link2, path: "/dashboard", tab: "shortlinks", feature: "link_shortener" },
    { title: "Gerador QR Code", icon: QrCode, path: "/dashboard", tab: "qrcode" },
  ];

  const advancedResourcesItems: MenuItem[] = [
    { title: "Chat Online e Agente IA", icon: Bot, path: "/dashboard", tab: "ai-agents" },
    { title: t('page_cloner_title'), icon: Copy, path: "/dashboard", tab: "cloner", feature: "page_cloner" },
    { title: "Área de Membros", icon: UserCog, path: "/dashboard", tab: "area-membros" },
    { title: "Link na Bio", icon: ExternalLink, path: "/dashboard", tab: "linkbio" },
    { title: "Briefing", icon: FileText, path: "/dashboard", tab: "briefing" },
    { title: "Criador de Quiz", icon: HelpCircle, path: "/dashboard", tab: "criador-quizz" },
    { title: "Criador de Pop-ups", icon: Megaphone, path: "/dashboard", tab: "popups" },
    { title: "Criador de Mapa Mental", icon: Brain, path: "/dashboard", tab: "mapa-mental" },
  ];

  const supportItems: MenuItem[] = [
    { title: t('support_ticket'), icon: LifeBuoy, path: "/dashboard", tab: "support", feature: "ticket_system" },
    { title: t('voucher'), icon: Gift, path: "/dashboard", tab: "voucher" },
    { title: t('my_plan'), icon: CreditCard, path: "/dashboard", tab: "plan" },
    { title: "Tutoriais", icon: Lightbulb, path: "/dashboard", tab: "tutoriais" },
  ];

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <div className="flex items-center justify-center p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Bot className="w-8 h-8 text-primary" />
          {!collapsed && <span className="font-bold text-lg">Bot Reals Zapp</span>}
        </Link>
      </div>
      
      <ScrollArea className="flex-1">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1">{t('main')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                      {item.title === "Blog" ? (
                        <SidebarMenuButton
                          onClick={() => window.open(item.path, '_blank')}
                          className=""
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item.path, item.tab)}
                          className={isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </SidebarMenuButton>
                      )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1">Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.path, item.tab)}
                      className={isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1">CRM</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {crmItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.path, item.tab)}
                      className={isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1">Recursos</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <TooltipProvider delayDuration={300}>
                  {basicResourcesItems.map((item) => {
                    if (item.feature && !hasFeature(item.feature)) return null;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              onClick={() => handleNavigation(item.path, item.tab)}
                              className={isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right">
                              <p>{item.title}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  })}
                </TooltipProvider>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1">Recursos Avançados</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <TooltipProvider delayDuration={300}>
                  {advancedResourcesItems.map((item) => {
                    if (item.feature && !hasFeature(item.feature)) return null;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              onClick={() => handleNavigation(item.path, item.tab)}
                              className={isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right">
                              <p>{item.title}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  })}
                </TooltipProvider>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1">{t('support')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {supportItems.map((item) => {
                  if (item.feature && !hasFeature(item.feature)) return null;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => handleNavigation(item.path, item.tab)}
                        className={isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  );
}
