import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import path from 'path';
import { authRoutes } from './routes/auth';
import { githubRoutes } from './routes/github';
import { repositoryRoutes } from './routes/repositories';
import { dashboardRoutes } from './routes/dashboard';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const fastify = Fastify({
    logger: true
});

const port = Number(process.env.PORT) || 8000;

// Register plugins
fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
});

// Register routes
fastify.register(authRoutes);
fastify.register(githubRoutes);
fastify.register(repositoryRoutes);
fastify.register(dashboardRoutes);

// Health check route
fastify.get('/', async (request, reply) => {
    return {
        message: 'AI Code Reviewer API is running',
        version: '1.0.0',
        status: 'healthy'
    };
});

// Run the server!
const start = async () => {
    try {
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Server is running at http://localhost:${port}`);
        console.log(`📝 API Documentation: http://localhost:${port}/`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

