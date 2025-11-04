import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText } from "lucide-react";

export default function BriefingPublicPage() {
  const { briefingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [briefing, setBriefing] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [visitorInfo, setVisitorInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    loadBriefing();
  }, [briefingId]);

  const loadBriefing = async () => {
    try {
      const { data, error } = await supabase
        .from('briefings')
        .select('*')
        .eq('id', briefingId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setBriefing(data);
    } catch (error) {
      toast.error("Briefing não encontrado");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('briefing_responses')
        .insert([{
          briefing_id: briefingId,
          responses: responses,
          visitor_name: visitorInfo.name,
          visitor_email: visitorInfo.email,
          visitor_phone: visitorInfo.phone
        }]);

      if (error) throw error;

      toast.success("Briefing enviado com sucesso!");
      setResponses({});
      setVisitorInfo({ name: '', email: '', phone: '' });
    } catch (error) {
      toast.error("Erro ao enviar briefing");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const value = responses[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
            required={field.required}
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
            required={field.required}
            rows={4}
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
            required={field.required}
          />
        );
      case 'phone':
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
            required={field.required}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.id]: e.target.value })}
            required={field.required}
          />
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true}
              onCheckedChange={(checked) => setResponses({ ...responses, [field.id]: checked })}
              required={field.required}
            />
            <span className="text-sm">{field.label}</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Briefing não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <Card className="max-w-3xl mx-auto glass">
        <CardHeader>
          <CardTitle className="text-2xl">{briefing.title}</CardTitle>
          {briefing.description && (
            <CardDescription>{briefing.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações do visitante */}
            <div className="space-y-4 pb-6 border-b">
              <h3 className="font-semibold">Suas Informações</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Nome *</Label>
                  <Input
                    value={visitorInfo.name}
                    onChange={(e) => setVisitorInfo({ ...visitorInfo, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={visitorInfo.email}
                    onChange={(e) => setVisitorInfo({ ...visitorInfo, email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input
                    type="tel"
                    value={visitorInfo.phone}
                    onChange={(e) => setVisitorInfo({ ...visitorInfo, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Campos do briefing */}
            <div className="space-y-4">
              {briefing.fields.map((field: any) => (
                <div key={field.id} className="grid gap-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-primary shadow-glow"
              disabled={submitting}
            >
              {submitting ? 'Enviando...' : 'Enviar Briefing'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
