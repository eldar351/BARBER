import { AnimatePresence } from 'motion/react';
import { PublicAccessibilityFooter } from '../components/accessibility';
import { BookingHeader, ConfirmStep, DateStep, FloatingFeedback, HeroSection, ServiceStep, SuccessScreen } from '../features/booking/components';
import { useBookingFlow } from '../features/booking/useBookingFlow';

export default function CustomerPortal() {
  const booking = useBookingFlow();

  if (booking.booked) {
    return (
      <SuccessScreen
        serviceName={booking.bookingReceipt?.serviceName || booking.selectedService?.name || ''}
        selectedDate={booking.bookingReceipt?.date || booking.selectedDate}
        selectedTime={booking.bookingReceipt?.time || booking.selectedTime}
        onReset={booking.resetFlow}
      />
    );
  }

  return (
    <div className="min-h-ios-screen bg-background text-[var(--color-page-foreground)] font-sans" dir="rtl">
      <BookingHeader
        step={booking.step}
        progressStep={booking.progressStep}
        selectedStepLabel={booking.selectedStepLabel}
        booked={booking.booked}
      />

      <main id="main-content" className="customer-stage app-shell py-6 pb-28 md:py-10 md:pb-10" role="main" tabIndex={-1}>
        <HeroSection settings={booking.settings} serviceCount={booking.services.length} barberCount={booking.barbers.length} />

        {booking.isLoading ? (
          <div className="editorial-shell rounded-3xl border border-white/6 bg-surface/90 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] md:p-8">
            <div className="mx-auto max-w-3xl space-y-4">
              <div className="h-6 w-32 rounded-full bg-surface-high/80" />
              <div className="h-12 w-full rounded-3xl bg-surface-high/70" />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-40 rounded-3xl bg-surface-high/65" />
                <div className="h-40 rounded-3xl bg-surface-high/65" />
              </div>
            </div>
          </div>
        ) : booking.loadError ? <div className="rounded-3xl border border-red-500/24 bg-red-500/10 p-6 text-center text-red-200 shadow-[0_18px_40px_rgba(0,0,0,0.16)]">{booking.loadError}</div> : (
          <AnimatePresence mode="wait">
            {booking.step === 'service' && (
              <ServiceStep
                services={booking.services}
                barbers={booking.barbers}
                selectedService={booking.selectedService}
                selectedBarber={booking.selectedBarber}
                eligibleBarbers={booking.eligibleBarbers}
                setSelectedService={booking.setSelectedService}
                setSelectedBarber={booking.setSelectedBarber}
                setSelectedTime={booking.setSelectedTime}
                canContinueToDate={booking.canContinueToDate}
                setStep={booking.setStep}
              />
            )}

            {booking.step === 'date' && (
              <DateStep
                selectedBarber={booking.selectedBarber}
                selectedService={booking.selectedService}
                selectedDate={booking.selectedDate}
                setSelectedDate={booking.setSelectedDate}
                selectedDateState={booking.selectedDateState}
                firstAvailableDate={booking.firstAvailableDate}
                dateAvailabilityLoading={booking.dateAvailabilityLoading}
                dateAvailabilityBackgroundLoading={booking.dateAvailabilityBackgroundLoading}
                dateAvailability={booking.dateAvailability}
                availableDates={booking.availableDates}
                timeSlots={booking.timeSlots}
                availabilityLoading={booking.availabilityLoading}
                selectedTime={booking.selectedTime}
                setSelectedTime={booking.setSelectedTime}
                setStep={booking.setStep}
              />
            )}

            {booking.step === 'confirm' && (
              <ConfirmStep
                selectedBarber={booking.selectedBarber}
                selectedService={booking.selectedService}
                selectedDate={booking.selectedDate}
                selectedTime={booking.selectedTime}
                customerInfo={booking.customerInfo}
                setCustomerInfo={booking.setCustomerInfo}
                isPhoneValid={booking.isPhoneValid}
                isEmailValid={booking.isEmailValid}
                isSubmitting={booking.isSubmitting}
                canSubmit={booking.canSubmit}
                handleBooking={booking.handleBooking}
                setStep={booking.setStep}
              />
            )}
          </AnimatePresence>
        )}
      </main>

      <PublicAccessibilityFooter />

      <FloatingFeedback
        step={booking.step}
        canContinueToConfirm={booking.canContinueToConfirm}
        selectedService={booking.selectedService}
        selectedBarber={booking.selectedBarber}
        selectedTime={booking.selectedTime}
        setStep={booking.setStep}
      />
    </div>
  );
}
