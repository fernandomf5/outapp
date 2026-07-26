import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export const CaptureImageInput = ({ value, onChange, label = "Imagem" }: Props) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop();
      const path = `capture/${auth.user?.id || "anon"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("blog-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Imagem enviada");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`URL da ${label.toLowerCase()} ou envie um arquivo`}
          className="h-9 text-sm"
        />
        <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 shrink-0" onClick={() => onChange("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {value && <img src={value} alt={label} className="h-20 w-full rounded-md object-cover border" />}
    </div>
  );
};

export default CaptureImageInput;
