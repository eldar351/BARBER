import { verifyAdminToken } from '../services/authService.mjs';
import { logWarn } from '../services/logService.mjs';
import { getRequestMeta } from '../requestContext.mjs';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    logWarn('auth.require', 'Missing bearer token', getRequestMeta(req));
    return res.status(401).json({ error: 'Unauthorized', requestId: req.requestId });
  }

  try {
    const admin = await verifyAdminToken(token);
    if (!admin) {
      logWarn('auth.require', 'Admin token does not match an active admin', getRequestMeta(req));
      return res.status(401).json({ error: 'Unauthorized', requestId: req.requestId });
    }
    req.admin = admin;
    return next();
  } catch (error) {
    logWarn('auth.require', 'Admin token verification failed', {
      ...getRequestMeta(req),
      error: error instanceof Error ? { name: error.name, message: error.message } : { value: String(error) },
    });
    return res.status(401).json({ error: 'Unauthorized', requestId: req.requestId });
  }
}
