import { useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface Node {
  id: number;
  x: number;
  y: number;
  size: number;
  pulseDelay: number;
}

/**
 * Fundo animado estilo "tecnológico" para a primeira seção.
 * Grid 3D, partículas, constelação e scanner, tudo em CSS/SVG leve.
 * Acompanha a cor primária configurada via variáveis CSS.
 */
export const HeroBackground = () => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 42 }).map((_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      size: 1 + Math.random() * 2.5,
      duration: 12 + Math.random() * 18,
      delay: Math.random() * -20,
      opacity: 0.25 + Math.random() * 0.45,
    }));
  }, []);

  const nodes = useMemo<Node[]>(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 70,
      size: 1.5 + Math.random() * 2,
      pulseDelay: Math.random() * 4,
    }));
  }, []);

  const connectionLines = useMemo(() => {
    const lines: Array<{ id: number; x1: number; y1: number; x2: number; y2: number; opacity: number }> = [];
    let id = 0;
    const threshold = 28;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < threshold) {
          lines.push({
            id: id++,
            x1: a.x,
            y1: a.y,
            x2: b.x,
            y2: b.y,
            opacity: 0.08 + (threshold - dist) / threshold * 0.22,
          });
        }
      }
    }
    return lines;
  }, [nodes]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Deep base gradient that follows the primary color */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(var(--primary-glow-hsl, 116 78% 62%) / 0.28) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, hsl(var(--primary-hsl, 116 62% 38%) / 0.18) 0%, transparent 50%), linear-gradient(180deg, hsl(var(--background) / 0.05) 0%, hsl(130 25% 6% / 0.45) 100%)",
        }}
      />

      {/* Animated 3D perspective grid */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div
          className="absolute left-1/2 top-1/2 w-[200vw] h-[140vh] -translate-x-1/2 -translate-y-[35%]"
          style={{
            perspective: "800px",
          }}
        >
          <div
            className="absolute inset-0 origin-top"
            style={{
              transform: "rotateX(60deg) translateY(-10%)",
              backgroundImage: `
                linear-gradient(to right, hsl(var(--primary-hsl, 116 62% 38%) / 0.12) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--primary-hsl, 116 62% 38%) / 0.12) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 75%)",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 75%)",
              animation: "heroGridMove 22s linear infinite",
            }}
          />
        </div>
      </div>

      {/* Subtle noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: "hsl(var(--primary-glow-hsl, 116 78% 62%))",
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 3}px hsl(var(--primary-glow-hsl, 116 78% 62%) / 0.7)`,
              animation: `heroFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Constellation network */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {connectionLines.map((line) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="hsl(var(--primary-glow-hsl, 116 78% 62%))"
            strokeWidth={0.12}
            opacity={line.opacity}
          />
        ))}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size * 0.35}
              fill="hsl(var(--primary-hsl, 116 62% 38%))"
              opacity={0.65}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill="none"
              stroke="hsl(var(--primary-glow-hsl, 116 78% 62%))"
              strokeWidth={0.15}
              opacity={0.35}
              style={{
                animation: `heroPulse 4s ease-in-out ${node.pulseDelay}s infinite`,
              }}
            />
          </g>
        ))}
      </svg>

      {/* Horizontal scanner beam */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 45%, hsl(var(--primary-glow-hsl, 116 78% 62%) / 0.08) 50%, transparent 55%)",
          backgroundSize: "100% 200%",
          backgroundPosition: "0% 0%",
          animation: "heroScanner 8s ease-in-out infinite",
        }}
      />

      {/* Vignette to keep text readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 0%, hsl(130 25% 6% / 0.55) 80%)",
        }}
      />
    </div>
  );
};
