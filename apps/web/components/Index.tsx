import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { PRCard } from "@/components/PRCard";
import { mockStats, mockPRs } from "@/lib/mock-data";
import {
  GitPullRequest,
  Shield,
  Clock,
  Bug,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

import { useUser } from "@clerk/nextjs";
import { useDashboardStats, useRecentPRs } from "@/hooks/use-dashboard";
import { useSyncUser } from "@/hooks/use-user";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import apiService from "@/services/api";
import { useGetUser, useDisconnectGithub } from "@/hooks/use-user";
import { useSearchParams, useRouter } from "next/navigation";

const Dashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const { data: stats, isLoading: statsLoading } = useDashboardStats(user?.id);
  const { data: recentIPrs, isLoading: prsLoading } = useRecentPRs(user?.id);
  const { data: dbUser } = useGetUser(user?.id);

  const syncUserMutation = useSyncUser();
  const disconnectGithubMutation = useDisconnectGithub();

  const isGithubConnected = dbUser?.user?.githubUsername;

  console.log("Db user", dbUser);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncUserMutation.mutate({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        fullName: user.fullName,
        avatarUrl: user.imageUrl,
      });
    }
  }, [isLoaded, isSignedIn, user?.id]);

  // Handle GitHub callback params
  useEffect(() => {
    const githubStatus = searchParams.get("github");
    if (githubStatus === "connected") {
      // Show success toast or clean URL
      router.replace("/");
    }
  }, [searchParams, router]);

  const handleConnectGithub = async () => {
    if (!user?.id) return;
    try {
      const { authUrl } = await apiService.getGithubAuthUrl(user.id);
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to get auth URL", error);
    }
  };

  const displayStats = stats || mockStats;
  const displayPRs = recentIPrs?.prs || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Welcome back, {user?.firstName || "Guest"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered PR review insights for your team
            </p>
          </div>
          <div>
            {isGithubConnected ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Connected as {dbUser?.user?.githubUsername}
                </span>
                <Dialog
                  open={isDisconnectOpen}
                  onOpenChange={setIsDisconnectOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-400 hover:bg-red-500 text-white hover:text-white border-red-500 hover:border-red-600">
                      Disconnect GitHub
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Disconnect GitHub Account</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to disconnect your GitHub account?
                        This will revoke access permissions and you will need to
                        re-authorize the application next time you connect.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDisconnectOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (user?.id) {
                            disconnectGithubMutation.mutate(user.id);
                            setIsDisconnectOpen(false);
                          }
                        }}>
                        Disconnect
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Button size="sm" onClick={handleConnectGithub}>
                Connect GitHub
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Total PRs"
            value={displayStats.totalPRs}
            icon={<GitPullRequest className="w-4 h-4" />}
            delay={0}
          />
          <StatCard
            label="Today"
            value={displayStats.reviewedToday}
            icon={<Clock className="w-4 h-4" />}
            trend="+3" // You might want to calculate this dynamically
            delay={0.05}
          />
          <StatCard
            label="Avg Risk"
            value={displayStats.avgRiskScore}
            icon={<TrendingUp className="w-4 h-4" />}
            delay={0.1}
          />
          <StatCard
            label="Issues Found"
            value={displayStats.issuesCaught}
            icon={<Bug className="w-4 h-4" />}
            delay={0.15}
          />
          <StatCard
            label="Time Saved"
            value={displayStats.timeSaved}
            icon={<Clock className="w-4 h-4" />}
            delay={0.2}
          />
          <StatCard
            label="Cost Saved"
            value={displayStats.costSaved}
            icon={<DollarSign className="w-4 h-4" />}
            delay={0.25}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-foreground">
              Recent Pull Requests
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              {displayPRs.length} PRs
            </span>
          </div>

          {prsLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading PRs...
            </div>
          ) : displayPRs.length > 0 ? (
            <div className="space-y-2">
              {displayPRs.map((pr: any, i: number) => (
                <PRCard
                  key={pr.id}
                  pr={{
                    ...pr,
                    repo: pr.repository?.repoFullName || "Unknown Repo",
                    timeAgo: new Date(pr.createdAt).toLocaleDateString(), // Simple formatting
                  }}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="text-center flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                <GitPullRequest className="w-12 h-12 mb-4" />
                <span>
                  {isGithubConnected
                    ? "No pull requests found. Make sure your repositories are synced."
                    : "No recent pull requests found. Connect a repository to get started!"}
                </span>
                {!isGithubConnected && (
                  <Button
                    className="mt-4 cursor-pointer"
                    onClick={handleConnectGithub}>
                    Connect Repository
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
