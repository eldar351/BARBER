import React from 'react';
import { KeyRound, Mail, ShieldCheck, ShieldOff, UserPlus } from 'lucide-react';
import { AppCard, FeedbackNotice, PrimaryButton, SecondaryButton, TextInput } from '../../components/ui';
import { AdminUser } from '../../types';

export function AdminUsersCreateCard({
  form,
  isCreating,
  onChange,
  onSubmit,
  onReset,
  validationError,
}: {
  form: { email: string; password: string; confirmPassword: string };
  isCreating: boolean;
  onChange: (field: 'email' | 'password' | 'confirmPassword', value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  validationError: string;
}) {
  return (
    <AppCard className="editorial-shell overflow-hidden p-5 md:p-6 xl:sticky xl:top-6">
      <div className="space-y-5">
        <div>
          <p className="designer-kicker text-[11px] font-bold uppercase">ADMIN ACCESS</p>
          <h2 className="mt-2 font-display text-2xl text-[#fff5eb] md:text-3xl">יצירת מנהל חדש</h2>
          <p className="mt-2 text-sm leading-6 text-[#d9ccd3]">
            מוסיפים גישת ניהול חדשה עם אימייל וסיסמה, בלי לגעת במשתמשים הקיימים.
          </p>
        </div>

        <div className="space-y-4">
          <Field label="אימייל" icon={<Mail size={18} className="text-on-surface-variant" />}>
            <TextInput autoComplete="email" enterKeyHint="next" type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} className="pr-12 pl-4" placeholder="manager@barber.com" />
          </Field>

          <Field label="סיסמה" icon={<KeyRound size={18} className="text-on-surface-variant" />}>
            <TextInput autoComplete="new-password" enterKeyHint="next" type="password" value={form.password} onChange={(event) => onChange('password', event.target.value)} className="pr-12 pl-4" placeholder="לפחות 8 תווים" />
          </Field>

          <Field label="אימות סיסמה" icon={<ShieldCheck size={18} className="text-on-surface-variant" />}>
            <TextInput autoComplete="new-password" enterKeyHint="done" type="password" value={form.confirmPassword} onChange={(event) => onChange('confirmPassword', event.target.value)} className="pr-12 pl-4" placeholder="להקליד שוב את הסיסמה" />
          </Field>
        </div>

        <div className="rounded-2xl border border-outline-brand/18 bg-surface-high/70 p-4 text-sm leading-7 text-[#d9ccd3]">
          משתמשי אדמין חדשים מקבלים גישה מלאה למערכת הניהול. מומלץ להשתמש בסיסמה ייחודית חזקה.
        </div>

        {validationError ? <FeedbackNotice tone="info">{validationError}</FeedbackNotice> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <PrimaryButton onClick={onSubmit} disabled={isCreating} className="w-full px-6 py-4 sm:flex-1">
            <UserPlus size={18} />
            {isCreating ? 'יוצר משתמש...' : 'יצירת אדמין'}
          </PrimaryButton>
          <SecondaryButton onClick={onReset} disabled={isCreating} className="w-full px-5 py-4 sm:w-auto">
            ניקוי
          </SecondaryButton>
        </div>
      </div>
    </AppCard>
  );
}

export function AdminUsersList({
  admins,
  currentAdminId,
  deletingId,
  onDelete,
}: {
  admins: AdminUser[];
  currentAdminId?: number;
  deletingId: number | null;
  onDelete: (admin: AdminUser) => void;
}) {
  return (
    <div className="grid gap-4">
      {admins.map((admin) => {
        const isCurrent = currentAdminId === admin.id;
        return (
          <div key={admin.id}>
          <AppCard className="editorial-card p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-xl text-[#fff5eb]">{admin.email}</p>
                  {isCurrent ? (
                    <span className="rounded-full border border-primary-brand/18 bg-primary-brand/10 px-3 py-1 text-[11px] font-bold text-[#f0dbc2]">מחובר עכשיו</span>
                  ) : (
                    <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[11px] font-bold text-[#e4d7de]">אדמין פעיל</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#d7cad2]">
                  <span>מזהה: #{admin.id}</span>
                  <span>נוצר: {admin.createdAt ? new Date(admin.createdAt).toLocaleString('he-IL') : 'לא זמין'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-3 py-2 text-xs font-bold text-[#efe4ea]">
                  <ShieldCheck size={14} className="text-primary-brand" />
                  גישת ניהול מלאה
                </div>
                <SecondaryButton
                  onClick={() => onDelete(admin)}
                  disabled={isCurrent || deletingId === admin.id}
                  className="px-4 py-3 text-sm"
                >
                  <ShieldOff size={16} />
                  {deletingId === admin.id ? 'מבטל גישה...' : 'בטל גישה'}
                </SecondaryButton>
              </div>
            </div>
          </AppCard>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold tracking-widest text-on-surface-variant">{label}</span>
      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2">{icon}</div>
        {children}
      </div>
    </label>
  );
}
