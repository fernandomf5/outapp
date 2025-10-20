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

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('section') || 'overview';
  const collapsed = state === "collapsed";

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
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
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
