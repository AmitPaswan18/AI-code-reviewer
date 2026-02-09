import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/mock-data";

export function RiskBadge({
  level,
  score,
}: {
  level: RiskLevel;
  score?: number;
}) {
  const colors: Record<RiskLevel, string> = {
    low: "bg-risk-low/15 text-success border-success/20",
    medium: "bg-warning/15 text-warning border-warning/20",
    high: "bg-risk-high/15 text-destructive border-destructive/20",
    critical: "bg-risk-critical/15 text-risk-critical border-risk-critical/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-medium rounded-md border",
        colors[level],
      )}>
      <span
        className={cn("risk-dot", {
          "bg-success": level === "low",
          "bg-warning": level === "medium",
          "bg-destructive": level === "high",
          "bg-risk-critical": level === "critical",
        })}
      />
      {score !== undefined ? score : level.toUpperCase()}
    </span>
  );
}
