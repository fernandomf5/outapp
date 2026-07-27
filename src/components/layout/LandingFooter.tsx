import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SocialLinks } from "@/components/SocialLinks";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import klicLogoAsset from "@/assets/klic-smart-logo-v2.png.asset.json";
import logoAsset from "@/assets/logo-outapp-v2.png.asset.json";

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
      <footer className="relative border-t border-border/60 bg-card/40">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="h-10 w-36 bg-muted animate-pulse rounded" />
              <div className="flex gap-2">
                {[1, 2, 3].map(i => <div key={i} className="h-8 w-8 bg-muted animate-pulse rounded" />)}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border/60 text-center">
            <div className="h-4 w-64 bg-muted animate-pulse rounded mx-auto" />
          </div>
        </div>
      </footer>
    );
  }

  const logoSrc = settings.siteLogoDarkUrl || settings.siteLogoUrl || logoAsset.url;

  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-gradient-to-b from-card/30 to-background">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="pointer-events-none absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />

      <div className="container relative mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="space-y-5">
            <img
              src={logoSrc}
              alt={settings.siteTitle || "Out App"}
              className="h-10 w-auto object-contain"
              loading="lazy"
            />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Ferramentas inteligentes para criar, organizar, automatizar e gerenciar o seu negócio em um só lugar.
            </p>
            <SocialLinks links={settings.socialLinks} variant="footer" />
          </div>

          {!hideCustomPages && footerPages.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/90">Páginas</h4>
              <ul className="space-y-2.5">
                {footerPages.map((page) => (
                  <li key={page.id}>
                    <a
                      href={`/${page.slug}`}
                      className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
                      {page.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {settings.footerMenus.map((menu: any, index: number) => (
            <div key={index}>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/90">{menu.title}</h4>
              <ul className="space-y-2.5">
                {menu.links?.map((link: any, linkIndex: number) => (
                  <li key={linkIndex}>
                    <a
                      href={link.url}
                      className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border/60 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="text-center md:text-left space-y-1">
            <p className="text-sm text-muted-foreground">
              {settings.footerText || `© ${new Date().getFullYear()} ${settings.siteTitle || 'Out App'}. Todos os direitos reservados.`}
            </p>
            <p className="text-xs text-muted-foreground/70">
              Uma Negócio do Grupo Liberdade Financeira Online - 21.233.977/0001-29
            </p>
          </div>

          <a
            href="https://klicsmart.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 rounded-full border border-border/60 bg-card/60 px-4 py-2 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-card"
          >
            <img
              src={klicLogoAsset.url}
              alt="Klic Smart"
              className="h-7 w-7 object-contain transition-transform group-hover:scale-110"
              loading="lazy"
            />
            <span className="text-left leading-tight">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Criado com carinho pela agência</span>
              <span className="block text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Klic Smart</span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};
