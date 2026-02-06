import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Loader2,
  FileText,
  Eye,
  Code,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RichDescriptionEditorProps {
  userId: string;
  value: string;
  htmlValue: string;
  onChange: (text: string, html: string) => void;
}

export default function RichDescriptionEditor({
  userId,
  value,
  htmlValue,
  onChange,
}: RichDescriptionEditorProps) {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText;
      onChange(text, html);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Erro", description: "Selecione uma imagem válida", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/desc-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chatbot-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chatbot-media")
        .getPublicUrl(fileName);

      // Insert image at cursor position
      execCommand("insertImage", publicUrl);
      toast({ title: "Imagem inserida!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      const text = linkText || linkUrl;
      const html = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${text}</a>`;
      execCommand("insertHTML", html);
      setLinkUrl("");
      setLinkText("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Descrição Completa
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? <Code className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
          {showPreview ? "Editar" : "Visualizar"}
        </Button>
      </div>

      {!showPreview ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-2 border rounded-t-lg bg-muted/50">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => execCommand("bold")}
              title="Negrito"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => execCommand("italic")}
              title="Itálico"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => execCommand("underline")}
              title="Sublinhado"
            >
              <Underline className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => execCommand("formatBlock", "h2")}
              title="Título"
            >
              <Heading1 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => execCommand("formatBlock", "h3")}
              title="Subtítulo"
            >
              <Heading2 className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => execCommand("insertUnorderedList")}
              title="Lista"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => execCommand("insertOrderedList")}
              title="Lista Numerada"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => execCommand("justifyLeft")}
              title="Alinhar Esquerda"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => execCommand("justifyCenter")}
              title="Centralizar"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => execCommand("justifyRight")}
              title="Alinhar Direita"
            >
              <AlignRight className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Link Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Inserir Link"
                >
                  <Link className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Texto do link</Label>
                    <Input
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      placeholder="Clique aqui"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">URL</Label>
                    <Input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://"
                    />
                  </div>
                  <Button size="sm" onClick={insertLink} className="w-full">
                    Inserir Link
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Image Upload */}
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Inserir Imagem"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploadingImage}
              />
            </div>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[200px] p-4 border border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 prose prose-sm max-w-none"
            onInput={updateContent}
            onBlur={updateContent}
            dangerouslySetInnerHTML={{ __html: htmlValue || "" }}
          />
        </>
      ) : (
        /* Preview */
        <div className="min-h-[200px] p-4 border rounded-lg bg-muted/30">
          {htmlValue ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlValue }}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhum conteúdo para visualizar
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Use a barra de ferramentas para formatar o texto, adicionar imagens e links.
      </p>
    </div>
  );
}
