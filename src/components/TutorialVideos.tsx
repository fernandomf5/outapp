import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PlayCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  category: string;
}

export const TutorialVideos = () => {
  const [videos, setVideos] = useState<TutorialVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<TutorialVideo | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      // Força o uso do anon key para buscar vídeos públicos
      const { data, error } = await supabase
        .from('tutorial_videos')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Erro ao carregar vídeos:', error);
      } else if (data) {
        setVideos(data);
      }
    };

    fetchVideos();
  }, []);

  if (videos.length === 0) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmbedUrl = (url: string) => {
    // Converte URLs do YouTube para formato embed
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    // Já é um embed URL ou outro formato
    return url;
  };

  const getThumbnailUrl = (video: TutorialVideo) => {
    // Se já tem thumbnail, usa ele
    if (video.thumbnail_url) return video.thumbnail_url;
    
    // Tenta extrair do YouTube
    const url = video.video_url;
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    
    // Retorna thumbnail do YouTube se tiver videoId
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };

  return (
    <>
      <Card className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Vídeos Tutoriais</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="cursor-pointer hover:shadow-lg transition-smooth overflow-hidden group"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="relative aspect-video bg-accent">
                {getThumbnailUrl(video) ? (
                  <img
                    src={getThumbnailUrl(video)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="w-16 h-16 text-white" />
                </div>
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-2">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {video.description}
                  </p>
                )}
                {video.category && (
                  <div className="mt-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {video.category}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedVideo && (
            <div>
              <div className="aspect-video bg-black">
                <iframe
                  src={getEmbedUrl(selectedVideo.video_url)}
                  className="w-full h-full"
                  allowFullScreen
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">{selectedVideo.title}</h2>
                {selectedVideo.description && (
                  <p className="text-muted-foreground">{selectedVideo.description}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
