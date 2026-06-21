import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BulkRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  onSuccess: () => void;
}

interface ParsedRow {
  name: string;
  email: string | null;
  phone: string | null;
}

function parseInput(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // skip header
    if (/^nome\s*[,;\t]/i.test(line)) continue;
    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    const name = parts[0];
    if (!name) continue;
    let email: string | null = null;
    let phone: string | null = null;
    for (let i = 1; i < parts.length; i++) {
      const v = parts[i];
      if (!v) continue;
      if (v.includes("@")) email = v;
      else if (/\d/.test(v)) phone = v;
    }
    rows.push({ name, email, phone });
  }
  return rows;
}

export function BulkRegistrationDialog({ open, onOpenChange, categoryId, onSuccess }: BulkRegistrationDialogProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const preview = parseInput(text);

  const handleFile = async (file: File) => {
    const content = await file.text();
    setText((prev) => (prev ? prev + "\n" + content : content));
  };

  const handleSubmit = async () => {
    if (!user) return;
    const rows = parseInput(text);
    if (rows.length === 0) {
      toast.error("Nenhum cadastro válido encontrado.");
      return;
    }
    setLoading(true);
    try {
      const payload = rows.map((r) => ({
        user_id: user.id,
        registration_category_id: categoryId,
        name: r.name,
        email: r.email,
        phone: r.phone,
        status: "active",
        urls: [],
      }));
      const { error } = await supabase.from("contacts").insert(payload);
      if (error) throw error;
      toast.success(`${rows.length} cadastro(s) criado(s) com sucesso!`);
      setText("");
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      toast.error("Erro ao cadastrar em massa: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastro em Massa</DialogTitle>
          <DialogDescription>
            Cole uma lista ou importe um arquivo CSV. Uma linha por cadastro, no formato:
            <br />
            <code className="text-xs">nome, email, telefone</code> (email e telefone são opcionais)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv,.txt"
              id="bulk-file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("bulk-file")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
            <span className="text-xs text-muted-foreground">
              ou cole abaixo (separe por vírgula, ponto-e-vírgula ou tab)
            </span>
          </div>

          <div>
            <Label htmlFor="bulk-text">Lista de cadastros</Label>
            <Textarea
              id="bulk-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"João Silva, joao@email.com, 11999999999\nMaria Souza, maria@email.com, 11988887777"}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {preview.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3 max-h-40 overflow-auto">
              <p className="text-xs font-medium mb-2">Pré-visualização ({preview.length} cadastro(s)):</p>
              <ul className="text-xs space-y-1">
                {preview.slice(0, 10).map((r, i) => (
                  <li key={i} className="text-muted-foreground">
                    {r.name}
                    {r.email && ` • ${r.email}`}
                    {r.phone && ` • ${r.phone}`}
                  </li>
                ))}
                {preview.length > 10 && <li className="text-muted-foreground">…e mais {preview.length - 10}</li>}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || preview.length === 0}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cadastrar {preview.length > 0 ? `(${preview.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
