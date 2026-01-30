export const isVideoUrl = (url: string): boolean => {
  const raw = (url || "").toLowerCase();
  const clean = raw.split("?")[0].split("#")[0];

  // Common video file extensions
  if (/(\.mp4|\.webm|\.mov|\.m4v|\.ogg|\.avi)$/.test(clean)) return true;

  // Facebook/Meta video CDN patterns
  if (raw.includes('video.') || raw.includes('video-')) return true;
  
  // /v/t patterns (Facebook video containers)
  if (/\/v\/t\d+/.test(raw)) return true;

  // Fallbacks for URLs that include mime/type hints
  if (raw.includes("video/") || raw.includes("type=video") || raw.includes("mime=video")) return true;

  // Video streaming patterns
  if (raw.includes("playable") || raw.includes("stream") || raw.includes("bytestart")) return true;

  return false;
};
