import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdPlatform = 'meta' | 'google' | 'tiktok' | string;

interface PlatformLogoProps {
  platform: AdPlatform;
  size?: number;
  className?: string;
}

// Logos oficiais em SVG (versões simplificadas fieis às marcas)
export const PlatformLogo = ({ platform, size = 18, className }: PlatformLogoProps) => {
  const style = { width: size, height: size };

  switch (platform) {
    case 'meta':
      return (
        <svg viewBox="0 0 24 24" style={style} className={className} role="img" aria-label="Meta Ads">
          <defs>
            <linearGradient id="meta-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0064E0" />
              <stop offset="100%" stopColor="#00A2FF" />
            </linearGradient>
          </defs>
          <path
            fill="url(#meta-grad)"
            d="M6.6 7.2c-2.6 0-4.6 2.1-4.6 4.8s2 4.8 4.6 4.8c1.9 0 3.4-1.4 5.4-4.8 2 3.4 3.5 4.8 5.4 4.8 2.6 0 4.6-2.1 4.6-4.8s-2-4.8-4.6-4.8c-1.9 0-3.4 1.4-5.4 4.8-2-3.4-3.5-4.8-5.4-4.8zm0 2.2c1 0 1.9 1 3.2 3.3-1.3 2.3-2.2 3.3-3.2 3.3-1.3 0-2.4-1.5-2.4-3.3s1.1-3.3 2.4-3.3zm10.8 0c1.3 0 2.4 1.5 2.4 3.3s-1.1 3.3-2.4 3.3c-1 0-1.9-1-3.2-3.3 1.3-2.3 2.2-3.3 3.2-3.3z"
          />
        </svg>
      );
    case 'google':
      return (
        <svg viewBox="0 0 24 24" style={style} className={className} role="img" aria-label="Google Ads">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
          />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" style={style} className={className} role="img" aria-label="TikTok Ads">
          {/* nota principal: currentColor adapta ao tema (claro/escuro) */}
          <path
            fill="#25F4EE"
            transform="translate(-0.7,-0.7)"
            d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
          />
          <path
            fill="#FE2C55"
            transform="translate(0.7,0.7)"
            d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
          />
          <path
            fill="currentColor"
            d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
          />
        </svg>
      );
    default:
      return <Megaphone style={style} className={cn("text-muted-foreground", className)} />;
  }
};

const PLATFORM_LABELS: Record<string, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  tiktok: 'TikTok Ads',
};

export const getPlatformLabel = (platform: AdPlatform): string =>
  PLATFORM_LABELS[platform] || platform;

interface PlatformBadgeProps {
  platform: AdPlatform;
  className?: string;
}

// Selo com logo oficial + nome da plataforma
export const PlatformBadge = ({ platform, className }: PlatformBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium",
      className
    )}
  >
    <PlatformLogo platform={platform} size={14} />
    {getPlatformLabel(platform)}
  </span>
);
