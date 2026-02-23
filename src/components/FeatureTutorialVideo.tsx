import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PlayCircle, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TutorialVideoData {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
}

interface FeatureTutorialVideoProps {
  featureKey: string;
}

const getEmbedUrl = (url: string) => {
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  return url;
};

export const FeatureTutorialVideo = ({ featureKey }: FeatureTutorialVideoProps) => {
  const [video, setVideo] = useState<TutorialVideoData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      const { data } = await supabase
        .from('tutorial_videos')
        .select('id, title, description, video_url')
        .eq('feature_key', featureKey)
        .eq('is_published', true)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) setVideo(data);
    };

    fetchVideo();
  }, [featureKey]);

  if (!video) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 mb-4 border-primary/30 text-primary hover:bg-primary/10"
      >
        <Video className="w-4 h-4" />
        📺 Como usar este recurso
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div>
            <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
              <iframe
                src={getEmbedUrl(video.video_url)}
                className="w-full h-full"
                allowFullScreen
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">{video.title}</h2>
              {video.description && (
                <p className="text-muted-foreground">{video.description}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
