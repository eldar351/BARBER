import { useCallback, useEffect, useMemo, useState } from 'react';
import { Appointment, AppointmentStatus, Barber, BusinessSettings, Service } from '../../types';
import { api } from '../../lib/api';
import { useLiveEvents } from '../../lib/live';
import { filterAppointments, formatDate, getAppointmentCounts, getPendingQueueHead, getSettingsPayload, getUpcomingAppointment, isToday } from './dashboardUtils';
import { useToast } from '../../components/toast';
import { useAdminAuth } from './auth';
import { listAdminBarbers, listAdminServices, rejectAdminAppointmentCancellation } from './api';

export function useAdminDashboard() {
  const { showToast } = useToast();
  const { handleUnauthorized } = useAdminAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [quickForm, setQuickForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', serviceId: '', barberId: '', date: '', time: '' });
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', serviceId: '', barberId: '', date: '', time: '', status: 'pending' as AppointmentStatus, notes: '' });
  const [error, setError] = useState('');

  const loadAppointments = useCallback(async () => {
    try {
      setError('');
      const data = await api<Appointment[]>('/api/admin/appointments', { auth: true });
      setAppointments(data);
    } catch (error) {
      if (handleUnauthorized(error)) return;
      setError(error instanceof Error ? error.message : 'טעינת התורים נכשלה');
    }
  }, [handleUnauthorized]);

  const loadSettings = useCallback(async () => {
    try {
      const data = await api<BusinessSettings>('/api/admin/settings', { auth: true });
      setSettings(data);
    } catch (error) {
      if (handleUnauthorized(error)) return;
      setError(error instanceof Error ? error.message : 'טעינת ההגדרות נכשלה');
    }
  }, [handleUnauthorized]);

  const loadCatalog = useCallback(async () => {
    try {
      const [servicesData, barbersData] = await Promise.all([
        listAdminServices(),
        listAdminBarbers(),
      ]);
      setServices(servicesData.filter((item) => Boolean(item.isActive)));
      setBarbers(barbersData.filter((item) => Boolean(item.isActive)));
    } catch (error) {
      handleUnauthorized(error);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    void loadAppointments();
    void loadSettings();
    void loadCatalog();
  }, [loadAppointments, loadCatalog, loadSettings]);

  useLiveEvents(useCallback((type) => {
    if (type === 'appointments_changed') {
      void loadAppointments();
    }
  }, [loadAppointments]));

  const filteredAppointments = useMemo(() => filterAppointments(appointments, search, statusFilter), [appointments, search, statusFilter]);
  const counts = useMemo(() => getAppointmentCounts(appointments), [appointments]);
  const nextPending = useMemo(() => getPendingQueueHead(appointments), [appointments]);
  const nextTask = useMemo(() => getUpcomingAppointment(appointments), [appointments]);
  const todayAppointments = appointments.filter((app) => isToday(app.date)).length;

  const updateSetting = useCallback((key: keyof BusinessSettings, value: string | number) => {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  }, []);

  const saveSettings = useCallback(async () => {
    if (!settings) return;
    try {
      setError('');
      const saved = await api<BusinessSettings>('/api/admin/settings', {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(getSettingsPayload(settings)),
      });
      setSettings(saved);
      showToast('תוכן דף הפתיחה נשמר.', 'success');
    } catch (err: any) {
      setError(err.message || 'שמירת ההגדרות נכשלה');
      showToast(err.message || 'שמירת ההגדרות נכשלה', 'error');
    }
  }, [settings, showToast]);

  const updateStatus = useCallback(async (id: number, status: AppointmentStatus) => {
    const previous = appointments;
    setAppointments((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    try {
      await api(`/api/admin/appointments/${id}/status`, { method: 'PATCH', auth: true, body: JSON.stringify({ status }) });
      showToast('סטטוס התור עודכן.', 'success');
    } catch (err: any) {
      setAppointments(previous);
      setError(err.message || 'עדכון סטטוס נכשל');
      showToast(err.message || 'עדכון סטטוס נכשל', 'error');
    }
  }, [appointments, showToast]);

  const openEditAppointment = useCallback((appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setEditForm({
      customerName: appointment.customerName || '',
      customerPhone: appointment.customerPhone || '',
      customerEmail: appointment.customerEmail || '',
      serviceId: appointment.serviceId ? String(appointment.serviceId) : '',
      barberId: appointment.barberId ? String(appointment.barberId) : '',
      date: appointment.date || '',
      time: appointment.time || '',
      status: appointment.status,
      notes: appointment.notes || '',
    });
    setIsEditOpen(true);
  }, []);

  const saveAppointment = useCallback(async () => {
    if (!editingAppointmentId) return;
    if (!editForm.customerName.trim() || !editForm.customerPhone.trim() || !editForm.customerEmail.trim() || !editForm.serviceId || !editForm.barberId || !editForm.date || !editForm.time) {
      showToast('יש למלא את כל השדות החיוניים.', 'error');
      return;
    }

    setIsSavingAppointment(true);
    try {
      setError('');
      await api(`/api/admin/appointments/${editingAppointmentId}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({
          customerName: editForm.customerName.trim(),
          customerPhone: editForm.customerPhone.trim(),
          customerEmail: editForm.customerEmail.trim(),
          serviceId: Number(editForm.serviceId),
          barberId: Number(editForm.barberId),
          date: editForm.date,
          time: editForm.time,
          status: editForm.status,
          notes: editForm.notes.trim(),
        }),
      });
      showToast('התור עודכן.', 'success');
      setIsEditOpen(false);
      setEditingAppointmentId(null);
      await loadAppointments();
    } catch (err: any) {
      setError(err.message || 'עדכון התור נכשל');
      showToast(err.message || 'עדכון התור נכשל', 'error');
    } finally {
      setIsSavingAppointment(false);
    }
  }, [editForm, editingAppointmentId, loadAppointments, showToast]);

  const createAppointment = useCallback(async () => {
    if (!quickForm.customerName.trim() || !quickForm.customerPhone.trim() || !quickForm.customerEmail.trim() || !quickForm.serviceId || !quickForm.barberId || !quickForm.date || !quickForm.time) {
      showToast('יש למלא את כל השדות לתור ידני.', 'error');
      return;
    }
    setIsCreatingAppointment(true);
    try {
      await api('/api/admin/appointments', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          customerName: quickForm.customerName.trim(),
          customerPhone: quickForm.customerPhone.trim(),
          customerEmail: quickForm.customerEmail.trim(),
          serviceId: Number(quickForm.serviceId),
          barberId: Number(quickForm.barberId),
          date: quickForm.date,
          time: quickForm.time,
        }),
      });
      showToast('התור הידני נוסף.', 'success');
      setQuickForm({ customerName: '', customerPhone: '', customerEmail: '', serviceId: '', barberId: '', date: '', time: '' });
      setIsQuickAddOpen(false);
      await loadAppointments();
    } catch (err: any) {
      setError(err.message || 'יצירת התור נכשלה');
      showToast(err.message || 'יצירת התור נכשלה', 'error');
    } finally {
      setIsCreatingAppointment(false);
    }
  }, [loadAppointments, quickForm, showToast]);

  const rejectCancellationRequest = useCallback(async (id: number) => {
    try {
      await rejectAdminAppointmentCancellation(id);
      showToast('בקשת הביטול נדחתה והתור חזר למצב פעיל.', 'success');
      if (editingAppointmentId === id) {
        setIsEditOpen(false);
        setEditingAppointmentId(null);
      }
      await loadAppointments();
    } catch (err: any) {
      setError(err.message || 'דחיית בקשת הביטול נכשלה');
      showToast(err.message || 'דחיית בקשת הביטול נכשלה', 'error');
    }
  }, [editingAppointmentId, loadAppointments, showToast]);

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    settings,
    services,
    barbers,
    isQuickAddOpen,
    setIsQuickAddOpen,
    quickForm,
    setQuickForm,
    isCreatingAppointment,
    isEditOpen,
    setIsEditOpen,
    isSavingAppointment,
    editingAppointmentId,
    editForm,
    setEditForm,
    error,
    filteredAppointments,
    counts,
    nextPending,
    nextTask,
    todayAppointments,
    updateSetting,
    saveSettings,
    updateStatus,
    openEditAppointment,
    saveAppointment,
    createAppointment,
    rejectCancellationRequest,
    formatDate,
  };
}
