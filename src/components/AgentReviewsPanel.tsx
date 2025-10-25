import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgentReviewsPanelProps {
  agentId: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  agent_customers: {
    name: string;
    email: string;
  };
  agent_orders?: {
    order_number: string;
  } | null;
  agent_appointments?: {
    service_name: string;
  } | null;
}

export default function AgentReviewsPanel({ agentId }: AgentReviewsPanelProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();

    const channel = supabase
      .channel('agent-reviews-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_reviews',
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_reviews')
        .select(`
          *,
          agent_customers (
            name,
            email
          ),
          agent_orders (
            order_number
          ),
          agent_appointments (
            service_name
          )
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100
      : 0
  }));

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              Avaliação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex items-center gap-1 mt-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Baseado em {reviews.length} avaliações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm">{star}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações dos Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma avaliação ainda
              </div>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium">{review.agent_customers?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.agent_customers?.email}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(review.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-sm mb-3">{review.comment}</p>
                    )}

                    <div className="flex gap-2">
                      {review.agent_orders && (
                        <Badge variant="outline">
                          Pedido #{review.agent_orders.order_number}
                        </Badge>
                      )}
                      {review.agent_appointments && (
                        <Badge variant="outline">
                          Agendamento: {review.agent_appointments.service_name}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
