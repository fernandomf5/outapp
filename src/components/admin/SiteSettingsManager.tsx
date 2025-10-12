import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Video } from "lucide-react";

export const SiteSettingsManager = () => {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'landing_video_url')
      .single();

    if (!error && data) {
      setVideoUrl(data.value || "");
    }
  };

  const handleSaveVideo = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('site_settings')
      .update({ value: videoUrl })
      .eq('key', 'landing_video_url');

    if (!error) {
      toast({ title: "Configurações salvas com sucesso!" });
    } else {
      toast({ 
        title: "Erro ao salvar", 
        description: error.message,
        variant: "destructive" 
      });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <CardTitle>Configurações do Site</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            <Label htmlFor="video-url">URL do Vídeo da Landing Page</Label>
          </div>
          <Input
            id="video-url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/embed/..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Cole a URL de embed do YouTube, Vimeo ou outro serviço.
            <br />
            Exemplo YouTube: https://www.youtube.com/embed/VIDEO_ID
            <br />
            Deixe em branco para não exibir o vídeo na landing page.
          </p>
          <Button onClick={handleSaveVideo} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Vídeo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};