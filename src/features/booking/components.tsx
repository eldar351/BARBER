import React, { useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Calendar as CalendarIcon, Check, ChevronLeft, Clock, Mail, Phone, Scissors, Sparkles, Star, User, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Barber, BusinessSettings, Service } from '../../types';
import { cn } from '../../lib/utils';
import { AppCard, PrimaryButton, SurfacePanel, TextInput } from '../../components/ui';
import { BookingStep, DateAvailability, Slot } from './types';
import { formatLongDate, formatShortDate, formatShortWeekday, getDateStateText, sameDay } from './utils';

export function BookingHeader({ step, progressStep, selectedStepLabel, booked }: { step: BookingStep; progressStep: number; selectedStepLabel: string; booked: boolean }) {
  const steps = [
    { key: 'service', label: 'שירות' },
    { key: 'date', label: 'יום ושעה' },
    { key: 'confirm', label: 'אישור' },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-background/88 pt-safe backdrop-blur-xl">
      <div className="app-shell py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="designer-kicker text-[11px] font-bold uppercase">BARBER STUDIO</p>
            <h1 className="font-display text-xl text-[#f5e6d5] md:text-2xl">{step === 'date' ? 'מתי נתראה?' : step === 'confirm' ? 'אישור פרטים' : 'זימון תורים'}</h1>
          </div>
          <nav className="hidden md:flex items-center gap-4" aria-label="התקדמות הזמנה">
            <Link to="/cancel" className="text-sm font-bold text-[#d8c9d3] transition-colors hover:text-primary-brand">ביטול תור</Link>
            {steps.map((item, index) => (
              <React.Fragment key={item.key}>
                {index > 0 && <div className="h-px w-6 bg-outline-brand" />}
                <StepBullet active={step === item.key} done={progressStep > index + 1 || (item.key === 'confirm' && booked)} label={item.label} num={index + 1} />
              </React.Fragment>
            ))}
          </nav>
        </div>
        <div className="mt-4 md:hidden">
          <div className="mb-3 flex items-center justify-between text-[11px] font-bold text-[#ddd1d8]">
            <span>שלב {progressStep} מתוך 3</span>
            <div className="flex items-center gap-3">
              <Link to="/cancel" className="text-primary-brand">ביטול תור</Link>
              <span>{selectedStepLabel}</span>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-high">
            <div className="h-full rounded-full bg-primary-brand transition-all" style={{ width: `${(progressStep / 3) * 100}%` }} />
          </div>
        </div>
      </div>
    </header>
  );
}

export function HeroSection({ settings, serviceCount, barberCount }: { settings: BusinessSettings | null; serviceCount: number; barberCount: number }) {
  return (
    <section className="mb-5 md:mb-6">
      <AppCard className="hero-stage editorial-shell mx-auto max-w-6xl overflow-hidden p-4 sm:p-5 md:p-7">
        <div className="absolute inset-y-0 left-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(215,170,118,0.18),transparent_68%)] md:block" aria-hidden="true" />
        <div className="relative grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="text-right">
            <div className="mb-4 inline-flex luxury-label text-[11px] sm:text-xs"><Sparkles size={15} /> {settings?.heroBadgeText || 'הזמנה מהירה ונוחה'}</div>
            <h2 className="max-w-3xl font-display text-[1.8rem] leading-[1.05] text-[#fff5eb] sm:text-[2.35rem] md:text-[3.6rem]">{settings?.heroTitle || 'קביעת תור מדויקת בלי טלפונים ובלי המתנה'}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#e5d8df] md:text-lg md:leading-8">{settings?.heroSubtitle || 'בוחרים שירות, איש צוות, יום ושעה בתוך זרימה אחת נקייה וברורה.'}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <MetricPill value={serviceCount} label="שירותים" />
              <MetricPill value={barberCount} label="נותני שירות" />
              <MetricPill value="3" label="שלבים פשוטים" />
            </div>
          </div>
          <div className="relative">
            <div className="halo-orb absolute -left-6 -top-8 h-28 w-28 md:h-36 md:w-36" aria-hidden="true" />
            <div className="booking-preview-card">
              <p className="designer-kicker text-[11px] font-bold uppercase">Booking Flow</p>
              <div className="mt-4 space-y-3">
                <PreviewRow index="01" title="שירות" detail="בחירה ברורה מתוך הקטלוג הפעיל" />
                <PreviewRow index="02" title="יום ושעה" detail="רק זמינות אמיתית, בזמן אמת" />
                <PreviewRow index="03" title="אישור" detail="פרטים קצרים ושליחה מיידית" />
              </div>
              <div className="editorial-divider my-5" />
              <p className="text-sm leading-6 text-[#dccfd6]">המסך בנוי למהירות: פחות עומס חזותי, פחות חיכוך, יותר המרות.</p>
            </div>
          </div>
        </div>
      </AppCard>
    </section>
  );
}

export function ServiceStep({
  services,
  barbers,
  selectedService,
  selectedBarber,
  eligibleBarbers,
  setSelectedService,
  setSelectedBarber,
  setSelectedTime,
  canContinueToDate,
  setStep,
}: {
  services: Service[];
  barbers: Barber[];
  selectedService: Service | null;
  selectedBarber: Barber | null;
  eligibleBarbers: Barber[];
  setSelectedService: (service: Service) => void;
  setSelectedBarber: (barber: Barber) => void;
  setSelectedTime: (value: string | null) => void;
  canContinueToDate: boolean;
  setStep: (step: BookingStep) => void;
}) {
  const handleServiceChoice = (service: Service) => {
    setSelectedService(service);
    setSelectedTime(null);

    const matchingBarbers = service.barberSelectionMode === 'specific'
      ? barbers.filter((barber) => (service.linkedBarberIds || []).includes(barber.id))
      : barbers;

    if (matchingBarbers.length === 1) {
      setSelectedBarber(matchingBarbers[0]);
      setStep('date');
    }
  };

  return (
    <motion.div key="service" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mx-auto max-w-6xl space-y-6">
      <section className="space-y-5">
        <SectionHeader title="1. בחר שירות" subtitle="בחר את השירות שמתאים לך." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((service) => {
            const selected = selectedService?.id === service.id;
            return (
              <button
                key={service.id}
                onClick={() => handleServiceChoice(service)}
                className={cn(
                  'text-right rounded-[28px] editorial-card transition-all hover:-translate-y-0.5',
                  selected ? 'border-primary-brand ring-1 ring-primary-brand/40 shadow-[0_18px_40px_rgba(185,132,90,0.16)]' : 'hover:border-white/12'
                )}
              >
                <div className="grid sm:grid-cols-[130px_1fr]">
                  <img src={service.imageUrl} alt={service.name} className="h-28 w-full rounded-t-[28px] object-cover sm:h-full sm:rounded-s-none sm:rounded-e-[28px]" />
                  <div className="p-4 md:p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {service.category && <p className="mb-2 text-xs font-bold text-[#e7cfb5]">{service.category}</p>}
                        <h3 className="font-display text-lg text-[#fff6ee] md:text-2xl">{service.name}</h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#e1d4db]">{service.description}</p>
                      </div>
                      {selected && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-brand"><Check className="h-5 w-5 text-on-primary-brand" /></div>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-primary-brand">
                      <span className="inline-flex items-center gap-2"><Clock size={15} /> {service.durationMin} דק׳</span>
                      <span className="inline-flex items-center gap-2"><Scissors size={15} /> ₪{service.price}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader title="2. בחר נותן שירות" subtitle={selectedService?.barberSelectionMode === 'specific' ? 'מוצגים רק נותני השירות שמתאימים לבחירה שלך.' : 'בחר את נותן השירות המועדף.'} />
        {!selectedService ? (
          <SurfacePanel className="p-5 text-center text-sm leading-7 text-[#ddd1d8] md:p-6">בחר קודם שירות כדי לראות את האפשרויות.</SurfacePanel>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {eligibleBarbers.map((barber) => {
                const selected = selectedBarber?.id === barber.id;
                return (
                  <button
                    key={barber.id}
                    onClick={() => setSelectedBarber(barber)}
                    className={cn(
                      'text-right rounded-[26px] editorial-card p-3.5 transition-all hover:-translate-y-0.5 md:p-4',
                      selected ? 'border-primary-brand ring-1 ring-primary-brand/40' : 'hover:border-white/12'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <img src={barber.imageUrl} alt={barber.name} className="h-14 w-14 rounded-2xl border border-outline-brand/20 object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <h3 className="truncate text-base font-bold md:text-lg">{barber.name}</h3>
                          {selected && <span className="rounded-full border border-primary-brand/18 bg-primary-brand/10 px-2 py-1 text-[11px] font-bold text-[#f0dbc2]">נבחר</span>}
                        </div>
                        <p className="truncate text-sm text-[#ddd1d8]">{barber.specialty || 'ספר מקצועי'}</p>
                        <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary-brand"><Star size={12} fill="currentColor" /> {barber.rating || 5}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="editorial-card rounded-3xl p-4 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <p className="designer-kicker text-[11px] font-bold uppercase">מוכנים להמשיך?</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm md:text-base">
                    <span className={cn('font-bold', selectedService ? 'text-primary-brand' : 'text-on-surface-variant')}>{selectedService?.name || 'בחר שירות'}</span>
                    <span className="text-on-surface-variant">·</span>
                    <span className={cn(selectedBarber ? 'text-white' : 'text-on-surface-variant')}>{selectedBarber?.name || 'בחר נותן שירות'}</span>
                  </div>
                </div>
                <PrimaryButton
                  onClick={() => {
                    if (!selectedBarber && eligibleBarbers.length > 0) setSelectedBarber(eligibleBarbers[0]);
                    if (canContinueToDate) setStep('date');
                  }}
                  disabled={!canContinueToDate}
                  className="w-full px-6 py-4 md:w-auto"
                >
                  המשך לבחירת יום
                </PrimaryButton>
              </div>
            </div>
          </>
        )}
      </section>
    </motion.div>
  );
}

export function DateStep({
  selectedBarber,
  selectedService,
  selectedDate,
  setSelectedDate,
  selectedDateState,
  firstAvailableDate,
  dateAvailabilityLoading,
  dateAvailabilityBackgroundLoading,
  dateAvailability,
  availableDates,
  timeSlots,
  availabilityLoading,
  selectedTime,
  setSelectedTime,
  setStep,
}: {
  selectedBarber: Barber | null;
  selectedService: Service | null;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedDateState?: DateAvailability;
  firstAvailableDate: Date | null;
  dateAvailabilityLoading: boolean;
  dateAvailabilityBackgroundLoading: boolean;
  dateAvailability: Record<string, DateAvailability>;
  availableDates: Date[];
  timeSlots: Slot[];
  availabilityLoading: boolean;
  selectedTime: string | null;
  setSelectedTime: (time: string | null) => void;
  setStep: (step: BookingStep) => void;
}) {
  const weekGroups = availableDates.reduce<Array<{ label: string; dates: Date[] }>>((groups, date, index) => {
    const groupIndex = Math.floor(index / 7);
    if (!groups[groupIndex]) {
      groups[groupIndex] = { label: groupIndex === 0 ? 'השבוע הקרוב' : 'השבוע שאחריו', dates: [] };
    }
    groups[groupIndex].dates.push(date);
    return groups;
  }, []);
  const availableSlots = timeSlots.filter((slot) => slot.available);
  const slotGroups = [
    { label: 'בוקר', slots: availableSlots.filter((slot) => slot.time < '12:00') },
    { label: 'צהריים', slots: availableSlots.filter((slot) => slot.time >= '12:00' && slot.time < '17:00') },
    { label: 'ערב', slots: availableSlots.filter((slot) => slot.time >= '17:00') },
  ].filter((group) => group.slots.length > 0);

  return (
    <motion.div key="date" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
      <SummaryCard className="hidden lg:block" selectedBarber={selectedBarber} selectedService={selectedService} selectedDate={selectedDate} selectedTime={null} />
      <div className="bg-surface rounded-3xl border border-outline-brand/20 p-4 shadow-xl md:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2 className="font-display text-2xl text-white sm:text-3xl">בחר יום ושעה</h2>
            <p className="mt-2 text-sm leading-6 text-[#e5d8df] sm:text-base">בחר יום, ומיד מתחתיו תראה רק את השעות הפנויות.</p>
          </div>
          <button onClick={() => setStep('service')} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-brand/20 px-4 py-3 text-sm text-on-surface-variant transition-colors hover:text-primary-brand sm:w-auto sm:justify-start sm:border-0 sm:px-0 sm:py-0"><ChevronLeft size={16} /> חזרה</button>
        </div>

        {selectedDateState && selectedDateState.kind !== 'available' && firstAvailableDate && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>{selectedDateState.kind === 'off' ? 'ביום הזה אין פעילות של נותן השירות.' : 'היום הזה מלא כרגע.'} היום הקרוב הבא עם זמינות הוא <span className="font-bold">{formatLongDate(firstAvailableDate)}</span>.</p>
              <button onClick={() => setSelectedDate(firstAvailableDate)} className="rounded-xl bg-amber-200/15 px-4 py-2 font-bold text-amber-50 hover:bg-amber-200/25">קפוץ ליום פנוי</button>
            </div>
          </div>
        )}

        {dateAvailabilityLoading ? (
          <div className="rounded-2xl bg-surface-high p-4 text-sm text-[#e5d8df]">בודק זמינות לימים הקרובים...</div>
        ) : (
          <div className="space-y-5">
            {dateAvailabilityBackgroundLoading && (
              <div className="rounded-2xl border border-primary-brand/15 bg-primary-brand/8 p-3 text-sm text-[#f0e0cf]">
                הימים הקרובים כבר זמינים לבחירה. שאר הימים נטענים עכשיו ברקע.
              </div>
            )}
            {weekGroups.map((group) => (
              <div key={group.label} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[#e7cfb5]">{group.label}</p>
                  <p className="text-xs text-[#cdbfc7]">גלול אופקית לבחירה</p>
                </div>
                <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 scrollbar-hide">
                  {group.dates.map((date) => {
                    const selected = sameDay(date, selectedDate);
                    const state = dateAvailability[`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`];
                    const isAvailable = state?.kind === 'available';
                    const isLoading = state?.kind === 'loading';
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => selectDateWithoutJump(date, setSelectedDate, () => setSelectedTime(null))}
                        disabled={!isAvailable || isLoading}
                        className={cn(
                          'min-h-[128px] min-w-[104px] snap-start shrink-0 rounded-[24px] border p-3 text-center transition-all',
                          selected ? 'border-primary-brand bg-primary-brand text-on-primary-brand' : isAvailable ? 'border-white/10 bg-surface-high hover:border-primary-brand/20' : isLoading ? 'cursor-wait border-primary-brand/10 bg-surface-high/75 text-[#cdbfc7]' : 'cursor-not-allowed border-outline-brand/10 bg-surface-low/80 text-[#ab9ca6] opacity-65'
                        )}
                      >
                        <p className={cn('text-[11px] font-bold', selected ? 'text-on-primary-brand/80' : isAvailable ? 'text-primary-brand' : isLoading ? 'text-[#d7c7d0]' : 'text-[#b8acb5]')}>{formatShortWeekday(date)}</p>
                        <p className="mt-3 font-display text-[1.7rem] sm:text-3xl">{date.getDate()}</p>
                        <p className={cn('mt-2 text-[11px]', selected ? 'text-on-primary-brand/85' : isAvailable ? 'text-[#efe4ea]' : isLoading ? 'text-[#d7c7d0]' : 'text-[#a797a2]')}>
                          {state?.kind === 'available' ? `${state.availableCount} פנוי` : state?.kind === 'full' ? 'מלא' : state?.kind === 'loading' ? 'טוען...' : 'לא זמין'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 editorial-card rounded-3xl p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#e7cfb5]">שעות פנויות ל־{formatLongDate(selectedDate)}</p>
              <p className="mt-1 text-sm text-[#d7cad2]">מוצגות רק שעות שאפשר באמת לבחור.</p>
            </div>
            {!!selectedTime && <span className="rounded-full border border-primary-brand/18 bg-primary-brand/10 px-3 py-1 text-xs font-bold text-[#f0dbc2]">נבחרה שעה {selectedTime}</span>}
          </div>

          {availabilityLoading ? (
            <div className="rounded-2xl bg-surface-high p-4 text-sm text-[#e5d8df]">טוען שעות פנויות...</div>
          ) : selectedDateState?.kind === 'off' ? (
            <SoftEmptyState>אין שעות ביום הזה. בחר יום אחר מהשורה למעלה.</SoftEmptyState>
          ) : availableSlots.length === 0 ? (
            <SoftEmptyState>
              כרגע אין שעות פנויות ביום הזה.
              {firstAvailableDate ? <span className="block mt-2">היום הקרוב הבא עם זמינות הוא <button onClick={() => setSelectedDate(firstAvailableDate)} className="font-bold text-primary-brand">{formatLongDate(firstAvailableDate)}</button>.</span> : null}
            </SoftEmptyState>
          ) : (
            <div className="space-y-5">
              {slotGroups.map((group) => (
                <div key={group.label} className="space-y-3">
                  <p className="text-sm font-bold text-[#e7cfb5]">{group.label}</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {group.slots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => selectTimeWithoutJump(slot.time, setSelectedTime)}
                        className={cn(
                          'min-h-[56px] rounded-2xl border px-3 py-4 font-bold transition-all md:px-4',
                          selectedTime === slot.time ? 'border-primary-brand bg-primary-brand text-on-primary-brand' : 'border-white/10 bg-surface-high text-[#fff4ea] hover:border-primary-brand/25'
                        )}
                      >
                        <div className="text-sm md:text-base">{slot.time}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TimeStep({
  selectedBarber,
  selectedService,
  selectedDate,
  selectedTime,
  setSelectedTime,
  selectedDateState,
  timeSlots,
  availabilityLoading,
  setStep,
}: {
  selectedBarber: Barber | null;
  selectedService: Service | null;
  selectedDate: Date;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  selectedDateState?: DateAvailability;
  timeSlots: Slot[];
  availabilityLoading: boolean;
  setStep: (step: BookingStep) => void;
}) {
  const availableSlots = timeSlots.filter((slot) => slot.available);
  const groups = [
    { label: 'בוקר', slots: availableSlots.filter((slot) => slot.time < '12:00') },
    { label: 'צהריים', slots: availableSlots.filter((slot) => slot.time >= '12:00' && slot.time < '17:00') },
    { label: 'ערב', slots: availableSlots.filter((slot) => slot.time >= '17:00') },
  ].filter((group) => group.slots.length > 0);

  return (
    <motion.div key="time" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-5 pb-24 lg:grid-cols-[0.78fr_1.22fr] lg:pb-0">
      <SummaryCard className="hidden lg:block" selectedBarber={selectedBarber} selectedService={selectedService} selectedDate={selectedDate} selectedTime={selectedTime} />
      <div className="bg-surface rounded-3xl border border-outline-brand/20 p-4 shadow-xl md:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2 className="font-display text-2xl text-white sm:text-3xl">בחר שעה</h2>
            <p className="mt-2 text-sm leading-6 text-[#e5d8df] sm:text-base">{formatLongDate(selectedDate)}</p>
          </div>
          <button onClick={() => setStep('date')} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-brand/20 px-4 py-3 text-sm text-on-surface-variant transition-colors hover:text-primary-brand sm:w-auto sm:justify-start sm:border-0 sm:px-0 sm:py-0"><ChevronLeft size={16} /> חזרה</button>
        </div>

        {availabilityLoading ? (
          <div className="py-10 text-center text-[#e5d8df]">טוען שעות פנויות...</div>
        ) : selectedDateState?.kind === 'off' ? (
          <SoftEmptyState>ביום הזה אין חלון עבודה פעיל לנותן השירות שבחרת.</SoftEmptyState>
        ) : availableSlots.length === 0 ? (
          <SoftEmptyState>כרגע אין שעות פנויות ביום הזה. נסה יום אחר.</SoftEmptyState>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.label} className="space-y-3">
                <p className="text-sm font-bold text-[#e7cfb5]">{group.label}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {group.slots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => selectTimeWithoutJump(slot.time, setSelectedTime)}
                      className={cn(
                        'min-h-[56px] rounded-2xl border px-3 py-4 font-bold transition-all md:px-4',
                        selectedTime === slot.time ? 'border-primary-brand bg-primary-brand text-on-primary-brand' : 'border-white/10 bg-surface-high text-[#fff4ea] hover:border-primary-brand/25'
                      )}
                    >
                      <div className="text-sm md:text-base">{slot.time}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ConfirmStep({
  selectedBarber,
  selectedService,
  selectedDate,
  selectedTime,
  customerInfo,
  setCustomerInfo,
  isPhoneValid,
  isEmailValid,
  isSubmitting,
  canSubmit,
  handleBooking,
  setStep,
}: {
  selectedBarber: Barber | null;
  selectedService: Service | null;
  selectedDate: Date;
  selectedTime: string | null;
  customerInfo: { name: string; phone: string; email: string };
  setCustomerInfo: (value: { name: string; phone: string; email: string }) => void;
  isPhoneValid: boolean;
  isEmailValid: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  handleBooking: () => void;
  setStep: (step: BookingStep) => void;
}) {
  return (
    <motion.div key="confirm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-5 pb-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-6">
      <SummaryCard className="hidden lg:block" selectedBarber={selectedBarber} selectedService={selectedService} selectedDate={selectedDate} selectedTime={selectedTime} detailed />
      <div className="rounded-3xl border border-outline-brand/20 bg-surface p-4 shadow-xl md:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:mb-8">
          <div>
            <h2 className="font-display text-2xl text-white sm:text-3xl md:text-4xl">פרטי לקוח</h2>
            <p className="mt-2 text-sm leading-6 text-[#e5d8df] sm:text-base">כמה פרטים קצרים ואפשר לשלוח.</p>
          </div>
          <button onClick={() => setStep('date')} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-brand/20 px-4 py-3 text-sm text-on-surface-variant transition-colors hover:text-primary-brand sm:w-auto sm:justify-start sm:border-0 sm:px-0 sm:py-0"><ChevronLeft size={16} /> חזרה</button>
        </div>
        <div className="space-y-5">
          <Field label="שם מלא" icon={<User size={18} className="text-on-surface-variant" />}>
            <TextInput autoComplete="name" enterKeyHint="next" value={customerInfo.name} onChange={(event) => setCustomerInfo({ ...customerInfo, name: event.target.value })} className="pr-12 pl-4" placeholder="לדוגמה: אלדר דמרי" />
          </Field>
          <Field label="טלפון" icon={<Phone size={18} className="text-on-surface-variant" />}>
            <TextInput autoComplete="tel" enterKeyHint="next" value={customerInfo.phone} onChange={(event) => setCustomerInfo({ ...customerInfo, phone: event.target.value })} className="pr-12 pl-4" placeholder="050-0000000" inputMode="tel" />
          </Field>
          {!isPhoneValid && customerInfo.phone.length > 0 && <p className="text-sm text-red-300">יש להזין מספר טלפון תקין.</p>}
          <Field label="אימייל" icon={<Mail size={18} className="text-on-surface-variant" />}>
            <TextInput autoComplete="email" enterKeyHint="done" type="email" value={customerInfo.email} onChange={(event) => setCustomerInfo({ ...customerInfo, email: event.target.value })} className="pr-12 pl-4" placeholder="name@example.com" inputMode="email" />
          </Field>
          {!isEmailValid && customerInfo.email.length > 0 && <p className="text-sm text-red-300">יש להזין כתובת אימייל תקינה.</p>}
          <div className="rounded-2xl border border-outline-brand/20 bg-surface-high p-4 text-sm text-[#e5d8df]">לאחר השליחה נחזור אליך לאישור סופי.</div>
          <PrimaryButton onClick={handleBooking} disabled={isSubmitting || !canSubmit} className="w-full py-4 text-base md:py-5 md:text-lg">{isSubmitting ? 'שולח בקשה...' : 'שליחת בקשת תור'}</PrimaryButton>
        </div>
      </div>
    </motion.div>
  );
}

export function SuccessScreen({ serviceName, selectedDate, selectedTime, onReset }: { serviceName: string; selectedDate: Date; selectedTime: string | null; onReset: () => void }) {
  const handleFinish = () => {
    onReset();
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  return <main id="main-content" className="min-h-ios-screen bg-background flex flex-col items-center justify-center p-4 pt-safe text-center sm:p-6" dir="rtl" role="main" tabIndex={-1}><motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg w-full rounded-3xl border border-primary-brand/20 bg-surface p-5 shadow-2xl sm:p-6 md:p-12"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container shadow-lg sm:mb-6 sm:h-20 sm:w-20"><Check className="h-8 w-8 text-white sm:h-10 sm:w-10" /></div><h1 className="mb-4 font-display text-3xl text-primary-brand sm:text-4xl">הבקשה נשלחה</h1><p className="mb-6 text-base leading-7 text-[#e5d8df] sm:mb-8 sm:text-lg sm:leading-8">קיבלנו את בקשת התור שלך ל־{serviceName} בתאריך {formatLongDate(selectedDate)}{selectedTime ? ` בשעה ${selectedTime}` : ''}. נחזור אליך לאישור.</p><div className="grid gap-3 sm:grid-cols-2"><button onClick={onReset} className="w-full rounded-2xl bg-primary-container py-4 font-bold text-white transition-all hover:bg-primary-brand">קביעת תור נוסף</button><button onClick={handleFinish} className="w-full rounded-2xl border border-outline-brand/40 py-4 font-bold transition-all hover:border-primary-brand">סיום</button></div></motion.div></main>;
}

export function FloatingFeedback({ step, canContinueToConfirm, selectedService, selectedBarber, selectedTime, setStep }: { step: BookingStep; canContinueToConfirm: boolean; selectedService: Service | null; selectedBarber: Barber | null; selectedTime: string | null; setStep: (step: BookingStep) => void }) {
  return (
    <AnimatePresence>
      {(step === 'date' && canContinueToConfirm) && <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-brand/20 bg-surface-highest/90 pb-safe shadow-2xl backdrop-blur-xl"><div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 px-safe py-4 md:px-6 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">סיכום נוכחי</p><div className="flex flex-wrap items-center gap-2 text-sm md:text-base"><span className="font-bold text-primary-brand">{selectedService?.name}</span>{selectedBarber && <span className="text-on-surface-variant">· {selectedBarber.name}</span>}{selectedTime && <span className="text-on-surface-variant">· {selectedTime}</span>}</div></div><button onClick={() => setStep('confirm')} className="w-full shrink-0 rounded-2xl bg-primary-brand px-6 py-4 font-bold text-on-primary-brand shadow-lg hover:bg-primary-brand/90 sm:w-auto md:px-8">המשך לאישור</button></div></motion.div>}
    </AnimatePresence>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <span className="h-px w-10 bg-[linear-gradient(90deg,rgba(231,201,169,0),rgba(231,201,169,0.8))]" />
        <span className="designer-kicker text-[10px] font-bold uppercase">BARBER FLOW</span>
      </div>
      <h2 className="font-display text-2xl text-white sm:text-3xl">{title}</h2>
      <p className="max-w-2xl text-sm leading-6 text-[#e5d8df] sm:text-base">{subtitle}</p>
    </div>
  );
}
function SummaryCard({ selectedBarber, selectedService, selectedDate, selectedTime, detailed, className }: { selectedBarber: Barber | null; selectedService: Service | null; selectedDate: Date; selectedTime: string | null; detailed?: boolean; className?: string }) { return <aside className={cn('summary-card h-fit rounded-3xl p-6 shadow-xl', className)}><p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary-brand">ההזמנה שלך</p><div className="space-y-4"><SummaryRow icon={<Scissors size={16} />} label="שירות" value={selectedService?.name || 'טרם נבחר'} /><SummaryRow icon={<User size={16} />} label="נותן שירות" value={selectedBarber?.name || 'טרם נבחר'} /><SummaryRow icon={<CalendarIcon size={16} />} label="תאריך" value={selectedService ? formatLongDate(selectedDate) : 'טרם נבחר'} /><SummaryRow icon={<Clock size={16} />} label="שעה" value={selectedTime || 'טרם נבחרה'} /></div>{selectedService && <div className="mt-6 flex items-center justify-between border-t border-outline-brand/20 pt-6"><div><p className="mb-1 text-xs text-[#d8cbd2]">מחיר</p><p className="font-display text-2xl text-primary-brand">₪{selectedService.price}</p></div><div className="text-left"><p className="mb-1 text-xs text-[#d8cbd2]">משך</p><p className="font-bold">{selectedService.durationMin} דק׳</p></div></div>}{detailed && selectedBarber?.imageUrl && <img src={selectedBarber.imageUrl} alt={selectedBarber.name} className="mt-6 h-48 w-full rounded-2xl border border-outline-brand/20 object-cover" />}</aside>; }
function SoftEmptyState({ children }: { children: React.ReactNode }) { return <div className="rounded-2xl border border-outline-brand/14 bg-surface-high/70 p-5 text-center text-sm text-[#ddd1d8]">{children}</div>; }
function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3"><div className="h-10 w-10 shrink-0 rounded-2xl bg-surface-high flex items-center justify-center text-primary-brand">{icon}</div><div className="min-w-0"><p className="text-xs text-on-surface-variant">{label}</p><p className="truncate font-bold">{value}</p></div></div>; }
function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  const inputId = useId();
  const child = React.isValidElement(children) ? React.cloneElement(children, { id: inputId } as React.HTMLAttributes<HTMLElement>) : children;
  return <label htmlFor={inputId} className="block space-y-2"><span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</span><div className="relative"><div className="absolute right-4 top-1/2 -translate-y-1/2">{icon}</div>{child}</div></label>;
}
function StepBullet({ active, done, label, num }: { active: boolean; done: boolean; label: string; num: number }) { return <div className="flex flex-col items-center gap-1"><div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all', active ? 'scale-110 bg-primary-brand text-on-primary-brand shadow-lg' : done ? 'bg-primary-container text-white' : 'border border-outline-brand text-on-surface-variant')}>{done ? <Check size={16} /> : num}</div><span className={cn('text-[10px] font-bold uppercase tracking-widest', active ? 'text-primary-brand' : 'text-on-surface-variant')}>{label}</span></div>; }
function MetricPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="metric-pill">
      <strong className="font-display text-[1.35rem] text-[#fff5ea]">{value}</strong>
      <span className="text-xs font-bold tracking-[0.14em] text-[#d8c7cf] uppercase">{label}</span>
    </div>
  );
}
function PreviewRow({ index, title, detail }: { index: string; title: string; detail: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-display text-sm text-primary-brand">{index}</div>
      <div>
        <p className="text-sm font-bold text-[#fff3e8]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#ccbfc8]">{detail}</p>
      </div>
    </div>
  );
}
function preserveScrollWhile(action: () => void) {
  const scrollY = window.scrollY;
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) activeElement.blur();
  action();
  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollY, behavior: 'auto' });
  });
}

function selectDateWithoutJump(date: Date, setSelectedDate: (date: Date) => void, resetSelectedTime: () => void) {
  preserveScrollWhile(() => {
    setSelectedDate(date);
    resetSelectedTime();
  });
}

function selectTimeWithoutJump(time: string, setSelectedTime: (time: string) => void) {
  preserveScrollWhile(() => {
    setSelectedTime(time);
  });
}
