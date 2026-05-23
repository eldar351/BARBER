const clients = new Set();

export function addEventClient(res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  res.write('retry: 3000\n\n');
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const client = { res };
  clients.add(client);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      // ignore
    }
  }, 25000);

  return () => {
    clearInterval(heartbeat);
    clients.delete(client);
    try {
      res.end();
    } catch {
      // ignore
    }
  };
}

export function publishEvent(type, extra = {}) {
  const payload = `data: ${JSON.stringify({ type, ts: Date.now(), ...extra })}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}
