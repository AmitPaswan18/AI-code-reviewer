"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import { RiskBadge } from "@/components/Indicator";
import { StatusIndicator } from "@/components/StatusIndicator";
import { FindingCard } from "@/components/FindingCard";
import { mockPRs, ReviewFinding } from "@/lib/mock-data";
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  FileText,
  Plus,
  Minus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const PRDetail = () => {
  const params = useParams();
  const id = params?.id as string;
  const pr = mockPRs.find((p) => p.id === id);
  const [streamedFindings, setStreamedFindings] = useState<ReviewFinding[]>([]);

  useEffect(() => {
    if (!pr) return;
    if (pr.status === "completed") {
      setStreamedFindings(pr.reviewFindings);
      return;
    }
    // Simulate streaming for non-completed PRs
    let i = 0;
    const interval = setInterval(() => {
      if (i < pr.reviewFindings.length) {
        setStreamedFindings((prev: any) => [...prev, pr.reviewFindings[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [pr]);

  if (!pr) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">PR not found</p>
          <Link
            href="/"
            className="text-primary text-sm mt-2 inline-block hover:underline">
            Back to dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  const criticalCount = pr.reviewFindings.filter(
    (f) => f.severity === "critical",
  ).length;
  const highCount = pr.reviewFindings.filter(
    (f) => f.severity === "high",
  ).length;
  const mediumCount = pr.reviewFindings.filter(
    (f) => f.severity === "medium",
  ).length;
  const lowCount = pr.reviewFindings.filter((f) => f.severity === "low").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to dashboard
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">
                  {pr.repo} #{pr.number}
                </span>
                <StatusIndicator status={pr.status} />
              </div>
              <h1 className="text-lg font-semibold text-foreground">
                {pr.title}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[9px] font-medium text-secondary-foreground">
                    {pr.authorAvatar}
                  </div>
                  {pr.author}
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5" />
                  {pr.branch}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <GitCommit className="w-3.5 h-3.5" />
                  {pr.commitSHA}
                </span>
                <span>{pr.createdAt}</span>
              </div>
            </div>
            <RiskBadge level={pr.riskLevel} score={pr.riskScore} />
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="glass rounded-lg px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Files Changed</p>
            <p className="text-lg font-mono font-semibold text-foreground flex items-center justify-center gap-1">
              <FileText className="w-4 h-4 text-muted-foreground" />
              {pr.filesChanged}
            </p>
          </div>
          <div className="glass rounded-lg px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Additions</p>
            <p className="text-lg font-mono font-semibold text-success flex items-center justify-center gap-1">
              <Plus className="w-4 h-4" />
              {pr.additions}
            </p>
          </div>
          <div className="glass rounded-lg px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Deletions</p>
            <p className="text-lg font-mono font-semibold text-destructive flex items-center justify-center gap-1">
              <Minus className="w-4 h-4" />
              {pr.deletions}
            </p>
          </div>
          <div className="glass rounded-lg px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Findings</p>
            <p className="text-lg font-mono font-semibold text-foreground">
              {pr.reviewFindings.length}
            </p>
          </div>
        </div>

        {/* Risk summary */}
        {pr.reviewFindings.length > 0 && (
          <div className="glass rounded-lg px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Risk Breakdown
            </p>
            <div className="flex items-center gap-4 text-xs font-mono">
              {criticalCount > 0 && (
                <span className="text-risk-critical">
                  {criticalCount} critical
                </span>
              )}
              {highCount > 0 && (
                <span className="text-destructive">{highCount} high</span>
              )}
              {mediumCount > 0 && (
                <span className="text-warning">{mediumCount} medium</span>
              )}
              {lowCount > 0 && (
                <span className="text-success">{lowCount} low</span>
              )}
            </div>
          </div>
        )}

        {/* Findings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-foreground">
              AI Review Findings
            </h2>
            {pr.status === "streaming" && (
              <span className="text-xs text-info animate-pulse">
                Streaming results...
              </span>
            )}
          </div>
          {streamedFindings.length === 0 && pr.status !== "streaming" ? (
            <div className="glass rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No findings — this PR looks clean! ✨
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {streamedFindings.map((finding: any, i: any) => (
                <FindingCard key={finding.id} finding={finding} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Feedback actions */}
        <div className="glass rounded-lg p-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Was this review helpful?
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5" /> Helpful
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <ThumbsDown className="w-3.5 h-3.5" /> Not helpful
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Comment
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PRDetail;
