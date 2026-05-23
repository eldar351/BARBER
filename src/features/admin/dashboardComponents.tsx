import React, { useId } from 'react';
import { Bell, Calendar as CalendarIcon, Check, Clock3, Edit3, Mail, MessageCircle, Phone, Plus, Search, Settings2, User, X } from 'lucide-react';
import { Appointment, AppointmentStatus, Barber, BusinessSettings, Service } from '../../types';
import { cn } from '../../lib/utils';
import { AppCard, PrimaryButton, SecondaryButton, SurfacePanel, TextAreaInput, TextInput } from '../../components/ui';
import { formatDate, formatFullDate, statusLabel } from './dashboardUtils';

export function DashboardStats({
  counts,
  statusFilter,
  setStatusFilter,
}: {
  counts: Record<AppointmentStatus, number>;
  statusFilter: 'all' | AppointmentStatus;
  setStatusFilter: (value: 'all' | AppointmentStatus) => void;
}) {
  const items: Array<{ key: 'all' | AppointmentStatus; label: string; count: number; helper: string; tone?: 'urgent' }> = [
    { key: 'all', label: 'הכול', count: counts.cancellation_requested + counts.pending + counts.confirmed + counts.completed + counts.cancelled, helper: 'תמונת מצב' },
    { key: 'cancellation_requested', label: 'בקשות ביטול', count: counts.cancellation_requested, helper: 'דורש החלטה', tone: counts.cancellation_requested > 0 ? 'urgent' : undefined },
    { key: 'pending', label: 'ממתינים', count: counts.pending, helper: 'דורש טיפול', tone: counts.pending > 0 ? 'urgent' : undefined },
    { key: 'confirmed', label: 'מאושרים', count: counts.confirmed, helper: 'סגורים' },
    { key: 'completed', label: 'הושלמו', count: counts.completed, helper: 'בוצעו' },
    { key: 'cancelled', label: 'בוטלו', count: counts.cancelled, helper: 'לא יתקיימו' },
  ];

  return (
    <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => setStatusFilter(item.key)}
          className={cn(
            'admin-stat-card rounded-[24px] p-3 text-right transition-all sm:rounded-[26px] sm:p-4',
            statusFilter === item.key
              ? 'border-primary-brand bg-primary-brand/14 shadow-[0_12px_32px_rgba(185,132,90,0.14)]'
              : 'hover:border-primary-brand/28',
            item.tone === 'urgent' && statusFilter !== item.key && 'border-amber-500/22 bg-amber-500/8'
          )}
        >
          <div className="designer-kicker text-[10px] font-bold uppercase">{item.label}</div>
          <div className="text-xl font-extrabold text-[#fff4e8] sm:text-2xl md:text-3xl">{item.count}</div>
          <div className="mt-2 text-[11px] leading-5 text-[#cdbfca]">{item.helper}</div>
        </button>
      ))}
    </section>
  );
}

export function DashboardFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}: {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: 'all' | AppointmentStatus;
  setStatusFilter: (value: 'all' | AppointmentStatus) => void;
}) {
  const chips: Array<{ value: 'all' | AppointmentStatus; label: string }> = [
    { value: 'all', label: 'הכול' },
    { value: 'cancellation_requested', label: 'בקשות ביטול' },
    { value: 'pending', label: 'ממתינים' },
    { value: 'confirmed', label: 'מאושרים' },
    { value: 'completed', label: 'הושלמו' },
    { value: 'cancelled', label: 'בוטלו' },
  ];

  return (
    <div className="admin-section-shell rounded-[28px] p-3 md:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#cdbfca]" size={18} />
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-transparent bg-surface-high/72 pr-12"
            placeholder="חיפוש לפי לקוח, טלפון, שירות או שעה"
          />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:mx-0 xl:px-0">
          {chips.map((chip) => (
            <FilterChip key={chip.value} active={statusFilter === chip.value} onClick={() => setStatusFilter(chip.value)}>
              {chip.label}
            </FilterChip>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardBoard({
  filteredAppointments,
  updateStatus,
  openEditAppointment,
  rejectCancellationRequest,
}: {
  filteredAppointments: Appointment[];
  updateStatus: (id: number, status: AppointmentStatus) => void;
  openEditAppointment: (appointment: Appointment) => void;
  rejectCancellationRequest: (id: number) => void;
}) {
  return (
    <section className="space-y-3">
      {filteredAppointments.length === 0 ? (
        <div className="soft-empty">אין תורים להצגה בסינון הנוכחי.</div>
      ) : (
        filteredAppointments.map((app) => (
          <AppointmentRow key={app.id} app={app} updateStatus={updateStatus} openEditAppointment={openEditAppointment} rejectCancellationRequest={rejectCancellationRequest} />
        ))
      )}
    </section>
  );
}

export function DashboardInsights({
  nextTask,
  counts,
  updateStatus,
  openEditAppointment,
}: {
  nextTask: Appointment | null;
  counts: Record<AppointmentStatus, number>;
  updateStatus: (id: number, status: AppointmentStatus) => void;
  openEditAppointment: (appointment: Appointment) => void;
}) {
  return (
    <AppCard className="editorial-shell p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-brand">FIFO QUEUE</p>
          <h2 className="mt-2 text-xl font-bold text-[#fff4e8] sm:text-2xl">המשימה החדשה הבאה</h2>
          <p className="mt-1 text-sm text-[#cdbfca]">ראשון שנכנס הוא הראשון שמקבל טיפול.</p>
        </div>
        <div className="rounded-2xl bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100">
          {counts.pending} ממתינים
        </div>
      </div>

      {nextTask ? (
        <SurfacePanel className="mt-5 border border-white/8 bg-background/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-bold text-white">{nextTask.customerName}</div>
              <div className="mt-1 text-sm text-[#d5c8d0]">{nextTask.serviceName || 'שירות'} · {nextTask.barberName || 'ללא משויך'}</div>
            </div>
            <StatusBadge status={nextTask.status} />
          </div>

          <div className="mt-4 space-y-2 text-sm text-[#d5c8d0]">
            <MetaLine icon={<CalendarIcon size={14} className="text-primary-brand" />} text={`${formatFullDate(nextTask.date)} · ${nextTask.time}`} />
            <MetaLine icon={<Phone size={14} className="text-primary-brand" />} text={nextTask.customerPhone} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <ActionButton tone="primary" onClick={() => updateStatus(nextTask.id, 'confirmed')}><Check size={14} /> אשר</ActionButton>
            <ActionButton onClick={() => updateStatus(nextTask.id, 'cancelled')}><X size={14} /> דחה</ActionButton>
            <ActionButton onClick={() => openEditAppointment(nextTask)}><Edit3 size={14} /> ערוך</ActionButton>
            <ActionLink href={buildWhatsAppLink(nextTask.customerPhone, nextTask.customerName)}><MessageCircle size={14} /> WhatsApp</ActionLink>
          </div>
        </SurfacePanel>
      ) : null}
    </AppCard>
  );
}

export function QuickAddAppointment({
  isOpen,
  setIsOpen,
  form,
  setForm,
  services,
  barbers,
  createAppointment,
  isCreating,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  form: { customerName: string; customerPhone: string; customerEmail: string; serviceId: string; barberId: string; date: string; time: string };
  setForm: (value: { customerName: string; customerPhone: string; customerEmail: string; serviceId: string; barberId: string; date: string; time: string }) => void;
  services: Service[];
  barbers: Barber[];
  createAppointment: () => void;
  isCreating: boolean;
}) {
  return (
    <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'סגירת טופס הוספת תור' : 'פתיחת טופס הוספת תור'}
          className="fixed left-4 z-40 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-primary-brand px-4 text-on-primary-brand shadow-[0_16px_36px_rgba(185,132,90,0.28)] [bottom:calc(env(safe-area-inset-bottom,0px)+5.75rem)] md:h-14 md:w-14 md:px-0 md:bottom-6 md:left-6"
        >
        <Plus size={22} />
        <span className="text-sm font-bold md:hidden">תור חדש</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 px-4 py-6 pt-safe backdrop-blur-sm" onClick={() => setIsOpen(false)}>
        <div role="dialog" aria-modal="true" aria-labelledby="quick-add-title" className="mx-auto max-w-2xl max-h-ios-modal ios-scroll overflow-y-auto pb-safe" onClick={(e) => e.stopPropagation()}>
            <AppCard className="p-4 md:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-brand">QUICK ACTION</p>
                  <h2 id="quick-add-title" className="mt-2 text-2xl font-bold text-[#fff4e8]">הוספת תור</h2>
                </div>
                <SecondaryButton onClick={() => setIsOpen(false)} className="px-4">סגור</SecondaryButton>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldGroup label="שם לקוח"><TextInput value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></FieldGroup>
                  <FieldGroup label="טלפון"><TextInput value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} inputMode="tel" /></FieldGroup>
                </div>
                <FieldGroup label="אימייל"><TextInput type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} inputMode="email" /></FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldGroup label="שירות">{renderServiceSelect(form.serviceId, (value) => setForm({ ...form, serviceId: value }), services)}</FieldGroup>
                  <FieldGroup label="נותן שירות">{renderBarberSelect(form.barberId, (value) => setForm({ ...form, barberId: value }), barbers)}</FieldGroup>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldGroup label="תאריך"><TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FieldGroup>
                  <FieldGroup label="שעה"><TextInput type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></FieldGroup>
                </div>
                <PrimaryButton onClick={createAppointment} disabled={isCreating} className="w-full py-4">{isCreating ? 'שומר...' : 'שמור תור'}</PrimaryButton>
              </div>
            </AppCard>
          </div>
        </div>
      )}
    </>
  );
}

export function EditAppointmentModal({
  isOpen,
  setIsOpen,
  form,
  setForm,
  services,
  barbers,
  saveAppointment,
  isSaving,
  rejectCancellationRequest,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  form: { customerName: string; customerPhone: string; customerEmail: string; serviceId: string; barberId: string; date: string; time: string; status: AppointmentStatus; notes: string };
  setForm: (value: { customerName: string; customerPhone: string; customerEmail: string; serviceId: string; barberId: string; date: string; time: string; status: AppointmentStatus; notes: string }) => void;
  services: Service[];
  barbers: Barber[];
  saveAppointment: () => void;
  isSaving: boolean;
  rejectCancellationRequest: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 px-4 py-6 pt-safe backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="edit-appointment-title" className="mx-auto max-w-3xl max-h-ios-modal ios-scroll overflow-y-auto pb-safe" onClick={(e) => e.stopPropagation()}>
        <AppCard className="p-4 md:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-brand">EDIT APPOINTMENT</p>
                  <h2 id="edit-appointment-title" className="mt-2 text-2xl font-bold text-[#fff4e8]">עריכת תור</h2>
            </div>
            <SecondaryButton onClick={() => setIsOpen(false)} className="px-4">סגור</SecondaryButton>
          </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldGroup label="שם לקוח"><TextInput value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></FieldGroup>
                <FieldGroup label="טלפון"><TextInput value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} inputMode="tel" /></FieldGroup>
              </div>
              <FieldGroup label="אימייל"><TextInput type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} inputMode="email" /></FieldGroup>

              <div className="grid gap-4 md:grid-cols-3">
                <FieldGroup label="סטטוס">
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })} className="w-full min-h-[54px] appearance-none rounded-[22px] border border-white/7 bg-surface-high/78 px-4 py-3.5 text-base text-[#f3ebef] outline-none">
                    <option value="cancellation_requested">ממתין לאישור ביטול</option>
                    <option value="pending">ממתין</option>
                    <option value="confirmed">מאושר</option>
                    <option value="completed">הושלם</option>
                  <option value="cancelled">בוטל</option>
                </select>
              </FieldGroup>
              <FieldGroup label="שירות">{renderServiceSelect(form.serviceId, (value) => setForm({ ...form, serviceId: value }), services)}</FieldGroup>
              <FieldGroup label="נותן שירות">{renderBarberSelect(form.barberId, (value) => setForm({ ...form, barberId: value }), barbers)}</FieldGroup>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup label="תאריך"><TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FieldGroup>
              <FieldGroup label="שעה"><TextInput type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></FieldGroup>
            </div>

            <FieldGroup label="הערות"><TextAreaInput value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-24 resize-none" /></FieldGroup>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {form.status === 'cancellation_requested' && <SecondaryButton onClick={rejectCancellationRequest}>דחה בקשת ביטול</SecondaryButton>}
              <SecondaryButton onClick={() => setIsOpen(false)}>ביטול</SecondaryButton>
              <PrimaryButton onClick={saveAppointment} disabled={isSaving}>{isSaving ? 'שומר...' : 'שמור שינויים'}</PrimaryButton>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  );
}

export function SettingsPanel({ settings, updateSetting, saveSettings }: { settings: BusinessSettings; updateSetting: (key: keyof BusinessSettings, value: string | number) => void; saveSettings: () => void }) {
  return (
    <AppCard className="editorial-shell p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-brand"><Settings2 size={14} /> תוכן דף פתיחה</div>
          <h2 className="mt-2 text-xl font-bold text-[#fff4e8]">הגדרות תוכן</h2>
        </div>
        <PrimaryButton onClick={saveSettings} className="w-full px-4 py-3 sm:w-auto">שמור</PrimaryButton>
      </div>
      <div className="space-y-4">
        <FieldGroup label="Badge"><TextInput value={settings.heroBadgeText} onChange={(e) => updateSetting('heroBadgeText', e.target.value)} /></FieldGroup>
        <FieldGroup label="כותרת ראשית"><TextInput value={settings.heroTitle} onChange={(e) => updateSetting('heroTitle', e.target.value)} /></FieldGroup>
        <FieldGroup label="טקסט משני"><TextAreaInput value={settings.heroSubtitle} onChange={(e) => updateSetting('heroSubtitle', e.target.value)} className="h-28 resize-none" /></FieldGroup>
      </div>
    </AppCard>
  );
}

function FilterChip({ active, onClick, children }: { key?: React.Key; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn('shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition-all', active ? 'bg-primary-brand text-on-primary-brand' : 'bg-surface-high/72 text-[#efe4ea] hover:bg-surface-highest/80')}>{children}</button>;
}

function AppointmentRow({ app, updateStatus, openEditAppointment, rejectCancellationRequest }: { key?: React.Key; app: Appointment; updateStatus: (id: number, status: AppointmentStatus) => void; openEditAppointment: (appointment: Appointment) => void; rejectCancellationRequest: (id: number) => void }) {
  const isPending = app.status === 'pending';
  const isConfirmed = app.status === 'confirmed';
  const isCancellationRequested = app.status === 'cancellation_requested';

  return (
    <article className="admin-section-shell editorial-shell rounded-[24px] p-3.5 md:rounded-[28px] md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-[#fff4e8]">{app.customerName}</h3>
            <StatusBadge status={app.status} />
          </div>
          <div className="mt-3 flex flex-col gap-2 text-sm leading-6 text-[#d5c8d0] md:flex-row md:flex-wrap md:items-center md:gap-4">
            <MetaLine icon={<CalendarIcon size={14} className="text-primary-brand" />} text={`${formatDate(app.date)} · ${app.time}`} />
            <MetaLine icon={<Clock3 size={14} className="text-primary-brand" />} text={app.serviceName || 'שירות'} />
            <MetaLine icon={<User size={14} className="text-primary-brand" />} text={app.barberName || 'ללא משויך'} />
            <MetaLine icon={<Phone size={14} className="text-primary-brand" />} text={app.customerPhone} />
            <MetaLine icon={<Mail size={14} className="text-primary-brand" />} text={app.customerEmail} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[320px]">
          {isCancellationRequested && <ActionButton tone="primary" onClick={() => updateStatus(app.id, 'cancelled')}><Check size={14} /> אשר ביטול</ActionButton>}
          {isCancellationRequested && <ActionButton onClick={() => rejectCancellationRequest(app.id)}><X size={14} /> דחה בקשה</ActionButton>}
          {isPending && <ActionButton tone="primary" onClick={() => updateStatus(app.id, 'confirmed')}><Check size={14} /> אשר</ActionButton>}
          {isPending && <ActionButton onClick={() => updateStatus(app.id, 'cancelled')}><X size={14} /> דחה</ActionButton>}
          {isConfirmed && <ActionButton tone="primary" onClick={() => updateStatus(app.id, 'completed')}>הושלם</ActionButton>}
          {!isPending && !isConfirmed && !isCancellationRequested && <div className="hidden lg:block" />}
          <ActionButton onClick={() => openEditAppointment(app)}><Edit3 size={14} /> ערוך</ActionButton>
          <ActionLink href={buildWhatsAppLink(app.customerPhone, app.customerName)}><MessageCircle size={14} /> WhatsApp</ActionLink>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const map = { cancellation_requested: 'bg-fuchsia-500/15 text-fuchsia-100', pending: 'bg-amber-500/15 text-amber-100', confirmed: 'bg-emerald-500/15 text-emerald-100', completed: 'bg-sky-500/15 text-sky-100', cancelled: 'bg-rose-500/15 text-rose-100' };
  return <span className={cn('rounded-full px-3 py-1 text-xs font-bold', map[status])}>{statusLabel(status)}</span>;
}

function ActionButton({ children, onClick, tone }: { children: React.ReactNode; onClick: () => void; tone?: 'primary' }) {
  return <button onClick={onClick} className={cn('inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border px-3 text-sm font-bold', tone === 'primary' ? 'border-primary-brand bg-primary-brand text-on-primary-brand' : 'border-white/8 bg-surface-high/70 text-white hover:border-primary-brand/30')}>{children}</button>;
}

function ActionLink({ children, href }: { children: React.ReactNode; href: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-white/8 bg-surface-high/70 px-3 text-sm font-bold text-white hover:border-primary-brand/30">{children}</a>;
}

function MetaLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="inline-flex items-center gap-2">{icon}<span>{text}</span></div>;
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const inputId = useId();
  const child = React.isValidElement(children) ? React.cloneElement(children, { id: inputId } as React.HTMLAttributes<HTMLElement>) : children;
  return <label htmlFor={inputId} className="block space-y-2"><span className="text-xs font-bold tracking-widest text-on-surface-variant">{label}</span>{child}</label>;
}

function renderServiceSelect(value: string, onChange: (value: string) => void, services: Service[]) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-h-[54px] appearance-none rounded-[22px] border border-white/7 bg-surface-high/78 px-4 py-3.5 text-base text-[#f3ebef] outline-none">
      <option value="">בחר שירות</option>
      {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
    </select>
  );
}

function renderBarberSelect(value: string, onChange: (value: string) => void, barbers: Barber[]) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-h-[54px] appearance-none rounded-[22px] border border-white/7 bg-surface-high/78 px-4 py-3.5 text-base text-[#f3ebef] outline-none">
      <option value="">בחר נותן שירות</option>
      {barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}
    </select>
  );
}

function buildWhatsAppLink(phone: string, customerName: string) {
  const normalized = phone.replace(/[^\d+]/g, '');
  const message = encodeURIComponent(`היי ${customerName}, מעדכן לגבי התור שלך.`);
  return `https://wa.me/${normalized.replace(/^\+/, '')}?text=${message}`;
}
