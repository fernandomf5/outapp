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
import { FileText, Upload, X, Star, MessageCircle } from "lucide-react";

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
      
      // Check if briefing is blocked
      if (data?.is_blocked) {
        setBriefing({ ...data, isBlocked: true });
      } else {
        setBriefing(data);
      }
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

      // Enviar email se destination_email estiver configurado
      if (briefing?.destination_email) {
        try {
          await supabase.functions.invoke('send-briefing-response', {
            body: {
              briefingTitle: briefing.title,
              visitorName: visitorName,
              destinationEmail: briefing.destination_email,
              responses: responses,
              fields: briefing.fields
            }
          });
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
          // Não bloquear o fluxo se o email falhar
        }
      }
      
      setSubmitted(true);
    } catch (error) {
      toast.error("Erro ao enviar briefing");
    } finally {
      setSubmitting(false);
    }
  };

  const generateWhatsAppMessage = () => {
    if (!briefing?.destination_whatsapp) return '';
    
    let message = `*Nova resposta de briefing: ${briefing.title}*\n\n`;
    message += `*Enviado por:* ${visitorName}\n\n`;
    message += `*Respostas:*\n`;
    
    for (const field of briefing.fields || []) {
      const value = responses[field.label];
      if (value !== undefined && value !== null && value !== '') {
        let displayValue = value;
        if (field.type === 'checkbox') {
          displayValue = value === true ? 'Sim' : 'Não';
        } else if (field.type === 'rating') {
          displayValue = `${value} de 5 estrelas`;
        } else if (field.type === 'file' && typeof value === 'string' && value.startsWith('http')) {
          displayValue = value;
        }
        message += `\n• *${field.label}:* ${displayValue}`;
      }
    }
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = () => {
    if (!briefing?.destination_whatsapp) return;
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${briefing.destination_whatsapp}?text=${message}`;
    window.open(whatsappUrl, '_blank');
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

  if (briefing.is_blocked) {
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
              <div className="rounded-full bg-destructive/10 p-4">
                <svg
                  className="h-16 w-16 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Briefing Bloqueado</h3>
              <p className="text-muted-foreground">
                Este briefing não está aceitando novas respostas no momento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    // Apply custom colors
    const primaryColor = (briefing as any).primary_color || '#8B5CF6';
    const secondaryColor = (briefing as any).secondary_color || '#EC4899';
    
    return (
      <div 
        className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 flex items-center justify-center"
        style={{
          '--custom-primary': primaryColor,
          '--custom-secondary': secondaryColor,
        } as React.CSSProperties}
      >
        <style>
          {`
            [style*="--custom-primary"] .gradient-primary {
              background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) !important;
            }
            [style*="--custom-primary"] .bg-primary {
              background-color: ${primaryColor} !important;
            }
            [style*="--custom-primary"] .text-primary {
              color: ${primaryColor} !important;
            }
            [style*="--custom-primary"] .bg-primary\\/10 {
              background-color: ${primaryColor}1a !important;
            }
          `}
        </style>
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
              <div className="rounded-full p-4 bg-primary/10">
                <svg
                  className="h-16 w-16 text-primary"
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
            
            {/* Botão WhatsApp */}
            {briefing?.destination_whatsapp && (
              <div className="pt-4">
                <Button 
                  onClick={handleWhatsAppClick}
                  className="bg-green-500 hover:bg-green-600 text-white w-full"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Enviar também pelo WhatsApp
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Clique para enviar as respostas diretamente no WhatsApp
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Apply custom colors
  const primaryColor = (briefing as any).primary_color || '#8B5CF6';
  const secondaryColor = (briefing as any).secondary_color || '#EC4899';
  const backgroundColor = (briefing as any).background_color || '#1a1a2e';
  const sectionBackgroundColor = (briefing as any).section_background_color || '#ffffff';
  const textColor = (briefing as any).text_color || '#1a1a2e';
  const fieldBackgroundColor = (briefing as any).field_background_color || '#ffffff';

  return (
    <>
      <style>
        {`
          [style*="--custom-primary"] .gradient-primary {
            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) !important;
          }
          [style*="--custom-primary"] .bg-primary {
            background-color: ${primaryColor} !important;
          }
          [style*="--custom-primary"] .text-primary {
            color: ${primaryColor} !important;
          }
          [style*="--custom-primary"] .border-primary {
            border-color: ${primaryColor} !important;
          }
          [style*="--custom-primary"] input,
          [style*="--custom-primary"] textarea,
          [style*="--custom-primary"] select,
          [style*="--custom-primary"] [role="combobox"],
          [style*="--custom-primary"] [data-radix-collection-item] {
            background-color: ${fieldBackgroundColor} !important;
            color: ${textColor} !important;
          }
        `}
      </style>
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
              className="w-full gradient-primary text-white shadow-lg"
            >
              Iniciar Briefing
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div 
        className="min-h-screen py-12 px-4"
        style={{
          '--custom-primary': primaryColor,
          '--custom-secondary': secondaryColor,
          backgroundColor: backgroundColor,
        } as React.CSSProperties}
      >
        <Card 
          className="max-w-3xl mx-auto"
          style={{
            backgroundColor: sectionBackgroundColor,
            color: textColor,
          }}
        >
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
            <CardTitle className="text-2xl" style={{ color: primaryColor }}>
              {briefing.title}
            </CardTitle>
            {briefing.description && (
              <CardDescription style={{ color: textColor, opacity: 0.8 }}>{briefing.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {briefing.fields.map((field: any) => (
                  <div key={field.id} className="grid gap-2">
                    <Label style={{ color: textColor }}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary text-white shadow-lg"
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
