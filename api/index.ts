import { createApp } from '../src/app.js';

const origins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = createApp(origins);

export default app;
