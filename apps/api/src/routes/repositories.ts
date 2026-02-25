import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { Octokit } from '@octokit/rest';
import { prisma } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface GitHubRepository {
    id: number;
    name: string;
    full_name: string;
    owner: {
        login: string;
    };
    private: boolean;
    description: string | null;
    default_branch: string;
    updated_at: string;
    language: string | null;
    stargazers_count: number;
}

import { decrypt } from '../utils/encryption';

export async function repositoryRoutes(fastify: FastifyInstance) {

    fastify.get('/api/repos', async (request: FastifyRequest<{ Querystring: { clerkId: string; page?: string; limit?: string } }>, reply: FastifyReply) => {
        try {
            const { clerkId } = request.query;
            const page = parseInt(request.query.page || '1');
            const limit = parseInt(request.query.limit || '10');

            if (!clerkId) {
                return reply.code(400).send({ error: 'clerkId is required' });
            }


            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (!user || !user.githubAccessToken) {
                return reply.code(400).send({ error: 'GitHub account not connected' });
            }


            let accessToken;
            try {
                accessToken = decrypt(user.githubAccessToken);
            } catch (error) {
                fastify.log.error(error);
                return reply.code(500).send({ error: 'Authentication error' });
            }


            const octokit = new Octokit({
                auth: accessToken
            });


            const { data: githubUser } = await octokit.users.getAuthenticated();
            const totalRepos = (githubUser.public_repos || 0) + (githubUser.total_private_repos || 0);


            const { data: repos } = await octokit.repos.listForAuthenticatedUser({
                visibility: 'all',
                affiliation: 'owner,collaborator,organization_member',
                per_page: limit,
                page: page,
                sort: 'updated',
                direction: 'desc'
            });


            const repositories = repos.map((repo: any) => ({
                githubRepoId: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                owner: repo.owner.login,
                isPrivate: repo.private,
                description: repo.description,
                defaultBranch: repo.default_branch,
                url: `https://github.com/${repo.full_name}`,
                updatedAt: repo.updated_at,
                language: repo.language,
                stars: repo.stargazers_count
            }));

            return reply.send({
                count: repositories.length,
                total: totalRepos,
                page,
                limit,
                totalPages: Math.ceil(totalRepos / limit),
                repositories
            });
        } catch (error: any) {
            fastify.log.error(error);


            if (error.status === 401) {
                return reply.code(401).send({ error: 'GitHub token expired or invalid. Please reconnect your GitHub account.' });
            }

            return reply.code(500).send({ error: 'Failed to fetch repositories' });
        }
    });


    fastify.post('/api/repos/sync', async (request: FastifyRequest<{ Body: { repositoryIds: number[]; clerkId: string } }>, reply: FastifyReply) => {
        try {
            const { repositoryIds, clerkId } = request.body;

            if (!clerkId) {
                return reply.code(400).send({ error: 'clerkId is required' });
            }

            if (!repositoryIds || !Array.isArray(repositoryIds)) {
                return reply.code(400).send({ error: 'Invalid repository IDs' });
            }


            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (!user || !user.githubAccessToken) {
                return reply.code(400).send({ error: 'GitHub account not connected' });
            }


            let accessToken;
            try {
                accessToken = decrypt(user.githubAccessToken);
            } catch (error) {
                return reply.code(500).send({ error: 'Authentication error' });
            }


            const octokit = new Octokit({
                auth: accessToken
            });

            const { data: allRepos } = await octokit.repos.listForAuthenticatedUser({
                visibility: 'all',
                per_page: 100
            });


            const selectedRepos = allRepos.filter((repo: GitHubRepository) =>
                repositoryIds.includes(repo.id)
            );


            const syncedRepos = [];
            for (const repo of selectedRepos) {
                const syncedRepo = await prisma.repository.upsert({
                    where: { githubRepoId: BigInt(repo.id) },
                    update: {
                        repoName: repo.name,
                        repoFullName: repo.full_name,
                        repoOwner: repo.owner.login,
                        isPrivate: repo.private,
                        description: repo.description,
                        defaultBranch: repo.default_branch,
                        isActive: true,
                        updatedAt: new Date()
                    },
                    create: {
                        userId: user.id,
                        githubRepoId: BigInt(repo.id),
                        repoName: repo.name,
                        repoFullName: repo.full_name,
                        repoOwner: repo.owner.login,
                        isPrivate: repo.private,
                        description: repo.description,
                        defaultBranch: repo.default_branch,
                        isActive: true
                    }
                });

                syncedRepos.push(syncedRepo);
            }


            const formattedRepos = syncedRepos.map(repo => ({
                id: repo.id,
                githubRepoId: repo.githubRepoId.toString(),
                name: repo.repoName,
                fullName: repo.repoFullName,
                owner: repo.repoOwner,
                isPrivate: repo.isPrivate,
                description: repo.description,
                defaultBranch: repo.defaultBranch,
                url: `https://github.com/${repo.repoFullName}`,
                isActive: repo.isActive,
                createdAt: repo.createdAt,
                updatedAt: repo.updatedAt
            }));

            return reply.send({
                message: 'Repositories synced successfully',
                count: formattedRepos.length,
                repositories: formattedRepos
            });
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to sync repositories' });
        }
    });


    fastify.get('/api/repos/saved', async (request: FastifyRequest<{ Querystring: { clerkId: string } }>, reply: FastifyReply) => {
        try {
            const { clerkId } = request.query;

            if (!clerkId) {
                return reply.code(400).send({ error: 'clerkId is required' });
            }

            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            const repositories = await prisma.repository.findMany({
                where: {
                    userId: user.id,
                    isActive: true
                },
                orderBy: { updatedAt: 'desc' }
            });


            const formattedRepos = repositories.map(repo => ({
                id: repo.id,
                githubRepoId: repo.githubRepoId.toString(),
                name: repo.repoName,
                fullName: repo.repoFullName,
                owner: repo.repoOwner,
                isPrivate: repo.isPrivate,
                description: repo.description,
                defaultBranch: repo.defaultBranch,
                url: `https://github.com/${repo.repoFullName}`,
                isActive: repo.isActive,
                createdAt: repo.createdAt,
                updatedAt: repo.updatedAt
            }));

            return reply.send({
                count: formattedRepos.length,
                repositories: formattedRepos
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch saved repositories' });
        }
    });

    // Fetch pull requests for a specific repo
    fastify.get('/api/repos/:owner/:repo/pulls', async (request: FastifyRequest<{ Params: { owner: string; repo: string }; Querystring: { clerkId: string; state?: string; page?: string; per_page?: string } }>, reply: FastifyReply) => {
        try {
            const { owner, repo } = request.params;
            const { clerkId, state = 'all', page = '1', per_page = '30' } = request.query;

            if (!clerkId) {
                return reply.code(400).send({ error: 'clerkId is required' });
            }

            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (!user || !user.githubAccessToken) {
                return reply.code(400).send({ error: 'GitHub account not connected' });
            }

            let accessToken;
            try {
                accessToken = decrypt(user.githubAccessToken);
            } catch (error) {
                return reply.code(500).send({ error: 'Authentication error' });
            }

            const octokit = new Octokit({ auth: accessToken });

            const { data: pulls } = await octokit.pulls.list({
                owner,
                repo,
                state: state as 'open' | 'closed' | 'all',
                per_page: parseInt(per_page),
                page: parseInt(page),
                sort: 'updated',
                direction: 'desc',
            });

            const pullRequests = pulls.map((pr: any) => ({
                id: pr.id,
                number: pr.number,
                title: pr.title,
                state: pr.state,
                author: pr.user?.login || 'unknown',
                authorAvatar: pr.user?.avatar_url || '',
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
                branch: pr.head?.ref || '',
                commitSHA: pr.head?.sha?.substring(0, 7) || '',
                additions: pr.additions || 0,
                deletions: pr.deletions || 0,
                filesChanged: pr.changed_files || 0,
                url: pr.html_url,
                draft: pr.draft || false,
            }));

            return reply.send({
                count: pullRequests.length,
                pulls: pullRequests,
                repo: `${owner}/${repo}`,
            });
        } catch (error: any) {
            fastify.log.error(error);

            if (error.status === 404) {
                return reply.code(404).send({ error: 'Repository not found' });
            }
            if (error.status === 401) {
                return reply.code(401).send({ error: 'GitHub token expired or invalid. Please reconnect.' });
            }

            return reply.code(500).send({ error: 'Failed to fetch pull requests' });
        }
    });

    fastify.delete('/api/repos/:id', async (request: FastifyRequest<{ Params: { id: string }, Querystring: { clerkId: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const { clerkId } = request.query;

            if (!clerkId) {
                return reply.code(400).send({ error: 'clerkId is required' });
            }

            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }


            const repository = await prisma.repository.findFirst({
                where: {
                    id,
                    userId: user.id
                }
            });

            if (!repository) {
                return reply.code(404).send({ error: 'Repository not found' });
            }


            await prisma.repository.update({
                where: { id },
                data: { isActive: false }
            });

            return reply.send({ message: 'Repository removed successfully' });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to remove repository' });
        }
    });
}
