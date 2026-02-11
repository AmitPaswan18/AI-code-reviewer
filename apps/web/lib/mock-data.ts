import { GitPullRequest, GitCommit, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ReviewStatus = "pending" | "streaming" | "completed" | "failed";
export type AgentType = "planner" | "reviewer" | "testgen";

export interface PRData {
    id: string;
    number: number;
    title: string;
    repo: string;
    author: string;
    authorAvatar: string;
    status: ReviewStatus;
    riskScore: number;
    riskLevel: RiskLevel;
    filesChanged: number;
    additions: number;
    deletions: number;
    createdAt: string;
    branch: string;
    commitSHA: string;
    reviewFindings: ReviewFinding[];
}

export interface ReviewFinding {
    id: string;
    agent: AgentType;
    severity: RiskLevel;
    title: string;
    description: string;
    file?: string;
    line?: number;
    suggestion?: string;
}

export interface RepoConfig {
    id: string;
    name: string;
    fullName: string;
    enabled: boolean;
    autoReview: boolean;
    testGeneration: boolean;
    lastReview?: string;
    totalReviews: number;
}

export interface DashboardStats {
    totalPRs: number;
    reviewedToday: number;
    avgRiskScore: number;
    issuesCaught: number;
    timeSaved: string;
    costSaved: string;
}

// Mock data
export const mockStats: DashboardStats = {
    totalPRs: 0,
    reviewedToday: 0,
    avgRiskScore: 0,
    issuesCaught: 0,
    timeSaved: "0h",
    costSaved: "$0",
};

export const mockPRs: PRData[] = [
    {
        id: "pr-1",
        number: 342,
        title: "feat: add OAuth2 PKCE flow for mobile clients",
        repo: "acme/auth-service",
        author: "sarah-chen",
        authorAvatar: "SC",
        status: "completed",
        riskScore: 72,
        riskLevel: "high",
        filesChanged: 14,
        additions: 482,
        deletions: 67,
        createdAt: "2 hours ago",
        branch: "feature/oauth-pkce",
        commitSHA: "a3f2b1c",
        reviewFindings: [
            { id: "f1", agent: "reviewer", severity: "high", title: "Token storage insecure", description: "Access tokens stored in localStorage are vulnerable to XSS attacks. Consider using httpOnly cookies.", file: "src/auth/token-store.ts", line: 42, suggestion: "Use secure httpOnly cookies with SameSite=Strict" },
            { id: "f2", agent: "reviewer", severity: "medium", title: "Missing rate limiting", description: "Token refresh endpoint lacks rate limiting, enabling potential abuse.", file: "src/routes/auth.ts", line: 118 },
            { id: "f3", agent: "planner", severity: "low", title: "Consider token rotation", description: "Implement refresh token rotation to limit the impact of token theft." },
            { id: "f4", agent: "testgen", severity: "low", title: "Missing edge case tests", description: "No tests for concurrent token refresh scenarios.", suggestion: "Add test for race condition in token refresh" },
        ],
    },
    {
        id: "pr-2",
        number: 341,
        title: "fix: resolve N+1 query in user feed endpoint",
        repo: "acme/api-gateway",
        author: "alex-rivera",
        authorAvatar: "AR",
        status: "streaming",
        riskScore: 28,
        riskLevel: "low",
        filesChanged: 3,
        additions: 45,
        deletions: 22,
        createdAt: "35 min ago",
        branch: "fix/n-plus-one-feed",
        commitSHA: "e7d4f2a",
        reviewFindings: [
            { id: "f5", agent: "reviewer", severity: "low", title: "Query optimization looks correct", description: "The eager loading approach resolves the N+1 but consider adding an index on user_id." },
        ],
    },
    {
        id: "pr-3",
        number: 340,
        title: "refactor: migrate payment module to Stripe SDK v3",
        repo: "acme/billing",
        author: "priya-patel",
        authorAvatar: "PP",
        status: "completed",
        riskScore: 85,
        riskLevel: "critical",
        filesChanged: 28,
        additions: 890,
        deletions: 1204,
        createdAt: "4 hours ago",
        branch: "refactor/stripe-v3",
        commitSHA: "b9c1d3e",
        reviewFindings: [
            { id: "f6", agent: "reviewer", severity: "critical", title: "Webhook signature verification removed", description: "The migration removed Stripe webhook signature verification, opening the door to spoofed events.", file: "src/webhooks/stripe.ts", line: 15, suggestion: "Re-add stripe.webhooks.constructEvent() verification" },
            { id: "f7", agent: "reviewer", severity: "high", title: "Breaking API change unhandled", description: "PaymentIntent.confirm() return shape changed in v3. Error handling doesn't account for new error codes.", file: "src/payments/intent.ts", line: 88 },
            { id: "f8", agent: "planner", severity: "medium", title: "Migration strategy risk", description: "Large-scale SDK migration with 1204 deletions. Consider feature-flagging the rollout." },
        ],
    },
    {
        id: "pr-4",
        number: 339,
        title: "chore: update dependencies and fix security advisories",
        repo: "acme/web-app",
        author: "jordan-kim",
        authorAvatar: "JK",
        status: "completed",
        riskScore: 15,
        riskLevel: "low",
        filesChanged: 2,
        additions: 120,
        deletions: 118,
        createdAt: "6 hours ago",
        branch: "chore/dep-updates",
        commitSHA: "f1a2b3c",
        reviewFindings: [],
    },
    {
        id: "pr-5",
        number: 338,
        title: "feat: implement real-time collaboration cursors",
        repo: "acme/web-app",
        author: "sarah-chen",
        authorAvatar: "SC",
        status: "pending",
        riskScore: 0,
        riskLevel: "low",
        filesChanged: 11,
        additions: 340,
        deletions: 12,
        createdAt: "8 hours ago",
        branch: "feature/collab-cursors",
        commitSHA: "d4e5f6a",
        reviewFindings: [],
    },
];

export const mockRepos: RepoConfig[] = [
    { id: "r1", name: "auth-service", fullName: "acme/auth-service", enabled: true, autoReview: true, testGeneration: true, lastReview: "2 hours ago", totalReviews: 89 },
    { id: "r2", name: "api-gateway", fullName: "acme/api-gateway", enabled: true, autoReview: true, testGeneration: false, lastReview: "35 min ago", totalReviews: 156 },
    { id: "r3", name: "billing", fullName: "acme/billing", enabled: true, autoReview: true, testGeneration: true, lastReview: "4 hours ago", totalReviews: 42 },
    { id: "r4", name: "web-app", fullName: "acme/web-app", enabled: true, autoReview: false, testGeneration: false, lastReview: "6 hours ago", totalReviews: 67 },
    { id: "r5", name: "infra", fullName: "acme/infra", enabled: false, autoReview: false, testGeneration: false, totalReviews: 0 },
];
