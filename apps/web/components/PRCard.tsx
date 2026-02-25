import { cn } from "@/lib/utils";
import { RiskBadge } from "./Indicator";
import { StatusIndicator } from "./StatusIndicator";
import type { PRData } from "@/lib/mock-data";
import { GitPullRequest, FileText, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface PRCardProps {
  pr: PRData;
  index?: number;
}

export function PRCard({ pr, index = 0 }: PRCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}>
      <Link
        href={`/pr/${pr.id}`}
        className="block glass rounded-lg p-4 hover:bg-accent/50 transition-colors group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <GitPullRequest className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-mono text-muted-foreground">
                {pr.repo}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                #{pr.number}
              </span>
            </div>
            <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {pr.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-secondary-foreground">
                  {pr.authorAvatar}
                </div>
                <span className="text-xs text-muted-foreground">
                  {pr.author}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {pr.createdAt}
              </span>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="flex items-center gap-0.5 text-success">
                  <Plus className="w-3 h-3" />
                  {pr.additions}
                </span>
                <span className="flex items-center gap-0.5 text-destructive">
                  <Minus className="w-3 h-3" />
                  {pr.deletions}
                </span>
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                {pr.filesChanged} files
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <RiskBadge level={pr.riskLevel} score={pr.riskScore} />
            <StatusIndicator status={pr.status} />
          </div>
        </div>
        {pr.reviewFindings.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {pr.reviewFindings.length} finding
              {pr.reviewFindings.length > 1 ? "s" : ""} ·{" "}
              {
                pr.reviewFindings.filter(
                  (f) => f.severity === "critical" || f.severity === "high",
                ).length
              }{" "}
              critical/high
            </span>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
