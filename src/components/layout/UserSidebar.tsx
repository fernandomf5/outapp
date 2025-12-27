import { useLocation, useNavigate, Link } from "react-router-dom";
import { Sparkles, Volume2, MessageSquare, Wrench, Link2, Copy, LifeBuoy, Gift, CreditCard, TrendingUp, Users, ExternalLink, QrCode, Calendar, BarChart3, ShoppingBag, DollarSign, Clock, Zap, Star, Bell, FileText, FileCheck, Database, Target, Globe, HelpCircle, Lightbulb, UserCog, Megaphone, Brain, ClipboardCheck, Layers, LogIn } from "lucide-react";
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

  // State for team membership check
  const [teamMembership, setTeamMembership] = useState<{ adminName: string; adminUserId: string } | null>(null);

  useEffect(() => {
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

  const mainItems: MenuItem[] = [
    { title: t('overview'), icon: TrendingUp, path: "/dashboard", tab: "overview" },
    { title: "Blog", icon: FileText, path: "/blog" },
  ];

  const managementItems: MenuItem[] = [
    { title: "Agenda", icon: Calendar, path: "/dashboard", tab: "agenda", moduleKey: "agenda" },
    { title: "Gestão de Clientes", icon: Users, path: "/dashboard", tab: "clientes", moduleKey: "crm" },
    { title: "Gestão Financeira", icon: DollarSign, path: "/dashboard", tab: "financeiro", moduleKey: "financial" },
    { title: "Gestão de Equipe", icon: UserCog, path: "/dashboard", tab: "equipe" }, // Always visible for admins, hidden for team members
    { title: "Gestão de Anúncios", icon: Megaphone, path: "/dashboard", tab: "anuncios", moduleKey: "ads" },
    { title: "Organizador de Tarefas", icon: Target, path: "/dashboard", tab: "tarefas", moduleKey: "tasks" },
    { title: "Aprova Job", icon: ClipboardCheck, path: "/dashboard", tab: "aprova-job" },
  ];

  const crmItems: MenuItem[] = [
    { title: "Controle de Leads", icon: Database, path: "/dashboard", tab: "crm-geral", moduleKey: "crm" },
  ];

  const basicResourcesItems: MenuItem[] = [
    { title: "Gerador de Link Whats", icon: Wrench, path: "/dashboard", tab: "tools" },
    { title: "Botão Flutuante Multi-Links", icon: Zap, path: "/dashboard", tab: "floating-button" },
    { title: t('link_shortener_title'), icon: Link2, path: "/dashboard", tab: "shortlinks", feature: "link_shortener" },
    { title: "Gerador QR Code", icon: QrCode, path: "/dashboard", tab: "qrcode" },
  ];

  const advancedResourcesItems: MenuItem[] = [
    { title: "Chat Online", icon: MessageSquare, path: "/dashboard", tab: "ai-agents", moduleKey: "chatbots" },
    { title: t('page_cloner_title'), icon: Copy, path: "/dashboard", tab: "cloner", feature: "page_cloner", moduleKey: "cloner" },
    { title: "Área de Membros", icon: UserCog, path: "/dashboard", tab: "area-membros" },
    { title: "Link na Bio", icon: ExternalLink, path: "/dashboard", tab: "linkbio", moduleKey: "link_bio" },
    { title: "Briefing", icon: FileText, path: "/dashboard", tab: "briefing", moduleKey: "briefings" },
    { title: "Criador de Quiz", icon: HelpCircle, path: "/dashboard", tab: "criador-quizz" },
    { title: "Criador de Pop-ups", icon: Megaphone, path: "/dashboard", tab: "popups" },
    { title: "Criador de Mapa Mental", icon: Brain, path: "/dashboard", tab: "mapa-mental" },
    { title: "Criador de Propostas", icon: FileCheck, path: "/dashboard", tab: "propostas" },
    { title: "Criador de Portfólio", icon: Layers, path: "/dashboard", tab: "portfolio", moduleKey: "portfolio" },
  ];

  const supportItems: MenuItem[] = [
    { title: t('support_ticket'), icon: LifeBuoy, path: "/dashboard", tab: "support", feature: "ticket_system" },
    { title: t('voucher'), icon: Gift, path: "/dashboard", tab: "voucher" },
    { title: t('my_plan'), icon: CreditCard, path: "/dashboard", tab: "plan" },
    { title: "Tutoriais", icon: Lightbulb, path: "/dashboard", tab: "tutoriais" },
  ];

  // Filter function that checks both feature access and team member permissions
  const canShowItem = (item: MenuItem): boolean => {
    // Check plan feature first
    if (item.feature && !hasFeature(item.feature)) return false;
    
    // If user is a team member and item has a moduleKey, check permission
    if (isTeamMember && item.moduleKey) {
      return canAccessModule(item.moduleKey);
    }
    
    // Special case: hide team management for team members
    if (isTeamMember && item.tab === 'equipe') return false;
    
    return true;
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-56 sm:w-60"} collapsible="icon">
      <div className="flex items-center justify-center p-3 sm:p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={currentLogo} alt="Out App" className="w-7 h-7 sm:w-8 sm:h-8" />
          {!collapsed && <span className="font-bold text-base sm:text-lg">Out App</span>}
        </Link>
      </div>
      
      <ScrollArea className="flex-1 overflow-y-auto">
        <SidebarContent className="p-1 sm:p-2">
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

          <SidebarGroup>
            <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => {
                  if (!canShowItem(item)) return null;
                  
                  // Special handling for team management to show access button
                  if (item.tab === 'equipe' && teamMembership && !isTeamMember) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item.path, item.tab)}
                          className={`text-sm py-2 ${isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </SidebarMenuButton>
                        {!collapsed && teamMembership && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-1 text-xs gap-1 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => navigate('/team-member-auth')}
                          >
                            <LogIn className="h-3 w-3" />
                            Acessar Área de {teamMembership.adminName}
                          </Button>
                        )}
                      </SidebarMenuItem>
                    );
                  }
                  
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
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  );
}
