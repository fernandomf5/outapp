import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldEditor } from "./BlockInspector";
import { ElementStyle, SiteElement, getElementDef } from "./elementTypes";
import { SiteTheme } from "./siteTypes";

interface Props {
  element: SiteElement;
  theme: SiteTheme;
  onChange: (element: SiteElement) => void;
  onDelete: () => void;
}

const NUMBER_CONTROLS: { key: keyof ElementStyle; label: string; min: number; max: number; step: number }[] = [
  { key: "fontSize", label: "Tamanho da fonte", min: 8, max: 96, step: 1 },
  { key: "fontWeight", label: "Espessura", min: 300, max: 900, step: 100 },
  { key: "paddingY", label: "Espaço interno (vertical)", min: 0, max: 80, step: 2 },
  { key: "paddingX", label: "Espaço interno (horizontal)", min: 0, max: 80, step: 2 },
  { key: "marginTop", label: "Espaço acima", min: 0, max: 120, step: 2 },
  { key: "marginBottom", label: "Espaço abaixo", min: 0, max: 120, step: 2 },
  { key: "radius", label: "Arredondamento", min: 0, max: 60, step: 2 },
  { key: "maxWidth", label: "Largura máxima (px)", min: 0, max: 1200, step: 20 },
  { key: "borderWidth", label: "Borda", min: 0, max: 12, step: 1 },
];

/** Painel de edição de conteúdo e estilo de um elemento. */
export function ElementInspector({ element, theme, onChange, onDelete }: Props) {
  const def = getElementDef(element.type);
  const style: ElementStyle = element.style || {};

  const setProp = (key: string, value: unknown) =>
    onChange({ ...element, props: { ...element.props, [key]: value } });

  const setStyle = (key: keyof ElementStyle, value: unknown) =>
    onChange({ ...element, style: { ...style, [key]: value } as ElementStyle });

  const clearStyle = (key: keyof ElementStyle) => {
    const next = { ...style };
    delete next[key];
    onChange({ ...element, style: next });
  };

  const Icon = ((Icons as any)[def?.icon || "Square"] || Icons.Square) as React.ComponentType<{ className?: string }>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {def?.label || element.type}
        </div>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
          <Icons.Trash2 className="h-4 w-4 mr-1" /> Remover
        </Button>
      </div>

      <Tabs defaultValue="conteudo">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
          <TabsTrigger value="estilo">Estilo</TabsTrigger>
        </TabsList>

        <TabsContent value="conteudo" className="space-y-4 pt-4">
          {(def?.fields || []).map((f) => (
            <FieldEditor key={f.key} field={f} value={element.props?.[f.key]} onChange={(v) => setProp(f.key, v)} />
          ))}
          {!def?.fields?.length && (
            <p className="text-sm text-muted-foreground">Este elemento não possui campos de conteúdo.</p>
          )}
        </TabsContent>

        <TabsContent value="estilo" className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Alinhamento</Label>
            <div className="grid grid-cols-3 gap-1">
              {([
                ["left", Icons.AlignLeft, "Esquerda"],
                ["center", Icons.AlignCenter, "Centro"],
                ["right", Icons.AlignRight, "Direita"],
              ] as const).map(([value, Ico, label]) => (
                <Button
                  key={value}
                  size="sm"
                  aria-label={label}
                  variant={style.align === value ? "default" : "outline"}
                  onClick={() => setStyle("align", value)}
                >
                  <Ico className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          {([
            ["color", "Cor do texto/ícone"],
            ["background", "Cor de fundo"],
            ["borderColor", "Cor da borda"],
          ] as const).map(([key, label]) => {
            const current = style[key] as string | undefined;
            return (
              <div key={key} className="space-y-1.5">
                <Label className="text-sm">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={label}
                    className="h-9 w-12 rounded border bg-transparent"
                    value={current || theme.text || "#000000"}
                    onChange={(e) => setStyle(key, e.target.value)}
                  />
                  <Input
                    value={current ?? ""}
                    placeholder="Padrão do site"
                    onChange={(e) => setStyle(key, e.target.value)}
                  />
                  {current && (
                    <Button size="icon" variant="ghost" aria-label={`Limpar ${label}`} onClick={() => clearStyle(key)}>
                      <Icons.X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {NUMBER_CONTROLS.map(({ key, label, min, max, step }) => {
            const value = style[key] as number | undefined;
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">
                    {label}: {value ?? "auto"}
                  </Label>
                  {value !== undefined && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => clearStyle(key)}>
                      auto
                    </Button>
                  )}
                </div>
                <Slider
                  value={[value ?? min]}
                  min={min}
                  max={max}
                  step={step}
                  onValueChange={([v]) => setStyle(key, v)}
                />
              </div>
            );
          })}

          <div className="space-y-1.5">
            <Label className="text-sm">Sombra</Label>
            <Select value={style.shadow || "none"} onValueChange={(v) => setStyle("shadow", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[300]">
                <SelectItem value="none">Sem sombra</SelectItem>
                <SelectItem value="sm">Leve</SelectItem>
                <SelectItem value="md">Média</SelectItem>
                <SelectItem value="lg">Forte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
