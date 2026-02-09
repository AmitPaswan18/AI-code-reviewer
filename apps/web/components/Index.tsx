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

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered PR review insights for your team
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Total PRs"
            value={mockStats.totalPRs}
            icon={<GitPullRequest className="w-4 h-4" />}
            delay={0}
          />
          <StatCard
            label="Today"
            value={mockStats.reviewedToday}
            icon={<Clock className="w-4 h-4" />}
            trend="+3"
            delay={0.05}
          />
          <StatCard
            label="Avg Risk"
            value={mockStats.avgRiskScore}
            icon={<TrendingUp className="w-4 h-4" />}
            delay={0.1}
          />
          <StatCard
            label="Issues Found"
            value={mockStats.issuesCaught}
            icon={<Bug className="w-4 h-4" />}
            delay={0.15}
          />
          <StatCard
            label="Time Saved"
            value={mockStats.timeSaved}
            icon={<Clock className="w-4 h-4" />}
            delay={0.2}
          />
          <StatCard
            label="Cost Saved"
            value={mockStats.costSaved}
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
              {mockPRs.length} PRs
            </span>
          </div>
          <div className="space-y-2">
            {mockPRs.map((pr, i) => (
              <PRCard key={pr.id} pr={pr} index={i} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
