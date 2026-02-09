import { useLocation, useNavigate, Link } from "react-router-dom";
import { Sparkles, Volume2, MessageSquare, Wrench, Link2, Copy, LifeBuoy, Gift, CreditCard, TrendingUp, Users, ExternalLink, QrCode, Calendar, BarChart3, ShoppingBag, DollarSign, Clock, Zap, Star, Bell, FileText, FileCheck, Database, Target, Globe, HelpCircle, Lightbulb, UserCog, Megaphone, Brain, ClipboardCheck, Layers, LogIn, Filter, Download, Smartphone, RefreshCw, FileType, Video, Truck, Building2, Package, CalendarCheck, BookOpen, Search, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
import { Input } from "@/components/ui/input";

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
  
  // Search state - must be at top level with other useState calls
  const [searchQuery, setSearchQuery] = useState("");

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
    { title: t('agenda'), icon: Calendar, path: "/dashboard", tab: "agenda", moduleKey: "agenda" },
    { title: "Rotina", icon: CalendarCheck, path: "/dashboard", tab: "rotina", hideForTeamMember: true },
  ];

  const managementItems: MenuItem[] = [
    { title: "Negócios", icon: Building2, path: "/dashboard", tab: "negocios", hideForTeamMember: true },
    { title: "Clientes", icon: Users, path: "/dashboard", tab: "clientes", moduleKey: "crm" },
    { title: "Produtos e Serviços", icon: ShoppingBag, path: "/dashboard", tab: "produtos-servicos", hideForTeamMember: true },
    { title: "Catálogo", icon: BookOpen, path: "/dashboard", tab: "catalogo", hideForTeamMember: true },
    { title: "Fornecedores", icon: Truck, path: "/dashboard", tab: "fornecedores", hideForTeamMember: true },
    { title: "Equipe", icon: UserCog, path: "/dashboard", tab: "equipe", hideForTeamMember: true },
    { title: "Anúncios", icon: Megaphone, path: "/dashboard", tab: "anuncios", moduleKey: "ads" },
    { title: "Tarefas", icon: Target, path: "/dashboard", tab: "tarefas", moduleKey: "tasks" },
  ];

  const financialItems: MenuItem[] = [
    { title: t('financial_management'), icon: DollarSign, path: "/dashboard", tab: "financeiro", moduleKey: "financial" },
  ];

  const crmItems: MenuItem[] = [
    { title: t('lead_control'), icon: Database, path: "/dashboard", tab: "crm-geral", moduleKey: "crm" },
  ];

  const basicResourcesItems: MenuItem[] = [
    { title: t('whatsapp_link_generator'), icon: Wrench, path: "/dashboard", tab: "tools", hideForTeamMember: true },
    { title: t('floating_multilink_button'), icon: Zap, path: "/dashboard", tab: "floating-button", hideForTeamMember: true },
    { title: t('link_shortener_title'), icon: Link2, path: "/dashboard", tab: "shortlinks", feature: "link_shortener", hideForTeamMember: true },
    { title: t('qr_code_generator'), icon: QrCode, path: "/dashboard", tab: "qrcode", hideForTeamMember: true },
    { title: t('manual_dispatcher'), icon: Zap, path: "/dashboard", tab: "disparador", hideForTeamMember: true },
  ];

  const advancedResourcesItems: MenuItem[] = [
    // Ordered items first
    { title: t('members_area'), icon: UserCog, path: "/dashboard", tab: "area-membros", hideForTeamMember: true },
    { title: t('portfolio'), icon: Layers, path: "/dashboard", tab: "portfolio", moduleKey: "portfolio" },
    { title: t('online_chat'), icon: MessageSquare, path: "/dashboard", tab: "ai-agents", moduleKey: "ai_agents" },
    { title: t('page_cloner_title'), icon: Copy, path: "/dashboard", tab: "cloner", feature: "page_cloner", moduleKey: "cloner" },
    { title: t('link_in_bio'), icon: ExternalLink, path: "/dashboard", tab: "linkbio", moduleKey: "link_bio" },
    // Rest of the items
    { title: t('sales_funnel'), icon: Filter, path: "/dashboard", tab: "funil-vendas", moduleKey: "sales_funnel" },
    { title: t('briefing'), icon: FileText, path: "/dashboard", tab: "briefing", moduleKey: "briefings" },
    { title: t('quiz_creator'), icon: HelpCircle, path: "/dashboard", tab: "criador-quizz", hideForTeamMember: true },
    { title: t('popup_creator'), icon: Megaphone, path: "/dashboard", tab: "popups", hideForTeamMember: true },
    { title: t('mind_map'), icon: Brain, path: "/dashboard", tab: "mapa-mental", hideForTeamMember: true },
    { title: t('proposal_creator'), icon: FileCheck, path: "/dashboard", tab: "propostas", hideForTeamMember: true },
    { title: t('aprova_job'), icon: ClipboardCheck, path: "/dashboard", tab: "aprova-job", hideForTeamMember: true },
    { title: t('creative_extractor'), icon: Download, path: "/dashboard", tab: "extrator-criativos", hideForTeamMember: true },
    { title: t('video_downloader'), icon: Video, path: "/dashboard", tab: "video-downloader", hideForTeamMember: true },
    { title: t('media_converter'), icon: RefreshCw, path: "/dashboard", tab: "conversor-midia", hideForTeamMember: true },
    { title: t('document_converter'), icon: FileType, path: "/dashboard", tab: "conversor-documentos", hideForTeamMember: true },
  ];

  // Support items - all hidden for team members
  const supportItems: MenuItem[] = [
    { title: t('blog'), icon: FileText, path: "/blog", hideForTeamMember: true },
    { title: t('support_ticket'), icon: LifeBuoy, path: "/dashboard", tab: "support", feature: "ticket_system", hideForTeamMember: true },
    { title: t('voucher'), icon: Gift, path: "/dashboard", tab: "voucher", hideForTeamMember: true },
    { title: t('my_plan'), icon: CreditCard, path: "/dashboard", tab: "plan", hideForTeamMember: true },
    { title: t('tutorial_videos'), icon: Lightbulb, path: "/dashboard", tab: "tutoriais", hideForTeamMember: true },
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

  // Combine all items for search
  
  // Combine all items for search
  const allMenuItems = useMemo(() => {
    const items = [
      ...mainItems,
      ...managementItems,
      ...financialItems,
      ...crmItems,
      ...basicResourcesItems,
      ...advancedResourcesItems,
      ...supportItems,
    ];
    return items.filter(item => canShowItem(item));
  }, [mainItems, managementItems, financialItems, crmItems, basicResourcesItems, advancedResourcesItems, supportItems, canShowItem]);
  
  // Filter items based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allMenuItems.filter(item => 
      item.title.toLowerCase().includes(query)
    );
  }, [searchQuery, allMenuItems]);

  const handleSearchSelect = (item: MenuItem) => {
    handleNavigation(item.path, item.tab);
    setSearchQuery("");
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-56 sm:w-60"} collapsible="icon">
      <div className="flex items-center justify-center p-3 sm:p-4 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={currentLogo} alt="Out App" className="w-7 h-7 sm:w-8 sm:h-8" />
          {!collapsed && <span className="font-bold text-base sm:text-lg">Out App</span>}
        </Link>
      </div>
      
      {/* Search input */}
      {!collapsed && (
        <div className="px-2 py-2 border-b border-border relative">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar recurso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 h-8 text-sm bg-muted/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Search results dropdown */}
          {searchQuery && searchResults.length > 0 && (
            <div className="absolute left-2 right-2 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
              {searchResults.map((item) => (
                <button
                  key={`${item.path}-${item.tab}`}
                  onClick={() => handleSearchSelect(item)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{item.title}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* No results message */}
          {searchQuery && searchResults.length === 0 && (
            <div className="absolute left-2 right-2 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 p-3">
              <p className="text-sm text-muted-foreground text-center">Nenhum resultado encontrado</p>
            </div>
          )}
        </div>
      )}
      
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
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">Gestão de:</SidebarGroupLabel>
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

          {/* Financial section */}
          {hasVisibleItems(financialItems) && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">{t('financial')}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {financialItems.map((item) => {
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

          {/* Leads section */}
          {hasVisibleItems(crmItems) && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">{t('captured_leads')}</SidebarGroupLabel>
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
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">{t('basic_resources')}</SidebarGroupLabel>
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
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">{t('advanced_resources')}</SidebarGroupLabel>
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
              <SidebarGroupLabel className="text-green-500 font-bold bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-md px-2 py-1 text-xs sm:text-sm">Suporte e Essenciais</SidebarGroupLabel>
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