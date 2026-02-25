"use client";

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { GitBranch, Star, Lock, Globe, Loader2 } from "lucide-react";

import { useGithubRepos } from "@/hooks/use-github";
import { Repository } from "@/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

const Repos = () => {
  const { user, isLoaded } = useUser();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useGithubRepos(user?.id!, page, limit);

  const totalPages = data?.totalPages || 1;

  if (!isLoaded) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-xl font-semibold text-foreground">
            Repositories {data?.total ? `(${data.total})` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse all your GitHub repositories
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">
            Failed to load repositories. Please ensure your GitHub account is
            connected.
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Repository</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Language
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Stars</TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Updated
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.repositories?.map((repo: Repository) => (
                  <TableRow key={repo.githubRepoId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline">
                              {repo.name}
                            </a>
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 px-1">
                              {repo.defaultBranch}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {repo.fullName}
                          </span>
                          {repo.description && (
                            <span
                              className="text-xs text-muted-foreground truncate max-w-[300px]"
                              title={repo.description}>
                              {repo.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={repo.isPrivate ? "secondary" : "outline"}
                        className="gap-1">
                        {repo.isPrivate ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          <Globe className="w-3 h-3" />
                        )}
                        {repo.isPrivate ? "Private" : "Public"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {repo.language ? (
                        <Badge variant="outline">{repo.language}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {repo.stars || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground whitespace-nowrap text-xs sm:text-sm">
                      {repo.updatedAt
                        ? format(new Date(repo.updatedAt), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage((p) => p - 1);
                  }}
                  className={
                    page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationLink isActive href="#">
                  {page}
                </PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage((p) => p + 1);
                  }}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </AppLayout>
  );
};

export default Repos;
