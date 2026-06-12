import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckoutImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectHint?: string;
}

export function CheckoutImageUpload({ label, value, onChange, aspectHint }: CheckoutImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione apenas imagens');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Você precisa estar autenticado'); return; }

      const fileExt = file.name.split('.').pop();
      const fileName = `checkout/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chatbot-media')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chatbot-media')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success('Imagem enviada!');
    } catch (error: any) {
      toast.error(`Erro ao enviar: ${error.message || 'Tente novamente'}`);
    } finally {
      setUploading(false);
    }
  };

  const inputId = `checkout-img-${label.replace(/\s/g, '-').toLowerCase()}`;

  return (
    <div className="space-y-2">
      <Label className="text-slate-700 font-semibold">{label}</Label>
      {value ? (
        <div className="relative rounded-lg border border-border overflow-hidden">
          <img src={value} alt={label} className="w-full h-36 object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() => onChange('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center hover:border-green-500/50 transition-colors cursor-pointer bg-slate-50"
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
          ) : (
            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          )}
          <p className="text-xs text-slate-500">
            {uploading ? 'Enviando...' : 'Clique para enviar imagem'}
          </p>
          {aspectHint && (
            <p className="text-[10px] text-slate-400 mt-1">{aspectHint}</p>
          )}
        </div>
      )}
    </div>
  );
}
