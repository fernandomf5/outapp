import { useLocation, useNavigate, Link } from "react-router-dom";
import { Sparkles, Volume2, MessageSquare, Wrench, Link2, Copy, LifeBuoy, Gift, CreditCard, TrendingUp, Users, ExternalLink, QrCode, Calendar, BarChart3, ShoppingBag, DollarSign, Clock, Zap, Star, Bell, FileText, FileCheck, Database, Target, Globe, HelpCircle, Lightbulb, UserCog, Megaphone, Brain, ClipboardCheck, Layers, LogIn, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
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
import { useTeamMember } from "@/contexts/TeamMemberContext";
import { Button } from "@/components/ui/button";

interface MenuItem {
  title: string;
  icon: any;
  path: string;
  tab?: string;
  feature?: string;
  badge?: number;
  inDevelopment?: boolean;
  superscript?: string;
  moduleKey?: string; // Key for team member permission check
  hideForTeamMember?: boolean; // Explicitly hide this item for team members
}

export function UserSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasFeature } = useUserFeatures();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const { isTeamMember, canAccessModule } = useTeamMember();
  
  const currentLogo = resolvedTheme === 'dark' ? logoDark : logoLight;
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';
  const collapsed = state === "collapsed";

  // State for team membership check (for regular users who are also team members elsewhere)
  const [teamMembership, setTeamMembership] = useState<{ adminName: string; adminUserId: string } | null>(null);

  useEffect(() => {
    // Only check team membership for regular users (not when already logged as team member)
    if (user && !isTeamMember) {
      checkTeamMembership();
    }
  }, [user, isTeamMember]);

  const checkTeamMembership = async () => {
    if (!user) return;

    try {
      // Check if user is a linked team member in someone else's team
      const { data: membership, error: membershipError } = await supabase
        .from('team_members')
        .select('id, user_id')
        .eq('linked_user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membershipError || !membership) {
        setTeamMembership(null);
        return;
      }

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', membership.user_id)
        .maybeSingle();

      setTeamMembership({
        adminName: adminProfile?.full_name || adminProfile?.email || 'Administrador',
        adminUserId: membership.user_id,
      });
    } catch (e) {
      console.error('Error checking team membership:', e);
      setTeamMembership(null);
    }
  };

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

  // Main items - overview is always visible, Blog is external
  const mainItems: MenuItem[] = [
    { title: t('overview'), icon: TrendingUp, path: "/dashboard", tab: "overview", hideForTeamMember: true },
    { title: "Blog", icon: FileText, path: "/blog", hideForTeamMember: true },
  ];

  const managementItems: MenuItem[] = [
    { title: "Agenda", icon: Calendar, path: "/dashboard", tab: "agenda", moduleKey: "agenda" },
    { title: "Gestão de Clientes", icon: Users, path: "/dashboard", tab: "clientes", moduleKey: "crm" },
    { title: "Gestão Financeira", icon: DollarSign, path: "/dashboard", tab: "financeiro", moduleKey: "financial" },
    { title: "Gestão de Equipe", icon: UserCog, path: "/dashboard", tab: "equipe", hideForTeamMember: true },
    { title: "Gestão de Anúncios", icon: Megaphone, path: "/dashboard", tab: "anuncios", moduleKey: "ads" },
    { title: "Organizador de Tarefas", icon: Target, path: "/dashboard", tab: "tarefas", moduleKey: "tasks" },
    { title: "Funil de Vendas", icon: Filter, path: "/dashboard", tab: "funil-vendas", moduleKey: "sales_funnel" },
  ];

  const crmItems: MenuItem[] = [
    { title: "Controle de Leads", icon: Database, path: "/dashboard", tab: "crm-geral", moduleKey: "crm" },
  ];

  const basicResourcesItems: MenuItem[] = [
    { title: "Gerador de Link Whats", icon: Wrench, path: "/dashboard", tab: "tools", hideForTeamMember: true },
    { title: "Botão Flutuante Multi-Links", icon: Zap, path: "/dashboard", tab: "floating-button", hideForTeamMember: true },
    { title: t('link_shortener_title'), icon: Link2, path: "/dashboard", tab: "shortlinks", feature: "link_shortener", hideForTeamMember: true },
    { title: "Gerador QR Code", icon: QrCode, path: "/dashboard", tab: "qrcode", hideForTeamMember: true },
  ];

  const advancedResourcesItems: MenuItem[] = [
    { title: "Chat Online", icon: MessageSquare, path: "/dashboard", tab: "ai-agents", moduleKey: "ai_agents" },
    { title: t('page_cloner_title'), icon: Copy, path: "/dashboard", tab: "cloner", feature: "page_cloner", moduleKey: "cloner" },
    { title: "Área de Membros", icon: UserCog, path: "/dashboard", tab: "area-membros", hideForTeamMember: true },
    { title: "Link na Bio", icon: ExternalLink, path: "/dashboard", tab: "linkbio", moduleKey: "link_bio" },
    { title: "Briefing", icon: FileText, path: "/dashboard", tab: "briefing", moduleKey: "briefings" },
    { title: "Criador de Quiz", icon: HelpCircle, path: "/dashboard", tab: "criador-quizz", hideForTeamMember: true },
    { title: "Criador de Pop-ups", icon: Megaphone, path: "/dashboard", tab: "popups", hideForTeamMember: true },
    { title: "Criador de Mapa Mental", icon: Brain, path: "/dashboard", tab: "mapa-mental", hideForTeamMember: true },
    { title: "Criador de Propostas", icon: FileCheck, path: "/dashboard", tab: "propostas", hideForTeamMember: true },
    { title: "Criador de Portfólio", icon: Layers, path: "/dashboard", tab: "portfolio", moduleKey: "portfolio" },
    { title: "Aprova Job", icon: ClipboardCheck, path: "/dashboard", tab: "aprova-job", hideForTeamMember: true },
    { title: "Disparador Manual", icon: Zap, path: "/dashboard", tab: "disparador", hideForTeamMember: true },
  ];

  // Support items - all hidden for team members
  const supportItems: MenuItem[] = [
    { title: t('support_ticket'), icon: LifeBuoy, path: "/dashboard", tab: "support", feature: "ticket_system", hideForTeamMember: true },
    { title: t('voucher'), icon: Gift, path: "/dashboard", tab: "voucher", hideForTeamMember: true },
    { title: t('my_plan'), icon: CreditCard, path: "/dashboard", tab: "plan", hideForTeamMember: true },
    { title: "Tutoriais", icon: Lightbulb, path: "/dashboard", tab: "tutoriais", hideForTeamMember: true },
  ];

  // Filter function that checks both feature access and team member permissions
  const canShowItem = (item: MenuItem): boolean => {
    // If team member and item is explicitly hidden for team members
    if (isTeamMember && item.hideForTeamMember) return false;
    
    // Check plan feature first (only for regular users)
    if (!isTeamMember && item.feature && !hasFeature(item.feature)) return false;
    
    // If user is a team member and item has a moduleKey, check permission
    if (isTeamMember && item.moduleKey) {
      return canAccessModule(item.moduleKey);
    }
    
    // For team members, only show items with moduleKey that they have access to
    if (isTeamMember && !item.moduleKey) return false;
    
    return true;
  };

  // Check if any items are visible in a group (for team members)
  const hasVisibleItems = (items: MenuItem[]): boolean => {
    return items.some(item => canShowItem(item));
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-56 sm:w-60"} collapsible="icon">
      <div className="flex items-center justify-center p-3 sm:p-4 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={currentLogo} alt="Out App" className="w-7 h-7 sm:w-8 sm:h-8" />
          {!collapsed && <span className="font-bold text-base sm:text-lg">Out App</span>}
        </Link>
      </div>
      
      <ScrollArea className="flex-1 overflow-y-auto">
        <SidebarContent className="p-1 sm:p-2">
          {/* Main section - hide for team members */}
          {!isTeamMember && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">{t('main')}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        {item.title === "Blog" ? (
                          <SidebarMenuButton
                            onClick={() => window.open(item.path, '_blank')}
                            className="text-sm py-2"
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="truncate">{item.title}</span>}
                          </SidebarMenuButton>
                        ) : (
                          <SidebarMenuButton
                            onClick={() => handleNavigation(item.path, item.tab)}
                            className={`text-sm py-2 ${isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}`}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="truncate">{item.title}</span>}
                          </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Management section */}
          {hasVisibleItems(managementItems) && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">Gestão</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementItems.map((item) => {
                    if (!canShowItem(item)) return null;
                    
                    // Special handling removed: no "Acessar Área do Administrador" shortcut
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item.path, item.tab)}
                          className={`text-sm py-2 ${isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Leads section */}
          {hasVisibleItems(crmItems) && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">Leads</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {crmItems.map((item) => {
                    if (!canShowItem(item)) return null;
                    return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => handleNavigation(item.path, item.tab)}
                        className={`text-sm py-2 ${isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Basic Resources section - hide for team members */}
          {!isTeamMember && hasVisibleItems(basicResourcesItems) && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">Recursos</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <TooltipProvider delayDuration={300}>
                    {basicResourcesItems.map((item) => {
                      if (!canShowItem(item)) return null;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                onClick={() => handleNavigation(item.path, item.tab)}
                                className={`text-sm py-2 ${isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}`}
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span className="truncate">{item.title}</span>}
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
          )}

          {/* Advanced Resources section */}
          {hasVisibleItems(advancedResourcesItems) && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">Avançados</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <TooltipProvider delayDuration={300}>
                    {advancedResourcesItems.map((item) => {
                      if (!canShowItem(item)) return null;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                onClick={() => handleNavigation(item.path, item.tab)}
                                className={`text-sm py-2 ${isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}`}
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span className="truncate">{item.title}</span>}
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
          )}

          {/* Support section - hide for team members */}
          {!isTeamMember && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">{t('support')}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {supportItems.map((item) => {
                    if (!canShowItem(item)) return null;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item.path, item.tab)}
                          className={`text-sm py-2 ${isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  );
}