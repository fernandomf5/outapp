import { useState, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  buttonText?: string;
}

export const ResourceCard = ({
  title,
  description,
  icon,
  onClick,
  buttonText = "Acessar",
}: ResourceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Check if text is overflowing after render
  useState(() => {
    setTimeout(() => {
      if (textRef.current) {
        setIsOverflowing(textRef.current.scrollHeight > textRef.current.clientHeight);
      }
    }, 0);
  });

  return (
    <div
      className="group relative flex flex-col bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/50 transition-smooth cursor-pointer h-full"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-auto">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-lg sm:text-xl font-bold mb-2 truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="relative">
            <p
              ref={textRef}
              className={cn(
                "text-sm sm:text-base text-muted-foreground transition-all duration-300",
                !isExpanded && "line-clamp-2 md:line-clamp-3"
              )}
            >
              {description}
            </p>
            {isOverflowing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-xs text-primary hover:underline mt-1 flex items-center gap-1 font-medium"
              >
                {isExpanded ? (
                  <>
                    Ver menos <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Ver mais <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="bg-primary/10 p-2.5 sm:p-3 rounded-xl shrink-0 group-hover:bg-primary/20 transition-smooth">
          {icon}
        </div>
      </div>
      <div className="mt-4 pt-2">
        <button
          className="w-full py-2 sm:py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity gradient-primary"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};
