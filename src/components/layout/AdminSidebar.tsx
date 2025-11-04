import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Users, DollarSign, TrendingUp, Settings, Video, FileText, Package, Crown, MessageSquare, LifeBuoy, Globe, Shield } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function AdminSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  const handleNavigation = async (tab: string) => {
    // Se clicar em tickets, marcar todas as notificações como lidas
    if (tab === 'tickets' && user) {
      await supabase
        .from('ticket_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    }
    
    navigate(`/admin?section=${tab}`);
  };

  const dashboardItems = [
    { title: t('overview'), icon: TrendingUp, tab: "overview" },
    { title: t('users'), icon: Users, tab: "users" },
    { title: t('subscriptions'), icon: DollarSign, tab: "subscriptions" },
    { title: t('revenue'), icon: DollarSign, tab: "revenue" },
  ];

  const contentItems = [
    { title: t('landing_page'), icon: Globe, tab: "landing" },
    { title: t('features_manager'), icon: Package, tab: "features-landing" },
    { title: t('faq_manager'), icon: FileText, tab: "faq" },
    { title: "Blog", icon: FileText, tab: "blog" },
    { title: t('tutorial_videos'), icon: Video, tab: "videos" },
  ];

  const systemItems = [
    { title: t('plans_manager'), icon: Crown, tab: "plans" },
    { title: "Administradores", icon: Shield, tab: "admins" },
    { title: "Segurança", icon: Shield, tab: "security" },
    { title: t('messages'), icon: MessageSquare, tab: "messages" },
    { title: t('tickets'), icon: LifeBuoy, tab: "tickets" },
    { title: t('vouchers'), icon: Package, tab: "vouchers" },
    { title: t('custom_pages'), icon: FileText, tab: "custom-pages" },
    { title: t('integrations'), icon: Settings, tab: "integrations" },
    { title: "Config da Landing Page", icon: Settings, tab: "settings" },
  ];

  return (
    <TooltipProvider>
      <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t('dashboard')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dashboardItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item.tab)}
                          className={isActive(item.tab) ? "bg-primary text-primary-foreground" : ""}
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
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>{t('content')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {contentItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item.tab)}
                          className={isActive(item.tab) ? "bg-primary text-primary-foreground" : ""}
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
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>{t('system')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
