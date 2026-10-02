import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type FinancialMetricTone = "neutral" | "positive" | "negative" | "warning" | "info";

interface FinancialMetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  tone?: FinancialMetricTone;
  emphasized?: boolean;
}

const toneClasses: Record<FinancialMetricTone, { icon: string; value: string; surface: string }> = {
  neutral: {
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
    surface: "border-border bg-card",
  },
  positive: {
    icon: "bg-success/10 text-success",
    value: "text-success",
    surface: "border-success/25 bg-success/5",
  },
  negative: {
    icon: "bg-destructive/10 text-destructive",
    value: "text-destructive",
    surface: "border-destructive/25 bg-destructive/5",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    value: "text-warning",
    surface: "border-warning/30 bg-warning/5",
  },
  info: {
    icon: "bg-info/10 text-info",
    value: "text-info",
    surface: "border-info/25 bg-info/5",
  },
};

export function FinancialMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
  emphasized = false,
}: FinancialMetricCardProps) {
  const styles = toneClasses[tone];

  return (
    <Card className={cn("overflow-hidden shadow-sm transition-shadow hover:shadow-md", styles.surface, emphasized && "ring-1 ring-inset ring-current/10")}>
      <CardContent className="p-4">
        <div className="mb-5 flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", styles.icon)}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className={cn("text-xl font-bold tabular-nums", styles.value)}>{value}</p>
        <p className="mt-1 min-h-4 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}