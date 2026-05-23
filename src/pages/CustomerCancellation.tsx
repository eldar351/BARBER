import { motion } from 'motion/react';
import { ArrowRight, KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { type ReactNode, useId } from 'react';
import { PublicAccessibilityFooter } from '../components/accessibility';
import { AppCard, PrimaryButton, SecondaryButton, TextInput } from '../components/ui';
import { useCancellationFlow } from '../features/booking/useCancellationFlow';
import { ThemeToggle } from '../features/theme/theme';

export default function CustomerCancellation() {
  const cancellation = useCancellationFlow();

  return (
    <div className="min-h-ios-screen bg-background text-[var(--color-page-foreground)]" dir="rtl">
      <main id="main-content" className="app-shell py-6 pb-12 md:py-10" role="main" tabIndex={-1}>
        <section className="mb-6">
          <AppCard className="hero-stage editorial-shell overflow-hidden p-5 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="luxury-label text-[11px]"><ShieldCheck size={14} /> ביטול תור מאובטח</div>
                  <ThemeToggle />
                </div>
                <h1 className="mt-5 font-display text-[2rem] leading-[1.02] text-[#fff5eb] md:text-[3.2rem]">בקשת ביטול עם קוד אימות למייל</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#e5d8df] md:text-lg md:leading-8">
                  מזינים טלפון ואימייל, מקבלים קוד בן 4 ספרות, ולאחר האימות בקשת הביטול עוברת לאישור אדמין.
                </p>
              </div>

              <div className="booking-preview-card">
                <p className="designer-kicker text-[11px] font-bold uppercase">Cancellation Flow</p>
                <div className="mt-4 space-y-3 text-sm leading-6 text-[#e5d8df]">
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">1. אימות לפי טלפון ואימייל</div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">2. הזנת קוד שנשלח למייל</div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">3. המתנה לאישור אדמין</div>
                </div>
              </div>
            </div>
          </AppCard>
        </section>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
          <AppCard className="editorial-shell p-5 md:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="designer-kicker text-[11px] font-bold uppercase">
                  {cancellation.step === 'lookup' ? 'VERIFY BOOKING' : cancellation.step === 'verify' ? 'ENTER CODE' : 'REQUEST SENT'}
                </p>
                <h2 className="mt-2 font-display text-2xl text-[#fff5eb] md:text-3xl">
                  {cancellation.step === 'lookup' ? 'זיהוי ההזמנה' : cancellation.step === 'verify' ? 'אימות קוד' : 'בקשת הביטול נקלטה'}
                </h2>
              </div>
              <Link to="/" className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[22px] border border-white/7 bg-surface-high/60 px-5 py-3.5 font-bold tracking-[-0.01em] text-[#f0e7ec] sm:w-auto">
                <ArrowRight size={16} />
                חזרה להזמנת תור
              </Link>
            </div>

            {cancellation.error && (
              <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {cancellation.error}
              </div>
            )}

            {cancellation.step === 'lookup' && (
              <div className="space-y-5">
                <Field label="טלפון" icon={<Phone size={18} className="text-on-surface-variant" />}>
                  <TextInput autoComplete="tel" enterKeyHint="next" value={cancellation.customerPhone} onChange={(event) => cancellation.setCustomerPhone(event.target.value)} inputMode="tel" placeholder="050-0000000" className="pr-12 pl-4" />
                </Field>
                <Field label="אימייל" icon={<Mail size={18} className="text-on-surface-variant" />}>
                  <TextInput autoComplete="email" enterKeyHint="done" type="email" value={cancellation.customerEmail} onChange={(event) => cancellation.setCustomerEmail(event.target.value)} inputMode="email" placeholder="name@example.com" className="pr-12 pl-4" />
                </Field>
                <div className="rounded-2xl border border-outline-brand/20 bg-surface-high p-4 text-sm leading-7 text-[#ddd1d8]">
                  אם נמצאה הזמנה מתאימה, נשלח קוד אימות למייל. מסיבות אבטחה לא נציג אם נמצאה התאמה או לא.
                </div>
                <PrimaryButton onClick={cancellation.requestCode} disabled={!cancellation.canRequestCode || cancellation.isRequestingCode} className="w-full py-4">
                  {cancellation.isRequestingCode ? 'שולח קוד...' : 'שליחת קוד אימות'}
                </PrimaryButton>
              </div>
            )}

            {cancellation.step === 'verify' && (
              <div className="space-y-5">
                <Field label="קוד אימות בן 4 ספרות" icon={<KeyRound size={18} className="text-on-surface-variant" />}>
                  <TextInput autoComplete="one-time-code" enterKeyHint="done" value={cancellation.code} onChange={(event) => cancellation.setCode(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="0000" className="pr-12 pl-4 text-center tracking-[0.4em]" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SecondaryButton onClick={cancellation.requestCode} disabled={cancellation.isRequestingCode}>
                    {cancellation.isRequestingCode ? 'שולח מחדש...' : 'שלח קוד מחדש'}
                  </SecondaryButton>
                  <PrimaryButton onClick={cancellation.verifyCode} disabled={!cancellation.canVerifyCode || cancellation.isVerifyingCode}>
                    {cancellation.isVerifyingCode ? 'מאמת...' : 'אימות ושליחת בקשת ביטול'}
                  </PrimaryButton>
                </div>
              </div>
            )}

            {cancellation.step === 'done' && (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-container shadow-lg">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
                <p className="text-lg leading-8 text-[#fff5eb]">בקשת הביטול נשלחה לאישור אדמין.</p>
                <p className="text-sm leading-7 text-[#d7cad2]">הסלוט שלך עדיין שמור עד שהאדמין יאשר את הביטול בפועל.</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <SecondaryButton onClick={cancellation.reset}>ביטול נוסף</SecondaryButton>
                  <Link to="/" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[22px] bg-primary-brand px-5 py-3.5 font-extrabold tracking-[-0.01em] text-on-primary-brand shadow-[0_12px_30px_rgba(185,132,90,0.22)]">
                    חזרה למסך הראשי
                  </Link>
                </div>
              </div>
            )}
          </AppCard>
        </motion.div>
      </main>

      <PublicAccessibilityFooter />
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  const inputId = useId();
  const child = typeof children === 'object' && children && 'props' in (children as object)
    ? (children as React.ReactElement)
    : null;
  return (
    <label htmlFor={inputId} className="block space-y-2">
      <span className="text-xs font-bold tracking-widest text-on-surface-variant">{label}</span>
      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2">{icon}</div>
        {child ? React.cloneElement(child, { id: inputId }) : children}
      </div>
    </label>
  );
}
