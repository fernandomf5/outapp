import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFavicon = () => {
  const [faviconUrl, setFaviconUrl] = useState<string>('');

  useEffect(() => {
    const fetchFavicon = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'site_favicon_url')
        .single();

      if (data?.value) {
        setFaviconUrl(data.value);
      }
    };

    fetchFavicon();

    // Realtime subscription para atualizar o favicon
    const channel = supabase
      .channel('favicon_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.site_favicon_url'
        },
        () => {
          fetchFavicon();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [faviconUrl]);

  return faviconUrl;
};
