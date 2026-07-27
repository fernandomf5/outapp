import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X, LayoutGrid, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  groups: string[];
  images?: Record<string, string>;
  onChange: (groups: string[]) => void;
  onChangeImages?: (images: Record<string, string>) => void;
}

/** Editor de subcategorias (ex: Blusas, Calças) com imagem opcional para cada uma. */
export function ItemGroupsEditor({ groups, images = {}, onChange, onChangeImages }: Props) {
  const [value, setValue] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  const add = () => {
    const v = value.trim();
    if (!v) return;
    if (groups.some((g) => g.toLowerCase() === v.toLowerCase())) {
      setValue("");
      return;
    }
    onChange([...groups, v]);
    setValue("");
  };

  const remove = (g: string) => {
    onChange(groups.filter((x) => x !== g));
    if (onChangeImages && images[g]) {
      const next = { ...images };
      delete next[g];
      onChangeImages(next);
    }
  };

  const uploadImage = async (group: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione apenas imagens");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB");
      return;
    }
    try {
      setUploading(group);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar autenticado");
        return;
      }
      const ext = file.name.split(".").pop();
      const path = `${user.id}/subcategorias/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("chatbot-media").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("chatbot-media").getPublicUrl(path);
      onChangeImages?.({ ...images, [group]: data.publicUrl });
      toast.success("Imagem adicionada");
    } catch (e: any) {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm">
        <LayoutGrid className="h-4 w-4" />
        Subcategorias (opcional)
      </Label>
      <p className="text-xs text-muted-foreground">
        Divida seus itens em grupos, ex: Blusas, Calças, Shorts. Eles aparecem separados no catálogo — e você
        pode adicionar uma imagem para cada um.
      </p>
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder="Ex: Blusas"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {groups.length > 0 && (
        <div className="space-y-2 pt-1">
          {groups.map((g) => (
            <div key={g} className="flex items-center gap-3 rounded-lg border p-2">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                {images[g] ? (
                  <img src={images[g]} alt={`Imagem da subcategoria ${g}`} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <span className="flex-1 truncate text-sm font-medium">{g}</span>
              {onChangeImages && (
                <>
                  <input
                    id={`group-img-${g}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(g, f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading === g}
                    onClick={() => document.getElementById(`group-img-${g}`)?.click()}
                  >
                    {uploading === g ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                    <span className="ml-1 hidden sm:inline">{images[g] ? "Trocar" : "Imagem"}</span>
                  </Button>
                  {images[g] && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const next = { ...images };
                        delete next[g];
                        onChangeImages(next);
                      }}
                    >
                      Remover
                    </Button>
                  )}
                </>
              )}
              <Button type="button" variant="ghost" size="icon" aria-label={`Remover ${g}`} onClick={() => remove(g)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
