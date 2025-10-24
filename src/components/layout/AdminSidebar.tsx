import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Users, DollarSign, TrendingUp, Settings, Video, FileText, Package, Crown, MessageSquare, LifeBuoy, Globe } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function AdminSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('section') || 'overview';
  const collapsed = state === "collapsed";
  const [unreadTicketNotifications, setUnreadTicketNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('ticket_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadTicketNotifications(count || 0);
    };

    fetchUnreadCount();

    // Realtime para notificações
    const channel = supabase
      .channel(`admin_ticket_notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isActive = (tab: string) => {
    return currentTab === tab;
  };

  const handleNavigation = (tab: string) => {
    navigate(`/admin?section=${tab}`);
  };

  const dashboardItems = [
    { title: "Visão Geral", icon: TrendingUp, tab: "overview" },
    { title: "Usuários", icon: Users, tab: "users" },
    { title: "Assinaturas", icon: DollarSign, tab: "subscriptions" },
    { title: "Receita", icon: DollarSign, tab: "revenue" },
  ];

  const contentItems = [
    { title: "Landing Page", icon: Globe, tab: "landing" },
    { title: "Recursos", icon: Package, tab: "features-landing" },
    { title: "FAQ", icon: FileText, tab: "faq" },
    { title: "Vídeos Tutoriais", icon: Video, tab: "videos" },
  ];

  const systemItems = [
    { title: "Planos", icon: Crown, tab: "plans" },
    { title: "Recursos", icon: Package, tab: "features" },
    { title: "Recursos dos Planos", icon: Settings, tab: "plan-features" },
    { title: "Mensagens", icon: MessageSquare, tab: "messages" },
    { title: "Tickets", icon: LifeBuoy, tab: "tickets" },
    { title: "Vouchers", icon: Package, tab: "vouchers" },
    { title: "Páginas Customizadas", icon: FileText, tab: "custom-pages" },
    { title: "Integrações", icon: Settings, tab: "integrations" },
    { title: "Configurações", icon: Settings, tab: "settings" },
  ];

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.tab)}
                    className={isActive(item.tab) ? "bg-primary text-primary-foreground" : ""}
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
          <SidebarGroupLabel>Conteúdo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.tab)}
                    className={isActive(item.tab) ? "bg-primary text-primary-foreground" : ""}
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
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.tab)}
                    className={isActive(item.tab) ? "bg-primary text-primary-foreground" : ""}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.tab === 'tickets' && unreadTicketNotifications > 0 && (
                        <Badge 
                          className="ml-auto h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground"
                        >
                          {unreadTicketNotifications > 9 ? '9+' : unreadTicketNotifications}
                        </Badge>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
