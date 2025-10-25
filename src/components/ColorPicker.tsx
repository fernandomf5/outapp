import { Suspense, lazy } from "react";

const Picker = lazy(() => import("react-colorful").then(m => ({ default: m.HexColorPicker })));

type Props = {
  color: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ color, onChange }: Props) {
  return (
    <Suspense fallback={<div className="h-36 flex items-center justify-center text-sm text-muted-foreground">Carregando…</div>}>
      <Picker color={color} onChange={onChange} />
    </Suspense>
  );
}
