import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  ExternalLink,
  Search,
  Table as TableIcon,
  ListTodo,
  StickyNote,
  Brain,
  GitBranch,
  ClipboardList,
  FileText,
  Receipt,
  QrCode,
  Link as LinkIcon,
  Globe,
  ShoppingBag,
  CreditCard,
  MousePointerClick,
  CircleDot,
  CalendarDays,
  Wrench,
  Trash2,
} from "lucide-react";
import {
  ResourceType,
  RESOURCE_LABELS,
} from "@/hooks/useCustomerLink";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ActivityRow {
  id: string;
  resource_type: ResourceType;
  resource_id: string;
  resource_title: string | null;
  resource_url: string | null;
  created_at: string;
}

const ICONS: Record<ResourceType, any> = {
  organization_table: TableIcon,
  task: ListTodo,
  quick_note: StickyNote,
  mind_map: Brain,
  funnel: GitBranch,
  briefing: ClipboardList,
  invoice: FileText,
  proposal: FileText,
  receipt: Receipt,
  qr_code: QrCode,
  short_link: LinkIcon,
  cloned_page: Globe,
  catalog: ShoppingBag,
  checkout: CreditCard,
  popup: CircleDot,
  floating_button: MousePointerClick,
  link_bio: LinkIcon,
  agenda_event: CalendarDays,
  service_order: Wrench,
  contract: FileText,
};

interface Props {
  customerId: string;
}

export function CustomerActivitiesTab({ customerId }: Props) {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ResourceType | "all">("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("customer_resource_links")
      .select("id, resource_type, resource_id, resource_title, resource_url, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    setItems((data || []) as ActivityRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (customerId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleRemove = async (id: string) => {
    await supabase.from("customer_resource_links").delete().eq("id", id);
    toast.success("Vínculo removido");
    load();
  };

  const types = Array.from(new Set(items.map((i) => i.resource_type)));

  const filtered = items.filter((i) => {
    if (filter !== "all" && i.resource_type !== filter) return false;
    if (search && !(i.resource_title || "").toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atividade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant={filter === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilter("all")}
        >
          Todos ({items.length})
        </Badge>
        {types.map((t) => (
          <Badge
            key={t}
            variant={filter === t ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter(t)}
          >
            {RESOURCE_LABELS[t]} ({items.filter((i) => i.resource_type === t).length})
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Activity className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade atrelada a este cliente ainda.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Em qualquer recurso da plataforma (tabelas, tarefas, notas, etc.) use o
            botão <b>"Atrelar cliente"</b> para vincular ao cadastro.
          </p>
        </Card>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2">
            {filtered.map((item) => {
              const Icon = ICONS[item.resource_type] || Activity;
              return (
                <Card key={item.id} className="p-3 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.resource_title || "(sem título)"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{RESOURCE_LABELS[item.resource_type]}</span>
                      <span>·</span>
                      <span>
                        {formatDistanceToNow(new Date(item.created_at), {
                          locale: ptBR,
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  {item.resource_url && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={item.resource_url}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> Abrir
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(item.id)}
                    title="Remover vínculo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
