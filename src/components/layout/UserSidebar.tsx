import { useLocation, useNavigate } from "react-router-dom";
import { Bot, Sparkles, MessageSquare, Wrench, Link2, Copy, LifeBuoy, Gift, CreditCard, TrendingUp, Users, ChevronDown, ExternalLink, QrCode, Calendar, BarChart3, ShoppingBag, DollarSign, Clock, Zap, Star, Bell, FileText, Database, Target, Globe, HelpCircle, Package, Lightbulb, UserCog, Megaphone } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

interface MenuItem {
  title: string;
  icon: any;
  path: string;
  tab?: string;
  feature?: string;
  badge?: number;
  inDevelopment?: boolean;
}

export function UserSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasFeature } = useUserFeatures();
  const { t } = useLanguage();
  const { user } = useAuth();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';
  const collapsed = state === "collapsed";
  const [unreadClientMessages, setUnreadClientMessages] = useState(0);

  // Monitorar mensagens de clientes em tempo real
  useEffect(() => {
    if (!user) return;

    const fetchChatbotIds = async () => {
      const { data: chatbots } = await supabase
        .from('chatbots')
        .select('id')
        .eq('user_id', user.id);

      if (!chatbots || chatbots.length === 0) return [];
      return chatbots.map(c => c.id);
    };

    fetchChatbotIds().then(chatbotIds => {
      if (chatbotIds.length === 0) return;

      const clientMessagesChannel = supabase
        .channel('client-messages-sidebar')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chatbot_messages',
        }, async (payload) => {
          const newMessage = payload.new as any;
          const isUserMessage = newMessage.role === 'user';
          const isFreeMessage = !newMessage.node_id || newMessage.node_id === null || newMessage.node_id === '';
          
          if (!isUserMessage || !isFreeMessage) return;

          const { data: conversation } = await supabase
            .from('chatbot_conversations')
            .select('chatbot_id')
            .eq('id', newMessage.conversation_id)
            .single();

          if (conversation && chatbotIds.includes(conversation.chatbot_id)) {
            if (currentTab !== 'clients') {
              setUnreadClientMessages(prev => prev + 1);
            }
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(clientMessagesChannel);
      };
    });
  }, [user, currentTab]);

  // Resetar contador quando entrar na aba clientes
  useEffect(() => {
    if (currentTab === 'clients') {
      setUnreadClientMessages(0);
    }
  }, [currentTab]);

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
  ];

  const managementItems: MenuItem[] = [
    { title: "Gestão Financeira", icon: DollarSign, path: "/dashboard", tab: "financeiro", inDevelopment: true },
    { title: "Gestão de Equipe", icon: UserCog, path: "/dashboard", tab: "equipe", inDevelopment: true },
    { title: "Gestão de Anúncios", icon: Megaphone, path: "/dashboard", tab: "anuncios", inDevelopment: true },
  ];

  const crmItems: MenuItem[] = [
    { title: "CRM Geral", icon: Database, path: "/dashboard", tab: "crm-geral" },
  ];

  const chatbotItems: MenuItem[] = [
    { title: t('create_chatbot'), icon: Bot, path: "/bot-builder" },
    { title: t('my_chatbots'), icon: Bot, path: "/dashboard", tab: "chatbots" },
  ];

  const aiAgentItems: MenuItem[] = [
    { title: t('create_ai_agent'), icon: Sparkles, path: "/ai-agent" },
    { title: t('my_ai_agents'), icon: Sparkles, path: "/dashboard", tab: "ai-agents" },
  ];


  const toolsItems: MenuItem[] = [
    { title: t('tools_manager'), icon: Wrench, path: "/dashboard", tab: "tools" },
    { title: "Gerador QR Code", icon: QrCode, path: "/dashboard", tab: "qrcode" },
    { title: "Link na Bio", icon: ExternalLink, path: "/dashboard", tab: "linkbio" },
    { title: t('link_shortener_title'), icon: Link2, path: "/dashboard", tab: "shortlinks", feature: "link_shortener" },
    { title: t('page_cloner_title'), icon: Copy, path: "/dashboard", tab: "cloner", feature: "page_cloner" },
    { title: "Espionar Anúncios", icon: Target, path: "/dashboard", tab: "espionar", inDevelopment: true },
    { title: "Criador de Sites", icon: Globe, path: "/dashboard", tab: "criador-sites", inDevelopment: true },
    { title: "Criador de Quizz", icon: HelpCircle, path: "/dashboard", tab: "criador-quizz", inDevelopment: true },
    { title: "Criador de Produto Digital", icon: Package, path: "/dashboard", tab: "produto-digital", inDevelopment: true },
    { title: "Gerador de Prompt", icon: Lightbulb, path: "/dashboard", tab: "gerador-prompt", inDevelopment: true },
  ];

  const supportItems: MenuItem[] = [
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
                    {!collapsed && (
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span>{item.title}</span>
                        {item.inDevelopment && (
                          <span className="text-[9px] text-red-500">em desenvolvimento</span>
                        )}
                      </div>
                    )}
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
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.path, item.tab)}
                    className={isActive(item.path, item.tab) ? "bg-primary text-primary-foreground" : ""}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && (
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span>{item.title}</span>
                        {item.inDevelopment && (
                          <span className="text-[9px] text-red-500">em desenvolvimento</span>
                        )}
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>CRM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {crmItems.map((item) => (
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
                      {!collapsed && (
                        <div className="flex flex-col gap-0.5 flex-1">
                          <span>{item.title}</span>
                          {item.inDevelopment && (
                            <span className="text-[9px] text-red-500">em desenvolvimento</span>
                          )}
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('support')}</SidebarGroupLabel>
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
