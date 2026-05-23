import React, { useEffect, useId, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Sparkles, Smartphone, Clock3 } from 'lucide-react';
import { api } from '../../lib/api';
import { AppCard, PrimaryButton, TextInput } from '../../components/ui';
import { useAdminAuth } from '../../features/admin/auth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAdminAuth();
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/admin/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate('/admin/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await api<{ token: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(result);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || 'אימייל או סיסמה שגויים.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-ios-screen relative overflow-hidden bg-background px-4 pb-8 pt-safe text-[#eadfee] sm:px-6 sm:pb-10" dir="rtl">
      <div className="absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-container/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-primary-brand/5 blur-[150px] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,rgba(228,178,118,0.1),transparent_52%)] pointer-events-none" />

      <main id="main-content" className="relative z-10 mx-auto flex min-h-ios-screen max-w-6xl items-center justify-center" role="main" tabIndex={-1}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] lg:items-stretch">
          <AppCard className="editorial-shell hidden p-7 lg:flex lg:flex-col lg:justify-between xl:p-9">
            <div>
              <div className="luxury-label">
                <Sparkles size={14} />
                BACK OFFICE
              </div>
              <h1 className="mt-6 font-display text-4xl leading-[1.02] text-[#fff5eb] xl:text-[3.4rem]">
                שליטה שקטה על כל מה שקורה ב-BARBER
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-[#d7c9d3]">
                תורים, שירותים, צוות ולוגים במסך עבודה אחד שמתאים גם לתפעול מהיר מהמובייל.
              </p>
            </div>

            <div className="grid gap-3">
              <LoginFeature icon={<ShieldCheck size={16} />} title="כניסה מאובטחת" text="גישה מוגנת למערכת הניהול בלבד." />
              <LoginFeature icon={<Smartphone size={16} />} title="מובייל ראשון" text="עובד נוח גם בזמן תנועה או מהחנות." />
              <LoginFeature icon={<Clock3 size={16} />} title="תגובה מיידית" text="אישור תורים, עריכות ולוגים בלי לקפוץ בין מסכים." />
            </div>
          </AppCard>

          <AppCard className="editorial-shell bg-surface/82 p-5 backdrop-blur-xl sm:p-6 md:p-8 lg:p-10">
            <header className="mb-7 space-y-4 text-center md:mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-outline-brand/24 bg-surface-high/70 shadow-[0_16px_34px_rgba(0,0,0,0.2)]">
                <ShieldCheck className="h-8 w-8 text-primary-brand" />
              </div>
              <div>
                <p className="designer-kicker mb-2 text-xs font-bold uppercase">BARBER ADMIN</p>
                <h2 className="font-display text-3xl tracking-tight text-[#fff5eb] md:text-4xl">כניסת מנהל</h2>
              </div>
              <p className="mx-auto max-w-md text-sm leading-6 text-on-surface-variant md:text-base">
                גישה מהירה, מאובטחת ומדויקת למרכז הניהול.
              </p>
            </header>

            <div className="mb-5 flex flex-wrap gap-2 lg:hidden">
              <LoginCompactBadge icon={<ShieldCheck size={14} />} text="מאובטח" />
              <LoginCompactBadge icon={<Smartphone size={14} />} text="נוח במובייל" />
              <LoginCompactBadge icon={<Clock3 size={14} />} text="מהיר לתפעול" />
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                <ShieldAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <Field label="דוא״ל" icon={<Mail size={18} className="text-on-surface-variant" />}>
                <TextInput autoComplete="username" enterKeyHint="next" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pr-12 pl-4 text-on-surface" placeholder="admin@example.com" required />
              </Field>

              <Field label="סיסמה" icon={<Lock size={18} className="text-on-surface-variant" />}>
                <TextInput autoComplete="current-password" enterKeyHint="done" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="pr-12 pl-12 text-on-surface" placeholder="••••••••" required />
                <button type="button" aria-label={showPassword ? 'הסתרת הסיסמה' : 'הצגת הסיסמה'} onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary-brand">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </Field>

              <PrimaryButton type="submit" disabled={isLoading} className="group mt-2 h-[56px] w-full bg-primary-container text-white">
                {isLoading ? 'מתחבר...' : 'התחברות'}
                <ArrowLeft className="transition-transform group-hover:-translate-x-1" />
              </PrimaryButton>
            </form>
          </AppCard>
        </motion.div>
      </main>
    </div>
  );
}

function LoginFeature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="admin-section-shell rounded-[24px] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-primary-brand">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-[#fff4e8]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[#d0c3cd]">{text}</p>
        </div>
      </div>
    </div>
  );
}

function LoginCompactBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-2 text-xs font-bold text-[#efe4ea]">
      <span className="text-primary-brand">{icon}</span>
      {text}
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  const inputId = useId();
  const child = React.isValidElement(children) ? React.cloneElement(children, { id: inputId } as React.HTMLAttributes<HTMLElement>) : children;
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-xs font-bold tracking-widest text-on-surface-variant">{label}</label>
      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2">{icon}</div>
        {child}
      </div>
    </div>
  );
}
