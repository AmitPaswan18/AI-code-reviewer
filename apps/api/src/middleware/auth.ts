import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthPayload {
    userId: string;
    email: string;
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthPayload;
    }
}

export async function authenticateUser(request: FastifyRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;

        request.user = decoded;
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return reply.code(401).send({ error: 'Invalid token' });
        }
        return reply.code(500).send({ error: 'Authentication failed' });
    }
}
