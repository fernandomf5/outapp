import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContactOption {
  id: string;
  name: string;
  company: string | null;
  registration_category_id: string | null;
}

export interface CategoryOption {
  id: string;
  name: string;
}

const ALL = "__all__";
const NONE = "__none__";
const NO_CATEGORY = "__nocat__";

interface Props {
  value: string | null;
  onChange: (contactId: string | null) => void;
  contacts?: ContactOption[];
  categories?: CategoryOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Category filter + searchable contact list.
 * First choose the category, then pick the cadastro from that category.
 */
export function ContactCategoryPicker({
  value,
  onChange,
  contacts: contactsProp,
  categories: categoriesProp,
  disabled,
  placeholder = "Avulso (sem cadastro)",
  className,
}: Props) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactOption[]>(contactsProp || []);
  const [categories, setCategories] = useState<CategoryOption[]>(categoriesProp || []);
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (contactsProp) setContacts(contactsProp);
  }, [contactsProp]);
  useEffect(() => {
    if (categoriesProp) setCategories(categoriesProp);
  }, [categoriesProp]);

  useEffect(() => {
    const load = async () => {
      if (contactsProp || !user?.id) return;
      const [{ data: cats }, { data: cts }] = await Promise.all([
        supabase
          .from("registration_categories")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name"),
        supabase
          .from("contacts")
          .select("id, name, company, registration_category_id")
          .eq("user_id", user.id)
          .order("name")
          .limit(1000),
      ]);
      setCategories((cats || []) as CategoryOption[]);
      setContacts((cts || []) as ContactOption[]);
    };
    load();
  }, [user?.id, contactsProp]);

  const selected = contacts.find((c) => c.id === value) || null;

  // Keep category filter in sync with the currently selected contact
  useEffect(() => {
    if (selected?.registration_category_id) setCategoryId(selected.registration_category_id);
  }, [selected?.registration_category_id]);

  const filtered = useMemo(() => {
    if (categoryId === ALL) return contacts;
    if (categoryId === NO_CATEGORY)
      return contacts.filter(
        (c) =>
          !c.registration_category_id ||
          !categories.some((cat) => cat.id === c.registration_category_id)
      );
    return contacts.filter((c) => c.registration_category_id === categoryId);
  }, [contacts, categories, categoryId]);

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <Select value={categoryId} onValueChange={setCategoryId} disabled={disabled}>
        <SelectTrigger className="sm:w-[45%]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] z-[400]">
          <SelectItem value={ALL}>Todas as categorias</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
          <SelectItem value={NO_CATEGORY}>Sem categoria</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="flex-1 justify-between font-normal"
          >
            <span className="truncate">
              {selected ? selected.name : placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[280px] z-[400]" align="start">
          <Command>
            <CommandInput placeholder="Pesquisar cadastro..." />
            <CommandList className="max-h-[260px]">
              <CommandEmpty>Nenhum cadastro encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value={placeholder}
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")}
                  />
                  {placeholder}
                </CommandItem>
                {filtered.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.name} ${c.company || ""}`}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === c.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">
                      {c.name}
                      {c.company ? ` — ${c.company}` : ""}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { NONE };
