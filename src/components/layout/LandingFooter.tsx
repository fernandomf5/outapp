import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SocialLinks } from "@/components/SocialLinks";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface CustomPageItem {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
}

export const LandingFooter = ({ hideCustomPages = false }: { hideCustomPages?: boolean }) => {
  const { settings, isLoading } = useSiteSettings();
  const [footerPages, setFooterPages] = useState<CustomPageItem[]>([]);

  useEffect(() => {
    const fetchPages = async () => {
      const { data } = await supabase
        .from('custom_pages')
        .select('id, title, slug, is_active')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (data) setFooterPages(data as CustomPageItem[]);
    };

    fetchPages();
  }, []);

  // Show skeleton while loading to prevent flash
  if (isLoading) {
    return (
      <footer className="bg-muted/50 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="flex gap-2">
                {[1,2,3].map(i => <div key={i} className="h-8 w-8 bg-muted animate-pulse rounded" />)}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t text-center">
            <div className="h-4 w-64 bg-muted animate-pulse rounded mx-auto" />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <span className="font-bold text-xl">{settings.siteTitle || "Automação"}</span>
            <SocialLinks links={settings.socialLinks} variant="footer" />
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
          {settings.footerMenus.map((menu: any, index: number) => (
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
        <div className="pt-8 border-t text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {settings.footerText || `© ${new Date().getFullYear()} ${settings.siteTitle || 'Automação'}. Todos os direitos reservados.`}
          </p>
          <p className="text-xs text-muted-foreground">
            Uma Negócio do Grupo Liberdade Financeira Online - 21.233.977/0001-29
          </p>
          <a 
            href="https://klicsmart.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Criado com carinho pela agência</span>
            <img 
              src="/klic-smart-logo.png" 
              alt="Klic Smart AI" 
              className="h-5 w-5 object-contain"
            />
            <span className="font-medium">Klic Smart</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
