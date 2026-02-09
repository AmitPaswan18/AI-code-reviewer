"use client";

import { AppLayout } from "@/components/AppLayout";
import { mockRepos } from "@/lib/mock-data";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { GitBranch, Settings, Clock } from "lucide-react";

const Repos = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-xl font-semibold text-foreground">
            Repositories
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure AI review for your repositories
          </p>
        </motion.div>

        <div className="space-y-2">
          {mockRepos.map((repo, i) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                    <GitBranch className="w-4 h-4 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">
                      {repo.fullName}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      {repo.lastReview && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {repo.lastReview}
                        </span>
                      )}
                      <span className="text-xs font-mono text-muted-foreground">
                        {repo.totalReviews} reviews
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Auto-review
                    </span>
                    <Switch checked={repo.autoReview} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Test gen
                    </span>
                    <Switch checked={repo.testGeneration} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Enabled
                    </span>
                    <Switch checked={repo.enabled} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Repos;
