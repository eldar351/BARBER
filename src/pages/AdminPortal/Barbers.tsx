import React, { useEffect, useState } from 'react';
import { AvailabilityException, AvailabilityWindow, Barber } from '../../types';
import { cn } from '../../lib/utils';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Check, Star, Scissors, CalendarClock, CalendarOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useLiveEvents } from '../../lib/live';
import { AdminBackButton, AdminMiniStat, AdminSectionHeading, AdminShell } from '../../components/admin/AdminShell';
import { AppCard, FeedbackNotice, PrimaryButton, SecondaryButton, SurfacePanel, TextInput } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useAdminAuth } from '../../features/admin/auth';
import { listAdminBarbers } from '../../features/admin/api';

const DAY_OPTIONS = [
  { value: 0, label: 'ראשון' },
  { value: 1, label: 'שני' },
  { value: 2, label: 'שלישי' },
  { value: 3, label: 'רביעי' },
  { value: 4, label: 'חמישי' },
  { value: 5, label: 'שישי' },
  { value: 6, label: 'שבת' },
];

const DEFAULT_WINDOWS: AvailabilityWindow[] = [
  makeWindow(0, 9 * 60, 19 * 60),
  makeWindow(1, 9 * 60, 19 * 60),
  makeWindow(2, 9 * 60, 19 * 60),
  makeWindow(3, 9 * 60, 19 * 60),
  makeWindow(4, 9 * 60, 19 * 60),
  makeWindow(5, 9 * 60, 14 * 60),
];

const INITIAL_FORM: Partial<Barber> = {
  name: '',
  specialty: '',
  imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600&h=400',
  rating: 5,
  isActive: true,
  schedules: DEFAULT_WINDOWS,
  exceptions: [],
};

export default function BarbersManagement() {
  const { showToast } = useToast();
  const { handleUnauthorized } = useAdminAuth();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Barber>>(INITIAL_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    void loadBarbers();
  }, []);

  useEffect(() => {
    if (!error && !success) return;
    const timer = window.setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [error, success]);

  useLiveEvents(
    React.useCallback((type) => {
      if (type === 'barbers_changed') loadBarbers();
    }, [])
  );

  const loadBarbers = async () => {
    try {
      setError('');
      const data = await listAdminBarbers();
      setBarbers(data);
    } catch (error) {
      if (handleUnauthorized(error)) return;
      setError(error instanceof Error ? error.message : 'טעינת נותני השירות נכשלה');
    }
  };

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM, schedules: DEFAULT_WINDOWS.map((item) => ({ ...item, id: undefined })), exceptions: [] });
    setEditingId(null);
    setIsAdding(false);
  };

  const normalizedPayload = (): Partial<Barber> => ({
    ...formData,
    rating: Number(formData.rating || 5),
    isActive: !!formData.isActive,
    schedules: (formData.schedules || []).map((window) => ({
      id: window.id,
      dayOfWeek: Number(window.dayOfWeek),
      startMinutes: Number(window.startMinutes),
      endMinutes: Number(window.endMinutes),
      isActive: !!window.isActive,
    })),
    exceptions: (formData.exceptions || []).map((item) => ({
      id: item.id,
      type: 'blocked',
      startDate: String(item.startDate),
      endDate: String(item.endDate),
      isAllDay: !!item.isAllDay,
      startMinutes: item.isAllDay ? null : Number(item.startMinutes),
      endMinutes: item.isAllDay ? null : Number(item.endMinutes),
      reason: String(item.reason || ''),
      isActive: !!item.isActive,
    })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = normalizedPayload();
    const previous = barbers;
    try {
      if (editingId) {
        setBarbers((current) => current.map((item) => item.id === editingId ? { ...item, ...payload } as Barber : item));
        await api(`/api/admin/barbers/${editingId}`, { method: 'PUT', auth: true, body: JSON.stringify(payload) });
        setSuccess('נותן השירות עודכן בהצלחה.');
        showToast('נותן השירות עודכן בהצלחה.', 'success');
      } else {
        const tempId = -Date.now();
        setBarbers((current) => [{ id: tempId, ...payload } as Barber, ...current]);
        await api('/api/admin/barbers', { method: 'POST', auth: true, body: JSON.stringify(payload) });
        setSuccess('נותן השירות נוסף בהצלחה.');
        showToast('נותן השירות נוסף בהצלחה.', 'success');
      }
      resetForm();
      await loadBarbers();
    } catch (err: any) {
      setBarbers(previous);
      setError(err.message || 'שמירת נותן השירות נכשלה');
      showToast(err.message || 'שמירת נותן השירות נכשלה', 'error');
    }
  };

  const startEdit = (barber: Barber) => {
    setEditingId(barber.id);
    setFormData({ ...barber, schedules: (barber.schedules || []).map((window) => ({ ...window })), exceptions: (barber.exceptions || []).map((item) => ({ ...item })) });
    setIsAdding(false);
  };

  const deleteBarber = async (id: number) => {
    if (!confirm('למחוק את נותן השירות הזה?')) return;
    const previous = barbers;
    setBarbers((current) => current.filter((item) => item.id !== id));
    try {
      await api(`/api/admin/barbers/${id}`, { method: 'DELETE', auth: true });
      setSuccess('נותן השירות נמחק.');
      showToast('נותן השירות נמחק.', 'success');
    } catch (err: any) {
      setBarbers(previous);
      setError(err.message || 'מחיקת נותן השירות נכשלה');
      showToast(err.message || 'מחיקת נותן השירות נכשלה', 'error');
    }
  };

  const toggleActive = async (barber: Barber) => {
    const previous = barbers;
    const next = !Boolean(barber.isActive);
    setBarbers((current) => current.map((item) => item.id === barber.id ? { ...item, isActive: next } : item));
    try {
      await api(`/api/admin/barbers/${barber.id}`, { method: 'PUT', auth: true, body: JSON.stringify({ ...barber, isActive: next }) });
      setSuccess(next ? 'נותן השירות הופעל.' : 'נותן השירות כובה.');
      showToast(next ? 'נותן השירות הופעל.' : 'נותן השירות כובה.', 'success');
    } catch (err: any) {
      setBarbers(previous);
      setError(err.message || 'עדכון הסטטוס נכשל');
      showToast(err.message || 'עדכון הסטטוס נכשל', 'error');
    }
  };

  const updateWindow = (index: number, patch: Partial<AvailabilityWindow>) => {
    const next = [...(formData.schedules || [])];
    next[index] = { ...next[index], ...patch };
    setFormData({ ...formData, schedules: next });
  };

  const addWindow = () => {
    setFormData({ ...formData, schedules: [...(formData.schedules || []), makeWindow(0, 9 * 60, 17 * 60)] });
  };

  const removeWindow = (index: number) => {
    setFormData({ ...formData, schedules: (formData.schedules || []).filter((_, currentIndex) => currentIndex !== index) });
  };

  const updateException = (index: number, patch: Partial<AvailabilityException>) => {
    const next = [...(formData.exceptions || [])];
    next[index] = { ...next[index], ...patch } as AvailabilityException;
    setFormData({ ...formData, exceptions: next });
  };

  const addException = () => {
    const today = new Date().toISOString().slice(0, 10);
    setFormData({
      ...formData,
      exceptions: [
        ...(formData.exceptions || []),
        { type: 'blocked', startDate: today, endDate: today, isAllDay: true, reason: '', isActive: true },
      ],
    });
  };

  const removeException = (index: number) => {
    setFormData({ ...formData, exceptions: (formData.exceptions || []).filter((_, currentIndex) => currentIndex !== index) });
  };

  return (
    <AdminShell
      title="ניהול נותני שירות"
      description="ניהול ספרים, התמחות, מצב פעיל וחלונות זמינות במבנה מודולרי שאפשר להרחיב אחר כך בקלות."
      backAction={<AdminBackButton onClick={() => navigate('/admin/dashboard')} />}
      actions={
        <>
          <SecondaryButton onClick={() => navigate('/admin/services')} className="w-full px-5 py-4 sm:w-auto"><Scissors size={18} /> שירותים</SecondaryButton>
          <PrimaryButton onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }} className="w-full px-6 py-4 sm:w-auto"><Plus size={18} /> נותן שירות חדש</PrimaryButton>
        </>
      }
    >
      {error && <FeedbackNotice tone="error" className="mb-6">{error}</FeedbackNotice>}

      <div className="mb-4 md:mb-6">
        <AdminSectionHeading
          eyebrow="TEAM CAPACITY"
          title="מי נמצא בפרונט ומתי הוא פנוי"
          description="ניהול הצוות, ההתמחויות וזמינות העבודה מתוך מסך אחד שמרכז את הקיבולת התפעולית."
          aside={
            <>
              <AdminMiniStat label="נותני שירות" value={barbers.length} helper="פרופילים במערכת" />
              <AdminMiniStat label="פעילים" value={barbers.filter((barber) => Boolean(barber.isActive)).length} helper="מוצגים כרגע ללקוחות" />
            </>
          }
        />
      </div>

      <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
          {(isAdding || editingId) ? (
            <AppCard className="editorial-shell overflow-hidden p-4 md:p-6 xl:sticky xl:top-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="designer-kicker mb-2 text-[11px] font-bold uppercase">TEAM</p>
                    <h2 className="font-display text-2xl text-[#fff4e8] sm:text-3xl">{editingId ? 'עריכת נותן שירות' : 'נותן שירות חדש'}</h2>
                  </div>
                  <button type="button" onClick={resetForm} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-outline-brand/16 hover:border-primary-brand"><X size={18} /></button>
                </div>
                <Input label="שם" value={formData.name} onChange={(value: string) => setFormData({ ...formData, name: value })} />
                <Input label="התמחות" value={formData.specialty} onChange={(value: string) => setFormData({ ...formData, specialty: value })} />
                <Input label="קישור תמונה" value={formData.imageUrl} onChange={(value: string) => setFormData({ ...formData, imageUrl: value })} icon={<ImageIcon size={16} />} />
                <Input label="דירוג" type="number" value={formData.rating} onChange={(value: string) => setFormData({ ...formData, rating: Number(value) })} icon={<Star size={16} />} />
                <ToggleRow label="פעיל" active={!!formData.isActive} onToggle={() => setFormData({ ...formData, isActive: !formData.isActive })} />

                <SurfacePanel className="space-y-4 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">שעות וימי עבודה</p>
                      <p className="text-xs text-on-surface-variant">אפשר להוסיף כמה חלונות זמן לכל יום שצריך</p>
                    </div>
                    <PrimaryButton type="button" onClick={addWindow} className="px-3 py-2 text-sm shadow-none"><Plus size={14} /> חלון חדש</PrimaryButton>
                  </div>

                  <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                    {(formData.schedules || []).map((window, index) => (
                      <div key={`${window.id || 'new'}-${index}`} className="space-y-3 rounded-2xl border border-outline-brand/16 p-3">
                        <div className="grid items-center gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                          <select value={window.dayOfWeek} onChange={(e) => updateWindow(index, { dayOfWeek: Number(e.target.value) })} className="rounded-xl border border-outline-brand/16 bg-background px-3 py-3 text-base outline-none appearance-none">
                            {DAY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                          <TextInput type="time" value={minutesToTime(window.startMinutes)} onChange={(e) => updateWindow(index, { startMinutes: timeToMinutes(e.target.value) })} className="rounded-xl bg-background px-3 py-3" />
                          <TextInput type="time" value={minutesToTime(window.endMinutes)} onChange={(e) => updateWindow(index, { endMinutes: timeToMinutes(e.target.value) })} className="rounded-xl bg-background px-3 py-3" />
                          <button type="button" onClick={() => removeWindow(index)} className="flex h-11 w-full items-center justify-center rounded-xl border border-outline-brand/16 hover:border-red-500 hover:text-red-400 sm:w-11"><Trash2 size={16} /></button>
                        </div>
                        <ToggleRow compact label="חלון פעיל" active={!!window.isActive} onToggle={() => updateWindow(index, { isActive: !window.isActive })} />
                      </div>
                    ))}
                  </div>
                </SurfacePanel>

                <SurfacePanel className="space-y-4 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">חסימות מיוחדות</p>
                      <p className="text-xs text-on-surface-variant">לחופשה, מחלה, אירוע אישי או חסימה חלקית ביום מסוים</p>
                    </div>
                    <PrimaryButton type="button" onClick={addException} className="px-3 py-2 text-sm shadow-none"><Plus size={14} /> חסימה</PrimaryButton>
                  </div>

                  <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                    {(formData.exceptions || []).length === 0 && <div className="rounded-2xl border border-dashed border-outline-brand/20 p-4 text-sm text-on-surface-variant">אין חסימות מיוחדות כרגע.</div>}
                    {(formData.exceptions || []).map((item, index) => (
                      <div key={`${item.id || 'new-ex'}-${index}`} className="space-y-3 rounded-2xl border border-outline-brand/16 p-3">
                        <div className="grid gap-3 lg:grid-cols-2">
                          <DateInput label="מתאריך" value={item.startDate} onChange={(value: string) => updateException(index, { startDate: value })} />
                          <DateInput label="עד תאריך" value={item.endDate} onChange={(value: string) => updateException(index, { endDate: value })} />
                        </div>
                        <Input label="סיבה" value={item.reason || ''} onChange={(value: string) => updateException(index, { reason: value })} />
                        <ToggleRow compact label="יום שלם" active={!!item.isAllDay} onToggle={() => updateException(index, { isAllDay: !item.isAllDay, startMinutes: item.isAllDay ? 9 * 60 : null, endMinutes: item.isAllDay ? 17 * 60 : null })} />
                        {!item.isAllDay && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-2"><label className="text-xs font-bold tracking-widest text-on-surface-variant">משעה</label><TextInput type="time" value={minutesToTime(Number(item.startMinutes || 0))} onChange={(e) => updateException(index, { startMinutes: timeToMinutes(e.target.value) })} className="bg-background px-3 py-3" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold tracking-widest text-on-surface-variant">עד שעה</label><TextInput type="time" value={minutesToTime(Number(item.endMinutes || 0))} onChange={(e) => updateException(index, { endMinutes: timeToMinutes(e.target.value) })} className="bg-background px-3 py-3" /></div>
                          </div>
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <ToggleRow compact label="חסימה פעילה" active={!!item.isActive} onToggle={() => updateException(index, { isActive: !item.isActive })} />
                          <button type="button" onClick={() => removeException(index)} className="flex h-11 w-full shrink-0 items-center justify-center rounded-xl border border-outline-brand/16 hover:border-red-500 hover:text-red-400 sm:w-11"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </SurfacePanel>

                {formData.imageUrl && <img src={String(formData.imageUrl)} alt="preview" className="h-44 w-full rounded-[24px] border border-white/6 object-cover shadow-[0_14px_30px_rgba(0,0,0,0.18)]" />}
                <PrimaryButton type="submit" className="w-full py-4"><Save size={18} /> {editingId ? 'שמירת שינויים' : 'הוספת נותן שירות'}</PrimaryButton>
              </form>
            </AppCard>
          ) : (
            <AppCard className="border-dashed p-6 md:p-8 text-center text-on-surface-variant">
              <div className="soft-empty">בחר נותן שירות לעריכה או צור חדש.</div>
            </AppCard>
          )}

          <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2">
            {barbers.length === 0 && (
              <AppCard className="md:col-span-2 p-6 md:p-8">
                <div className="soft-empty">עדיין אין נותני שירות במערכת. אפשר להוסיף חדש מהכפתור למעלה.</div>
              </AppCard>
            )}
            {barbers.map((barber) => (
              <article key={barber.id} className="editorial-shell overflow-hidden rounded-3xl border border-white/6 bg-surface/96 shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
                <img src={barber.imageUrl} alt={barber.name} className="w-full h-48 object-cover" />
                <div className="p-4 md:p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="designer-kicker mb-2 text-[10px] font-bold uppercase">Team</p>
                      <h3 className="font-display text-xl text-[#fff4e8] md:text-2xl">{barber.name}</h3>
                      <p className="text-sm text-on-surface-variant leading-6 md:leading-7 mt-2">{barber.specialty}</p>
                    </div>
                    <button onClick={() => toggleActive(barber)} className={cn('px-3 py-1 rounded-full text-xs font-bold shrink-0', barber.isActive ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-500/15 text-slate-300')}>{barber.isActive ? 'פעיל' : 'כבוי'}</button>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm font-bold">
                    <span className="inline-flex items-center gap-2 rounded-full bg-surface-high px-3 py-2 text-primary-brand"><Star size={14} /> {barber.rating || 5}</span>
                    {Boolean(barber.isActive) && <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-emerald-200"><Check size={14} /> מוצג ללקוחות</span>}
                  </div>
                  <div className="rounded-2xl bg-surface-high p-3">
                    <div className="flex items-center gap-2 mb-2 font-bold"><CalendarClock size={15} /> חלונות זמינות</div>
                    <div className="space-y-1 text-sm text-on-surface-variant">
                      {(barber.schedules || []).filter((window) => Boolean(window.isActive)).slice(0, 4).map((window, index) => (
                        <div key={`${window.id || index}`}>{DAY_OPTIONS.find((item) => item.value === window.dayOfWeek)?.label}: {minutesToTime(window.startMinutes)}-{minutesToTime(window.endMinutes)}</div>
                      ))}
                      {(barber.schedules || []).filter((window) => Boolean(window.isActive)).length === 0 && <div>אין חלונות זמינות פעילים</div>}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-surface-high p-3">
                    <div className="flex items-center gap-2 mb-2 font-bold"><CalendarOff size={15} /> חסימות מיוחדות</div>
                    <div className="space-y-1 text-sm text-on-surface-variant">
                      {(barber.exceptions || []).filter((item) => Boolean(item.isActive)).slice(0, 3).map((item, index) => (
                        <div key={`${item.id || index}`}>{formatDateRange(item.startDate, item.endDate)}{item.isAllDay ? ' · יום מלא' : ` · ${minutesToTime(Number(item.startMinutes || 0))}-${minutesToTime(Number(item.endMinutes || 0))}`}{item.reason ? ` · ${item.reason}` : ''}</div>
                      ))}
                      {(barber.exceptions || []).filter((item) => Boolean(item.isActive)).length === 0 && <div>אין חסימות מיוחדות פעילות</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 border-t border-outline-brand/10 pt-2 sm:grid-cols-[1fr_auto]">
                    <button onClick={() => startEdit(barber)} className="border border-outline-brand/20 hover:border-primary-brand py-3 rounded-2xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-all"><Edit2 size={14} /> עריכה</button>
                    <button onClick={() => deleteBarber(barber.id)} className="flex h-12 w-full items-center justify-center rounded-2xl border border-outline-brand/20 transition-all hover:border-red-500 hover:text-red-400 sm:w-12"><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
      </div>
    </AdminShell>
  );
}

function ToggleRow({ label, active, onToggle, compact }: { label: string; active: boolean; onToggle: () => void; compact?: boolean }) {
  return <label className={cn('flex cursor-pointer items-center justify-between rounded-2xl border border-outline-brand/16 bg-surface-high/60 px-4 py-4', compact && 'py-3')}><span className="font-bold">{label}</span><button type="button" onClick={onToggle} className={cn('relative h-8 w-14 rounded-full transition-colors', active ? 'bg-primary-container' : 'bg-outline-brand/30')}><span className={cn('absolute top-1 h-6 w-6 rounded-full bg-white transition-all', active ? 'right-1' : 'right-7')} /></button></label>;
}

function Input({ label, value, onChange, type = 'text', icon }: any) {
  return <div className="space-y-2"><label className="text-xs font-bold tracking-widest text-on-surface-variant">{label}</label><div className="relative">{icon && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">{icon}</div>}<TextInput type={type} className={cn(icon && 'pr-11')} value={value as any} onChange={(e) => onChange(e.target.value)} /></div></div>;
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2"><label className="text-xs font-bold tracking-widest text-on-surface-variant">{label}</label><TextInput type="date" className="min-h-[56px] bg-background text-base md:text-lg" value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

function makeWindow(dayOfWeek: number, startMinutes: number, endMinutes: number): AvailabilityWindow {
  return { dayOfWeek, startMinutes, endMinutes, isActive: true };
}

function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startLabel = Number.isNaN(start.getTime()) ? startDate : start.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  const endLabel = Number.isNaN(end.getTime()) ? endDate : end.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  return startDate === endDate ? startLabel : `${startLabel} עד ${endLabel}`;
}
