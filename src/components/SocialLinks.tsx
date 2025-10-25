import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialLink {
  platform: string;
  url: string;
}

interface SocialLinksProps {
  links: SocialLink[];
  variant?: "default" | "footer";
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
};

export const SocialLinks = ({ links, variant = "default" }: SocialLinksProps) => {
  if (!links || links.length === 0) return null;

  const size = variant === "footer" ? 20 : 18;
  const buttonSize = variant === "footer" ? "default" : "sm";

  return (
    <div className="flex items-center gap-2">
      {links.map((link, index) => {
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
      })}
    </div>
  );
};
