import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { Link2, Instagram, Youtube, Facebook, Twitter, Linkedin, Mail, Phone, Globe } from "lucide-react";

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

export default function LinkBioPage() {
  const { username, slug } = useParams<{ username?: string; slug?: string }>();
  const [bio, setBio] = useState<LinkBio | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username || slug) {
      fetchBioPage();
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
              className="text-center max-w-md mb-6 sm:mb-8 px-4 text-sm sm:text-base"
              style={{ color: bio.text_color }}
            >
              {bio.bio}
            </p>
          )}
        </div>

        <div className="max-w-md mx-auto px-4" style={{ display: 'flex', flexDirection: 'column', gap: `${bio.button_spacing || 12}px` }}>
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
                  borderRadius: `${bio.border_radius || 12}px`,
                  ...(bio.border_animation === 'rgb' && {
                    '--border-width': `${bio.border_width || 2}px`
                  }),
                  ...(bio.border_animation !== 'rgb' && {
                    border: `${bio.border_width || 2}px ${bio.border_style || 'solid'} ${bio.border_color || '#000000'}`
                  })
                } as React.CSSProperties}
              >
                <img 
                  src={link.image_url} 
                  alt={link.title}
                  className="w-full h-auto object-cover"
                  style={{
                    borderRadius: `${bio.border_radius || 12}px`,
                  }}
                />
              </div>
            ) : (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 sm:gap-3 group text-sm sm:text-base
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
                  ...(bio.border_animation === 'rgb' && {
                    '--border-width': `${bio.border_width || 2}px`
                  }),
                  ...(bio.border_animation !== 'rgb' && {
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
