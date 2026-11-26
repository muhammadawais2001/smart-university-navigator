import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp(allowedOrigins: string[]) {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false,
      handler: (_req, res) => res.status(429).json({ success: false, message: 'Too many requests', error: { code: 'RATE_LIMITED' } }),
    }),
  );
  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
