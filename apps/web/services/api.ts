
import axios from "axios"


const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 60000,
})

api.interceptors.request.use(
    (config) => {

        return config
    },
    (error) => {
        return Promise.reject(error)
    },
)

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error("Unauthorized access")
        }
        return Promise.reject(error)
    },
)

export const apiService = {

    syncUser: async (data: { clerkId: string; email: string; fullName?: string | null; avatarUrl?: string | null }) => {
        const response = await api.post("/auth/sync", data)
        return response.data
    },
    getUser: async (clerkId: string) => {
        const response = await api.get(`/auth/me?clerkId=${clerkId}`)
        return response.data
    },
    getUserById: async (userId: string) => {
        const response = await api.get(`/auth/me/${userId}`)
        return response.data
    },

    getDashboardStats: async (clerkId: string) => {
        const response = await api.get(`/dashboard/stats?clerkId=${clerkId}`)
        return response.data
    },
    getRecentPRs: async (clerkId: string) => {
        const response = await api.get(`/dashboard/recent-prs?clerkId=${clerkId}`)
        return response.data
    },

    getGithubAuthUrl: async (clerkId: string) => {
        const response = await api.get(`/auth/github?clerkId=${clerkId}`)
        return response.data
    },
    getGithubRepos: async (clerkId: string, page: number = 1, limit: number = 10) => {
        const response = await api.get(`/repos?clerkId=${clerkId}&page=${page}&limit=${limit}`)
        return response.data
    },
    disconnectGithub: async (clerkId: string) => {
        const response = await api.post(`/auth/github/disconnect?clerkId=${clerkId}`)
        return response.data
    },
    syncRepos: async (clerkId: string, repositoryIds: number[]) => {
        const response = await api.post("/repos/sync", { clerkId, repositoryIds })
        return response.data
    },
    getSavedRepos: async (clerkId: string) => {
        const response = await api.get(`/repos/saved?clerkId=${clerkId}`)
        return response.data
    },
}

export default apiService
