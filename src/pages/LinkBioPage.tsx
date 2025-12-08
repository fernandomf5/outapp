import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { Link2, Instagram, Youtube, Facebook, Twitter, Linkedin, Mail, Phone, Globe } from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
}

interface LinkBio {
  id: string;
  username: string;
  custom_slug?: string | null;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  background_image: string;
  border_style: string;
  border_width: number;
  border_color: string;
  border_animation: string;
  hover_animation: string;
  border_radius: number;
  button_spacing: number;
  is_active: boolean;
  gradient_color1: string;
  gradient_color2: string;
  music_url?: string;
  music_autoplay?: boolean;
  background_overlay_color: string;
  background_overlay_opacity: number;
  social_links?: SocialLink[];
}

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  image_url: string;
  position: number;
  is_active: boolean;
}

const iconOptions = {
  link: Link2,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  email: Mail,
  phone: Phone,
  website: Globe,
};

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const socialPlatformIcons: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: TikTokIcon,
  whatsapp: WhatsAppIcon,
  email: Mail,
  website: Globe,
};

export default function LinkBioPage() {
  const { username, slug } = useParams<{ username?: string; slug?: string }>();
  const [bio, setBio] = useState<LinkBio | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username || slug) {
      fetchBioPage();
    } else {
      // Caso a rota esteja sem parâmetros, evitamos loading infinito
      setLoading(false);
    }
  }, [username, slug]);

  useEffect(() => {
    if (bio) {
      const pageTitle = `${bio.display_name || bio.username} | Links`;
      const pageDescription = bio.bio || `Todos os links de ${bio.display_name || bio.username} em um só lugar`;
      
      document.title = pageTitle;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', pageDescription);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = pageDescription;
        document.head.appendChild(meta);
      }
    }
  }, [bio]);

  const fetchBioPage = async () => {
    // Buscar por slug personalizado ou username
    let bioData = null;
    
    if (slug) {
      // @ts-ignore - Type instantiation issue with Supabase query
      const { data } = await supabase
        .from('link_bios')
        .select('*')
        .eq('is_active', true)
        .eq('custom_slug', slug)
        .maybeSingle();
      bioData = data;
    } else if (username) {
      // @ts-ignore - Type instantiation issue with Supabase query  
      const { data } = await supabase
        .from('link_bios')
        .select('*')
        .eq('is_active', true)
        .eq('username', username)
        .maybeSingle();
      bioData = data;
    }

    if (bioData) {
      setBio(bioData as LinkBio);
      
      const { data: linksData } = await supabase
        .from('link_bio_links')
        .select('*')
        .eq('bio_id', bioData.id)
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (linksData) {
        setLinks(linksData);
      }
    }
    
    setLoading(false);
  };

  const trackClick = async (linkId: string) => {
    if (!bio) return;
    
    const visitorId = localStorage.getItem('visitor_id') || `visitor_${Date.now()}_${Math.random()}`;
    localStorage.setItem('visitor_id', visitorId);

    await supabase
      .from('link_bio_clicks')
      .insert([{
        bio_id: bio.id,
        link_id: linkId,
        visitor_id: visitorId,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      }]);
  };

  const handleLinkClick = (link: BioLink) => {
    trackClick(link.id);
    window.open(link.url, '_blank');
  };

  const IconComponent = ({ iconName }: { iconName: string }) => {
    const Icon = iconOptions[iconName as keyof typeof iconOptions] || Link2;
    return <Icon className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!bio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-muted-foreground">Página não encontrada</p>
        </div>
      </div>
    );
  }

  const isGradient = bio.theme === 'gradient';
  const hasBackgroundImage = bio.background_image && bio.background_image.trim() !== '';
  
  const getBackgroundStyle = () => {
    if (hasBackgroundImage) {
      return {
        backgroundImage: `url(${bio.background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    } else if (isGradient) {
      return { background: `linear-gradient(135deg, ${bio.gradient_color1 || '#667eea'} 0%, ${bio.gradient_color2 || '#764ba2'} 100%)` };
    } else {
      return { backgroundColor: bio.background_color };
    }
  };

  return (
    <div 
      className="min-h-screen py-8 sm:py-12 px-4 relative"
      style={getBackgroundStyle()}
    >
      {/* Background overlay */}
      {bio.background_overlay_opacity > 0 && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: bio.background_overlay_color,
            opacity: bio.background_overlay_opacity / 100,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      
      {bio.music_url && (
        <audio 
          src={bio.music_url} 
          autoPlay={bio.music_autoplay}
          loop
          controls
          className="fixed bottom-4 right-4 z-50 opacity-80 hover:opacity-100 transition-opacity"
          style={{ maxWidth: '250px' }}
        />
      )}

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          {bio.avatar_url && (
            <img 
              src={bio.avatar_url} 
              alt={bio.display_name || bio.username}
              className="w-24 h-24 sm:w-32 sm:h-32 mb-4 sm:mb-6 shadow-lg object-cover"
              style={{
                borderRadius: `${bio.border_radius || 12}px`,
              }}
            />
          )}
          
          <h1 
            className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-center px-4"
            style={{ color: bio.text_color }}
          >
            {bio.display_name || bio.username}
          </h1>
          
          {bio.bio && (
            <p 
              className="text-center max-w-md mb-4 px-4 text-sm sm:text-base"
              style={{ color: bio.text_color }}
            >
              {bio.bio}
            </p>
          )}

          {/* Social Links */}
          {bio.social_links && bio.social_links.length > 0 && (
            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8 flex-wrap">
              {bio.social_links.filter(s => s.url).map((social, index) => {
                const Icon = socialPlatformIcons[social.platform] || Globe;
                const isSvgComponent = social.platform === 'tiktok' || social.platform === 'whatsapp';
                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ 
                      backgroundColor: bio.button_color,
                      color: bio.button_text_color
                    }}
                  >
                    {isSvgComponent ? <Icon /> : <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto px-4" style={{ display: 'flex', flexDirection: 'column', gap: `${bio.button_spacing || 12}px`, alignItems: 'center' }}>
          {links.map((link) => (
            link.image_url ? (
              <div
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className={`cursor-pointer transition-all hover:shadow-lg active:scale-95
                  ${bio.border_animation !== 'rgb' ? 'overflow-hidden' : ''}
                  ${bio.border_animation === 'rgb' ? 'bio-border-rgb' : ''} 
                  ${bio.border_animation === 'pulse' ? 'bio-border-pulse' : ''}
                  ${bio.border_animation === 'glow' ? 'bio-border-glow' : ''}
                  ${bio.hover_animation === 'scale' ? 'bio-hover-scale' : ''}
                  ${bio.hover_animation === 'bounce' ? 'bio-hover-bounce' : ''}
                  ${bio.hover_animation === 'shake' ? 'bio-hover-shake' : ''}
                  ${bio.hover_animation === 'rotate' ? 'bio-hover-rotate' : ''}
                `}
                style={{ 
                  borderRadius: bio.border_style === 'none' ? '0px' : `${bio.border_radius || 12}px`,
                  display: 'inline-block',
                  ...(bio.border_animation === 'rgb' && bio.border_style !== 'none' && {
                    '--border-width': `${bio.border_width || 2}px`
                  }),
                  ...(bio.border_animation !== 'rgb' && bio.border_style !== 'none' && {
                    border: `${bio.border_width || 2}px ${bio.border_style || 'solid'} ${bio.border_color || '#000000'}`
                  })
                } as React.CSSProperties}
              >
                <img 
                  src={link.image_url} 
                  alt={link.title}
                  className="h-auto block"
                  style={{
                    borderRadius: bio.border_style === 'none' ? '0px' : `${bio.border_radius || 12}px`,
                    maxWidth: '100vw',
                    width: 'auto',
                  }}
                />
              </div>
            ) : (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className={`w-full max-w-md px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 sm:gap-3 group text-sm sm:text-base
                  ${bio.border_animation === 'rgb' ? 'bio-border-rgb' : ''} 
                  ${bio.border_animation === 'pulse' ? 'bio-border-pulse' : ''}
                  ${bio.border_animation === 'glow' ? 'bio-border-glow' : ''}
                  ${bio.hover_animation === 'scale' ? 'bio-hover-scale' : ''}
                  ${bio.hover_animation === 'bounce' ? 'bio-hover-bounce' : ''}
                  ${bio.hover_animation === 'shake' ? 'bio-hover-shake' : ''}
                  ${bio.hover_animation === 'rotate' ? 'bio-hover-rotate' : ''}
                `}
                style={{ 
                  borderRadius: `${bio.border_radius || 12}px`,
                  backgroundColor: bio.button_color,
                  color: bio.button_text_color,
                  ...(bio.border_animation === 'rgb' && bio.border_style !== 'none' && {
                    '--border-width': `${bio.border_width || 2}px`
                  }),
                  ...(bio.border_animation !== 'rgb' && bio.border_style !== 'none' && {
                    border: `${bio.border_width || 2}px ${bio.border_style || 'solid'} ${bio.border_color || '#000000'}`
                  })
                } as React.CSSProperties}
              >
                <IconComponent iconName={link.icon} />
                <span className="flex-1 text-center">{link.title}</span>
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )
          ))}
        </div>

        {links.length === 0 && (
          <div className="text-center py-12 px-4">
            <p style={{ color: bio.text_color }} className="opacity-60 text-sm sm:text-base">
              Nenhum link disponível no momento
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
