import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { ContactCategoryPicker } from "./ContactCategoryPicker";


interface ContactOption {
  id: string;
  name: string;
  company: string | null;
  registration_category_id: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface ContactPickerProps {
  value: string | null;
  onChange: (contactId: string | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Restrict contacts and categories to the selected Gestão Livre management. */
  entityId?: string;
}

const NONE = "__none__";

/**
 * Reusable picker to attach any resource to a "Cadastro" (contacts),
 * grouped by registration category.
 */
export function ContactPicker({
  value,
  onChange,
  label = "Atribuir a um cadastro (opcional)",
  placeholder = "Avulso (sem cadastro)",
  disabled,
  entityId,
}: ContactPickerProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      let categoriesQuery: any = supabase
        .from("registration_categories")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");
      let contactsQuery: any = supabase
        .from("contacts")
        .select("id, name, company, registration_category_id")
        .eq("user_id", user.id)
        .order("name")
        .limit(1000);
      if (entityId) {
        categoriesQuery = categoriesQuery.filter("entity_id", "eq", entityId);
        contactsQuery = contactsQuery.filter("entity_id", "eq", entityId);
      }
      const [{ data: cats }, { data: cts }] = await Promise.all([categoriesQuery, contactsQuery]);
      setCategories((cats || []) as CategoryOption[]);
      setContacts((cts || []) as ContactOption[]);
    };
    load();
  }, [user?.id, entityId]);

  const grouped = categories
    .map((cat) => ({
      category: cat,
      items: contacts.filter((c) => c.registration_category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  const ungrouped = contacts.filter(
    (c) => !c.registration_category_id || !categories.some((cat) => cat.id === c.registration_category_id)
  );

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <ContactCategoryPicker
        value={value}
        onChange={onChange}
        contacts={contacts}
        categories={categories}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}

