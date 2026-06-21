import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Upload, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  onSuccess: () => void;
}

interface Lead {
  name: string;
  phone: string;
  email: string;
}

export function PhotoRegistrationDialog({ open, onOpenChange, categoryId, onSuccess }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  const reset = () => {
    setImagePreview(null);
    setLeads([]);
    setProcessing(false);
    setSaving(false);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 8MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setLeads([]);
      setProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke("parse-leads-from-image", {
          body: { imageDataUrl: dataUrl },
        });
        if (error) throw error;
        const found: Lead[] = (data?.leads || []).map((l: any) => ({
          name: l.name || "",
          phone: l.phone || "",
          email: l.email || "",
        }));
        if (found.length === 0) {
          toast.warning("Nenhum contato encontrado na imagem. Tente outra foto.");
        } else {
          toast.success(`${found.length} contato(s) identificado(s)!`);
        }
        setLeads(found);
      } catch (e: any) {
        toast.error("Erro ao processar imagem: " + (e.message || e));
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateLead = (i: number, field: keyof Lead, value: string) => {
    setLeads((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };

  const removeLead = (i: number) => {
    setLeads((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!user || leads.length === 0) return;
    const valid = leads.filter((l) => l.name.trim() && (l.phone.trim() || l.email.trim()));
    if (valid.length === 0) {
      toast.error("Preencha pelo menos nome + telefone ou email");
      return;
    }
    setSaving(true);
    try {
      const rows = valid.map((l) => ({
        user_id: user.id,
        registration_category_id: categoryId,
        name: l.name.trim(),
        phone: l.phone.trim() || null,
        email: l.email.trim() || null,
        source: "photo",
      }));
      const { error } = await supabase.from("contacts").insert(rows);
      if (error) throw error;
      toast.success(`${valid.length} cadastro(s) salvo(s)!`);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> Cadastrar por Foto
          </DialogTitle>
          <DialogDescription>
            Tire uma foto ou envie uma imagem com nome, telefone e/ou email. A IA identifica e preenche os dados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!imagePreview ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-32 flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-8 w-8" />
                Tirar Foto
              </Button>
              <Button
                variant="outline"
                className="h-32 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8" />
                Enviar Imagem
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-contain bg-muted" />
                {processing && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Analisando imagem...</span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={reset} disabled={processing || saving}>
                Trocar Imagem
              </Button>
            </div>
          )}

          {leads.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Contatos identificados ({leads.length})</h3>
              {leads.map((lead, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  <div className="flex justify-between items-start gap-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                      <div>
                        <Label className="text-xs">Nome</Label>
                        <Input value={lead.name} onChange={(e) => updateLead(i, "name", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Telefone</Label>
                        <Input value={lead.phone} onChange={(e) => updateLead(i, "phone", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input value={lead.email} onChange={(e) => updateLead(i, "email", e.target.value)} />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeLead(i)} className="text-destructive shrink-0 mt-5">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || processing || leads.length === 0} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar {leads.length > 0 ? `(${leads.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
