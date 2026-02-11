import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiService from "@/services/api"


export const QUERY_KEYS = {
    user: (clerkId: string) => ["user", clerkId] as const,
    userById: (userId: string) => ["userById", userId] as const,
}

export function useSyncUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { clerkId: string; email: string; fullName?: string | null; avatarUrl?: string | null }) =>
            apiService.syncUser(data),
        onSuccess: (data) => {

            if (data.user?.clerkId) {
                queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.user(data.user.clerkId)
                })
            }
        }
    })
}

export function useGetUser(clerkId?: string) {
    return useQuery({
        queryKey: QUERY_KEYS.user(clerkId || ""),
        queryFn: () => apiService.getUser(clerkId!),
        enabled: !!clerkId,
    })
}

export function useGetUserById(userId?: string) {
    return useQuery({
        queryKey: QUERY_KEYS.userById(userId || ""),
        queryFn: () => apiService.getUserById(userId!),
        enabled: !!userId,
    })
}

export function useDisconnectGithub() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (clerkId: string) => apiService.disconnectGithub(clerkId),
        onSuccess: (data, clerkId) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.user(clerkId)
            })
        }
    })
}
