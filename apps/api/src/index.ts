import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const fastify = Fastify({
    logger: true
});

const port = Number(process.env.PORT) || 3001;

// Register plugins
fastify.register(cors);

// Declare a route
fastify.get('/', async (request, reply) => {
    return { message: 'API is running (Fastify)' };
});

// Run the server!
const start = async () => {
    try {
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server is running at http://localhost:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
