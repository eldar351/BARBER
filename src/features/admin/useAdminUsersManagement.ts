import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../components/toast';
import { AdminUser } from '../../types';
import { createAdminUser, deleteAdminUser, listAdminUsers } from './api';
import { useAdminAuth } from './auth';

const INITIAL_FORM = {
  email: '',
  password: '',
  confirmPassword: '',
};

export function useAdminUsersManagement() {
  const { admin, handleUnauthorized } = useAdminAuth();
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadAdmins = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);
      const data = await listAdminUsers();
      setAdmins(data);
    } catch (loadError) {
      if (handleUnauthorized(loadError)) return;
      setError(loadError instanceof Error ? loadError.message : 'טעינת המנהלים נכשלה.');
    } finally {
      setIsLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const validationError = useMemo(() => {
    if (!form.email.trim() && !form.password && !form.confirmPassword) return '';
    if (!form.email.trim()) return 'יש להזין כתובת אימייל.';
    if (form.password.length < 8) return 'הסיסמה חייבת להכיל לפחות 8 תווים.';
    if (form.password !== form.confirmPassword) return 'אימות הסיסמה אינו תואם.';
    return '';
  }, [form]);

  const canSubmit = !validationError && !!form.email.trim() && !!form.password && !!form.confirmPassword;

  const updateField = (field: keyof typeof INITIAL_FORM, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => setForm(INITIAL_FORM);

  const submit = async () => {
    if (!canSubmit) {
      setError(validationError || 'יש להשלים את כל השדות.');
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      await createAdminUser({ email: form.email.trim(), password: form.password });
      showToast('משתמש המנהל נוצר בהצלחה.', 'success');
      resetForm();
      await loadAdmins();
    } catch (createError) {
      if (handleUnauthorized(createError)) return;
      const message = createError instanceof Error ? createError.message : 'יצירת משתמש המנהל נכשלה.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const removeAdmin = async (target: AdminUser) => {
    try {
      setDeletingId(target.id);
      setError('');
      await deleteAdminUser(target.id);
      showToast(`הגישה של ${target.email} בוטלה.`, 'success');
      await loadAdmins();
    } catch (deleteError) {
      if (handleUnauthorized(deleteError)) return;
      const message = deleteError instanceof Error ? deleteError.message : 'מחיקת המנהל נכשלה.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return {
    admin,
    admins,
    canSubmit,
    deletingId,
    error,
    form,
    isCreating,
    isLoading,
    loadAdmins,
    removeAdmin,
    resetForm,
    setForm,
    submit,
    updateField,
    validationError,
  };
}
