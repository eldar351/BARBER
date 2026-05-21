import React from 'react';
import {
  Clock,
  Edit2,
  Image as ImageIcon,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { Barber, Service } from '../../types';
import { cn } from '../../lib/utils';
import {
  AppCard,
  PrimaryButton,
  SurfacePanel,
} from '../../components/ui';
import { ChoiceCard, InputField, TextAreaField, ToggleRow } from './formFields';

export function ServiceEditorCard({
  barbers,
  editingId,
  formData,
  onCancel,
  onSubmit,
  onToggleLinkedBarber,
  setField,
}: {
  barbers: Barber[];
  editingId: number | null;
  formData: Partial<Service>;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleLinkedBarber: (barberId: number) => void;
  setField: <K extends keyof Service>(field: K, value: Service[K]) => void;
}) {
  return (
    <AppCard className="editorial-shell overflow-hidden p-4 md:p-6 xl:sticky xl:top-6">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="designer-kicker mb-2 text-[11px] font-bold uppercase">SERVICE</p>
            <h2 className="font-display text-2xl text-[#fff4e8] sm:text-3xl">
              {editingId ? 'עריכת שירות' : 'שירות חדש'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-outline-brand/16 hover:border-primary-brand"
          >
            <X size={18} />
          </button>
        </div>

        <InputField label="שם שירות" value={formData.name} onChange={(value) => setField('name', value)} />
        <TextAreaField
          label="תיאור"
          value={formData.description || ''}
          onChange={(value) => setField('description', value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label="משך בדקות"
            type="number"
            value={formData.durationMin}
            onChange={(value) => setField('durationMin', Number(value))}
            icon={<Clock size={16} />}
          />
          <InputField
            label="מחיר"
            type="number"
            value={formData.price}
            onChange={(value) => setField('price', Number(value))}
            icon={<span className="text-sm font-bold">₪</span>}
          />
        </div>

        <InputField
          label="קישור תמונה"
          value={formData.imageUrl}
          onChange={(value) => setField('imageUrl', value)}
          icon={<ImageIcon size={16} />}
        />

        <SurfacePanel className="space-y-3 p-4">
          <p className="font-bold">לאילו נותני שירות השירות משויך?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ChoiceCard
              active={(formData.barberSelectionMode || 'all') === 'all'}
              onClick={() => {
                setField('barberSelectionMode', 'all');
                setField('linkedBarberIds', []);
              }}
              title="לכל נותני השירות"
              subtitle="כל נותן שירות פעיל יוכל לבצע את השירות"
            />
            <ChoiceCard
              active={formData.barberSelectionMode === 'specific'}
              onClick={() => setField('barberSelectionMode', 'specific')}
              title="לנותני שירות ספציפיים"
              subtitle="בחירה ידנית של מי שמבצע את השירות"
            />
          </div>

          {formData.barberSelectionMode === 'specific' && (
            <div className="grid max-h-52 gap-2 overflow-y-auto pr-1">
              {barbers.map((barber) => {
                const checked = (formData.linkedBarberIds || []).includes(barber.id);
                return (
                  <label
                    key={barber.id}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition-all',
                      checked
                        ? 'border-primary-brand bg-primary-brand/10'
                        : 'border-outline-brand/16 bg-surface-high/40'
                    )}
                  >
                    <div>
                      <p className="font-bold">{barber.name}</p>
                      <p className="text-xs text-on-surface-variant">{barber.specialty}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleLinkedBarber(barber.id)}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </SurfacePanel>

        <ToggleRow
          label="שירות פעיל"
          active={Boolean(formData.isActive)}
          onToggle={() => setField('isActive', !formData.isActive)}
        />

        {formData.imageUrl && (
          <img
            src={String(formData.imageUrl)}
            alt="preview"
            className="h-44 w-full rounded-[24px] border border-white/6 object-cover shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
          />
        )}

        <PrimaryButton type="submit" className="w-full py-4">
          <Save size={18} /> {editingId ? 'שמירת שינויים' : 'הוספת שירות'}
        </PrimaryButton>
      </form>
    </AppCard>
  );
}

export function ServiceList({
  barberMap,
  onDelete,
  onEdit,
  onToggleActive,
  services,
}: {
  barberMap: Map<number, Barber>;
  onDelete: (id: number) => void;
  onEdit: (service: Service) => void;
  onToggleActive: (service: Service) => void;
  services: Service[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-2">
      {services.length === 0 && (
        <AppCard className="md:col-span-2 p-6 md:p-8">
          <div className="soft-empty">
            עדיין אין שירותים במערכת. אפשר ליצור שירות חדש מהכפתור למעלה.
          </div>
        </AppCard>
      )}

      {services.map((service) => {
        const linkedNames = (service.linkedBarberIds || [])
          .map((id) => barberMap.get(id)?.name)
          .filter(Boolean);

        return (
          <article
            key={service.id}
            className="editorial-shell overflow-hidden rounded-3xl border border-white/6 bg-surface/96 shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
          >
            <img src={service.imageUrl} alt={service.name} className="h-48 w-full object-cover" />
            <div className="space-y-4 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="designer-kicker mb-2 text-[10px] font-bold uppercase">Service</p>
                  <h3 className="font-display text-xl text-[#fff4e8] md:text-2xl">{service.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant md:leading-7">
                    {service.description}
                  </p>
                </div>
                <button
                  onClick={() => onToggleActive(service)}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-xs font-bold',
                    service.isActive
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : 'bg-slate-500/15 text-slate-300'
                  )}
                >
                  {service.isActive ? 'פעיל' : 'כבוי'}
                </button>
              </div>

              <div className="flex flex-wrap gap-3 text-sm font-bold">
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-high px-3 py-2 text-primary-brand">
                  <Clock size={14} /> {service.durationMin} דק׳
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-high px-3 py-2 text-primary-brand">
                  <span className="text-sm font-bold">₪</span> {service.price}
                </span>
              </div>

              <SurfacePanel className="p-3 text-sm">
                <p className="mb-2 font-bold">שיוך נותני שירות</p>
                {service.barberSelectionMode === 'specific' ? (
                  linkedNames.length > 0 ? (
                    <p className="text-on-surface-variant">{linkedNames.join(' · ')}</p>
                  ) : (
                    <p className="text-amber-200">לא נבחרו נותני שירות</p>
                  )
                ) : (
                  <p className="text-on-surface-variant">זמין לכל נותני השירות הפעילים</p>
                )}
              </SurfacePanel>

              <div className="grid grid-cols-1 gap-2 border-t border-outline-brand/10 pt-2 sm:grid-cols-[1fr_auto]">
                <button
                  onClick={() => onEdit(service)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-brand/20 py-3 text-sm font-bold transition-all hover:border-primary-brand"
                >
                  <Edit2 size={14} /> עריכה
                </button>
                <button
                  onClick={() => onDelete(service.id)}
                  className="flex h-12 w-full items-center justify-center rounded-2xl border border-outline-brand/20 transition-all hover:border-red-500 hover:text-red-400 sm:w-12"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
