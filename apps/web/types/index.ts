export interface Repository {
    id: string;
    githubRepoId: string;
    name: string;
    fullName: string;
    owner: string;
    isPrivate: boolean;
    description: string | null;
    defaultBranch: string;
    url: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    language?: string | null;
    stars?: number;
}

export interface SyncRepoResponse {
    message: string;
    count: number;
    repositories: Repository[];
}

export interface GetReposResponse {
    count: number;
    repositories: Repository[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}
