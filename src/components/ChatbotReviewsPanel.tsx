import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const ChatbotReviewsPanel = ({ chatbotId }: { chatbotId: string }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [chatbotId]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_reviews')
        .select('*, customer:chatbot_customers(*)')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Star className="h-5 w-5" />
        Avaliações
      </h3>
      <div className="grid gap-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{review.customer?.name}</h4>
                <div className="flex">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm">{review.comment}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};