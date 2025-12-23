export const isVideoUrl = (url: string): boolean => {
  const raw = (url || "").toLowerCase();
  const clean = raw.split("?")[0].split("#")[0];

  // Common video file extensions
  if (/(\.mp4|\.webm|\.mov|\.m4v|\.ogg)$/.test(clean)) return true;

  // Fallbacks for URLs that include mime/type hints
  if (raw.includes("video/") || raw.includes("type=video") || raw.includes("mime=video")) return true;

  // Backward compatibility with older logic
  if (raw.includes("video")) return true;

  return false;
};
