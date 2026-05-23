import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.mjs';
import { publicRouter } from './routes/public.mjs';
import { adminRouter } from './routes/admin.mjs';
import { logError, logWarn, serializeError } from './services/logService.mjs';
import { ensureRequestContext, getRequestMeta } from './requestContext.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(path.resolve(__dirname, '..'), 'dist');

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(ensureRequestContext);
  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  const withRateLimit = (source, options) => rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const entry = logWarn(source, 'Rate limit exceeded', getRequestMeta(req));
      res.status(429).json({ error: 'יותר מדי ניסיונות. נסה שוב בעוד רגע.', logId: entry.id, requestId: req.requestId });
    },
  });

  app.use('/api/admin/login', withRateLimit('server.rate-limit.admin-login', { windowMs: 15 * 60 * 1000, max: 20 }));
  app.use('/api/public/appointments/cancellation-code/request', withRateLimit('server.rate-limit.cancellation-code-request', { windowMs: 15 * 60 * 1000, max: 8 }));
  app.use('/api/public/appointments/cancellation-code/verify', withRateLimit('server.rate-limit.cancellation-code-verify', { windowMs: 15 * 60 * 1000, max: 20 }));
  app.use('/api/public/appointments', withRateLimit('server.rate-limit.public-appointments', { windowMs: 15 * 60 * 1000, max: 60 }));
  app.use('/api/public/client-logs', withRateLimit('server.rate-limit.client-logs', { windowMs: 15 * 60 * 1000, max: 40 }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, dataProvider: config.dataProvider });
  });

  app.use('/api/public', publicRouter);
  app.use('/api/admin', adminRouter);

  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.use((error, req, res, _next) => {
    if (error?.type === 'entity.parse.failed') {
      const entry = logError('server.request', 'Invalid JSON payload', {
        ...getRequestMeta(req),
        error: serializeError(error),
      });
      return res.status(400).json({ error: 'גוף הבקשה אינו JSON תקין.', logId: entry.id, requestId: req.requestId });
    }

    const entry = logError('server.request', 'Unhandled request error', {
      ...getRequestMeta(req),
      error: serializeError(error),
    });
    res.status(500).json({ error: 'שגיאת שרת פנימית.', logId: entry.id, requestId: req.requestId });
  });

  return app;
}
