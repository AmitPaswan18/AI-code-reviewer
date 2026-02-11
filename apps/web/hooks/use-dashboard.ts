import { useQuery } from "@tanstack/react-query"
import apiService from "@/services/api"

export const DASHBOARD_KEYS = {
    stats: (clerkId: string) => ["dashboard", "stats", clerkId] as const,
    recentPrs: (clerkId: string) => ["dashboard", "recentPrs", clerkId] as const,
}

export function useDashboardStats(clerkId?: string) {
    return useQuery({
        queryKey: DASHBOARD_KEYS.stats(clerkId || ""),
        queryFn: () => apiService.getDashboardStats(clerkId!),
        enabled: !!clerkId,
        refetchInterval: 30000, // Refresh every 30 seconds
    })
}

export function useRecentPRs(clerkId?: string) {
    return useQuery({
        queryKey: DASHBOARD_KEYS.recentPrs(clerkId || ""),
        queryFn: () => apiService.getRecentPRs(clerkId!),
        enabled: !!clerkId,
    })
}
