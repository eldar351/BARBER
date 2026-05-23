import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Barber, BusinessSettings, Service } from '../../types';
import { api } from '../../lib/api';
import { useLiveEvents } from '../../lib/live';
import { BookingStep, CustomerInfo, DateAvailability, Slot } from './types';

type BookingReceipt = {
  serviceName: string;
  date: Date;
  time: string;
};
import { formatIsoDate, getUpcomingDates } from './utils';
import { useToast } from '../../components/toast';
import { captureClientError } from '../../lib/errorMonitoring';

const INITIAL_DATES_BATCH = 4;
const DATE_AVAILABILITY_CACHE_TTL_MS = 60_000;
const SLOT_CACHE_TTL_MS = 30_000;

type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

export function useBookingFlow() {
  const { showToast } = useToast();
  const [step, setStep] = useState<BookingStep>('service');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<Slot[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [dateAvailability, setDateAvailability] = useState<Record<string, DateAvailability>>({});
  const [dateAvailabilityLoading, setDateAvailabilityLoading] = useState(false);
  const [dateAvailabilityBackgroundLoading, setDateAvailabilityBackgroundLoading] = useState(false);
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => getUpcomingDates()[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const selectedTimeRef = useRef<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: '', phone: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookingReceipt, setBookingReceipt] = useState<BookingReceipt | null>(null);
  const dateAvailabilityCacheRef = useRef<Map<string, CacheEntry<Record<string, DateAvailability>>>>(new Map());
  const slotCacheRef = useRef<Map<string, CacheEntry<Slot[]>>>(new Map());
  const dateAvailabilityRequestRef = useRef(0);
  const slotAvailabilityRequestRef = useRef(0);

  const availableDates = useMemo(() => getUpcomingDates(), []);
  const progressStep = step === 'service' ? 1 : step === 'date' ? 2 : 3;
  const selectedStepLabel = step === 'service' ? 'בחירת שירות ונותן שירות' : step === 'date' ? 'בחירת יום ושעה' : 'אישור פרטים';
  const selectedDateState = dateAvailability[formatIsoDate(selectedDate)];
  const firstAvailableDate = useMemo(
    () => availableDates.find((date) => dateAvailability[formatIsoDate(date)]?.kind === 'available') || null,
    [availableDates, dateAvailability]
  );

  const eligibleBarbers = useMemo(() => {
    if (!selectedService || selectedService.barberSelectionMode !== 'specific') return barbers;
    const ids = new Set(selectedService.linkedBarberIds || []);
    return barbers.filter((barber) => ids.has(barber.id));
  }, [barbers, selectedService]);

  const normalizedPhone = customerInfo.phone.replace(/\D/g, '');
  const isPhoneValid = normalizedPhone.length >= 9;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email.trim());
  const canContinueToDate = !!selectedService && eligibleBarbers.length > 0;
  const canContinueToConfirm = !!selectedTime;
  const canSubmit = !!customerInfo.name.trim() && isPhoneValid && isEmailValid && !!selectedBarber && !!selectedService && !!selectedTime;
  const hasAvailableSlots = timeSlots.some((slot) => slot.available);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [barbersData, servicesData, settingsData] = await Promise.all([
        api<Barber[]>('/api/public/barbers'),
        api<Service[]>('/api/public/services'),
        api<BusinessSettings>('/api/public/settings'),
      ]);
      setBarbers(barbersData);
      setServices(servicesData);
      setSettings(settingsData);
    } catch (error) {
      captureClientError(error, 'booking.catalog', 'טעינת הקטלוג נכשלה');
      setLoadError('לא הצלחנו לטעון את הנתונים כרגע. נסה שוב בעוד רגע.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    if (!selectedBarber || !selectedService) {
      setTimeSlots([]);
      return;
    }

    const cacheKey = `${selectedBarber.id}:${selectedService.id}:${formatIsoDate(selectedDate)}`;
    const now = Date.now();
    const cached = slotCacheRef.current.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      setTimeSlots(cached.data);
      setAvailabilityLoading(false);
      return;
    }

    const requestId = slotAvailabilityRequestRef.current + 1;
    slotAvailabilityRequestRef.current = requestId;
    setAvailabilityLoading(true);
    try {
      const params = new URLSearchParams({
        barberId: String(selectedBarber.id),
        serviceId: String(selectedService.id),
        date: formatIsoDate(selectedDate),
      });
      const data = await api<{ slots: Slot[] }>(`/api/public/availability?${params.toString()}`);
      if (slotAvailabilityRequestRef.current !== requestId) return;
      const slots = data.slots || [];
      slotCacheRef.current.set(cacheKey, {
        expiresAt: now + SLOT_CACHE_TTL_MS,
        data: slots,
      });
      const currentSelectedTime = selectedTimeRef.current;
      setTimeSlots((previous) => {
        const previousAvailable = new Set(previous.filter((slot) => slot.available).map((slot) => slot.time));
        const currentAvailable = new Set(slots.filter((slot) => slot.available).map((slot) => slot.time));

        if (currentSelectedTime && previousAvailable.has(currentSelectedTime) && !currentAvailable.has(currentSelectedTime)) {
          setLiveToast('השעה שבחרת נתפסה. בחר שעה אחרת.');
          showToast('השעה שבחרת נתפסה. בחר שעה אחרת.', 'error');
        }
        return slots;
      });

      if (currentSelectedTime && !slots.some((slot) => slot.time === currentSelectedTime && slot.available)) {
        setSelectedTime(null);
      }
    } catch (error) {
      if (slotAvailabilityRequestRef.current !== requestId) return;
      captureClientError(error, 'booking.availability', 'טעינת הזמינות נכשלה', {
        barberId: selectedBarber?.id,
        serviceId: selectedService?.id,
        date: formatIsoDate(selectedDate),
      });
      setTimeSlots([]);
      setSelectedTime(null);
    } finally {
      setAvailabilityLoading(false);
    }
  }, [selectedBarber, selectedService, selectedDate, showToast]);

  const loadDateAvailability = useCallback(async () => {
    if (!selectedBarber || !selectedService) {
      setDateAvailability({});
      setDateAvailabilityBackgroundLoading(false);
      return;
    }

    const requestId = dateAvailabilityRequestRef.current + 1;
    dateAvailabilityRequestRef.current = requestId;
    const cacheKey = `${selectedBarber.id}:${selectedService.id}`;
    const now = Date.now();
    const cached = dateAvailabilityCacheRef.current.get(cacheKey);
    const cachedData = cached && cached.expiresAt > now ? cached.data : {};
    const initialDates = availableDates.slice(0, INITIAL_DATES_BATCH);
    const remainingDates = availableDates.slice(INITIAL_DATES_BATCH);
    const hasAllDatesCached = availableDates.every((date) => cachedData[formatIsoDate(date)]);

    if (hasAllDatesCached) {
      setDateAvailability(cachedData);
      setDateAvailabilityLoading(false);
      setDateAvailabilityBackgroundLoading(false);
      return;
    }

    const loadingState = Object.fromEntries(availableDates.map((date) => {
      const key = formatIsoDate(date);
      return [key, cachedData[key] || { kind: 'loading', availableCount: 0, totalCount: 0 }];
    }));
    setDateAvailability(loadingState);
    setDateAvailabilityLoading(true);
    setDateAvailabilityBackgroundLoading(false);

    const mergeAvailability = (incoming: Record<string, DateAvailability>) => {
      const next = { ...dateAvailabilityCacheRef.current.get(cacheKey)?.data, ...incoming };
      dateAvailabilityCacheRef.current.set(cacheKey, {
        expiresAt: Date.now() + DATE_AVAILABILITY_CACHE_TTL_MS,
        data: next,
      });
      setDateAvailability((previous) => ({ ...previous, ...incoming }));
      return next;
    };

    try {
      const firstMissingIndex = initialDates.findIndex((date) => !cachedData[formatIsoDate(date)]);
      if (firstMissingIndex !== -1) {
        const firstStartDate = initialDates[firstMissingIndex];
        const params = new URLSearchParams({
          barberId: String(selectedBarber.id),
          serviceId: String(selectedService.id),
          startDate: formatIsoDate(firstStartDate),
          days: String(initialDates.length - firstMissingIndex),
        });
        const data = await api<{ availability: Record<string, DateAvailability> }>(`/api/public/availability-range?${params.toString()}`);
        if (dateAvailabilityRequestRef.current !== requestId) return;
        mergeAvailability(data.availability || {});
      }
      if (dateAvailabilityRequestRef.current !== requestId) return;
      setDateAvailabilityLoading(false);

      const missingRemainingDates = remainingDates.filter((date) => !cachedData[formatIsoDate(date)]);
      if (missingRemainingDates.length === 0) return;

      setDateAvailabilityBackgroundLoading(true);
      const params = new URLSearchParams({
        barberId: String(selectedBarber.id),
        serviceId: String(selectedService.id),
        startDate: formatIsoDate(missingRemainingDates[0]),
        days: String(missingRemainingDates.length),
      });
      const data = await api<{ availability: Record<string, DateAvailability> }>(`/api/public/availability-range?${params.toString()}`);
      if (dateAvailabilityRequestRef.current !== requestId) return;
      mergeAvailability(data.availability || {});
    } catch (error) {
      if (dateAvailabilityRequestRef.current !== requestId) return;
      captureClientError(error, 'booking.availability-range', 'טעינת הזמינות לטווח נכשלה', {
        barberId: selectedBarber?.id,
        serviceId: selectedService?.id,
      });
      setDateAvailability({});
    } finally {
      if (dateAvailabilityRequestRef.current === requestId) {
        setDateAvailabilityLoading(false);
        setDateAvailabilityBackgroundLoading(false);
      }
    }
  }, [availableDates, selectedBarber, selectedService]);

  useEffect(() => {
    selectedTimeRef.current = selectedTime;
  }, [selectedTime]);

  useEffect(() => { void loadCatalog(); }, [loadCatalog]);
  useEffect(() => { void loadAvailability(); }, [loadAvailability]);
  useEffect(() => { void loadDateAvailability(); }, [loadDateAvailability]);

  useEffect(() => {
    if (!selectedService) return;
    if (selectedService.barberSelectionMode === 'specific') {
      const ids = new Set(selectedService.linkedBarberIds || []);
      if (!selectedBarber || !ids.has(selectedBarber.id)) {
        const firstEligible = barbers.find((barber) => ids.has(barber.id)) || null;
        setSelectedBarber(firstEligible);
        setSelectedTime(null);
      }
      return;
    }

    if (!selectedBarber && barbers.length > 0) {
      setSelectedBarber(barbers[0]);
    }
  }, [selectedService, selectedBarber, barbers]);

  useLiveEvents(useCallback((type) => {
    if (type === 'barbers_changed' || type === 'services_changed') {
      dateAvailabilityCacheRef.current.clear();
      slotCacheRef.current.clear();
      void loadCatalog();
      void loadDateAvailability();
      setLiveToast('הנתונים התעדכנו בזמן אמת.');
      showToast('הנתונים התעדכנו בזמן אמת.', 'info');
    }
    if (type === 'appointments_changed' && selectedBarber && selectedService) {
      dateAvailabilityCacheRef.current.clear();
      slotCacheRef.current.clear();
      void loadAvailability();
      void loadDateAvailability();
    }
  }, [loadCatalog, loadAvailability, loadDateAvailability, selectedBarber, selectedService]));

  useEffect(() => {
    if (!liveToast) return;
    const timer = setTimeout(() => setLiveToast(null), 3500);
    return () => clearTimeout(timer);
  }, [liveToast]);

  const handleBooking = useCallback(async () => {
    if (!canSubmit || !selectedBarber || !selectedService || !selectedTime) return;
    setIsSubmitting(true);
    try {
      await api('/api/public/appointments', {
        method: 'POST',
        body: JSON.stringify({
          customerName: customerInfo.name.trim(),
          customerPhone: customerInfo.phone.trim(),
          customerEmail: customerInfo.email.trim().toLowerCase(),
          barberId: selectedBarber.id,
          serviceId: selectedService.id,
          date: formatIsoDate(selectedDate),
          time: selectedTime,
        }),
      });
      setBookingReceipt({
        serviceName: selectedService.name,
        date: new Date(selectedDate),
        time: selectedTime,
      });
      dateAvailabilityCacheRef.current.clear();
      slotCacheRef.current.clear();
      showToast('הבקשה נשלחה בהצלחה.', 'success');
      setBooked(true);
    } catch (error) {
      captureClientError(error, 'booking.submit', 'יצירת התור נכשלה', {
        barberId: selectedBarber?.id,
        serviceId: selectedService?.id,
        date: formatIsoDate(selectedDate),
        time: selectedTime,
      });
      showToast('אירעה שגיאה בשליחת הבקשה. נסה שוב.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, customerInfo, selectedBarber, selectedService, selectedDate, selectedTime, showToast]);

  const resetFlow = useCallback(() => {
    setStep('service');
    setSelectedBarber(barbers[0] || null);
    setSelectedService(null);
    setSelectedDate(availableDates[0]);
    setSelectedTime(null);
    setCustomerInfo({ name: '', phone: '', email: '' });
    setBooked(false);
    setBookingReceipt(null);
    setTimeSlots([]);
  }, [availableDates, barbers]);

  return {
    step,
    setStep,
    barbers,
    services,
    timeSlots,
    settings,
    isLoading,
    loadError,
    availabilityLoading,
    dateAvailability,
    dateAvailabilityLoading,
    dateAvailabilityBackgroundLoading,
    liveToast,
    setLiveToast,
    selectedBarber,
    setSelectedBarber,
    selectedService,
    setSelectedService,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    customerInfo,
    setCustomerInfo,
    isSubmitting,
    booked,
    bookingReceipt,
    availableDates,
    progressStep,
    selectedStepLabel,
    selectedDateState,
    firstAvailableDate,
    eligibleBarbers,
    isPhoneValid,
    isEmailValid,
    canContinueToDate,
    canContinueToConfirm,
    canSubmit,
    hasAvailableSlots,
    handleBooking,
    resetFlow,
  };
}
