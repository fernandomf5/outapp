import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { Link2, Instagram, Youtube, Facebook, Twitter, Linkedin, Mail, Phone, Globe } from "lucide-react";

interface LinkBio {
  id: string;
  username: string;
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
  is_active: boolean;
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
  const { username } = useParams<{ username: string }>();
  const [bio, setBio] = useState<LinkBio | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchBioPage();
    }
  }, [username]);

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
    const { data: bioData } = await supabase
      .from('link_bios')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

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

  const isGradient = bio.background_color.includes('gradient');
  const hasBackgroundImage = bio.background_image && bio.background_image.trim() !== '';

  return (
    <div 
      className="min-h-screen py-8 sm:py-12 px-4"
      style={
        hasBackgroundImage
          ? {
              backgroundImage: `url(${bio.background_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }
          : isGradient 
            ? { background: bio.background_color }
            : { backgroundColor: bio.background_color }
      }
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          {bio.avatar_url && (
            <img 
              src={bio.avatar_url} 
              alt={bio.display_name || bio.username}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mb-4 sm:mb-6 shadow-lg object-cover"
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

        <div className="space-y-3 sm:space-y-4 max-w-md mx-auto px-4">
          {links.map((link) => (
            link.image_url ? (
              <div
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className="cursor-pointer rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-lg active:scale-95"
              >
                <img 
                  src={link.image_url} 
                  alt={link.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            ) : (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-full font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 sm:gap-3 group text-sm sm:text-base ${
                  bio.border_style === 'rgb' ? 'rgb-border' : ''
                }`}
                style={{ 
                  backgroundColor: bio.button_color,
                  color: bio.button_text_color,
                  ...(bio.border_style !== 'rgb' && {
                    border: `${bio.border_width || 2}px ${bio.border_style || 'solid'} ${bio.border_color || '#000000'}`
                  })
                }}
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
