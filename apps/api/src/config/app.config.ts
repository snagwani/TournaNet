export const appConfig = () => ({
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.API_PORT || '3001', 10),
    database: {
        url: process.env.DATABASE_URL,
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
    },
    ai: {
        serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    },
});
