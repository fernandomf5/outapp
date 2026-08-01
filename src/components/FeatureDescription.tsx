import { useState } from "react";

interface FeatureDescriptionProps {
  text: string;
  /** Acima deste tamanho, mostra "Ver mais" */
  limit?: number;
  className?: string;
}

export const FeatureDescription = ({ text, limit = 160, className = "" }: FeatureDescriptionProps) => {
  const [expanded, setExpanded] = useState(false);
  const value = text || "";
  const isLong = value.length > limit;

  return (
    <div className={className}>
      <p className="card-3d-layer text-[10px] xs:text-xs sm:text-sm md:text-base 3xl:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
        {isLong && !expanded ? `${value.slice(0, limit).trimEnd()}…` : value}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="card-3d-layer mt-1.5 text-[10px] xs:text-xs sm:text-sm font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-expanded={expanded}
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  );
};
