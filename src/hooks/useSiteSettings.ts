import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_LOGO_SIZE = 40;
export const MIN_LOGO_SIZE = 20;
export const MAX_LOGO_SIZE = 120;

export const parseLogoSize = (value: string | null | undefined): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) return DEFAULT_LOGO_SIZE;
  return Math.min(MAX_LOGO_SIZE, Math.max(MIN_LOGO_SIZE, parsed));
};

export interface SiteSettings {
  siteTitle: string;
  siteLogoUrl: string;
  siteLogoLightUrl: string;
  siteLogoDarkUrl: string;
  siteLogoSize: number;
  footerText: string;
  footerMenus: any[];
  socialLinks: any[];
}

const defaultSettings: SiteSettings = {
  siteTitle: "",
  siteLogoUrl: "",
  siteLogoLightUrl: "",
  siteLogoDarkUrl: "",
  siteLogoSize: DEFAULT_LOGO_SIZE,
  footerText: "",
  footerMenus: [],
  socialLinks: [],
};

let cachedSettings: SiteSettings | null = null;
let fetchPromise: Promise<SiteSettings> | null = null;

export const SITE_SETTINGS_UPDATED_EVENT = "site-settings-updated";

export const notifySiteSettingsChange = (): void => {
  cachedSettings = null;
  fetchPromise = null;
  window.dispatchEvent(new Event(SITE_SETTINGS_UPDATED_EVENT));
};

const fetchSettings = async (): Promise<SiteSettings> => {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [
      'site_title',
      'site_logo_url',
      'site_logo_light_url',
      'site_logo_dark_url',
      'site_logo_size',
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
        case 'site_logo_size':
          settings.siteLogoSize = parseLogoSize(item.value);
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
    let isMounted = true;

    const loadSettings = async (forceRefresh = false) => {
      if (forceRefresh) {
        cachedSettings = null;
        fetchPromise = null;
      }

      if (!fetchPromise) {
        fetchPromise = fetchSettings();
      }

      const result = await fetchPromise;
      cachedSettings = result;

      if (isMounted) {
        setSettings(result);
        setIsLoading(false);
      }
    };

    if (cachedSettings) {
      setSettings(cachedSettings);
      setIsLoading(false);
    } else {
      void loadSettings();
    }

    const handleSettingsUpdate = () => {
      void loadSettings(true);
    };

    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    };
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
