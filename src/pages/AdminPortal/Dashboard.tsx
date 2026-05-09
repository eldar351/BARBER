import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Appointment, Barber, Service } from '../../types';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Scissors, 
  Users, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Plus,
  Search,
  Bell,
  User,
  Check,
  X,
  History,
  MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [barbers, setBarbers] = useState<Record<string, Barber>>({});
  const navigate = useNavigate();

  useEffect(() => {
    // Check auth
    if (!auth.currentUser) {
      navigate('/admin/login');
      return;
    }

    const unsubApp = onSnapshot(query(collection(db, 'appointments'), orderBy('createdAt', 'desc')), (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
    });
    
    const unsubSrv = onSnapshot(collection(db, 'services'), (snap) => {
      const srvMap: Record<string, Service> = {};
      snap.docs.forEach(d => srvMap[d.id] = { id: d.id, ...d.data() } as Service);
      setServices(srvMap);
    });

    const unsubBrb = onSnapshot(collection(db, 'barbers'), (snap) => {
      const brbMap: Record<string, Barber> = {};
      snap.docs.forEach(d => brbMap[d.id] = { id: d.id, ...d.data() } as Barber);
      setBarbers(brbMap);
    });

    return () => { unsubApp(); unsubSrv(); unsubBrb(); };
  }, [navigate]);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'appointments', id), { status });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-surface border-r border-outline-brand/20 flex flex-col p-8 pt-24 fixed left-0 top-0 h-screen z-40 hidden md:flex">
        <div className="mb-12">
          <h1 className="font-display text-2xl text-primary-brand mb-1">BarberBooking</h1>
          <p className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">Executive Management</p>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem active icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          <NavItem icon={<CalendarIcon size={20}/>} label="Calendar" />
          <NavItem icon={<Scissors size={20}/>} label="Services" onClick={() => navigate('/admin/services')} />
          <NavItem icon={<Users size={20}/>} label="Clients" />
          <NavItem icon={<BarChart3 size={20}/>} label="Analytics" />
        </nav>

        <div className="mt-8 space-y-4">
           <button className="w-full bg-primary-container hover:bg-primary-brand text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all">
             <Plus size={20} /> New Appointment
           </button>
           <button onClick={handleLogout} className="w-full text-on-surface-variant hover:text-white text-left px-6 py-4 flex items-center gap-4 transition-all">
              <X size={20} /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 bg-background p-8 md:p-12 pb-24" dir="rtl">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="text-right">
            <h2 className="font-display text-4xl mb-2">ניהול תורים</h2>
            <p className="text-on-surface-variant text-lg">היום, {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          
          <div className="flex gap-4">
            <StatCard icon={<History className="text-primary-brand" />} count={appointments.length} label="סה״כ תורים" />
            <StatCard icon={<Check className="text-primary-brand" />} count={appointments.filter(a => a.status === 'pending').length} label="ממתינים לאישור" />
          </div>
        </header>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px]">
          <KanbanColumn 
            title="ממתינים" 
            count={appointments.filter(a => a.status === 'pending').length}
            icon={<div className="w-3 h-3 bg-primary-brand rounded-full animate-pulse" />}
          >
            {appointments.filter(a => a.status === 'pending').map(app => (
              <AppointmentCard 
                key={app.id}
                app={app} 
                service={services[app.serviceId]}
                barber={barbers[app.barberId]}
                actions={
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(app.id, 'confirmed')} className="flex-1 bg-primary-container hover:bg-primary-brand text-white py-2 rounded-xl flex items-center justify-center gap-1 font-bold text-xs"><Check size={14}/> אשר</button>
                    <button onClick={() => updateStatus(app.id, 'cancelled')} className="flex-1 border border-outline-brand hover:bg-surface-high text-on-surface py-2 rounded-xl flex items-center justify-center gap-1 font-bold text-xs"><X size={14}/> דחה</button>
                  </div>
                }
              />
            ))}
          </KanbanColumn>

          <KanbanColumn 
            title="מאושרים" 
            count={appointments.filter(a => a.status === 'confirmed').length}
            icon={<Check className="text-on-surface-variant" size={20} />}
          >
            {appointments.filter(a => a.status === 'confirmed').map(app => (
              <AppointmentCard 
                key={app.id}
                app={app} 
                service={services[app.serviceId]}
                barber={barbers[app.barberId]}
                highlight
                actions={
                  <button onClick={() => updateStatus(app.id, 'completed')} className="w-full border border-primary-brand text-primary-brand py-2 rounded-xl flex items-center justify-center gap-1 font-bold text-xs">הושלם</button>
                }
              />
            ))}
          </KanbanColumn>

          <KanbanColumn 
            title="הושלמו" 
            count={appointments.filter(a => a.status === 'completed').length}
            icon={<History className="text-on-surface-variant" size={20} />}
            muted
          >
            {appointments.filter(a => a.status === 'completed').map(app => (
              <AppointmentCard 
                key={app.id}
                app={app} 
                service={services[app.serviceId]}
                barber={barbers[app.barberId]}
                muted
              />
            ))}
          </KanbanColumn>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-6 py-4 cursor-pointer transition-all rounded-xl",
        active ? "bg-primary-brand/10 text-primary-brand brightness-125 border-r-4 border-primary-brand" : "text-on-surface-variant hover:bg-surface-high hover:text-on-surface"
      )}
    >
      {icon}
      <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
    </div>
  );
}

function StatCard({ icon, count, label }: { icon: any, count: number, label: string }) {
  return (
    <div className="bg-surface border border-outline-brand/30 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
      <div className="bg-background p-3 rounded-full">{icon}</div>
      <div>
        <p className="font-display text-2xl leading-none">{count}</p>
        <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );
}

function KanbanColumn({ title, count, icon, children, muted }: any) {
  return (
    <section className={cn(
      "flex-1 flex flex-col bg-surface-lowest/50 rounded-3xl border border-outline-brand/10 overflow-hidden",
      muted && "opacity-60"
    )}>
      <div className="p-6 border-b border-outline-brand/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="font-display text-xl">{title}</h2>
        </div>
        <span className="bg-surface-high px-3 py-1 rounded-full text-xs font-bold">{count}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {children}
      </div>
    </section>
  );
}

function AppointmentCard({ app, service, barber, actions, highlight, muted }: any) {
  return (
    <div className={cn(
      "bg-surface rounded-2xl p-5 border border-outline-brand/20 shadow-lg relative overflow-hidden transition-all",
      highlight && "border-r-4 border-primary-brand",
      muted && "grayscale opacity-80"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-display text-xl mb-1">{app.customerName}</h3>
          <p className="text-xs text-on-surface-variant">{service?.name || 'Service Loading...'}</p>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-on-surface-variant mt-2">
            <User size={10}/> Barber: {barber?.name || 'Any'}
          </div>
        </div>
        <div className="bg-surface-high px-3 py-1.5 rounded-lg font-bold text-xs text-primary-brand">
          {app.time}
        </div>
      </div>
      {actions && <div className="mt-4">{actions}</div>}
    </div>
  );
}
