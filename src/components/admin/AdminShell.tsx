import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, LayoutDashboard, LogOut, Scissors, Sparkles, Users, ScrollText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AppCard, SecondaryButton } from '../ui';
import { useAdminAuth } from '../../features/admin/auth';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'תורים', mobileLabel: 'תורים', icon: LayoutDashboard },
  { to: '/admin/services', label: 'שירותים', mobileLabel: 'שירותים', icon: Scissors },
  { to: '/admin/barbers', label: 'נותני שירות', mobileLabel: 'צוות', icon: Users },
  { to: '/admin/logs', label: 'לוגים', mobileLabel: 'לוגים', icon: ScrollText },
];

export function AdminShell({
  title,
  description,
  eyebrow,
  children,
  actions,
  backAction,
  realtime = true,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  backAction?: React.ReactNode;
  realtime?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-stage admin-grid min-h-ios-screen overflow-hidden bg-background text-[#eadfee]" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(circle_at_top,rgba(228,178,118,0.08),transparent_48%)]" />
      <div className="mx-auto max-w-7xl px-3 py-3 pb-24 sm:px-4 md:px-6 md:py-8 md:pb-8">
        <header className="mb-4 pt-safe md:mb-6">
          <AppCard className="editorial-shell overflow-hidden p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                {backAction && <div className="mb-3">{backAction}</div>}
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <p className="designer-kicker text-[10px] font-bold uppercase">{eyebrow || 'BARBER ADMIN'}</p>
                  {realtime && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-100">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      מתעדכן בזמן אמת
                    </div>
                  )}
                </div>
                <h1 className="mt-2 font-display text-xl text-[#fff5eb] sm:text-2xl md:text-3xl">{title}</h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#ece2e8] md:text-[15px]">{description}</p>
              </div>

              <div className="flex flex-col gap-3 xl:items-end">
                <nav className="hidden flex-wrap gap-2 md:flex">
                  {NAV_ITEMS.map((item) => (
                    <div key={item.to}>
                      <AdminNavPill to={item.to} label={item.label} icon={<item.icon size={16} />} active={location.pathname === item.to} />
                    </div>
                  ))}
                  <SecondaryButton onClick={handleLogout} className="px-4 py-3 text-sm">
                    <LogOut size={16} />
                    התנתקות
                  </SecondaryButton>
                </nav>
                {actions && <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto xl:justify-end">{actions}</div>}
              </div>
            </div>
          </AppCard>

          <div className="admin-info-strip mt-3 grid gap-3 overflow-hidden rounded-[28px] p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-primary-brand">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <p className="designer-kicker text-[10px] font-bold uppercase">Control Surface</p>
                <p className="mt-1 text-sm font-bold text-[#fff5eb]">מרכז ניהול אחיד לכל הפעולות הקריטיות של BARBER</p>
                <p className="mt-1 text-xs leading-5 text-[#cbbfd2]">ניווט מהיר בין תורים, שירותים, צוות ולוגים בלי לאבד הקשר.</p>
              </div>
            </div>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:justify-end md:overflow-visible md:px-0 md:pb-0">
              {NAV_ITEMS.map((item) => (
                <span
                  key={item.to}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-bold',
                    location.pathname === item.to ? 'border-primary-brand/40 bg-primary-brand/14 text-[#fff3e4]' : 'border-white/8 bg-white/[0.03] text-[#d5c8d0]'
                  )}
                >
                  <item.icon size={13} />
                  <span className="md:hidden">{item.mobileLabel}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </span>
              ))}
            </div>
          </div>
        </header>

        <main id="main-content" role="main" tabIndex={-1}>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-brand/20 bg-surface-highest/95 px-3 px-safe py-3 pb-safe backdrop-blur md:hidden" aria-label="ניווט ניהול תחתון">
        <div className="mx-auto grid max-w-7xl grid-cols-5 gap-2">
          {NAV_ITEMS.map((item) => (
            <div key={item.to}>
              <MobileNavButton to={item.to} label={item.mobileLabel} icon={<item.icon size={18} />} active={location.pathname === item.to} />
            </div>
          ))}
          <button
            onClick={handleLogout}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-outline-brand/18 bg-surface text-xs font-bold text-[#cbbfd2]"
          >
            <LogOut size={18} />
            יציאה
          </button>
        </div>
      </nav>
    </div>
  );
}

export function AdminSectionHeading({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="admin-section-shell rounded-[28px] p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="designer-kicker text-[10px] font-bold uppercase">{eyebrow}</p>
          <h2 className="mt-2 font-display text-[1.65rem] text-[#fff5eb] md:text-[2rem]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#cec1cc]">{description}</p>
        </div>
        {aside ? <div className="flex flex-wrap gap-2 lg:justify-end">{aside}</div> : null}
      </div>
    </div>
  );
}

export function AdminMiniStat({ label, value, helper }: { label: string; value: React.ReactNode; helper: string }) {
  return (
    <div className="admin-stat-card rounded-[24px] p-4">
      <div className="designer-kicker text-[10px] font-bold uppercase">{label}</div>
      <div className="mt-3 font-display text-2xl text-[#fff5eb] md:text-[2rem]">{value}</div>
      <div className="mt-1 text-xs leading-5 text-[#c9bdc7]">{helper}</div>
    </div>
  );
}

export function AdminBackButton({ onClick, label = 'חזרה לדשבורד' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-brand/20 px-4 py-3 text-sm text-on-surface-variant hover:text-primary-brand sm:w-auto sm:justify-start sm:border-0 sm:px-0 sm:py-0"
    >
      <ArrowRight size={16} />
      {label}
    </button>
  );
}

function AdminNavPill({ to, label, icon, active }: { to: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <NavLink
      to={to}
      className={cn(
        'inline-flex items-center gap-2 rounded-[22px] border px-4 py-3 text-sm font-bold transition-all',
        active ? 'border-primary-brand bg-primary-brand text-on-primary-brand shadow-[0_10px_24px_rgba(185,132,90,0.18)]' : 'border-white/7 bg-surface-high/70 hover:border-primary-brand/30'
      )}
    >
      {icon}
      {label}
    </NavLink>
  );
}

function MobileNavButton({ to, label, icon, active }: { to: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <NavLink
      to={to}
      className={cn(
        'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[22px] border text-[11px] font-bold transition-all',
        active ? 'border-primary-brand bg-primary-brand text-on-primary-brand' : 'border-white/7 bg-surface text-[#cbbfd2]'
      )}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export function DashboardDateBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-outline-brand/16 bg-surface-high/70 px-4 py-3 text-xs md:text-sm text-[#d8cadf]">
      <CalendarDays size={16} className="text-primary-brand" />
      {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
    </div>
  );
}
