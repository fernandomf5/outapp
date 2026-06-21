import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pen, Type, Eraser } from "lucide-react";

interface Props {
  /** Called with PNG dataURL whenever signature changes, or null when cleared */
  onChange: (dataUrl: string | null) => void;
  /** Pre-fill the typed name field */
  defaultName?: string;
  /** Font choices for typed signature */
}

const TYPED_FONTS = [
  { label: "Cursiva Clássica", value: "'Great Vibes', cursive" },
  { label: "Manuscrita Elegante", value: "'Allura', cursive" },
  { label: "Assinatura Casual", value: "'Sacramento', cursive" },
  { label: "Caligrafia Moderna", value: "'Dancing Script', cursive" },
];

// Inject Google Font once
let fontsInjected = false;
function ensureFonts() {
  if (fontsInjected || typeof document === "undefined") return;
  fontsInjected = true;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Allura&family=Sacramento&family=Dancing+Script:wght@500;700&display=swap";
  document.head.appendChild(link);
}

export default function SignaturePadField({ onChange, defaultName = "" }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [size, setSize] = useState({ w: 600, h: 200 });
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState(defaultName);
  const [typedFont, setTypedFont] = useState(TYPED_FONTS[0].value);

  useEffect(() => ensureFonts(), []);

  // Resize the canvas to match its CSS size so pointer coordinates align
  useEffect(() => {
    if (mode !== "draw") return;
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(200, Math.floor(rect.width));
      const h = 200;
      setSize({ w, h });
      // After resize the canvas is cleared by signature_pad
      onChange(null);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Generate typed signature image
  useEffect(() => {
    if (mode !== "type") return;
    if (!typedName.trim()) {
      onChange(null);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0a0a0a";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    // Fit text within canvas
    let fontSize = 90;
    ctx.font = `${fontSize}px ${typedFont}`;
    while (ctx.measureText(typedName).width > canvas.width - 40 && fontSize > 24) {
      fontSize -= 4;
      ctx.font = `${fontSize}px ${typedFont}`;
    }
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
    onChange(canvas.toDataURL("image/png"));
  }, [mode, typedName, typedFont, onChange]);

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onChange(sigRef.current.toDataURL("image/png"));
    } else {
      onChange(null);
    }
  };

  const clear = () => {
    sigRef.current?.clear();
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "draw" | "type")}>
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="draw"><Pen className="h-4 w-4 mr-1" />Desenhar</TabsTrigger>
          <TabsTrigger value="type"><Type className="h-4 w-4 mr-1" />Digitada</TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="mt-2">
          <div ref={wrapRef} className="border rounded bg-white overflow-hidden" style={{ touchAction: "none" }}>
            <SignatureCanvas
              ref={sigRef}
              canvasProps={{
                width: size.w,
                height: size.h,
                style: { width: "100%", height: `${size.h}px`, display: "block", touchAction: "none" },
              }}
              minWidth={0.8}
              maxWidth={2.2}
              velocityFilterWeight={0.7}
              throttle={8}
              onEnd={handleEnd}
            />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={clear} className="mt-1">
            <Eraser className="h-4 w-4 mr-1" />Limpar
          </Button>
        </TabsContent>

        <TabsContent value="type" className="mt-2 space-y-2">
          <div>
            <Label className="text-xs">Seu nome (será sua assinatura)</Label>
            <Input value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder="Digite seu nome completo" />
          </div>
          <div>
            <Label className="text-xs">Estilo</Label>
            <div className="grid grid-cols-2 gap-2">
              {TYPED_FONTS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setTypedFont(f.value)}
                  className={`border rounded p-2 bg-white text-center transition ${
                    typedFont === f.value ? "border-primary ring-2 ring-primary/30" : "border-muted hover:border-primary/50"
                  }`}
                >
                  <span style={{ fontFamily: f.value, fontSize: 28, color: "#0a0a0a" }}>
                    {typedName.trim() || "Assinatura"}
                  </span>
                  <div className="text-[10px] text-muted-foreground mt-1">{f.label}</div>
                </button>
              ))}
            </div>
          </div>
          {typedName.trim() && (
            <div className="border rounded bg-white p-4 text-center">
              <span style={{ fontFamily: typedFont, fontSize: 56, color: "#0a0a0a" }}>{typedName}</span>
              <p className="text-xs text-muted-foreground mt-2">Confirme sua assinatura clicando no botão abaixo.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
