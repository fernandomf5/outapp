import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Activity, BarChart3, BookOpenText, ChartNoAxesCombined, CircleHelp, Coins,
  ContactRound, CreditCard, FileCog, FileText, Gift, Globe2, Headset,
  LayoutDashboard, LockKeyhole, MessageCircleMore, MonitorPlay, PlugZap,
  Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Tag, Ticket, Users,
  UserRoundCog, Wallet, WandSparkles, type LucideIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AdminItem = { title: string; icon: LucideIcon; tab: string; description?: string };
type AdminGroup = { title: string; items: AdminItem[] };

export const ADMIN_NAV_GROUPS: AdminGroup[] = [
  {
    title: "Centro de comando",
    items: [
      { title: "Visão geral", icon: LayoutDashboard, tab: "overview", description: "Painel de controle" },
      { title: "Usuários", icon: Users, tab: "users", description: "Contas cadastradas" },
      { title: "Contatos", icon: ContactRound, tab: "contacts", description: "Base de contatos" },
      { title: "Assinaturas", icon: CreditCard, tab: "subscriptions", description: "Clientes e vencimentos" },
      { title: "Receitas", icon: ChartNoAxesCombined, tab: "revenue", description: "Resultados financeiros" },
    ],
  },
  {
    title: "Planos e acesso",
    items: [
      { title: "Gerenciar planos", icon: Wallet, tab: "plans" },
      { title: "Recursos do sistema", icon: SlidersHorizontal, tab: "features-manager" },
      { title: "Permissões por plano", icon: ShieldCheck, tab: "feature-access" },
      { title: "Cupons", icon: Tag, tab: "discount-coupons" },
      { title: "Vouchers", icon: Gift, tab: "vouchers" },
    ],
  },
  {
    title: "Site e conteúdo",
    items: [
      { title: "Editar site", icon: Globe2, tab: "landing" },
      { title: "Vitrine de recursos", icon: WandSparkles, tab: "features-landing" },
      { title: "Perguntas frequentes", icon: CircleHelp, tab: "faq" },
      { title: "Páginas institucionais", icon: FileText, tab: "page-creator" },
      { title: "Vídeos tutoriais", icon: MonitorPlay, tab: "videos" },
    ],
  },
  {
    title: "Comunicação",
    items: [
      { title: "Mensagens", icon: MessageCircleMore, tab: "messages" },
      { title: "Suporte e tickets", icon: Headset, tab: "tickets" },
    ],
  },
  {
    title: "Sistema e segurança",
    items: [
      { title: "Administradores", icon: UserRoundCog, tab: "admins" },
      { title: "Segurança", icon: LockKeyhole, tab: "security" },
      { title: "Integrações", icon: PlugZap, tab: "integrations" },
      { title: "Configurações do site", icon: Settings2, tab: "settings" },
    ],
  },
];

export const ADMIN_NAV_LABELS = Object.fromEntries(
  ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => [item.tab, item.title])),
);

export function AdminSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = new URLSearchParams(location.search).get("section") || "overview";
  const collapsed = state === "collapsed" && !isMobile;
  const [unreadTicketNotifications, setUnreadTicketNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from("ticket_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (mounted) setUnreadTicketNotifications(count ?? 0);
    };
    void fetchUnreadCount();
    const channel = supabase
      .channel("admin_ticket_notifications:" + user.id)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "ticket_notifications",
        filter: "user_id=eq." + user.id,
      }, () => { void fetchUnreadCount(); })
      .subscribe();
    return () => { mounted = false; void supabase.removeChannel(channel); };
  }, [user]);

  const handleNavigation = async (tab: string) => {
    if (isMobile) setOpenMobile(false);
    navigate("/admin?section=" + encodeURIComponent(tab));
    if (tab === "tickets" && user) {
      await supabase
        .from("ticket_notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setUnreadTicketNotifications(0);
    }
  };

  return (
    <TooltipProvider delayDuration={140}>
      <Sidebar collapsible="icon" className="master-sidebar-root">
        <Link to="/admin?section=overview" onClick={() => isMobile && setOpenMobile(false)}
          className={"master-sidebar-brand " + (collapsed ? "master-sidebar-brand-small" : "")}>
          <span className="master-sidebar-logo"><img src="/outapp-icon-192.png" alt="" /></span>
          {!collapsed && <span className="master-sidebar-brand-copy"><strong>Out App</strong><small><Sparkles size={11} /> MASTER CONTROL</small></span>}
        </Link>
        <div className="master-sidebar-connected" aria-label="Painel administrativo ativo">
          <span className="master-live-dot" />{!collapsed && <span>SISTEMA OPERACIONAL</span>}
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <SidebarContent className="master-sidebar-content">
            {ADMIN_NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.title} className="master-navigation-group">
                <SidebarGroupLabel className="master-group-title">{!collapsed ? group.title : "•••"}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="master-navigation-items">
                    {group.items.map((item) => {
                      const active = item.tab === currentTab;
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.tab}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                onClick={() => void handleNavigation(item.tab)}
                                isActive={active}
                                className={"master-navigation-link " + (active ? "master-navigation-active" : "")}
                                aria-current={active ? "page" : undefined}
                                aria-label={item.title}
                              >
                                <Icon className="master-navigation-icon" size={18} strokeWidth={1.8} />
                                {!collapsed && <span className="master-navigation-label">{item.title}</span>}
                                {item.tab === "tickets" && unreadTicketNotifications > 0 && (
                                  <span className="master-navigation-count">{unreadTicketNotifications > 9 ? "9+" : unreadTicketNotifications}</span>
                                )}
                                {!collapsed && active && <span className="master-navigation-indicator" aria-hidden="true" />}
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            {collapsed && <TooltipContent side="right" className="master-navigation-tooltip">{item.title}</TooltipContent>}
                          </Tooltip>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </ScrollArea>
        <div className={"master-sidebar-footer " + (collapsed ? "master-sidebar-footer-small" : "")}>
          <span className="master-sidebar-footer-icon"><ShieldCheck size={18}/></span>
          {!collapsed && <span><strong>Acesso administrativo</strong><small>Ambiente de gestão restrito</small></span>}
        </div>
      </Sidebar>
    </TooltipProvider>
  );
}
