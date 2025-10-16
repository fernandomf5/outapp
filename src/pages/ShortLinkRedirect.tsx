import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ShortLinkRedirect = () => {
  const { shortCode } = useParams();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!shortCode) {
        setNotFound(true);
        return;
      }

      // Buscar o link
      const { data, error } = await supabase
        .from("short_links")
        .select("*")
        .eq("short_code", shortCode)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        console.error("Link não encontrado:", error);
        setNotFound(true);
        return;
      }

      // Incrementar o contador de cliques
      await supabase
        .from("short_links")
        .update({ clicks: data.clicks + 1 })
        .eq("id", data.id);

      // Redirecionar
      setRedirectUrl(data.original_url);
    };

    fetchAndRedirect();
  }, [shortCode]);

  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <p className="text-lg text-foreground font-semibold">Redirecionando...</p>
        <p className="text-sm text-muted-foreground">Você será redirecionado em instantes</p>
      </div>
    </div>
  );
};

export default ShortLinkRedirect;
