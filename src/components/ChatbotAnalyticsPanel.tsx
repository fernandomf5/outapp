import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, MessageSquare, Users, Clock, TrendingUp, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ChatbotAnalyticsPanel() {
  const { user } = useAuth();
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string>("all");
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    uniqueVisitors: 0,
    avgMessagesPerConversation: 0,
    conversationsToday: 0,
    conversationsThisWeek: 0,
    conversationsThisMonth: 0,
    activeConversations: 0,
  });

  useEffect(() => {
    if (!user) return;
    fetchChatbots();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user, selectedChatbotId]);

  const fetchChatbots = async () => {
    const { data } = await supabase
      .from('chatbots')
      .select('id, name')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) {
      setChatbots(data);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    // Get all user's chatbot IDs
    const { data: userChatbots } = await supabase
      .from('chatbots')
      .select('id')
      .eq('user_id', user.id);

    if (!userChatbots || userChatbots.length === 0) return;

    const chatbotIds = userChatbots.map(c => c.id);
    
    // Filter by selected chatbot or all
    const filterIds = selectedChatbotId === "all" 
      ? chatbotIds 
      : [selectedChatbotId];

    // Total conversations
    const { count: totalConversations } = await supabase
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })
      .in('chatbot_id', filterIds);

    // Active conversations
    const { count: activeConversations } = await supabase
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })
      .in('chatbot_id', filterIds)
      .eq('status', 'active');

    // Total messages
    const { data: conversations } = await supabase
      .from('chatbot_conversations')
      .select('id')
      .in('chatbot_id', filterIds);

    const conversationIds = conversations?.map(c => c.id) || [];

    let totalMessages = 0;
    if (conversationIds.length > 0) {
      const { count } = await supabase
        .from('chatbot_messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds);
      totalMessages = count || 0;
    }

    // Unique visitors (based on unique session_ids)
    const { data: uniqueVisitorsData } = await supabase
      .from('chatbot_conversations')
      .select('session_id')
      .in('chatbot_id', filterIds);

    const uniqueVisitors = new Set(uniqueVisitorsData?.map(c => c.session_id)).size;

    // Conversations today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: conversationsToday } = await supabase
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })
      .in('chatbot_id', filterIds)
      .gte('created_at', today.toISOString());

    // Conversations this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: conversationsThisWeek } = await supabase
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })
      .in('chatbot_id', filterIds)
      .gte('created_at', weekAgo.toISOString());

    // Conversations this month
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const { count: conversationsThisMonth } = await supabase
      .from('chatbot_conversations')
      .select('*', { count: 'exact', head: true })
      .in('chatbot_id', filterIds)
      .gte('created_at', monthAgo.toISOString());

    const avgMessagesPerConversation = totalConversations 
      ? (totalMessages / totalConversations).toFixed(1)
      : 0;

    setStats({
      totalConversations: totalConversations || 0,
      totalMessages,
      uniqueVisitors,
      avgMessagesPerConversation: Number(avgMessagesPerConversation),
      conversationsToday: conversationsToday || 0,
      conversationsThisWeek: conversationsThisWeek || 0,
      conversationsThisMonth: conversationsThisMonth || 0,
      activeConversations: activeConversations || 0,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics das Conversas
              </CardTitle>
              <CardDescription>
                Acompanhe as estatísticas dos seus chatbots online
              </CardDescription>
            </div>
            <Select value={selectedChatbotId} onValueChange={setSelectedChatbotId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Chatbots</SelectItem>
                {chatbots.map((chatbot) => (
                  <SelectItem key={chatbot.id} value={chatbot.id}>
                    {chatbot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Conversas</p>
                    <p className="text-3xl font-bold">{stats.totalConversations}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversas Ativas</p>
                    <p className="text-3xl font-bold">{stats.activeConversations}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Mensagens</p>
                    <p className="text-3xl font-bold">{stats.totalMessages}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
                    <p className="text-3xl font-bold">{stats.uniqueVisitors}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Média Mensagens/Conversa</p>
                    <p className="text-3xl font-bold">{stats.avgMessagesPerConversation}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hoje</p>
                    <p className="text-3xl font-bold">{stats.conversationsToday}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Esta Semana</p>
                    <p className="text-3xl font-bold">{stats.conversationsThisWeek}</p>
                  </div>
                  <Clock className="w-8 h-8 text-cyan-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Este Mês</p>
                    <p className="text-3xl font-bold">{stats.conversationsThisMonth}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
