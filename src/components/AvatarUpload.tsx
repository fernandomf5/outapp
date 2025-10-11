import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AvatarUploadProps {
  avatarUrl: string | null;
  name: string;
  onUploadComplete: (url: string) => void;
}

export const AvatarUpload = ({ avatarUrl, name, onUploadComplete }: AvatarUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) {
      return;
    }

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Math.random()}.${fileExt}`;

    setUploading(true);

    try {
      // Create bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarBucket = buckets?.find(b => b.name === 'avatars');
      
      if (!avatarBucket) {
        await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 2097152 // 2MB
        });
      }

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onUploadComplete(publicUrl);

      toast({
        title: "Foto atualizada! ✅",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <Avatar className="w-24 h-24">
        <AvatarImage src={avatarUrl || undefined} alt={name} />
        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
          {getInitials(name || 'U')}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Foto de perfil ou logo do negócio
        </p>
        <label htmlFor="avatar-upload">
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Alterar Foto
              </>
            )}
          </Button>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
        <p className="text-xs text-muted-foreground mt-2">
          PNG, JPG até 2MB
        </p>
      </div>
    </div>
  );
};
