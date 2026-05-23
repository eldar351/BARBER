import { useEffect } from 'react';

export function useLiveEvents(onMessage: (event: string) => void) {
  useEffect(() => {
    const source = new EventSource('/api/public/events');

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onMessage(payload?.type || 'unknown');
      } catch {
        onMessage('unknown');
      }
    };

    source.onerror = () => {
      // EventSource reconnects automatically.
    };

    return () => source.close();
  }, [onMessage]);
}
