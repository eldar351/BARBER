import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { useLiveEvents } from '../../lib/live';
import { Barber, Service } from '../../types';
import { useToast } from '../../components/toast';
import { useAdminAuth } from './auth';
import { listAdminBarbers, listAdminServices } from './api';
import { INITIAL_SERVICE_FORM, normalizeServicePayload } from './servicesManagement';

export function useServicesManagement() {
  const { showToast } = useToast();
  const { handleUnauthorized } = useAdminAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Service>>(INITIAL_SERVICE_FORM);
  const [error, setError] = useState('');

  const barberMap = useMemo(() => new Map(barbers.map((barber) => [barber.id, barber])), [barbers]);

  const loadData = React.useCallback(async () => {
    try {
      setError('');
      const [servicesData, barbersData] = await Promise.all([
        listAdminServices(),
        listAdminBarbers(),
      ]);
      setServices(servicesData);
      setBarbers(barbersData);
    } catch (error) {
      if (handleUnauthorized(error)) return;
      setError(error instanceof Error ? error.message : 'טעינת הנתונים נכשלה');
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(''), 3200);
    return () => window.clearTimeout(timer);
  }, [error]);

  useLiveEvents(
    React.useCallback(
      (type) => {
        if (type === 'services_changed' || type === 'barbers_changed') void loadData();
      },
      [loadData]
    )
  );

  const resetForm = React.useCallback(() => {
    setFormData(INITIAL_SERVICE_FORM);
    setEditingId(null);
    setIsAdding(false);
  }, []);

  const startCreate = React.useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
    setFormData(INITIAL_SERVICE_FORM);
  }, []);

  const startEdit = React.useCallback((service: Service) => {
    setEditingId(service.id);
    setFormData({ ...service, linkedBarberIds: service.linkedBarberIds || [] });
    setIsAdding(false);
  }, []);

  const setField = React.useCallback(<K extends keyof Service>(field: K, value: Service[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  }, []);

  const toggleLinkedBarber = React.useCallback((barberId: number) => {
    setFormData((current) => {
      const next = new Set(current.linkedBarberIds || []);
      if (next.has(barberId)) next.delete(barberId);
      else next.add(barberId);
      return { ...current, linkedBarberIds: Array.from(next) };
    });
  }, []);

  const saveService = React.useCallback(async () => {
    const payload = normalizeServicePayload(formData);
    const previous = services;

    try {
      if (editingId) {
        setServices((current) =>
          current.map((item) => (item.id === editingId ? ({ ...item, ...payload } as Service) : item))
        );
        await api(`/api/admin/services/${editingId}`, {
          method: 'PUT',
          auth: true,
          body: JSON.stringify(payload),
        });
        showToast('השירות עודכן בהצלחה.', 'success');
      } else {
        const tempId = -Date.now();
        setServices((current) => [{ id: tempId, ...payload } as Service, ...current]);
        await api('/api/admin/services', {
          method: 'POST',
          auth: true,
          body: JSON.stringify(payload),
        });
        showToast('השירות נוסף בהצלחה.', 'success');
      }

      resetForm();
      await loadData();
      } catch (error) {
        if (handleUnauthorized(error)) return;
        setServices(previous);
        const message = error instanceof Error ? error.message : 'שמירת השירות נכשלה';
        setError(message);
        showToast(message, 'error');
      }
  }, [editingId, formData, handleUnauthorized, loadData, resetForm, services, showToast]);

  const deleteService = React.useCallback(
    async (id: number) => {
      if (!window.confirm('למחוק את השירות הזה?')) return;
      const previous = services;
      setServices((current) => current.filter((item) => item.id !== id));

      try {
        await api(`/api/admin/services/${id}`, { method: 'DELETE', auth: true });
        showToast('השירות נמחק.', 'success');
      } catch (error) {
        if (handleUnauthorized(error)) return;
        setServices(previous);
        const message = error instanceof Error ? error.message : 'מחיקת השירות נכשלה';
        setError(message);
        showToast(message, 'error');
      }
    },
    [handleUnauthorized, services, showToast]
  );

  const toggleActive = React.useCallback(
    async (service: Service) => {
      const previous = services;
      const next = !Boolean(service.isActive);
      setServices((current) =>
        current.map((item) => (item.id === service.id ? { ...item, isActive: next } : item))
      );

      try {
        await api(`/api/admin/services/${service.id}`, {
          method: 'PUT',
          auth: true,
          body: JSON.stringify({ ...service, isActive: next }),
        });
        showToast(next ? 'השירות הופעל.' : 'השירות כובה.', 'success');
      } catch (error) {
        if (handleUnauthorized(error)) return;
        setServices(previous);
        const message = error instanceof Error ? error.message : 'עדכון הסטטוס נכשל';
        setError(message);
        showToast(message, 'error');
      }
    },
    [handleUnauthorized, services, showToast]
  );

  return {
    barberMap,
    barbers,
    deleteService,
    editingId,
    error,
    formData,
    isAdding,
    resetForm,
    saveService,
    services,
    setField,
    setFormData,
    startCreate,
    startEdit,
    toggleActive,
    toggleLinkedBarber,
  };
}
