import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';
import { encrypt, decrypt } from '../utils/encryption';

interface GitHubTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    refresh_token?: string;
    expires_in?: number;
}

interface GitHubUser {
    login: string;
    id: number;
    avatar_url: string;
    name: string;
    email: string;
}

export async function githubRoutes(fastify: FastifyInstance) {
    // Access env vars here, after dotenv.config() has run in index.ts
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
    const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_CALLBACK_URL) {
        fastify.log.error('GitHub OAuth configuration missing');
    }

    // Initiate GitHub OAuth flow
    fastify.get('/api/auth/github', async (request: FastifyRequest<{ Querystring: { clerkId: string } }>, reply: FastifyReply) => {
        try {
            if (!GITHUB_CLIENT_ID || !GITHUB_CALLBACK_URL) {
                return reply.code(500).send({ error: 'Server misconfiguration: Missing GitHub credentials' });
            }

            const { clerkId } = request.query;

            if (!clerkId) {
                return reply.code(400).send({ error: 'clerkId is required' });
            }

            // Verify user exists
            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            // Generate random string for CSRF protection
            const csrfState = Math.random().toString(36).substring(7);
            const combinedState = Buffer.from(JSON.stringify({ userId: user.id, csrf: csrfState })).toString('base64');

            const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&scope=repo,read:user,user:email,write:repo_hook&state=${combinedState}`;

            return reply.send({ authUrl: githubAuthUrl });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    // GitHub OAuth callback
    fastify.get('/api/auth/github/callback', async (request: FastifyRequest<{ Querystring: { code?: string; state?: string } }>, reply: FastifyReply) => {
        try {
            if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_CALLBACK_URL) {
                return reply.redirect(`${FRONTEND_URL}?github=error_config`);
            }

            const { code, state } = request.query;

            if (!code || !state) {
                return reply.code(400).send({ error: 'Missing code or state parameter' });
            }

            // Decode state to get userId
            let userId: string;
            try {
                const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
                userId = stateData.userId;
            } catch (e) {
                return reply.code(400).send({ error: 'Invalid state parameter' });
            }

            // Exchange code for access token
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    client_secret: GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: GITHUB_CALLBACK_URL
                })
            });

            const tokenData = await tokenResponse.json() as GitHubTokenResponse;

            if (!tokenData.access_token) {
                fastify.log.error({ tokenData }, 'Failed to get GitHub access token');
                return reply.redirect(`${FRONTEND_URL}?github=error_token`);
            }

            // Get GitHub user info
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            const githubUser = await userResponse.json() as GitHubUser;

            // Calculate token expiration
            const expiresAt = tokenData.expires_in
                ? new Date(Date.now() + tokenData.expires_in * 1000)
                : null;

            // Encrypt tokens
            const encryptedAccessToken = encrypt(tokenData.access_token);
            const encryptedRefreshToken = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null;

            // Update user with GitHub credentials
            await prisma.user.update({
                where: { id: userId },
                data: {
                    githubUsername: githubUser.login,
                    githubAccessToken: encryptedAccessToken,
                    githubRefreshToken: encryptedRefreshToken,
                    githubTokenExpiresAt: expiresAt,
                }
            });

            // Redirect to frontend with success
            return reply.redirect(`${FRONTEND_URL}?github=connected`);
        } catch (error) {
            fastify.log.error(error);
            return reply.redirect(`${FRONTEND_URL}?github=error`);
        }
    });

    // Disconnect GitHub account and revoke grant
    fastify.post('/api/auth/github/disconnect', async (request: FastifyRequest<{ Querystring: { clerkId: string } }>, reply: FastifyReply) => {
        try {
            const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
            const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

            const { clerkId } = request.query;

            if (!clerkId) {
                return reply.code(400).send({ error: 'clerkId is required' });
            }

            // Get user to revoke token
            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (user?.githubAccessToken && GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
                try {
                    const accessToken = decrypt(user.githubAccessToken);

                    // Revoke GitHub grant to force re-consent next time
                    await fetch(`https://api.github.com/applications/${GITHUB_CLIENT_ID}/grant`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Basic ${Buffer.from(`${GITHUB_CLIENT_ID}:${GITHUB_CLIENT_SECRET}`).toString('base64')}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/vnd.github.v3+json'
                        },
                        body: JSON.stringify({ access_token: accessToken })
                    });
                } catch (error) {
                    fastify.log.error({ err: error }, 'Failed to revoke GitHub token');
                    // Continue to disconnect locally even if revocation fails
                }
            }

            // Remove GitHub credentials locally
            await prisma.user.update({
                where: { clerkId },
                data: {
                    githubUsername: null,
                    githubAccessToken: null,
                    githubRefreshToken: null,
                    githubTokenExpiresAt: null
                }
            });

            return reply.send({ message: 'GitHub account disconnected successfully' });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
}
