import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LayoutTemplate } from "lucide-react";
import type { CatalogLayoutSettings } from "./catalogLayout";

interface Props {
  value: CatalogLayoutSettings;
  onChange: (next: CatalogLayoutSettings) => void;
}

export default function CatalogLayoutEditor({ value, onChange }: Props) {
  const set = <K extends keyof CatalogLayoutSettings>(key: K, patch: Partial<CatalogLayoutSettings[K]>) =>
    onChange({ ...value, [key]: { ...(value[key] as any), ...patch } });

  const row = (label: string, checked: boolean, onCheck: (v: boolean) => void) => (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheck} />
    </div>
  );

  return (
    <div className="space-y-3 pt-2 border-t">
      <h4 className="font-medium flex items-center gap-2">
        <LayoutTemplate className="w-4 h-4" />
        Layout da Loja (cabeçalho, vantagens e rodapé)
      </h4>
      <p className="text-xs text-muted-foreground">
        Personalize todos os textos e seções que aparecem no catálogo público.
      </p>

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="topbar">
          <AccordionTrigger className="text-sm">Barra superior</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {row("Exibir barra superior", value.topbar.enabled, (v) => set("topbar", { enabled: v }))}
            <div>
              <Label className="text-xs">Texto 1</Label>
              <Input value={value.topbar.item1} onChange={(e) => set("topbar", { item1: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Texto 2</Label>
              <Input value={value.topbar.item2} onChange={(e) => set("topbar", { item2: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Texto 3 (WhatsApp)</Label>
              <Input value={value.topbar.item3} onChange={(e) => set("topbar", { item3: e.target.value })} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="header">
          <AccordionTrigger className="text-sm">Cabeçalho</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {row("Exibir busca", value.header.showSearch, (v) => set("header", { showSearch: v }))}
            <div>
              <Label className="text-xs">Placeholder da busca</Label>
              <Input
                value={value.header.searchPlaceholder}
                onChange={(e) => set("header", { searchPlaceholder: e.target.value })}
              />
            </div>
            {row("Exibir botão de contato", value.header.showCta, (v) => set("header", { showCta: v }))}
            <div>
              <Label className="text-xs">Texto do botão</Label>
              <Input value={value.header.ctaLabel} onChange={(e) => set("header", { ctaLabel: e.target.value })} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="hero">
          <AccordionTrigger className="text-sm">Banner principal</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {row("Exibir banner", value.hero.enabled, (v) => set("hero", { enabled: v }))}
            <div>
              <Label className="text-xs">Selo (badge)</Label>
              <Input value={value.hero.badge} onChange={(e) => set("hero", { badge: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Título (vazio = nome do catálogo)</Label>
              <Input value={value.hero.title} onChange={(e) => set("hero", { title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Subtítulo (vazio = descrição)</Label>
              <Input value={value.hero.subtitle} onChange={(e) => set("hero", { subtitle: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Texto do botão</Label>
              <Input value={value.hero.ctaLabel} onChange={(e) => set("hero", { ctaLabel: e.target.value })} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm">Categorias</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {row("Exibir vitrine de categorias", value.categories.showStrip, (v) => set("categories", { showStrip: v }))}
            <div>
              <Label className="text-xs">Título da vitrine</Label>
              <Input value={value.categories.title} onChange={(e) => set("categories", { title: e.target.value })} />
            </div>
            {row("Exibir item inicial no menu", value.categories.showHomeInNav, (v) =>
              set("categories", { showHomeInNav: v })
            )}
            <div>
              <Label className="text-xs">Nome do item inicial</Label>
              <Input value={value.categories.homeLabel} onChange={(e) => set("categories", { homeLabel: e.target.value })} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="benefits">
          <AccordionTrigger className="text-sm">Faixa de vantagens</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {row("Exibir vantagens", value.benefits.enabled, (v) => set("benefits", { enabled: v }))}
            {value.benefits.items.map((item, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <Input
                  value={item.title}
                  placeholder={`Título ${i + 1}`}
                  onChange={(e) => {
                    const items = value.benefits.items.map((b, j) => (j === i ? { ...b, title: e.target.value } : b));
                    set("benefits", { items });
                  }}
                />
                <Input
                  value={item.sub}
                  placeholder={`Descrição ${i + 1}`}
                  onChange={(e) => {
                    const items = value.benefits.items.map((b, j) => (j === i ? { ...b, sub: e.target.value } : b));
                    set("benefits", { items });
                  }}
                />
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="footer">
          <AccordionTrigger className="text-sm">Rodapé</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {row("Exibir rodapé", value.footer.enabled, (v) => set("footer", { enabled: v }))}
            <div>
              <Label className="text-xs">Texto sobre a loja</Label>
              <Textarea
                rows={3}
                value={value.footer.about}
                onChange={(e) => set("footer", { about: e.target.value })}
                placeholder="Vazio = descrição do catálogo"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Título coluna categorias</Label>
                <Input
                  value={value.footer.categoriesTitle}
                  onChange={(e) => set("footer", { categoriesTitle: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Título coluna ajuda</Label>
                <Input value={value.footer.helpTitle} onChange={(e) => set("footer", { helpTitle: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Itens de ajuda (um por linha)</Label>
              <Textarea
                rows={4}
                value={value.footer.helpItems.join("\n")}
                onChange={(e) => set("footer", { helpItems: e.target.value.split("\n") })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Título atendimento</Label>
                <Input value={value.footer.contactTitle} onChange={(e) => set("footer", { contactTitle: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Texto do botão</Label>
                <Input value={value.footer.contactCta} onChange={(e) => set("footer", { contactCta: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Texto de atendimento</Label>
              <Textarea
                rows={2}
                value={value.footer.contactText}
                onChange={(e) => set("footer", { contactText: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Instagram</Label>
                <Input value={value.footer.instagram} onChange={(e) => set("footer", { instagram: e.target.value })} placeholder="https://" />
              </div>
              <div>
                <Label className="text-xs">Facebook</Label>
                <Input value={value.footer.facebook} onChange={(e) => set("footer", { facebook: e.target.value })} placeholder="https://" />
              </div>
              <div>
                <Label className="text-xs">YouTube</Label>
                <Input value={value.footer.youtube} onChange={(e) => set("footer", { youtube: e.target.value })} placeholder="https://" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Texto de copyright</Label>
              <Input
                value={value.footer.copyright}
                onChange={(e) => set("footer", { copyright: e.target.value })}
                placeholder="Vazio = © ano + nome da loja"
              />
            </div>
            {row("Exibir páginas criadas no rodapé", value.footer.showPages, (v) => set("footer", { showPages: v }))}
            {value.footer.showPages && (
              <div>
                <Label className="text-xs">Título da coluna de páginas</Label>
                <Input
                  value={value.footer.pagesTitle}
                  onChange={(e) => set("footer", { pagesTitle: e.target.value })}
                  placeholder="Páginas"
                />
              </div>
            )}
            {row("Exibir crédito Out App", value.footer.showCredits, (v) => set("footer", { showCredits: v }))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
