import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "@/services/api";
import { Repository } from "../types";

export const GITHUB_KEYS = {
    all: ["github"] as const,
    repos: (clerkId: string) => [...GITHUB_KEYS.all, "repos", clerkId] as const,
    savedRepos: (clerkId: string) => [...GITHUB_KEYS.all, "savedRepos", clerkId] as const,
    repoPulls: (clerkId: string, owner: string, repo: string) => [...GITHUB_KEYS.all, "repoPulls", clerkId, owner, repo] as const,
};

export function useGithubRepos(clerkId: string, page: number = 1, limit: number = 10) {
    return useQuery({
        queryKey: [...GITHUB_KEYS.repos(clerkId), page, limit],
        queryFn: async () => {
            const data = await apiService.getGithubRepos(clerkId, page, limit);
            return data as {
                count: number;
                total: number;
                totalPages: number;
                repositories: Repository[]
            };
        },
        enabled: !!clerkId,
    });
}

export function useSavedRepos(clerkId: string) {
    return useQuery({
        queryKey: GITHUB_KEYS.savedRepos(clerkId),
        queryFn: async () => {
            const response = await apiService.getSavedRepos(clerkId);
            return response as { count: number; repositories: Repository[] };
        },
        enabled: !!clerkId,
    });
}

export function useSyncRepos() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ clerkId, repositoryIds }: { clerkId: string; repositoryIds: number[] }) => {

            return apiService.syncRepos(clerkId, repositoryIds);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: GITHUB_KEYS.savedRepos(variables.clerkId) });
        },
    });
}

export function useRepoPulls(clerkId: string, owner: string, repo: string) {
    return useQuery({
        queryKey: GITHUB_KEYS.repoPulls(clerkId, owner, repo),
        queryFn: async () => {
            const data = await apiService.getRepoPulls(clerkId, owner, repo);
            return data as {
                count: number;
                pulls: any[];
                repo: string;
            };
        },
        enabled: !!clerkId && !!owner && !!repo,
    });
}

export function useSearchRepos(clerkId: string, page: number = 1, limit: number = 100) {
    return useQuery({
        queryKey: [...GITHUB_KEYS.repos(clerkId), "search", page, limit],
        queryFn: async () => {
            const data = await apiService.searchGithubRepos(clerkId, "", page, limit);
            return data as {
                count: number;
                total: number;
                totalPages: number;
                repositories: Repository[];
            };
        },
        enabled: !!clerkId,
    });
}
