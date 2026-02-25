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
  Search,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useUser } from "@clerk/nextjs";
import { useDashboardStats, useRecentPRs } from "@/hooks/use-dashboard";
import { useSyncUser } from "@/hooks/use-user";
import { useEffect, useState, useMemo, useRef } from "react";
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
import { useSearchRepos, useRepoPulls } from "@/hooks/use-github";
import { Repository } from "@/types";
import { format } from "date-fns";

const Dashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search / repo select state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<{
    owner: string;
    name: string;
    fullName: string;
  } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: stats, isLoading: statsLoading } = useDashboardStats(user?.id);
  const { data: recentIPrs, isLoading: prsLoading } = useRecentPRs(user?.id);
  const { data: dbUser } = useGetUser(user?.id);

  const syncUserMutation = useSyncUser();
  const disconnectGithubMutation = useDisconnectGithub();

  const isGithubConnected = dbUser?.user?.githubUsername;

  // Fetch repos for search
  const { data: reposData, isLoading: reposLoading } = useSearchRepos(
    isGithubConnected ? user?.id! : "",
    1,
    100,
  );

  // Fetch PRs for selected repo
  const {
    data: repoPulls,
    isLoading: pullsLoading,
    error: pullsError,
  } = useRepoPulls(
    user?.id!,
    selectedRepo?.owner || "",
    selectedRepo?.name || "",
  );

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
      router.replace("/");
    }
  }, [searchParams, router]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnectGithub = async () => {
    if (!user?.id) return;
    try {
      const { authUrl } = await apiService.getGithubAuthUrl(user.id);
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to get auth URL", error);
    }
  };

  // Filter repos based on search query
  const filteredRepos = useMemo(() => {
    if (!reposData?.repositories) return [];
    if (!searchQuery.trim()) return reposData.repositories;
    const q = searchQuery.toLowerCase();
    return reposData.repositories.filter(
      (repo: Repository) =>
        repo.name.toLowerCase().includes(q) ||
        repo.fullName?.toLowerCase().includes(q) ||
        repo.owner?.toLowerCase().includes(q),
    );
  }, [reposData?.repositories, searchQuery]);

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo({
      owner: repo.owner,
      name: repo.name,
      fullName: repo.fullName,
    });
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  const handleGoBack = () => {
    setSelectedRepo(null);
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
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              <Button
                size="sm"
                onClick={handleConnectGithub}
                className="w-full sm:w-auto">
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
            trend="+3"
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

        {/* Recent Pull Requests Section */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-sm font-medium text-foreground">
              {selectedRepo
                ? `Pull Requests — ${selectedRepo.fullName}`
                : "Recent Pull Requests"}
            </h2>
            {selectedRepo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="gap-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to search
              </Button>
            )}
          </div>

          {/* Repo search bar (shown when GitHub is connected and no repo selected) */}
          {isGithubConnected && !selectedRepo && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-5"
              ref={searchRef}>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search a repository to view its pull requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60 text-foreground"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                <AnimatePresence>
                  {isSearchFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                      animate={{ opacity: 1, y: 0, scaleY: 1 }}
                      exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-xl max-h-72 overflow-y-auto origin-top">
                      {reposLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">
                            Loading repos...
                          </span>
                        </div>
                      ) : filteredRepos.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          {searchQuery
                            ? `No repos found for "${searchQuery}"`
                            : "No repositories found"}
                        </div>
                      ) : (
                        <div className="py-1">
                          {filteredRepos.map((repo: Repository) => (
                            <button
                              key={repo.githubRepoId || repo.id}
                              onClick={() => handleSelectRepo(repo)}
                              className="w-full text-left px-4 py-2.5 hover:bg-accent/60 transition-colors flex items-center gap-3 group">
                              <GitPullRequest className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">
                                  {repo.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {repo.fullName}
                                  {repo.language && (
                                    <span className="ml-2 text-muted-foreground/70">
                                      · {repo.language}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {repo.isPrivate && (
                                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                                  Private
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Show PRs for selected repo */}
          {selectedRepo ? (
            <div>
              {pullsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/20 rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <span className="text-sm">
                    Fetching pull requests from {selectedRepo.fullName}...
                  </span>
                </div>
              ) : pullsError ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <p className="text-red-500 text-sm mb-4">
                    Failed to fetch pull requests. The repository may not exist
                    or you may lack permissions.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGoBack}
                    className="gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Search another repo
                  </Button>
                </div>
              ) : repoPulls && repoPulls.pulls.length > 0 ? (
                <div className="space-y-2">
                  {repoPulls.pulls.map((pr: any, i: number) => (
                    <motion.div
                      key={pr.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block glass rounded-lg p-4 hover:bg-accent/50 transition-colors group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <GitPullRequest className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs font-mono text-muted-foreground">
                                {selectedRepo.fullName}
                              </span>
                              <span className="text-xs font-mono text-muted-foreground">
                                #{pr.number}
                              </span>
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  pr.state === "open"
                                    ? "bg-green-500/15 text-green-600"
                                    : pr.state === "closed"
                                      ? "bg-red-500/15 text-red-500"
                                      : "bg-purple-500/15 text-purple-500"
                                }`}>
                                {pr.state}
                              </span>
                              {pr.draft && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  Draft
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {pr.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                {pr.authorAvatar ? (
                                  <img
                                    src={pr.authorAvatar}
                                    alt={pr.author}
                                    className="w-4 h-4 rounded-full"
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[8px] font-medium">
                                    {pr.author?.charAt(0)?.toUpperCase()}
                                  </div>
                                )}
                                <span>{pr.author}</span>
                              </div>
                              <span>
                                {pr.createdAt
                                  ? format(
                                      new Date(pr.createdAt),
                                      "MMM d, yyyy",
                                    )
                                  : ""}
                              </span>
                              <span className="font-mono text-xs">
                                {pr.branch}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {pr.commitSHA}
                            </span>
                          </div>
                        </div>
                      </a>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                  <GitPullRequest className="w-12 h-12 mb-4 opacity-40" />
                  <span className="text-sm mb-1">
                    No pull requests found in{" "}
                    <span className="font-medium text-foreground">
                      {selectedRepo.fullName}
                    </span>
                  </span>
                  <p className="text-xs text-muted-foreground/70 mb-4">
                    This repo has no open or closed pull requests yet.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGoBack}
                    className="gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Search another repo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Default view: recent PRs or empty state */}
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
                        timeAgo: new Date(pr.createdAt).toLocaleDateString(),
                      }}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                  <GitPullRequest className="w-12 h-12 mb-4" />
                  <span>
                    {isGithubConnected
                      ? "Search a repository above to view its pull requests."
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
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
