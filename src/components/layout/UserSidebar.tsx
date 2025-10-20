import { useLocation, useNavigate } from "react-router-dom";
import { Bot, Sparkles, MessageSquare, Wrench, Link2, Copy, LifeBuoy, Gift, CreditCard, TrendingUp } from "lucide-react";
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
import { useUserFeatures } from "@/hooks/useUserFeatures";

export function UserSidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasFeature } = useUserFeatures();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';

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

  const mainItems = [
    { title: "Visão Geral", icon: TrendingUp, path: "/dashboard", tab: "overview" },
    { title: "Criar Chatbot", icon: Bot, path: "/bot-builder" },
    { title: "Criar Agente IA", icon: Sparkles, path: "/ai-agent" },
    { title: "Criar Funil", icon: TrendingUp, path: "/funnel-builder" },
  ];

  const toolsItems = [
    { title: "Clientes", icon: MessageSquare, path: "/dashboard", tab: "clients", feature: "chatbot_conversations" },
    { title: "Ferramentas", icon: Wrench, path: "/dashboard", tab: "tools" },
    { title: "Links Curtos", icon: Link2, path: "/dashboard", tab: "shortlinks", feature: "link_shortener" },
    { title: "Clonador", icon: Copy, path: "/dashboard", tab: "cloner", feature: "page_cloner" },
  ];

  const supportItems = [
    { title: "Suporte", icon: LifeBuoy, path: "/dashboard", tab: "support", feature: "ticket_system" },
    { title: "Voucher", icon: Gift, path: "/dashboard", tab: "voucher" },
    { title: "Meu Plano", icon: CreditCard, path: "/dashboard", tab: "plan" },
  ];

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible>
      <SidebarContent>
        <SidebarGroup open={true}>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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

        <SidebarGroup open={true}>
          <SidebarGroupLabel>Ferramentas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => {
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

        <SidebarGroup open={true}>
          <SidebarGroupLabel>Suporte & Plano</SidebarGroupLabel>
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
    </Sidebar>
  );
}
