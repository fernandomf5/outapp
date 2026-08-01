interface FeatureDescriptionProps {
  text: string;
  className?: string;
}

export const FeatureDescription = ({ text, className = "" }: FeatureDescriptionProps) => {
  return (
    <div className={className}>
      <p className="card-3d-layer text-[10px] xs:text-xs sm:text-sm md:text-base 3xl:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
        {text || ""}
      </p>
    </div>
  );
};
