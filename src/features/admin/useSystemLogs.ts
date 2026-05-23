import { useCallback, useEffect, useState } from 'react';
import { SystemLogEntry } from '../../types';
import { listAdminLogs } from './api';
import { useAdminAuth } from './auth';
import { useToast } from '../../components/toast';
import { getErrorMessage } from '../../lib/errorMonitoring';

export function useSystemLogs() {
  const { handleUnauthorized } = useAdminAuth();
  const { showToast } = useToast();
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async (background = false) => {
    if (background) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      setError('');
      const nextLogs = await listAdminLogs({
        limit: 80,
        search,
        level: level === 'all' ? undefined : level,
      });
      setLogs(nextLogs);
    } catch (loadError) {
      if (handleUnauthorized(loadError)) return;
      const message = getErrorMessage(loadError, 'טעינת הלוגים נכשלה');
      setError(message);
      if (background) showToast(message, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [handleUnauthorized, level, search, showToast]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadLogs(true);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [loadLogs]);

  return {
    logs,
    search,
    setSearch,
    level,
    setLevel,
    isLoading,
    isRefreshing,
    error,
    reload: () => loadLogs(true),
  };
}
