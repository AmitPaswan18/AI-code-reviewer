import { cn } from "@/lib/utils";
import type { ReviewFinding } from "@/lib/mock-data";
import { RiskBadge } from "./Indicator";
import { FileCode, Lightbulb, Bot } from "lucide-react";
import { motion } from "framer-motion";

interface FindingCardProps {
  finding: ReviewFinding;
  index?: number;
}

const agentLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  planner: { label: "Planner", icon: <Lightbulb className="w-3.5 h-3.5" /> },
  reviewer: { label: "Reviewer", icon: <Bot className="w-3.5 h-3.5" /> },
  testgen: { label: "TestGen", icon: <FileCode className="w-3.5 h-3.5" /> },
};

export function FindingCard({ finding, index = 0 }: FindingCardProps) {
  const agent = agentLabels[finding.agent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="glass rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              {agent.icon}
              {agent.label}
            </span>
            <RiskBadge level={finding.severity} />
          </div>
          <h4 className="text-sm font-medium text-foreground">
            {finding.title}
          </h4>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {finding.description}
      </p>

      {finding.file && (
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
          <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{finding.file}</span>
          {finding.line && (
            <span className="text-primary">:{finding.line}</span>
          )}
        </div>
      )}

      {finding.suggestion && (
        <div className="flex items-start gap-2 text-xs bg-primary/5 border border-primary/10 rounded px-3 py-2">
          <Lightbulb className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-foreground/80">{finding.suggestion}</span>
        </div>
      )}
    </motion.div>
  );
}
