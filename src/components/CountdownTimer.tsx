import { useEffect, useState } from "react";

interface Props {
  endsAt: string | Date;
  label?: string;
  bgColor?: string;
  textColor?: string;
  className?: string;
}

export function CountdownTimer({ endsAt, label, bgColor = "#111827", textColor = "#ffffff", className }: Props) {
  const target = typeof endsAt === "string" ? new Date(endsAt).getTime() : endsAt.getTime();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const Box = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center px-2 py-1 rounded min-w-[44px]" style={{ background: "rgba(255,255,255,0.12)" }}>
      <span className="font-bold text-lg leading-none tabular-nums">{String(v).padStart(2, "0")}</span>
      <span className="text-[10px] uppercase opacity-80">{l}</span>
    </div>
  );

  return (
    <div
      className={`rounded-lg p-3 my-3 ${className || ""}`}
      style={{ background: bgColor, color: textColor }}
    >
      {label && <div className="text-xs font-medium mb-2 text-center">{label}</div>}
      <div className="flex items-center justify-center gap-2">
        <Box v={days} l="dias" />
        <Box v={hours} l="hs" />
        <Box v={minutes} l="min" />
        <Box v={seconds} l="seg" />
      </div>
    </div>
  );
}
