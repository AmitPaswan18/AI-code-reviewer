"use client";

import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useGetPullRequestById } from "@/hooks/use-github";
import { AppLayout } from "@/components/AppLayout";
import { Loader2, ArrowLeft, GitPullRequest, AlertTriangle, FileText, Plus, Minus, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/Indicator";
import { StatusIndicator } from "@/components/StatusIndicator";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function PRDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();

  const { data: pr, isLoading, error } = useGetPullRequestById(user?.id || "", id);

  return (
    <AppLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 mb-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading Pull Request details...</p>
          </div>
        ) : error || !pr ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to load Review</h2>
            <p className="text-muted-foreground mb-6">We couldn't fetch this pull request review or it doesn't exist.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6 border-l-4 border-l-primary/60">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <GitPullRequest className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-mono text-muted-foreground">{pr.repository.repoFullName}</span>
                    <span className="text-sm font-mono text-muted-foreground">#{pr.prNumber}</span>
                    <StatusIndicator status={pr.reviewStatus} />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-4">{pr.title}</h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{pr.author}</span>
                    </span>
                    <span>•</span>
                    <span>{format(new Date(pr.createdAt), "PPP")}</span>
                    <span>•</span>
                    <span className="font-mono bg-muted px-2 py-0.5 rounded">{pr.baseBranch} ← {pr.headBranch}</span>
                    <span>•</span>
                    <span className="font-mono text-xs">{pr.commitSha.substring(0, 7)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 min-w-[150px]">
                    <RiskBadge score={pr.riskScore ?? 0} level={pr.riskScore > 75 ? 'critical' : pr.riskScore > 50 ? 'high' : pr.riskScore > 25 ? 'medium' : 'low'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    AI Review Summary
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    {pr.aiSummary ? (
                       <ReactMarkdown>{pr.aiSummary}</ReactMarkdown>
                    ) : (
                      <p>No summary explicitly generated. Awaiting review.</p>
                    )}
                  </div>
                </div>

                <div className="glass rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    Detailed Findings ({pr.reviewComments?.length || 0})
                  </h3>
                  
                  {pr.reviewComments && pr.reviewComments.length > 0 ? (
                    <div className="space-y-4">
                      {pr.reviewComments.map((comment: any) => (
                        <div key={comment.id} className="p-4 rounded-lg bg-background border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                comment.severity === 'CRITICAL' ? 'bg-destructive/20 text-destructive' :
                                comment.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                                comment.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-600' :
                                'bg-blue-500/20 text-blue-500'
                            }`}>
                                {comment.severity}
                            </span>
                            <span className="text-xs font-medium text-foreground px-2 py-1 rounded bg-muted">
                                {comment.commentType}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-3">{comment.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                     <div className="text-center py-8">
                        <CheckCircle className="w-10 h-10 text-success mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground text-sm">No issues or suggestions were found! The code looks solid.</p>
                     </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass rounded-xl p-6">
                  <h3 className="text-sm font-semibold mb-3">Original Description</h3>
                  <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-border/50 max-h-[300px] overflow-y-auto">
                    {pr.description ? pr.description : <span className="italic">No description provided.</span>}
                  </div>
                </div>

                <div className="glass rounded-xl p-6">
                  <h3 className="text-sm font-semibold mb-3">Repository Links</h3>
                  <Button variant="outline" className="w-full justify-between" asChild>
                    <a href={`https://github.com/${pr.repository.repoFullName}/pull/${pr.prNumber}`} target="_blank" rel="noopener noreferrer">
                      View on GitHub
                      <GitPullRequest className="w-4 h-4 ml-2 text-muted-foreground" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
