import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Sparkles, Volume2, MessageSquare, Wrench, Link2, Copy, LifeBuoy, Gift, CreditCard, TrendingUp, Users, ExternalLink, QrCode, Calendar, BarChart3, ShoppingBag, DollarSign, Clock, Zap, Star, Bell, FileText, FileCheck, Database, Target, Globe, HelpCircle, Lightbulb, UserCog, Megaphone, Brain, ClipboardCheck, Layers, LogIn, Filter, Download, Smartphone, RefreshCw, FileType, Video, Truck, Building2, Package, CalendarCheck, BookOpen, Search, X, ChevronDown, PlusCircle, Handshake, Settings, HardHat, HeartPulse, GraduationCap, Gavel, Briefcase, Settings2, Table } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/Logo_3D_Verde.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

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
  openInNewTab?: boolean; // Open the path in a new browser tab
}

interface RegistrationCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  system_type: string | null;
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
  
  const { settings: siteSettings } = useSiteSettings();
  const currentLogo =
    (resolvedTheme === "light"
      ? siteSettings.siteLogoLightUrl || siteSettings.siteLogoUrl
      : siteSettings.siteLogoDarkUrl || siteSettings.siteLogoUrl) ||
    siteSettings.siteLogoUrl ||
    logoAsset.url;
  const logoSize = siteSettings.siteLogoSize;
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';
  const categoryId = searchParams.get('categoryId');
  const collapsed = state === "collapsed";

  const [registrationCategories, setRegistrationCategories] = useState<RegistrationCategory[]>([]);
  const [isCadastroOpen, setIsCadastroOpen] = useState(true);
  
  // State for team membership check (for regular users who are also team members elsewhere)
  const [teamMembership, setTeamMembership] = useState<{ adminName: string; adminUserId: string } | null>(null);
  
  // Search state - must be at top level with other useState calls
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Only check team membership for regular users (not when already logged as team member)
    if (user) {
      if (!isTeamMember) {
        checkTeamMembership();
      }
      fetchRegistrationCategories();
    }

    // Listen for category updates
    const handleUpdate = () => {
      fetchRegistrationCategories();
    };
    window.addEventListener('registration-categories-updated', handleUpdate);
    window.addEventListener('registration-items-updated', handleUpdate);
    return () => {
      window.removeEventListener('registration-categories-updated', handleUpdate);
      window.removeEventListener('registration-items-updated', handleUpdate);
    };

  }, [user, isTeamMember]);

  const fetchRegistrationCategories = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('registration_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        setRegistrationCategories(data);
      }
    } catch (error) {
      console.error('Error fetching registration categories:', error);
    }
  };

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

  const isActive = (path: string, tab?: string, catId?: string) => {
    if (catId) {
      return currentPath === path && currentTab === tab && categoryId === catId;
    }
    if (tab) {
      return currentPath === path && currentTab === tab;
    }
    return currentPath === path;
  };

  const handleNavigation = (path: string, tab?: string, catId?: string) => {
    let url = path;
    const params = new URLSearchParams();
    if (tab) params.set('tab', tab);
    if (catId) params.set('categoryId', catId);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    navigate(url);
  };

  // Main items - overview is always visible
  const mainItems: MenuItem[] = [
    { title: t('overview'), icon: TrendingUp, path: "/dashboard", tab: "overview", hideForTeamMember: true },
    { title: "Abrir nova aba", icon: ExternalLink, path: "/dashboard", tab: "overview", openInNewTab: true, hideForTeamMember: true },
  ];

  const organizerItems: MenuItem[] = [
    { title: "Tarefas", icon: Target, path: "/dashboard", tab: "tarefas", moduleKey: "tasks" },
    { title: t('agenda'), icon: Calendar, path: "/dashboard", tab: "agenda", moduleKey: "agenda" },
    { title: "Rotina", icon: CalendarCheck, path: "/dashboard", tab: "rotina", hideForTeamMember: true },
    { title: "Tabela de Organização", icon: Table, path: "/dashboard", tab: "tabelas-organizacao", moduleKey: "financial" },
  ];

  const financialItems: MenuItem[] = [
    { title: t('financial_management'), icon: DollarSign, path: "/dashboard", tab: "financeiro", moduleKey: "financial" },
    { title: "Gerador de Recibos", icon: FileCheck, path: "/dashboard", tab: "recibos", hideForTeamMember: true },
  ];





  const basicResourcesItems: MenuItem[] = [
    { title: t('whatsapp_link_generator'), icon: Wrench, path: "/dashboard", tab: "tools", hideForTeamMember: true },
    { title: t('floating_multilink_button'), icon: Zap, path: "/dashboard", tab: "floating-button", hideForTeamMember: true },
    { title: t('link_shortener_title'), icon: Link2, path: "/dashboard", tab: "shortlinks", feature: "link_shortener", hideForTeamMember: true },
    { title: t('qr_code_generator'), icon: QrCode, path: "/dashboard", tab: "qrcode", hideForTeamMember: true },
    { title: "Organizador de Script", icon: MessageSquare, path: "/dashboard", tab: "scripts", hideForTeamMember: true },
  ];

  const advancedResourcesItems: MenuItem[] = [
    { title: "Criador de Área de Membros", icon: UserCog, path: "/dashboard", tab: "area-membros", hideForTeamMember: true },
    { title: "Criador de Checkout", icon: ShoppingBag, path: "/dashboard", tab: "checkout-creator", hideForTeamMember: true },
    { title: "Criador de Dados de Anúncios", icon: Megaphone, path: "/dashboard", tab: "anuncios", moduleKey: "ads" },
    
    { title: "Criador de Chat Online", icon: MessageSquare, path: "/dashboard", tab: "chat-online", moduleKey: "ai_agents" },
    

    { title: t('page_cloner_title'), icon: Copy, path: "/dashboard", tab: "cloner", feature: "page_cloner", moduleKey: "cloner" },
    { title: "Criador de Link na Bio", icon: ExternalLink, path: "/dashboard", tab: "linkbio", moduleKey: "link_bio" },
    { title: "Criador de Funil de Vendas", icon: Filter, path: "/dashboard", tab: "funil-vendas", moduleKey: "sales_funnel" },
    { title: t('briefing'), icon: FileText, path: "/dashboard", tab: "briefing", moduleKey: "briefings" },
    { title: t('mind_map'), icon: Brain, path: "/dashboard", tab: "mapa-mental", hideForTeamMember: true },
    { title: t('proposal_creator'), icon: FileCheck, path: "/dashboard", tab: "propostas", hideForTeamMember: true },
    { title: "Criador de Contratos", icon: Gavel, path: "/dashboard", tab: "contratos", hideForTeamMember: true },
    { title: "Criador de Aprova Job", icon: ClipboardCheck, path: "/dashboard", tab: "aprova-job", hideForTeamMember: true },
  ];

  // Support items - all hidden for team members
  const supportItems: MenuItem[] = [
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
      ...organizerItems,
      ...financialItems,
      
      ...basicResourcesItems,
      ...advancedResourcesItems,
      ...supportItems,
    ];
    return items.filter(item => canShowItem(item));
  }, [mainItems, organizerItems, financialItems, basicResourcesItems, advancedResourcesItems, supportItems, canShowItem]);

  
  // Filter items based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allMenuItems.filter(item => 
      item.title.toLowerCase().includes(query)
    );
  }, [searchQuery, allMenuItems]);

  const handleSearchSelect = (item: MenuItem) => {
    if (item.openInNewTab) window.open(`${item.path}${item.tab ? `?tab=${item.tab}` : ''}`, '_blank');
    else handleNavigation(item.path, item.tab);
    setSearchQuery("");
  };

  return (
    <Sidebar 
      className={cn(
        "border-r border-border transition-all duration-300 ease-in-out",
        collapsed ? "w-14" : "w-64"
      )} 
      collapsible="icon"
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "56px",
      } as React.CSSProperties}
    >
      <div className={cn(
        "flex h-14 shrink-0 items-center overflow-hidden border-b border-sidebar-border sm:h-[72px]",
        collapsed ? "justify-center p-0" : "px-3"
      )}>
        <Link 
          to="/dashboard" 
          className={cn(
            "flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80",
            collapsed && "justify-center w-full"
          )}
        >
          <img
            src={currentLogo}
            alt={siteSettings.siteTitle || "Out App"}
            style={{ height: `${collapsed ? Math.min(logoSize, 30) : Math.min(logoSize, 44)}px` }}
            className="w-auto max-w-[160px] object-contain transition-all duration-300"
          />
          {!collapsed && <span className="truncate text-sm font-semibold">Out App</span>}
        </Link>
      </div>
      
      {/* Search input - Hidden on mobile if collapsed or just generally more compact */}
      {!collapsed && (
        <div className="relative shrink-0 border-b border-sidebar-border px-2.5 py-1.5">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 rounded-md border-sidebar-border bg-sidebar-accent/40 pl-8 pr-8 text-xs focus-visible:ring-1 focus-visible:ring-sidebar-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Search results dropdown */}
          {searchQuery && searchResults.length > 0 && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-popover border border-border rounded-xl shadow-2xl z-50 max-h-[60vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="p-1">
                {searchResults.map((item) => (
                  <button
                    key={`${item.path}-${item.tab}`}
                    onClick={() => handleSearchSelect(item)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-accent rounded-lg transition-colors text-left"
                  >
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4 shrink-0" />
                    </div>
                    <span className="truncate font-medium">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* No results message */}
          {searchQuery && searchResults.length === 0 && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-popover border border-border rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-sm text-muted-foreground text-center">Nenhum recurso encontrado</p>
            </div>
          )}
        </div>
      )}
      
      <ScrollArea className="flex-1 min-h-0 overflow-x-hidden h-full">
        <SidebarContent className={cn("gap-0.5 p-1 pb-16", collapsed && "items-center px-0")}>
          {/* Group Rendering Helper */}
          {Object.entries({
            main: { label: t('main'), items: mainItems, show: !isTeamMember },
            cadastro: { label: "Gestão Livre", items: registrationCategories, show: !isTeamMember, isCollapsible: true },
            organizer: { label: "Organizador", items: organizerItems, show: hasVisibleItems(organizerItems) },
            financial: { label: t('financial'), items: financialItems, show: hasVisibleItems(financialItems) },
            basic: { label: t('basic_resources'), items: basicResourcesItems, show: !isTeamMember && hasVisibleItems(basicResourcesItems) },
            advanced: { label: t('advanced_resources'), items: advancedResourcesItems, show: hasVisibleItems(advancedResourcesItems) },
            support: { label: "Suporte e Essenciais", items: supportItems, show: !isTeamMember }
          }).map(([key, group]) => {
            if (!group.show) return null;

            const renderItems = (items: any[]) => {
              const allItems = [...items];
              
              return (
                <SidebarMenu className={cn("gap-0.5", collapsed && "items-center")}>
                  {/* Always show "Gerenciar" as the first item in Cadastro group */}
                  {key === 'cadastro' && (
                    <SidebarMenuItem className={cn(collapsed && "w-full flex justify-center")}>
                      <SidebarMenuButton
                        onClick={() => handleNavigation("/dashboard", "cadastro-settings")}
                        className={cn(
                          "h-7 rounded-md px-2 text-xs transition-colors",
                          isActive("/dashboard", "cadastro-settings") ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          collapsed && "h-8 w-8 justify-center !p-0"
                        )}
                        tooltip={collapsed ? "Gerenciar" : undefined}
                      >
                        <Settings className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate font-medium">Gerenciar</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {items.map((item) => {
                    const isCat = key === 'cadastro' && item.id;
                    if (!isCat && !canShowItem(item)) return null;
                    
                    const title = isCat ? item.name : item.title;
                    
                    // Map icon name to component for categories
                    let IconComponent = item.icon;
                    if (isCat && typeof item.icon === 'string') {
                      const icons: Record<string, any> = {
                        Building2, Users, UserCog, Truck, Database, Handshake, 
                        Wrench, Target, DollarSign, Globe, Package, Briefcase,
                        HardHat, HeartPulse, GraduationCap, Gavel
                      };
                      IconComponent = icons[item.icon] || Database;
                    } else if (isCat && !item.icon) {
                      IconComponent = Database;
                    }

                    const path = isCat ? "/dashboard" : item.path;
                    const tab = isCat ? "cadastro" : item.tab;
                    const catId = isCat ? item.id : undefined;
                    const active = isActive(path, tab, catId);
                    const color = isCat ? item.color : undefined;

                    return (
                      <SidebarMenuItem key={isCat ? item.id : `${item.path}-${item.tab ?? "root"}`} className={cn(collapsed && "flex w-full justify-center")}>
                        <SidebarMenuButton
                          onClick={() => {
                            if (item.openInNewTab) window.open(`${path}${tab ? `?tab=${tab}` : ''}`, '_blank');
                            else handleNavigation(path, tab, catId);
                          }}
                          className={cn(
                          "h-7 min-w-0 rounded-md px-2 text-xs transition-colors",
                          active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          collapsed && "h-8 w-8 justify-center !p-0"
                          )}
                          tooltip={collapsed ? title : undefined}
                        >
                          {React.createElement(IconComponent, { 
                            className: "h-4 w-4 shrink-0", 
                            style: isCat && !active ? { color } : undefined 
                          })}
                          {!collapsed && <span className="truncate font-medium">{title}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              );
            };

            if (group.isCollapsible && !collapsed) {
              return (
                <SidebarGroup key={key} className={cn("p-1", collapsed && "px-0")}>
                  <Collapsible
                    open={isCadastroOpen}
                    onOpenChange={setIsCadastroOpen}
                    className="w-full"
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarGroupLabel className="mb-1 flex h-6 w-full cursor-pointer items-center justify-between rounded-md bg-sidebar-primary/10 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-primary transition-colors hover:bg-sidebar-primary/15">
                        <span>{group.label}</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isCadastroOpen ? "" : "-rotate-90")} />
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarGroupContent>
                        {renderItems(group.items)}
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarGroup>
              );
            }

            return (
              <SidebarGroup key={key} className={cn("p-1", collapsed && "px-0")}>
                {!collapsed && (
                  <SidebarGroupLabel className="mb-1 flex h-6 w-full items-center rounded-md bg-sidebar-primary/10 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-primary">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  {renderItems(group.items)}
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  );
}