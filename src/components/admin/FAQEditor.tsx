import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Plus, Edit, Trash2, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

export const FAQEditor = () => {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'faqs')
      .maybeSingle();

    if (!error && data && data.value) {
      try {
        const parsedFaqs = JSON.parse(data.value);
        setFaqs(parsedFaqs);
      } catch (e) {
        console.error('Error parsing FAQs:', e);
      }
    }
  };

  const handleSave = async () => {
    if (!editingFaq?.question || !editingFaq?.answer) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a pergunta e resposta.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    let updatedFaqs = [...faqs];
    if (editingFaq.id === "new") {
      updatedFaqs.push({
        ...editingFaq,
        id: Date.now().toString(),
        order_index: faqs.length,
      });
    } else {
      updatedFaqs = faqs.map(f => f.id === editingFaq.id ? editingFaq : f);
    }

    await saveFAQs(updatedFaqs);
    setIsDialogOpen(false);
    setEditingFaq(null);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const updatedFaqs = faqs.filter(f => f.id !== id);
    await saveFAQs(updatedFaqs);
  };

  const saveFAQs = async (updatedFaqs: FAQ[]) => {
    const { data: existing } = await supabase
      .from('site_settings')
      .select('key')
      .eq('key', 'faqs')
      .maybeSingle();

    const faqsJson = JSON.stringify(updatedFaqs);

    if (existing) {
      await supabase
        .from('site_settings')
        .update({ value: faqsJson })
        .eq('key', 'faqs');
    } else {
      await supabase
        .from('site_settings')
        .insert({ key: 'faqs', value: faqsJson, description: 'FAQs da landing page' });
    }

    setFaqs(updatedFaqs);
    toast({ title: "FAQs atualizadas com sucesso!" });
  };

  const createNew = () => {
    setEditingFaq({
      id: "new",
      question: "",
      answer: "",
      order_index: faqs.length,
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            <CardTitle>Editor de Perguntas Frequentes</CardTitle>
          </div>
          <Button onClick={createNew}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar FAQ
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-muted/50 p-4 rounded-lg border border-border"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{faq.question}</h4>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingFaq(faq);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(faq.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {faqs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma FAQ cadastrada. Clique em "Adicionar FAQ" para começar.
            </p>
          )}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFaq?.id === "new" ? "Nova FAQ" : "Editar FAQ"}
            </DialogTitle>
          </DialogHeader>

          {editingFaq && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="question">Pergunta</Label>
                <Input
                  id="question"
                  value={editingFaq.question}
                  onChange={(e) =>
                    setEditingFaq({ ...editingFaq, question: e.target.value })
                  }
                  placeholder="Como criar minha conta?"
                />
              </div>

              <div>
                <Label htmlFor="answer">Resposta</Label>
                <Textarea
                  id="answer"
                  value={editingFaq.answer}
                  onChange={(e) =>
                    setEditingFaq({ ...editingFaq, answer: e.target.value })
                  }
                  placeholder="É muito simples! Clique em..."
                  rows={6}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingFaq(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
