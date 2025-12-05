import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  siteTitle: string;
  siteLogoUrl: string;
  siteLogoLightUrl: string;
  siteLogoDarkUrl: string;
  footerText: string;
  footerMenus: any[];
  socialLinks: any[];
}

const defaultSettings: SiteSettings = {
  siteTitle: "",
  siteLogoUrl: "",
  siteLogoLightUrl: "",
  siteLogoDarkUrl: "",
  footerText: "",
  footerMenus: [],
  socialLinks: [],
};

let cachedSettings: SiteSettings | null = null;
let fetchPromise: Promise<SiteSettings> | null = null;

const fetchSettings = async (): Promise<SiteSettings> => {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [
      'site_title',
      'site_logo_url',
      'site_logo_light_url',
      'site_logo_dark_url',
      'footer_text',
      'footer_menus',
      'social_links'
    ]);

  const settings = { ...defaultSettings };
  
  if (data) {
    data.forEach(item => {
      switch (item.key) {
        case 'site_title':
          settings.siteTitle = item.value || '';
          break;
        case 'site_logo_url':
          settings.siteLogoUrl = item.value || '';
          break;
        case 'site_logo_light_url':
          settings.siteLogoLightUrl = item.value || '';
          break;
        case 'site_logo_dark_url':
          settings.siteLogoDarkUrl = item.value || '';
          break;
        case 'footer_text':
          settings.footerText = item.value || '';
          break;
        case 'footer_menus':
          try { settings.footerMenus = JSON.parse(item.value || '[]'); } catch {}
          break;
        case 'social_links':
          try { settings.socialLinks = JSON.parse(item.value || '[]'); } catch {}
          break;
      }
    });
  }
  
  return settings;
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings || defaultSettings);
  const [isLoading, setIsLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setIsLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchSettings();
    }

    fetchPromise.then(result => {
      cachedSettings = result;
      setSettings(result);
      setIsLoading(false);
    });
  }, []);

  return { settings, isLoading };
};

export const preloadSiteSettings = () => {
  if (!cachedSettings && !fetchPromise) {
    fetchPromise = fetchSettings().then(result => {
      cachedSettings = result;
      return result;
    });
  }
  return fetchPromise;
};
