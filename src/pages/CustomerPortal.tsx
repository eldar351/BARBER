import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Barber, Service, Appointment } from '../types';
import { cn } from '../lib/utils';
import { 
  Scissors, 
  Clock, 
  Check, 
  ArrowRight, 
  Star, 
  User, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

type Step = 'service' | 'time' | 'confirm';

export default function CustomerPortal() {
  const [step, setStep] = useState<Step>('service');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const bSnap = await getDocs(collection(db, 'barbers'));
      const sSnap = await getDocs(collection(db, 'services'));
      setBarbers(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Barber)));
      setServices(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    };
    fetchData();
  }, []);

  const handleBooking = async () => {
    if (!selectedBarber || !selectedService || !selectedTime || !customerInfo.name || !customerInfo.phone) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        barberId: selectedBarber.id,
        serviceId: selectedService.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setBooked(true);
    } catch (e) {
      console.error(e);
      alert('Error booking appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (booked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-surface p-12 rounded-3xl border border-primary-brand/20 shadow-2xl max-w-md w-full"
        >
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-white w-10 h-10" />
          </div>
          <h1 className="font-display text-4xl mb-4 text-primary-brand">Appointment Requested!</h1>
          <p className="text-on-surface-variant font-sans text-lg mb-8">
            Julian and the team have received your request. You'll receive a confirmation soon.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-primary-container hover:bg-primary-brand text-white py-4 rounded-xl font-bold transition-all"
          >
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-outline-brand/30 px-6 h-16 flex items-center justify-between">
        <h1 className="font-display text-xl tracking-wider text-primary-brand uppercase">BarberBooking Pro</h1>
        <div className="flex items-center gap-4">
           {/* Step Indicator */}
           <div className="hidden md:flex items-center gap-2">
              <StepBullet active={step === 'service'} done={!!selectedService} label="Service" num={1} />
              <div className="w-8 h-px bg-outline-brand" />
              <StepBullet active={step === 'time'} done={!!selectedTime} label="Time" num={2} />
              <div className="w-8 h-px bg-outline-brand" />
              <StepBullet active={step === 'confirm'} done={booked} label="Confirm" num={3} />
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 'service' && (
            <motion.div 
              key="service"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="space-y-12"
            >
              {/* Barber Selection */}
              <section className="space-y-6">
                <div>
                  <h2 className="font-display text-3xl text-on-surface">The Masters</h2>
                  <p className="text-on-surface-variant">Select your preferred craftsman</p>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                  {barbers.map(barber => (
                    <button 
                      key={barber.id}
                      onClick={() => setSelectedBarber(barber)}
                      className={cn(
                        "group shrink-0 flex flex-col items-center gap-4 transition-all",
                        selectedBarber?.id === barber.id ? "scale-105" : "opacity-70 grayscale hover:opacity-100 hover:grayscale-0"
                      )}
                    >
                      <div className={cn(
                        "w-24 h-24 rounded-full p-1 border-2 transition-colors",
                        selectedBarber?.id === barber.id ? "border-primary-brand" : "border-outline-brand"
                      )}>
                        <img src={barber.imageUrl} alt={barber.name} className="w-full h-full rounded-full object-cover" />
                      </div>
                      <span className={cn(
                        "font-bold text-xs uppercase tracking-widest",
                        selectedBarber?.id === barber.id ? "text-primary-brand" : "text-on-surface-variant"
                      )}>{barber.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Service Selection */}
              <section className="space-y-6">
                <div>
                  <h2 className="font-display text-3xl text-on-surface">Curated Services</h2>
                  <p className="text-on-surface-variant">Select one or more treatments</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map(service => (
                    <div 
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={cn(
                        "group relative rounded-3xl overflow-hidden cursor-pointer h-72 border transition-all",
                        selectedService?.id === service.id 
                          ? "border-primary-brand shadow-2xl ring-1 ring-primary-brand/50" 
                          : "border-outline-brand/30 grayscale hover:grayscale-0 hover:border-outline-brand"
                      )}
                    >
                      <img src={service.imageUrl} alt={service.name} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                      
                      <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        {selectedService?.id === service.id && (
                          <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-primary-brand flex items-center justify-center">
                            <Check className="text-on-primary-brand w-5 h-5" />
                          </div>
                        )}
                        <div className="flex justify-between items-end mb-2">
                          <h3 className="font-display text-2xl group-hover:text-primary-brand transition-colors">{service.name}</h3>
                          <span className="font-bold text-primary-brand">${service.price}</span>
                        </div>
                        <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">{service.description}</p>
                        <div className="flex items-center gap-6 border-t border-outline-brand/20 pt-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          <div className="flex items-center gap-2"><Clock size={16} /> {service.durationMin} MIN</div>
                          <div className="flex items-center gap-2"><Scissors size={16} /> Professional</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {step === 'time' && (
             <motion.div 
               key="time"
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: -20, opacity: 0 }}
               className="grid grid-cols-1 lg:grid-cols-2 gap-12"
             >
                <div className="space-y-8">
                   <h1 className="font-display text-5xl">Select Date & Time</h1>
                   <p className="text-on-surface-variant text-lg">Choose your preferred slot for the {selectedService?.name}.</p>
                   
                   {/* Modern Calendar (Mock UI) */}
                   <div className="bg-surface rounded-3xl p-8 border border-outline-brand/20">
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="font-display font-semibold text-2xl">October 2023</h2>
                        <div className="flex gap-2">
                          <button className="p-2 hover:text-primary-brand transition-colors"><ChevronLeft /></button>
                          <button className="p-2 hover:text-primary-brand transition-colors"><ChevronRight /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-4 mb-4 text-center font-bold text-xs text-on-surface-variant tracking-wider">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                         {Array.from({ length: 31 }).map((_, i) => (
                           <button 
                             key={i}
                             disabled={i < 10}
                             className={cn(
                               "aspect-square rounded-xl flex items-center justify-center font-bold text-lg transition-all",
                               i < 10 ? "opacity-20 cursor-not-allowed" : "hover:bg-primary-container hover:text-white",
                               selectedDate.getDate() === i + 1 ? "bg-primary-brand text-on-primary-brand" : "text-on-surface"
                             )}
                             onClick={() => setSelectedDate(new Date(2023, 9, i + 1))}
                           >
                            {i+1}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-surface rounded-3xl p-8 border border-outline-brand/20">
                      <div className="flex items-center gap-3 mb-8">
                        <Clock className="text-primary-brand" />
                        <h3 className="font-display text-2xl">Available on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h3>
                      </div>
                      
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Morning</h4>
                          <div className="flex flex-wrap gap-3">
                             {['09:00', '10:00', '11:00'].map(t => (
                               <button 
                                 key={t}
                                 onClick={() => setSelectedTime(t)}
                                 className={cn(
                                   "px-6 py-3 rounded-xl border font-bold transition-all",
                                   selectedTime === t 
                                    ? "bg-primary-brand text-on-primary-brand border-primary-brand" 
                                    : "border-outline-brand/30 hover:border-primary-brand"
                                 )}
                               >
                                 {t}
                               </button>
                             ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Afternoon</h4>
                          <div className="flex flex-wrap gap-3">
                             {['13:00', '14:00', '15:00', '16:30'].map(t => (
                               <button 
                                 key={t}
                                 onClick={() => setSelectedTime(t)}
                                 className={cn(
                                   "px-6 py-3 rounded-xl border font-bold transition-all",
                                   selectedTime === t 
                                    ? "bg-primary-brand text-on-primary-brand border-primary-brand" 
                                    : "border-outline-brand/30 hover:border-primary-brand"
                                 )}
                               >
                                 {t}
                               </button>
                             ))}
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          )}

          {step === 'confirm' && (
             <motion.div 
               key="confirm"
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: -20, opacity: 0 }}
               className="grid grid-cols-1 lg:grid-cols-12 gap-12"
             >
                <div className="lg:col-span-5 space-y-8">
                  <h1 className="font-display text-4xl">Appointment Summary</h1>
                  <div className="bg-surface rounded-3xl p-8 border-l-4 border-primary-brand shadow-2xl space-y-8 relative overflow-hidden">
                    <div className="flex items-center gap-6">
                      <img src={selectedBarber?.imageUrl} className="w-20 h-20 rounded-full object-cover border border-outline-brand" />
                      <div>
                        <p className="font-display text-2xl">{selectedBarber?.name}</p>
                        <p className="text-on-surface-variant tracking-wider uppercase text-xs font-bold">Master Barber</p>
                      </div>
                    </div>
                    <div className="h-px bg-outline-brand/20" />
                    <div className="space-y-6">
                       <div className="flex justify-between items-start">
                         <div className="space-y-1">
                           <p className="text-xs uppercase text-primary-brand font-bold tracking-widest">Service</p>
                           <p className="text-xl">{selectedService?.name}</p>
                         </div>
                         <p className="font-display text-3xl font-bold">${selectedService?.price}</p>
                       </div>
                       <div className="space-y-4">
                          <div className="flex items-center gap-4 text-on-surface-variant italic">
                            <CalendarIcon size={20} className="text-primary-brand" />
                            <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-4 text-on-surface-variant italic">
                            <Clock size={20} className="text-primary-brand" />
                            <span>{selectedTime} - {calculateEndTime(selectedTime!, selectedService?.durationMin || 0)}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-8">
                  <div>
                    <h2 className="font-display text-4xl mb-4">Your Details</h2>
                    <p className="text-on-surface-variant">Provide your info to finalize the booking.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Full Name</label>
                       <input 
                         value={customerInfo.name}
                         onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                         className="w-full bg-surface-lowest border border-outline-brand/30 rounded-3xl px-6 py-4 focus:border-primary-brand focus:ring-1 focus:ring-primary-brand outline-none transition-all placeholder:opacity-30" 
                         placeholder="James Sterling"
                        />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Phone Number</label>
                       <input 
                         value={customerInfo.phone}
                         onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                         className="w-full bg-surface-lowest border border-outline-brand/30 rounded-3xl px-6 py-4 focus:border-primary-brand focus:ring-1 focus:ring-primary-brand outline-none transition-all placeholder:opacity-30" 
                         placeholder="+1 (555) 019-2834"
                        />
                    </div>
                    
                    <div className="p-6 rounded-3xl bg-surface-lowest border border-outline-brand/20 flex gap-4">
                      <Info className="text-primary-brand shrink-0" />
                      <p className="text-sm opacity-80 leading-relaxed">
                        Your request will be sent to the barber. You'll get a notification once confirmed.
                        <br/><span className="text-xs italic text-on-surface-variant">הבקשה נשלחה, תקבל הודעה ברגע שהספר יאשר את התור</span>
                      </p>
                    </div>

                    <button 
                      onClick={handleBooking}
                      disabled={isSubmitting || !customerInfo.name || !customerInfo.phone}
                      className="w-full bg-primary-brand disabled:opacity-50 text-on-primary-brand font-bold py-6 rounded-3xl text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                    >
                      {isSubmitting ? 'Sending Request...' : 'Submit Booking Request'}
                    </button>
                    <p className="text-center text-sm opacity-50">
                      By submitting, you agree to our <span className="text-primary-brand cursor-pointer hover:underline">cancellation policy</span>.
                    </p>
                  </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Bar */}
      <AnimatePresence>
        {((step === 'service' && selectedService && selectedBarber) || (step === 'time' && selectedTime)) && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 w-full z-50 bg-surface-highest/90 backdrop-blur-xl border-t border-outline-brand/20 shadow-2xl"
          >
            <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
               <div className="space-y-1">
                 <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">Total Summary</p>
                 <div className="flex items-center gap-2">
                   <span className="font-display text-2xl text-primary-brand">${selectedService?.price}</span>
                   <span className="text-on-surface-variant font-bold text-sm">· {selectedService?.durationMin} Min</span>
                 </div>
               </div>
               <button 
                 onClick={() => {
                   if (step === 'service') setStep('time');
                   else if (step === 'time') setStep('confirm');
                 }}
                 className="bg-primary-brand hover:bg-primary-brand/90 text-on-primary-brand px-10 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg"
               >
                 {step === 'service' ? 'Continue to Time' : 'Review Request'}
                 <ArrowRight size={20} />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepBullet({ active, done, label, num }: { active: boolean, done: boolean, label: string, num: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
        active ? "bg-primary-brand text-on-primary-brand shadow-lg scale-110" : done ? "bg-primary-container text-white" : "border border-outline-brand text-on-surface-variant"
      )}>
        {done ? <Check size={16} /> : num}
      </div>
      <span className={cn(
        "text-[10px] uppercase font-bold tracking-widest",
        active ? "text-primary-brand" : "text-on-surface-variant"
      )}>{label}</span>
    </div>
  );
}

function calculateEndTime(startTime: string, duration: number) {
  const [h, m] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + duration);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}
