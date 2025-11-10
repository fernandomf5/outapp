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

      // Determinar o domínio para busca
      const hostname = window.location.hostname;
      
      // Verifica se é um domínio personalizado (não localhost e não o domínio principal)
      const isCustomDomain = !hostname.includes('localhost') && 
                             !hostname.includes('127.0.0.1') &&
                             hostname !== window.location.host.split(':')[0];
      
      if (!isCustomDomain) {
        // Se não é domínio personalizado, é uma custom page
        setPageType('custom');
        return;
      }

      // Tentar buscar como página clonada
      const { data: clonedPage, error } = await supabase
        .from('cloned_pages')
        .select('id')
        .eq('slug', slug)
        .eq('custom_domain', hostname)
        .eq('is_active', true)
        .maybeSingle();

      if (clonedPage) {
        setPageType('cloned');
      } else {
        setPageType('custom');
      }
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
