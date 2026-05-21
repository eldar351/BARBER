import React from 'react';
import { cn } from '../../lib/utils';
import { TextAreaInput, TextInput } from '../../components/ui';

export function ToggleRow({
  label,
  active,
  onToggle,
  compact,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center justify-between rounded-2xl border border-outline-brand/16 bg-surface-high/60 px-4 py-4',
        compact && 'py-3'
      )}
    >
      <span className="font-bold">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'relative h-8 w-14 rounded-full transition-colors',
          active ? 'bg-primary-container' : 'bg-outline-brand/30'
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-6 w-6 rounded-full bg-white transition-all',
            active ? 'right-1' : 'right-7'
          )}
        />
      </button>
    </label>
  );
}

export function InputField({
  label,
  value,
  onChange,
  type = 'text',
  icon,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold tracking-widest text-on-surface-variant">{label}</label>
      <div className="relative">
        {icon && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">{icon}</div>}
        <TextInput
          type={type}
          className={cn(icon && 'pr-11')}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold tracking-widest text-on-surface-variant">{label}</label>
      <TextAreaInput
        className="h-28 resize-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold tracking-widest text-on-surface-variant">{label}</label>
      <TextInput
        type="date"
        className="min-h-[56px] bg-background text-base md:text-lg"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function ChoiceCard({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 text-right transition-all',
        active ? 'border-primary-brand bg-primary-brand/10' : 'border-outline-brand/16 bg-surface-high/55'
      )}
    >
      <p className="mb-1 font-bold">{title}</p>
      <p className="text-xs text-on-surface-variant">{subtitle}</p>
    </button>
  );
}
