import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaptureTheme, DEFAULT_THEME, FONT_OPTIONS, THEME_PRESETS } from "./captureTypes";
import { CaptureImageInput } from "./CaptureImageInput";

interface Props {
  theme: CaptureTheme;
  onChange: (theme: CaptureTheme) => void;
}

const ColorRow = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex items-center justify-between gap-3">
    <Label className="text-xs">{label}</Label>
    <div className="flex items-center gap-2">
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-28 text-xs" />
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border bg-transparent"
        aria-label={label}
      />
    </div>
  </div>
);

const SliderRow = ({ label, value, min, max, step = 1, suffix = "px", onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) => (
  <div>
    <div className="mb-1 flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <span className="text-xs text-muted-foreground">{value}{suffix}</span>
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
  </div>
);

export const CaptureThemeEditor = ({ theme, onChange }: Props) => {
  const t = { ...DEFAULT_THEME, ...theme };
  const set = (patch: Partial<CaptureTheme>) => onChange({ ...t, ...patch });

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <Label className="text-sm font-semibold">Temas prontos</Label>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((p) => (
            <Button key={p.name} variant="outline" size="sm" className="h-8 text-xs" onClick={() => set(p.theme)}>
              <span className="mr-2 flex gap-1">
                <span className="h-3 w-3 rounded-full" style={{ background: p.theme.background }} />
                <span className="h-3 w-3 rounded-full" style={{ background: p.theme.primary }} />
              </span>
              {p.name}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <Label className="text-sm font-semibold">Cores</Label>
        <ColorRow label="Fundo da página" value={t.background} onChange={(v) => set({ background: v })} />
        <ColorRow label="Fundo dos cards" value={t.surface} onChange={(v) => set({ surface: v })} />
        <ColorRow label="Cor do texto" value={t.textColor} onChange={(v) => set({ textColor: v })} />
        <ColorRow label="Texto secundário" value={t.mutedTextColor} onChange={(v) => set({ mutedTextColor: v })} />
        <ColorRow label="Cor principal" value={t.primary} onChange={(v) => set({ primary: v })} />
        <ColorRow label="Texto do botão" value={t.primaryText} onChange={(v) => set({ primaryText: v })} />
        <ColorRow label="Cor da borda" value={t.borderColor} onChange={(v) => set({ borderColor: v })} />
      </Card>

      <Card className="space-y-3 p-4">
        <Label className="text-sm font-semibold">Imagem de fundo</Label>
        <CaptureImageInput value={t.backgroundImage} onChange={(v) => set({ backgroundImage: v })} />
        {t.backgroundImage && <SliderRow label="Escurecer fundo" value={t.backgroundOverlay} min={0} max={95} suffix="%" onChange={(v) => set({ backgroundOverlay: v })} />}
      </Card>

      <Card className="space-y-3 p-4">
        <Label className="text-sm font-semibold">Tipografia e espaçamento</Label>
        <div>
          <Label className="text-xs">Fonte</Label>
          <Select value={t.fontFamily} onValueChange={(v) => set({ fontFamily: v })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[200]">
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <SliderRow label="Tamanho base do texto" value={t.baseFontSize} min={13} max={22} onChange={(v) => set({ baseFontSize: v })} />
        <SliderRow label="Escala dos títulos" value={t.headingScale} min={0.7} max={1.6} step={0.05} suffix="x" onChange={(v) => set({ headingScale: v })} />
        <SliderRow label="Espaço entre seções" value={t.sectionSpacing} min={16} max={120} onChange={(v) => set({ sectionSpacing: v })} />
        <SliderRow label="Largura do conteúdo" value={t.contentWidth} min={600} max={1280} step={20} onChange={(v) => set({ contentWidth: v })} />
      </Card>

      <Card className="space-y-3 p-4">
        <Label className="text-sm font-semibold">Bordas, botões e efeitos</Label>
        <SliderRow label="Arredondamento geral" value={t.radius} min={0} max={36} onChange={(v) => set({ radius: v })} />
        <SliderRow label="Arredondamento dos botões" value={t.buttonRadius} min={0} max={999} onChange={(v) => set({ buttonRadius: v })} />
        <div>
          <Label className="text-xs">Estilo do botão</Label>
          <Select value={t.buttonStyle} onValueChange={(v: any) => set({ buttonStyle: v })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[200]">
              <SelectItem value="solid">Sólido</SelectItem>
              <SelectItem value="outline">Contorno</SelectItem>
              <SelectItem value="soft">Suave</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Animação das seções</Label>
          <Select value={t.animation} onValueChange={(v: any) => set({ animation: v })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[200]">
              <SelectItem value="none">Sem animação</SelectItem>
              <SelectItem value="fade">Suave (fade)</SelectItem>
              <SelectItem value="slide-up">Subir</SelectItem>
              <SelectItem value="zoom">Zoom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
};

export default CaptureThemeEditor;
