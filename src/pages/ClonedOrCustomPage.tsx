import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ClonedPage from "./ClonedPage";
import CustomPage from "./CustomPage";
import { Loader2 } from "lucide-react";

export default function ClonedOrCustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pageType, setPageType] = useState<'cloned' | 'custom' | 'loading'>('loading');

  useEffect(() => {
    const detectPageType = async () => {
      if (!slug) {
        setPageType('custom');
        return;
      }

      const pathSegment = window.location.pathname.split('/')[1];

      // Verifica se é uma página com page path (page1, page2, etc)
      const pagePathPattern = /^page[1-5]$/;
      if (pagePathPattern.test(pathSegment)) {
        const { data: clonedPage } = await supabase
          .from('cloned_pages')
          .select('id')
          .eq('slug', slug)
          .eq('custom_domain', pathSegment)
          .eq('is_active', true)
          .maybeSingle();

        if (clonedPage) {
          setPageType('cloned');
          return;
        }
      }

      // Fallback: busca pelo slug diretamente para encontrar páginas com page path
      const { data: fallbackPage } = await supabase
        .from('cloned_pages')
        .select('id, custom_domain')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (fallbackPage && fallbackPage.custom_domain) {
        // Se for um page path, aceita
        if (pagePathPattern.test(fallbackPage.custom_domain)) {
          setPageType('cloned');
          return;
        }
      }

      // Se não encontrou página clonada, assume que é custom page
      setPageType('custom');
    };

    detectPageType();
  }, [slug]);

  if (pageType === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pageType === 'cloned') {
    return <ClonedPage />;
  }

  return <CustomPage />;
}
