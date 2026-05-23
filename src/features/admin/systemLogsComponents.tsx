import React from 'react';
import { Search, RefreshCw, ShieldAlert, TriangleAlert, CircleAlert, Info } from 'lucide-react';
import { SystemLogEntry } from '../../types';
import { AppCard, PrimaryButton, SurfacePanel, TextInput } from '../../components/ui';
import { cn } from '../../lib/utils';

const LEVEL_OPTIONS = [
  { value: 'all', label: 'הכל', icon: ShieldAlert },
  { value: 'error', label: 'שגיאות', icon: CircleAlert },
  { value: 'warn', label: 'אזהרות', icon: TriangleAlert },
  { value: 'info', label: 'מידע', icon: Info },
] as const;

export function SystemLogsToolbar({
  search,
  onSearchChange,
  level,
  onLevelChange,
  onRefresh,
  isRefreshing,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  level: 'all' | 'info' | 'warn' | 'error';
  onLevelChange: (value: 'all' | 'info' | 'warn' | 'error') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <AppCard className="editorial-shell p-4 md:p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="grid gap-3">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#c8b8c8]" />
            <TextInput
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="חיפוש לפי מקור, הודעה או תוכן לוג"
              className="pr-11"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {LEVEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onLevelChange(option.value)}
                className={cn(
                  'inline-flex min-h-[44px] items-center gap-2 rounded-[20px] border px-4 py-2 text-sm font-bold transition-all',
                  level === option.value
                    ? 'border-primary-brand bg-primary-brand text-on-primary-brand'
                    : 'border-white/7 bg-surface-high/60 text-[#f0e7ec]'
                )}
              >
                <option.icon size={15} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <PrimaryButton onClick={onRefresh} className="w-full px-5 py-3 xl:w-auto">
          <RefreshCw size={16} className={cn(isRefreshing && 'animate-spin')} />
          רענון לוגים
        </PrimaryButton>
      </div>
    </AppCard>
  );
}

export function SystemLogsList({ logs }: { logs: SystemLogEntry[] }) {
  if (!logs.length) {
    return (
      <AppCard className="editorial-shell p-6">
        <p className="font-display text-xl text-[#fff5eb]">אין לוגים להצגה</p>
        <p className="mt-2 text-sm text-[#d7cad7]">נסה להחליף פילטר או לרענן שוב בעוד רגע.</p>
      </AppCard>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((entry) => (
        <div key={entry.id}>
          <SurfacePanel className="editorial-shell overflow-hidden border border-white/8 bg-background/28 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <LevelBadge level={entry.level} />
                  <span className="rounded-full border border-white/8 bg-background/40 px-3 py-1 text-[11px] font-bold text-[#e9dbe0]">
                    {entry.source}
                  </span>
                  <span className="text-xs text-[#bbaebb]">
                    {new Date(entry.timestamp).toLocaleString('he-IL')}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#fff4ea]">{entry.message}</p>
              </div>
            </div>

            {entry.context && Object.keys(entry.context).length > 0 && (
              <pre className="mt-4 overflow-x-auto rounded-[20px] border border-white/6 bg-[#120f12] p-4 text-xs leading-6 text-[#d6c9d4]">
                {JSON.stringify(entry.context, null, 2)}
              </pre>
            )}
          </SurfacePanel>
        </div>
      ))}
    </div>
  );
}

function LevelBadge({ level }: { level: SystemLogEntry['level'] }) {
  const map = {
    info: 'border-sky-400/20 bg-sky-500/10 text-sky-100',
    warn: 'border-amber-400/20 bg-amber-500/10 text-amber-100',
    error: 'border-red-400/20 bg-red-500/10 text-red-100',
  } as const;

  return (
    <span className={cn('rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em]', map[level])}>
      {level}
    </span>
  );
}
