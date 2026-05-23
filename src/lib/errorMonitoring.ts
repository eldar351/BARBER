export type ClientLogLevel = 'info' | 'warn' | 'error';

type ClientLogPayload = {
  level?: ClientLogLevel;
  source: string;
  message: string;
  context?: Record<string, unknown>;
};

export function serializeUnknownError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) return error;
  return { value: String(error) };
}

export function getErrorMessage(error: unknown, fallback = 'אירעה שגיאה.') {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

export async function reportClientLog(payload: ClientLogPayload) {
  try {
    await fetch('/api/public/client-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: payload.level || 'error',
        source: payload.source,
        message: payload.message,
        context: payload.context || {},
      }),
    });
  } catch {
    // Silent by design. Monitoring must never break the UI flow.
  }
}

export function captureClientError(
  error: unknown,
  source: string,
  fallback = 'אירעה שגיאה.',
  context: Record<string, unknown> = {}
) {
  const message = getErrorMessage(error, fallback);
  void reportClientLog({
    level: 'error',
    source,
    message,
    context: {
      ...context,
      error: serializeUnknownError(error),
    },
  });
  return message;
}
