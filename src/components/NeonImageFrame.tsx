interface NeonImageFrameProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Moldura com borda arredondada, brilho neon e uma luz "viva" girando ao redor.
 */
export const NeonImageFrame = ({ src, alt, className = "" }: NeonImageFrameProps) => {
  return (
    <div className={`neon-frame relative w-full rounded-2xl sm:rounded-3xl p-[2px] ${className}`}>
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-background">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-auto block"
        />
      </div>
    </div>
  );
};
