import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bot } from "lucide-react";
import { SocialLinks } from "@/components/SocialLinks";
import { useTheme } from "next-themes";


interface CustomPageItem {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
}

export const LandingFooter = ({ hideCustomPages = false }: { hideCustomPages?: boolean }) => {
  const { resolvedTheme } = useTheme();
  const [siteTitle, setSiteTitle] = useState("");
  const [logoLightUrl, setLogoLightUrl] = useState("");
  const [logoDarkUrl, setLogoDarkUrl] = useState("");
  const [footerText, setFooterText] = useState("");
  const [footerMenus, setFooterMenus] = useState<any[]>([]);
  const [footerImages, setFooterImages] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [footerPages, setFooterPages] = useState<CustomPageItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [pagesRes, settingsRes] = await Promise.all([
        supabase
          .from('custom_pages')
          .select('id, title, slug, is_active')
          .eq('is_active', true)
          .order('order_index', { ascending: true }),
        supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['site_title', 'site_logo_light_url', 'site_logo_dark_url', 'footer_text', 'footer_menus', 'footer_images', 'social_links'])
      ]);

      if (pagesRes.data) setFooterPages(pagesRes.data as CustomPageItem[]);

      if (settingsRes.data) {
        settingsRes.data.forEach(item => {
          switch(item.key) {
            case 'site_title':
              setSiteTitle(item.value || 'Automação');
              break;
            case 'site_logo_light_url':
              setLogoLightUrl(item.value || '');
              break;
            case 'site_logo_dark_url':
              setLogoDarkUrl(item.value || '');
              break;
            case 'footer_text':
              setFooterText(item.value || '');
              break;
            case 'footer_menus':
              try { setFooterMenus(JSON.parse(item.value || '[]')); } catch {}
              break;
            case 'footer_images':
              try { setFooterImages(JSON.parse(item.value || '[]')); } catch {}
              break;
            case 'social_links':
              try { setSocialLinks(JSON.parse(item.value || '[]')); } catch {}
              break;
          }
        });
      }
    };

    fetchData();
  }, []);

  const currentLogo = resolvedTheme === 'dark' ? logoDarkUrl : logoLightUrl;

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            {currentLogo ? (
              <img src={currentLogo} alt={siteTitle} className="h-12 w-auto mb-4" />
            ) : (
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl">{siteTitle || "Automação"}</span>
              </div>
            )}
            {footerText && (
              <p className="text-sm text-muted-foreground">{footerText}</p>
            )}
            <SocialLinks links={socialLinks} variant="footer" />
          </div>
          {!hideCustomPages && footerPages.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4">Páginas</h4>
              <ul className="space-y-2">
                {footerPages.map((page) => (
                  <li key={page.id}>
                    <a 
                      href={`/${page.slug}`} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {page.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {footerMenus.map((menu: any, index: number) => (
            <div key={index}>
              <h4 className="font-semibold mb-4">{menu.title}</h4>
              <ul className="space-y-2">
                {menu.links?.map((link: any, linkIndex: number) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.url} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {footerImages.length > 0 && (
          <div className="flex items-center justify-center gap-8 py-6 border-t">
            {footerImages.map((img, index) => (
              <img 
                key={index} 
                src={img} 
                alt={`Partner ${index + 1}`}
                className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
        )}
        <div className="pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            {footerText || `© ${new Date().getFullYear()} ${siteTitle || 'Automação'}. Todos os direitos reservados.`}
          </p>
        </div>
      </div>
    </footer>
  );
};
