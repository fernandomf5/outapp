import { useRef, type ReactNode } from "react";

interface Feature3DCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const MAX_TILT = 9;

/**
 * Card com efeito 3D: inclinação seguindo o cursor, brilho radial e reflexo.
 */
export const Feature3DCard = ({ children, className = "", style }: Feature3DCardProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--ry", `${(x - 0.5) * MAX_TILT * 2}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * MAX_TILT * 2}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`feature-card-3d ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};
