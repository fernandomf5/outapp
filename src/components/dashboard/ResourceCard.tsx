import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceCardProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export const ResourceCard = ({
  title,
  icon,
  onClick,
}: ResourceCardProps) => {

  return (
    <div
      className="group relative flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-smooth cursor-pointer h-full"
      onClick={onClick}
    >
      <div className="bg-primary/10 p-2.5 rounded-xl shrink-0 group-hover:bg-primary/20 transition-smooth">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm sm:text-base font-bold truncate group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
    </div>
  );
};
