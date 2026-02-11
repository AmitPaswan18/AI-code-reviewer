import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';

export async function dashboardRoutes(fastify: FastifyInstance) {
    // Get dashboard stats
    fastify.get('/api/dashboard/stats', async (request: FastifyRequest<{ Querystring: { clerkId: string } }>, reply: FastifyReply) => {
        try {
            const { clerkId } = request.query;

            if (!clerkId) {
                // Return default/global stats or 400
                // For now returning mock stats if no user
                return reply.send({
                    totalPRs: 0,
                    reviewedToday: 0,
                    avgRiskScore: 0,
                    issuesCaught: 0,
                    timeSaved: "0h",
                    costSaved: "$0"
                });
            }

            // Find user
            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            // In a real app, we would query the PullRequest table here
            // const totalPRs = await prisma.pullRequest.count({ where: { repository: { userId: user.id } } });

            // For now, return real counts where possible and 0 for others until we have data
            const repoCount = await prisma.repository.count({
                where: { userId: user.id, isActive: true }
            });

            const prCount = await prisma.pullRequest.count({
                where: { repository: { userId: user.id } }
            });

            // Mock other stats for now as we don't have them populated
            return reply.send({
                totalPRs: prCount,
                reviewedToday: 0,
                avgRiskScore: 0,
                issuesCaught: 0,
                timeSaved: "0h",
                costSaved: "$0",
                repoCount
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    // Get recent PRs
    fastify.get('/api/dashboard/recent-prs', async (request: FastifyRequest<{ Querystring: { clerkId: string } }>, reply: FastifyReply) => {
        try {
            const { clerkId } = request.query;

            if (!clerkId) {
                return reply.send({ prs: [] });
            }

            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            const prs = await prisma.pullRequest.findMany({
                where: {
                    repository: { userId: user.id }
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    repository: {
                        select: {
                            repoName: true,
                            repoFullName: true
                        }
                    }
                }
            });

            return reply.send({ prs });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
}
