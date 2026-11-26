import { createApp } from './app.js';
import { getEnv } from './config/env.js';

try {
  const env = getEnv(); // fails fast with a clear message when configuration is missing
  const origins = env.FRONTEND_URL.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
  createApp(origins).listen(env.PORT, () => console.log(`API listening on :${env.PORT} (${env.NODE_ENV})`));
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
