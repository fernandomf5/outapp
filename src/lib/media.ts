export const isVideoUrl = (url: string): boolean => {
  const raw = (url || "").toLowerCase();
  const clean = raw.split("?")[0].split("#")[0];

  // Common video file extensions
  if (/(\.mp4|\.webm|\.mov|\.m4v|\.ogg|\.avi)$/.test(clean)) return true;

  // Facebook/Meta video CDN patterns
  if (raw.includes('video.') || raw.includes('video-')) return true;
  
  // Facebook containers:
  // - t42.* costuma ser container de vídeo
  // - t39.* costuma ser container de imagem
  if (/\/v\/t42\./.test(raw)) return true;
  if (/\/v\/t39\./.test(raw)) return false;

  // Fallbacks for URLs that include mime/type hints
  if (raw.includes("video/") || raw.includes("type=video") || raw.includes("mime=video")) return true;

  // Video streaming patterns
  if (raw.includes("playable") || raw.includes("stream") || raw.includes("bytestart")) return true;

  return false;
};
