import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';

interface ClerkWebhookBody {
    type: string;
    data: {
        id: string;
        email_addresses: Array<{ email_address: string }>;
        first_name?: string;
        last_name?: string;
        image_url?: string;
    };
}

interface SyncUserBody {
    clerkId: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
}

export async function authRoutes(fastify: FastifyInstance) {

    fastify.post('/api/auth/sync', async (request: FastifyRequest<{ Body: SyncUserBody }>, reply: FastifyReply) => {
        try {
            const { clerkId, email, fullName, avatarUrl } = request.body;


            if (!clerkId || !email) {
                return reply.code(400).send({ error: 'clerkId and email are required' });
            }


            let user = await prisma.user.findUnique({
                where: { clerkId },
                select: {
                    id: true,
                    clerkId: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true,
                    githubUsername: true,
                    createdAt: true,
                }
            });

            if (user) {

                user = await prisma.user.update({
                    where: { clerkId },
                    data: {
                        lastLoginAt: new Date(),
                        email,
                        fullName: fullName || user.fullName,
                        avatarUrl: avatarUrl || user.avatarUrl,
                    },
                    select: {
                        id: true,
                        clerkId: true,
                        email: true,
                        fullName: true,
                        avatarUrl: true,
                        githubUsername: true,
                        createdAt: true,
                    }
                });

                return reply.send({
                    message: 'User synced successfully',
                    user,
                    isNewUser: false,
                });
            }


            user = await prisma.user.create({
                data: {
                    clerkId,
                    email,
                    fullName,
                    avatarUrl,
                    lastLoginAt: new Date(),
                },
                select: {
                    id: true,
                    clerkId: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true,
                    githubUsername: true,
                    createdAt: true,
                }
            });

            return reply.code(201).send({
                message: 'User created successfully',
                user,
                isNewUser: true,
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });


    fastify.get('/api/auth/me/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        try {
            const { userId } = request.params;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    clerkId: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true,
                    githubUsername: true,
                    createdAt: true,
                }
            });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            return reply.send({ user });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });


    fastify.get('/api/auth/me', async (request: FastifyRequest<{ Querystring: { clerkId?: string } }>, reply: FastifyReply) => {
        try {
            const { clerkId } = request.query;

            if (!clerkId) {
                return reply.code(400).send({ error: 'clerkId query parameter is required' });
            }

            const user = await prisma.user.findUnique({
                where: { clerkId },
                select: {
                    id: true,
                    clerkId: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true,
                    githubUsername: true,
                    createdAt: true,
                }
            });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            return reply.send({ user });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });


    fastify.post('/api/webhooks/clerk', async (request: FastifyRequest<{ Body: ClerkWebhookBody }>, reply: FastifyReply) => {
        try {
            const { type, data } = request.body;

            switch (type) {
                case 'user.created':
                case 'user.updated': {
                    const email = data.email_addresses[0]?.email_address;
                    const fullName = data.first_name && data.last_name
                        ? `${data.first_name} ${data.last_name}`
                        : data.first_name || null;

                    await prisma.user.upsert({
                        where: { clerkId: data.id },
                        update: {
                            email,
                            fullName,
                            avatarUrl: data.image_url,
                        },
                        create: {
                            clerkId: data.id,
                            email,
                            fullName,
                            avatarUrl: data.image_url,
                        },
                    });
                    break;
                }
                case 'user.deleted': {
                    await prisma.user.delete({
                        where: { clerkId: data.id },
                    });
                    break;
                }
            }

            return reply.send({ success: true });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
}
