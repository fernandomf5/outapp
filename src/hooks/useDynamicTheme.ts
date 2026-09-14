import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_PRIMARY_COLOR = "#5ce951";
const THEME_COLOR_EVENT = "outapp:theme-color-change";

interface HslColor {
  hue: number;
  saturation: number;
  lightness: number;
  red: number;
  green: number;
  blue: number;
}

const normalizeHex = (value: string): string | null => {
  const trimmed = value.trim();
  const shortMatch = /^#([\da-f]{3})$/i.exec(trimmed);
  if (shortMatch) {
    return `#${shortMatch[1].split("").map((character) => character.repeat(2)).join("")}`.toLowerCase();
  }

  return /^#[\da-f]{6}$/i.test(trimmed) ? trimmed.toLowerCase() : null;
};

const hexToHsl = (hex: string): HslColor => {
  const normalized = normalizeHex(hex) ?? DEFAULT_PRIMARY_COLOR;
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }

  if (hue < 0) hue += 360;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return {
    hue: Math.round(hue),
    saturation: Math.round(saturation * 100),
    lightness: Math.round(lightness * 100),
    red,
    green,
    blue,
  };
};

const getContrastForeground = ({ red, green, blue }: HslColor): string => {
  const toLinear = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
  return luminance > 0.42 ? "130 40% 8%" : "0 0% 100%";
};

export const isValidThemeColor = (value: string): boolean => normalizeHex(value) !== null;

let lastAppliedColor = DEFAULT_PRIMARY_COLOR;

export const applyThemeColor = (value: string): void => {
  lastAppliedColor = value;
  const color = hexToHsl(value);
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const hsl = `${color.hue} ${color.saturation}% ${color.lightness}%`;
  const foreground = getContrastForeground(color);
  const hoverLightness = Math.max(18, color.lightness - 7);
  const glowLightness = Math.min(72, color.lightness + 10);
  const softLightness = color.lightness > 55 ? 18 : 92;

  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--primary-foreground", foreground);
  root.style.setProperty("--primary-rgb", `${color.red}, ${color.green}, ${color.blue}`);
  root.style.setProperty("--primary-hover", `${color.hue} ${color.saturation}% ${hoverLightness}%`);
  root.style.setProperty("--primary-light", `${color.hue} ${Math.max(25, color.saturation - 18)}% ${softLightness}%`);
  root.style.setProperty("--primary-glow", `${color.hue} ${color.saturation}% ${glowLightness}%`);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--sidebar-primary", hsl);
  root.style.setProperty("--sidebar-primary-foreground", foreground);
  root.style.setProperty("--sidebar-ring", hsl);
  // Menu (sidebar) surfaces follow the chosen hue in both light and dark themes
  root.style.setProperty("--sidebar-background", isDark ? `${color.hue} 24% 8%` : `${color.hue} 25% 97%`);
  root.style.setProperty("--sidebar-foreground", isDark ? `${color.hue} 25% 97%` : `${color.hue} 30% 12%`);
  root.style.setProperty("--sidebar-accent", isDark ? `${color.hue} 18% 15%` : `${color.hue} 35% 92%`);
  root.style.setProperty(
    "--sidebar-accent-foreground",
    isDark ? `${color.hue} 25% 97%` : `${color.hue} ${Math.max(30, color.saturation)}% 22%`,
  );
  root.style.setProperty("--sidebar-border", isDark ? `${color.hue} 15% 18%` : `${color.hue} 20% 87%`);
  root.style.setProperty("--gradient-primary", `linear-gradient(135deg, hsl(${color.hue} ${color.saturation}% ${hoverLightness}%) 0%, hsl(${color.hue} ${color.saturation}% ${glowLightness}%) 100%)`);
  root.style.setProperty("--gradient-hero", `linear-gradient(135deg, hsl(${color.hue} ${color.saturation}% ${glowLightness}%) 0%, hsl(${color.hue} ${color.saturation}% ${Math.max(18, color.lightness - 15)}%) 42%, hsl(${color.hue} 28% 7%) 100%)`);
  root.style.setProperty("--shadow-glow", `0 0 40px hsl(${color.hue} ${color.saturation}% ${glowLightness}% / 0.4), 0 0 20px hsl(${color.hue} ${color.saturation}% ${glowLightness}% / 0.24)`);
  root.style.setProperty("--shadow-glow-lg", `0 0 60px hsl(${color.hue} ${color.saturation}% ${glowLightness}% / 0.48), 0 0 30px hsl(${color.hue} ${color.saturation}% ${glowLightness}% / 0.3)`);
};

export const notifyThemeColorChange = (color: string): void => {
  window.dispatchEvent(new CustomEvent<string>(THEME_COLOR_EVENT, { detail: color }));
};

export const useDynamicTheme = (): void => {
  useEffect(() => {
    const loadColor = async (): Promise<void> => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "site_primary_color")
        .maybeSingle();

      applyThemeColor(data?.value || DEFAULT_PRIMARY_COLOR);
    };

    const handleLocalChange = (event: Event): void => {
      const customEvent = event as CustomEvent<string>;
      applyThemeColor(customEvent.detail);
    };

    void loadColor();
    window.addEventListener(THEME_COLOR_EVENT, handleLocalChange);

    // Re-apply when the user toggles light/dark so menu surfaces stay tinted
    const observer = new MutationObserver(() => applyThemeColor(lastAppliedColor));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const channel = supabase
      .channel("global_theme_color")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "key=eq.site_primary_color" },
        () => void loadColor(),
      )
      .subscribe();

    return () => {
      observer.disconnect();
      window.removeEventListener(THEME_COLOR_EVENT, handleLocalChange);
      void supabase.removeChannel(channel);
    };
  }, []);
};