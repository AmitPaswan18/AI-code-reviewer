import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/lib/mock-data";
import { CheckCircle, Loader2, Clock, XCircle } from "lucide-react";

export function StatusIndicator({ status }: { status: ReviewStatus }) {
  const config: Record<
    ReviewStatus,
    { icon: React.ReactNode; label: string; className: string }
  > = {
    pending: {
      icon: <Clock className="w-3.5 h-3.5" />,
      label: "Pending",
      className: "text-muted-foreground",
    },
    streaming: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: "Reviewing",
      className: "text-info",
    },
    completed: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: "Completed",
      className: "text-success",
    },
    failed: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: "Failed",
      className: "text-destructive",
    },
  };

  const { icon, label, className } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        className,
      )}>
      {icon}
      {label}
    </span>
  );
}
