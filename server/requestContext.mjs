import crypto from 'crypto';

export function ensureRequestContext(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = String(requestId);
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

export function getRequestMeta(req) {
  return {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  };
}
