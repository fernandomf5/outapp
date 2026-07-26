import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { buildResourceUrl } from "@/lib/resourceLinks";

export interface ContactResourceLink {
  id: string;
  user_id: string;
  contact_id: string;
  category_id: string | null;
  resource_type: string;
  resource_id: string;
  resource_title: string | null;
  resource_url: string | null;
  created_at: string;
}

const TABLE = "contact_resource_links" as any;

/** All resources attributed to one contact (cadastro). */
export function useContactResources(contactId?: string | null) {
  const [links, setLinks] = useState<ContactResourceLink[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!contactId) {
      setLinks([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from(TABLE)
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false });
    setLinks(((data || []) as any) as ContactResourceLink[]);
    setLoading(false);
  }, [contactId]);

  useEffect(() => {
    load();
  }, [load]);

  const removeLink = useCallback(
    async (linkId: string) => {
      const { error } = await supabase.from(TABLE).delete().eq("id", linkId);
      if (!error) setLinks((prev) => prev.filter((l) => l.id !== linkId));
      return !error;
    },
    []
  );

  return { links, loading, reload: load, removeLink };
}

/** Link/unlink a single resource to a contact (used inside resource forms). */
export function useResourceContactLink(resourceType: string, resourceId?: string | null) {
  const { user } = useAuth();
  const [contactId, setContactId] = useState<string | null>(null);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!resourceId) {
        setContactId(null);
        setLinkId(null);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from(TABLE)
        .select("id, contact_id")
        .eq("resource_type", resourceType)
        .eq("resource_id", resourceId)
        .maybeSingle();
      if (!cancelled) {
        setContactId((data as any)?.contact_id ?? null);
        setLinkId((data as any)?.id ?? null);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [resourceType, resourceId]);

  /** Persist the current selection for a given resource id. */
  const saveLink = useCallback(
    async (targetResourceId: string, targetContactId: string | null, resourceTitle?: string) => {
      if (!user?.id || !targetResourceId) return;

      if (!targetContactId) {
        await supabase
          .from(TABLE)
          .delete()
          .eq("resource_type", resourceType)
          .eq("resource_id", targetResourceId);
        setLinkId(null);
        setContactId(null);
        return;
      }

      const { data: contact } = await supabase
        .from("contacts")
        .select("registration_category_id")
        .eq("id", targetContactId)
        .maybeSingle();

      await supabase
        .from(TABLE)
        .delete()
        .eq("resource_type", resourceType)
        .eq("resource_id", targetResourceId);

      const { data } = await supabase
        .from(TABLE)
        .insert({
          user_id: user.id,
          contact_id: targetContactId,
          category_id: (contact as any)?.registration_category_id ?? null,
          resource_type: resourceType,
          resource_id: targetResourceId,
          resource_title: resourceTitle || null,
          resource_url: buildResourceUrl(resourceType, targetResourceId),
        } as any)
        .select("id")
        .maybeSingle();

      setLinkId((data as any)?.id ?? null);
      setContactId(targetContactId);
    },
    [resourceType, user?.id]
  );

  return { contactId, setContactId, linkId, loading, saveLink };
}
