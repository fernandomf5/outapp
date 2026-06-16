import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ResourceType =
  | "organization_table"
  | "task"
  | "quick_note"
  | "mind_map"
  | "funnel"
  | "briefing"
  | "invoice"
  | "proposal"
  | "receipt"
  | "qr_code"
  | "short_link"
  | "cloned_page"
  | "catalog"
  | "checkout"
  | "popup"
  | "floating_button"
  | "link_bio"
  | "agenda_event"
  | "service_order"
  | "contract";

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  organization_table: "Tabela de Organização",
  task: "Tarefa",
  quick_note: "Nota Rápida",
  mind_map: "Mapa Mental",
  funnel: "Funil",
  briefing: "Briefing",
  invoice: "Cobrança",
  proposal: "Proposta",
  receipt: "Recibo",
  qr_code: "QR Code",
  short_link: "Link Curto",
  cloned_page: "Página Clonada",
  catalog: "Catálogo",
  checkout: "Checkout",
  popup: "Pop-up",
  floating_button: "Botão Flutuante",
  link_bio: "Link Bio",
  agenda_event: "Agenda",
  service_order: "Ordem de Serviço",
  contract: "Contrato",
};

interface UseCustomerLinkOptions {
  resourceType: ResourceType;
  resourceId?: string | null;
  resourceTitle?: string;
  resourceUrl?: string;
}

export function useCustomerLink({
  resourceType,
  resourceId,
  resourceTitle,
  resourceUrl,
}: UseCustomerLinkOptions) {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!resourceId) {
      setCustomerId(null);
      return;
    }
    const { data } = await supabase
      .from("customer_resource_links")
      .select("customer_id")
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .maybeSingle();
    setCustomerId(data?.customer_id ?? null);
  }, [resourceType, resourceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const linkCustomer = useCallback(
    async (newCustomerId: string | null) => {
      if (!resourceId) return;
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Não autenticado");

        // Remove existing link
        await supabase
          .from("customer_resource_links")
          .delete()
          .eq("resource_type", resourceType)
          .eq("resource_id", resourceId);

        if (newCustomerId) {
          const { error } = await supabase
            .from("customer_resource_links")
            .insert({
              user_id: userData.user.id,
              customer_id: newCustomerId,
              resource_type: resourceType,
              resource_id: resourceId,
              resource_title: resourceTitle ?? null,
              resource_url: resourceUrl ?? null,
            });
          if (error) throw error;
          toast.success("Cliente atrelado");
        } else {
          toast.success("Vínculo removido");
        }
        setCustomerId(newCustomerId);
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Erro ao atrelar cliente");
      } finally {
        setLoading(false);
      }
    },
    [resourceType, resourceId, resourceTitle, resourceUrl]
  );

  return { customerId, linkCustomer, loading, refresh };
}
