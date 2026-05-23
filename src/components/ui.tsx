import React from 'react';
import { cn } from '../lib/utils';

export function AppCard({ className, soft = false, children }: { className?: string; soft?: boolean; children: React.ReactNode }) {
  return <div className={cn('rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] bg-surface/96 shadow-[0_20px_50px_rgba(0,0,0,0.22)] backdrop-blur-sm', soft && 'bg-surface-high/72 shadow-[0_12px_30px_rgba(0,0,0,0.14)]', className)}>{children}</div>;
}

export function SurfacePanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-[24px] border border-white/6 bg-surface-high/68', className)}>{children}</div>;
}

export function PrimaryButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cn('inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[22px] bg-primary-brand px-5 py-3.5 font-extrabold tracking-[-0.01em] text-on-primary-brand shadow-[0_12px_30px_rgba(185,132,90,0.22)] disabled:cursor-not-allowed disabled:opacity-50', className)}>{children}</button>;
}

export function SecondaryButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cn('inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[22px] border border-white/7 bg-surface-high/60 px-5 py-3.5 font-bold tracking-[-0.01em] text-[#f0e7ec]', className)}>{children}</button>;
}

export function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('w-full min-h-[54px] appearance-none rounded-[22px] border border-white/7 bg-surface-high/78 px-4 py-3.5 text-base leading-6 text-[#f3ebef] outline-none focus:border-primary-brand focus:bg-surface-highest/70', className)} />;
}

export function TextAreaInput({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn('w-full appearance-none rounded-[22px] border border-white/7 bg-surface-high/78 px-4 py-3.5 text-base leading-7 text-[#f3ebef] outline-none focus:border-primary-brand focus:bg-surface-highest/70', className)} />;
}

export function FeedbackNotice({ className, tone = 'info', children }: { className?: string; tone?: 'info' | 'success' | 'error'; children: React.ReactNode }) {
  const tones = {
    info: 'border-primary-brand/22 bg-primary-brand/10 text-[#f0dbc2]',
    success: 'border-emerald-500/24 bg-emerald-500/10 text-emerald-100',
    error: 'border-red-500/30 bg-red-500/10 text-red-200',
  };
  return <div className={cn('rounded-[22px] border px-4 py-3 text-sm font-medium tracking-[-0.01em]', tones[tone], className)}>{children}</div>;
}
