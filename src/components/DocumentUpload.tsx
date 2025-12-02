import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, X } from "lucide-react";

interface DocumentUploadProps {
  currentDocument?: string;
  onDocumentSelect: (url: string) => void;
  bucketName: string;
  acceptedFileTypes?: string;
}

export const DocumentUpload = ({ 
  currentDocument, 
  onDocumentSelect, 
  bucketName,
  acceptedFileTypes = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
}: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      setFileName(file.name);

      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onDocumentSelect(publicUrl);
      toast.success("Documento enviado com sucesso!");
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error("Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onDocumentSelect("");
    setFileName("");
  };

  const getFileNameFromUrl = (url: string) => {
    if (!url) return "";
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  };

  return (
    <div className="space-y-4">
      {currentDocument ? (
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">{fileName || getFileNameFromUrl(currentDocument)}</p>
                <p className="text-xs text-muted-foreground">Documento enviado</p>
              </div>
            </div>
            <Button
              onClick={handleRemove}
              variant="ghost"
              size="icon"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Envie documentos PDF, Word, Excel, PowerPoint, etc.
          </p>
          <Input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="document-upload"
            accept={acceptedFileTypes}
          />
          <label htmlFor="document-upload">
            <Button
              type="button"
              disabled={uploading}
              asChild
            >
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Enviando..." : "Selecionar Documento"}
              </span>
            </Button>
          </label>
        </div>
      )}
    </div>
  );
};
