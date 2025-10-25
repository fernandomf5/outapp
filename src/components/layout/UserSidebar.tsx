import { useLocation, useNavigate } from "react-router-dom";
import { Bot, Sparkles, MessageSquare, Wrench, Link2, Copy, LifeBuoy, Gift, CreditCard, TrendingUp, Users, ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUserFeatures } from "@/hooks/useUserFeatures";
import { useLanguage } from "@/contexts/LanguageContext";

export function UserSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasFeature } = useUserFeatures();
  const { t } = useLanguage();
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

  const mainItems = [
    { title: t('overview'), icon: TrendingUp, path: "/dashboard", tab: "overview" },
    { title: t('create_funnel'), icon: TrendingUp, path: "/funnel-builder" },
  ];

  const chatbotItems = [
    { title: t('create_chatbot'), icon: Bot, path: "/bot-builder" },
    { title: t('my_chatbots'), icon: Bot, path: "/dashboard", tab: "chatbots" },
  ];

  const aiAgentItems = [
    { title: t('create_ai_agent'), icon: Sparkles, path: "/ai-agent" },
    { title: t('my_ai_agents'), icon: Sparkles, path: "/dashboard", tab: "ai-agents" },
  ];

  const crmItems = [
    { title: t('client_conversations'), icon: MessageSquare, path: "/dashboard", tab: "clients", feature: "chatbot_conversations" },
    { title: t('captured_leads_title'), icon: Users, path: "/dashboard", tab: "leads", feature: "chatbot_conversations" },
  ];

  const toolsItems = [
    { title: t('tools_manager'), icon: Wrench, path: "/dashboard", tab: "tools" },
    { title: t('link_shortener_title'), icon: Link2, path: "/dashboard", tab: "shortlinks", feature: "link_shortener" },
    { title: t('page_cloner_title'), icon: Copy, path: "/dashboard", tab: "cloner", feature: "page_cloner" },
  ];

  const supportItems = [
    { title: t('support_ticket'), icon: LifeBuoy, path: "/dashboard", tab: "support", feature: "ticket_system" },
    { title: t('voucher'), icon: Gift, path: "/dashboard", tab: "voucher" },
    { title: t('my_plan'), icon: CreditCard, path: "/dashboard", tab: "plan" },
  ];

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('main')}</SidebarGroupLabel>
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

              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Bot className="h-4 w-4" />
                      {!collapsed && <span>{t('chatbots')}</span>}
                      {!collapsed && <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {chatbotItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            onClick={() => handleNavigation(item.path, item.tab)}
                            className={isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}
                          >
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Sparkles className="h-4 w-4" />
                      {!collapsed && <span>{t('ai_agents')}</span>}
                      {!collapsed && <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {aiAgentItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            onClick={() => handleNavigation(item.path, item.tab)}
                            className={isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}
                          >
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('crm')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <MessageSquare className="h-4 w-4" />
                      {!collapsed && <span>{t('crm')}</span>}
                      {!collapsed && <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {crmItems.map((item) => {
                        if (item.feature && !hasFeature(item.feature)) return null;
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              onClick={() => handleNavigation(item.path, item.tab)}
                              className={isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('tools')}</SidebarGroupLabel>
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

        <SidebarGroup>
          <SidebarGroupLabel>{t('support_plan')}</SidebarGroupLabel>
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
