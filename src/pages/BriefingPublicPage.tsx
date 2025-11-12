import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Upload, X, Star } from "lucide-react";

export default function BriefingPublicPage() {
  const { briefingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [briefing, setBriefing] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [visitorName, setVisitorName] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  const handleFileUpload = async (fieldId: string, file: File) => {
    try {
      setUploadingFiles(prev => ({ ...prev, [fieldId]: true }));
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${briefingId}/${fieldId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('briefing-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('briefing-files')
        .getPublicUrl(fileName);

      setResponses(prev => ({ 
        ...prev, 
        [fieldId]: publicUrl
      }));
      
      toast.success("Arquivo enviado com sucesso!");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erro ao fazer upload do arquivo");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  const handleRemoveFile = (fieldId: string) => {
    setResponses(prev => {
      const newResponses = { ...prev };
      delete newResponses[fieldId];
      return newResponses;
    });
  };

  const handleNameSubmit = () => {
    if (!visitorName.trim()) {
      toast.error("Por favor, informe seu primeiro nome");
      return;
    }
    setShowNameDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('briefing_responses')
        .insert([{
          briefing_id: briefingId,
          visitor_name: visitorName,
          responses: responses
        }]);

      if (error) throw error;

      // Incrementar contador de respostas
      if (briefingId) {
        await supabase
          .from('briefings')
          .update({ responses_count: (briefing?.responses_count || 0) + 1 })
          .eq('id', briefingId);
      }
      
      setSubmitted(true);
    } catch (error) {
      toast.error("Erro ao enviar briefing");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const value = responses[field.label] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      case 'phone':
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
            required={field.required}
          />
        );
      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
            required={field.required}
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
            placeholder={field.placeholder || "https://"}
            required={field.required}
          />
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true}
              onCheckedChange={(checked) => setResponses({ ...responses, [field.label]: checked })}
              required={field.required}
            />
            <span className="text-sm">{field.label}</span>
          </div>
        );
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => setResponses({ ...responses, [field.label]: val })}
            required={field.required}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string, idx: number) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <RadioGroup
            value={value}
            onValueChange={(val) => setResponses({ ...responses, [field.label]: val })}
            required={field.required}
          >
            {field.options?.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${idx}`} />
                <Label htmlFor={`${field.id}-${idx}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'rating':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setResponses({ ...responses, [field.id]: rating })}
                className="focus:outline-none transition-colors"
              >
                <Star
                  className={`h-8 w-8 ${
                    value >= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
            {value && (
              <span className="ml-2 text-sm text-muted-foreground self-center">
                {value} de 5 estrelas
              </span>
            )}
          </div>
        );
      case 'file':
        return (
          <div className="space-y-2">
            {value ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm flex-1 truncate">Arquivo enviado</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFile(field.label)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(field.label, file);
                    }
                  }}
                  disabled={uploadingFiles[field.label]}
                  required={field.required}
                  className="cursor-pointer"
                />
                {uploadingFiles[field.label] && (
                  <span className="text-sm text-muted-foreground">Enviando...</span>
                )}
              </div>
            )}
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md mx-auto glass text-center">
          <CardHeader>
            {briefing?.logo_url && (
              <div className="flex justify-center mb-4">
                <img 
                  src={briefing.logo_url} 
                  alt="Logo" 
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6 py-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-500/10 p-4">
                <svg
                  className="h-16 w-16 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Briefing Enviado com Sucesso!</h3>
              <p className="text-muted-foreground">
                Obrigado por responder o formulário, {visitorName}!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bem-vindo!</DialogTitle>
            <DialogDescription>
              Por favor, informe seu primeiro nome antes de iniciar o briefing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="visitor-name">Primeiro Nome *</Label>
              <Input
                id="visitor-name"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Digite seu primeiro nome"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNameSubmit();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleNameSubmit}
              className="w-full gradient-primary"
            >
              Iniciar Briefing
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
        <Card className="max-w-3xl mx-auto glass">
          <CardHeader>
            {briefing.logo_url && (
              <div className="flex justify-center mb-4">
                <img 
                  src={briefing.logo_url} 
                  alt="Logo" 
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
            <CardTitle className="text-2xl">{briefing.title}</CardTitle>
            {briefing.description && (
              <CardDescription>{briefing.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={submitting || showNameDialog}
              >
                {submitting ? 'Enviando...' : 'Enviar Briefing'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
