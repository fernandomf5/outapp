export type VideoKind = 'youtube' | 'vimeo' | 'file';

export const getYouTubeId = (url: string): string | null => {
  const u = (url || '').trim();
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*\bv=)([A-Za-z0-9_-]{6,})/i,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/live\/([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/v\/([A-Za-z0-9_-]{6,})/i,
  ];
  for (const p of patterns) {
    const m = u.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
};

export const getVimeoId = (url: string): string | null => {
  const m = (url || '').match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return m?.[1] || null;
};

export const getVideoKind = (url: string): VideoKind => {
  if (getYouTubeId(url)) return 'youtube';
  if (getVimeoId(url)) return 'vimeo';
  return 'file';
};

/** Returns a safe, embeddable iframe URL (or null for direct video files). */
export const getVideoEmbedUrl = (url: string, opts?: { autoplay?: boolean }): string | null => {
  const yt = getYouTubeId(url);
  if (yt) {
    const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
    if (opts?.autoplay) params.set('autoplay', '1');
    // start time support (?t=90 / &start=90)
    const t = (url.match(/[?&](?:t|start)=(\d+)/) || [])[1];
    if (t) params.set('start', t);
    return `https://www.youtube-nocookie.com/embed/${yt}?${params.toString()}`;
  }
  const vm = getVimeoId(url);
  if (vm) {
    return `https://player.vimeo.com/video/${vm}${opts?.autoplay ? '?autoplay=1' : ''}`;
  }
  return null;
};
