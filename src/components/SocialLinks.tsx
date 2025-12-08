import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MessageCircle, Share2, Music, Github, Send, Disc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SocialLink {
  platform: string;
  url: string;
}

interface SocialLinksProps {
  links: SocialLink[];
  variant?: "default" | "footer";
  vertical?: boolean;
  horizontal?: boolean;
}

const platformIcons: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  tiktok: Music,
  telegram: Send,
  pinterest: Disc,
  discord: MessageCircle,
  twitch: Disc,
  snapchat: MessageCircle,
  reddit: MessageCircle,
  spotify: Music,
  threads: MessageCircle,
  github: Github,
};

const platformColors: Record<string, string> = {
  facebook: "hover:text-[#1877F2]",
  instagram: "hover:text-[#E4405F]",
  twitter: "hover:text-[#1DA1F2]",
  linkedin: "hover:text-[#0A66C2]",
  youtube: "hover:text-[#FF0000]",
  email: "hover:text-primary",
  phone: "hover:text-primary",
  whatsapp: "hover:text-[#25D366]",
  tiktok: "hover:text-[#000000] dark:hover:text-[#FFFFFF]",
  telegram: "hover:text-[#0088CC]",
  pinterest: "hover:text-[#E60023]",
  discord: "hover:text-[#5865F2]",
  twitch: "hover:text-[#9146FF]",
  snapchat: "hover:text-[#FFFC00]",
  reddit: "hover:text-[#FF4500]",
  spotify: "hover:text-[#1DB954]",
  threads: "hover:text-[#000000] dark:hover:text-[#FFFFFF]",
  github: "hover:text-[#333] dark:hover:text-[#FFFFFF]",
};

export const SocialLinks = ({ links, variant = "default", vertical = false, horizontal = false }: SocialLinksProps) => {
  if (!links || links.length === 0) return null;

  const size = variant === "footer" ? 20 : 18;

  const socialButtons = links.map((link, index) => {
    const Icon = platformIcons[link.platform.toLowerCase()];
    const colorClass = platformColors[link.platform.toLowerCase()];
    
    if (!Icon) return null;

    return (
      <Button
        key={index}
        variant="ghost"
        size="icon"
        className={`transition-colors ${colorClass}`}
        asChild
      >
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.platform}
        >
          <Icon size={size} />
        </a>
      </Button>
    );
  });

  if (vertical) {
    return <div className="flex flex-col gap-2">{socialButtons}</div>;
  }

  if (horizontal) {
    return <div className="flex flex-row gap-2 flex-wrap justify-center">{socialButtons}</div>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          <span className="hidden xl:inline">Redes</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex flex-col gap-1">{socialButtons}</div>
      </PopoverContent>
    </Popover>
  );
};
