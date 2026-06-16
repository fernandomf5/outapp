import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color?: string | null;
}

interface CustomerRow {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  category_id: string | null;
}

interface CustomerPickerProps {
  value?: string | null;
  onChange: (customerId: string | null, customer?: CustomerRow) => void;
  placeholder?: string;
  allowClear?: boolean;
  className?: string;
}

const NONE_VALUE = "__none__";

export function CustomerPicker({
  value,
  onChange,
  placeholder = "Selecionar cliente...",
  allowClear = true,
  className,
}: CustomerPickerProps) {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }
      const [{ data: cats }, { data: custs }] = await Promise.all([
        supabase
          .from("registration_categories")
          .select("id, name, color")
          .eq("user_id", userData.user.id)
          .order("name"),
        supabase
          .from("customers")
          .select("id, name, company, email, category_id")
          .eq("user_id", userData.user.id)
          .order("name"),
      ]);
      setCategories(cats || []);
      setCustomers((custs || []) as CustomerRow[]);
      setLoading(false);
    })();
  }, []);

  const handleChange = (v: string) => {
    if (v === NONE_VALUE) {
      onChange(null);
    } else {
      const c = customers.find((x) => x.id === v);
      onChange(v, c);
    }
  };

  const grouped = categories
    .map((cat) => ({
      cat,
      items: customers.filter((c) => c.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  const uncategorized = customers.filter((c) => !c.category_id);

  return (
    <Select
      value={value || (allowClear ? NONE_VALUE : undefined)}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? "Carregando..." : placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[320px]">
        {allowClear && (
          <SelectItem value={NONE_VALUE}>
            <span className="text-muted-foreground">Nenhum cliente</span>
          </SelectItem>
        )}
        {grouped.map(({ cat, items }) => (
          <SelectGroup key={cat.id}>
            <SelectLabel>{cat.name}</SelectLabel>
            {items.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{c.name}</span>
                  {c.company && (
                    <span className="text-xs text-muted-foreground">
                      · {c.company}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
        {uncategorized.length > 0 && (
          <SelectGroup>
            <SelectLabel>Sem categoria</SelectLabel>
            {uncategorized.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{c.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {customers.length === 0 && !loading && (
          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
            Nenhum cliente cadastrado
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
