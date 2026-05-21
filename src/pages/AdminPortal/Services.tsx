import React from 'react';
import { ArrowRight, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminShell } from '../../components/admin/AdminShell';
import { AppCard, FeedbackNotice, PrimaryButton, SecondaryButton } from '../../components/ui';
import { ServiceEditorCard, ServiceList } from '../../features/admin/servicesComponents';
import { useServicesManagement } from '../../features/admin/useServicesManagement';

export default function ServicesManagement() {
  const {
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
    startCreate,
    startEdit,
    toggleActive,
    toggleLinkedBarber,
  } = useServicesManagement();
  const navigate = useNavigate();
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveService();
  };

  return (
    <AdminShell
      title="ניהול שירותים"
      description="עריכת שירותים עם הפרדה ברורה בין טופס, כרטיסי תצוגה ושיוך לנותני שירות — כדי שיהיה קל להרחיב בלי לגעת בכל המערכת."
      backAction={<button onClick={() => navigate('/admin/dashboard')} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-outline-brand/20 px-4 py-3 text-sm text-on-surface-variant hover:text-primary-brand sm:w-auto sm:justify-start sm:border-0 sm:px-0 sm:py-0"><ArrowRight size={16} /> חזרה לדשבורד</button>}
      actions={
        <>
          <SecondaryButton onClick={() => navigate('/admin/barbers')} className="w-full px-5 py-4 sm:w-auto"><Users size={18} /> נותני שירות</SecondaryButton>
          <PrimaryButton onClick={startCreate} className="w-full px-6 py-4 sm:w-auto"><Plus size={18} /> שירות חדש</PrimaryButton>
        </>
      }
    >
      {error && <FeedbackNotice tone="error" className="mb-6">{error}</FeedbackNotice>}

      <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        {isAdding || editingId ? (
          <ServiceEditorCard
            barbers={barbers}
            editingId={editingId}
            formData={formData}
            onCancel={resetForm}
            onSubmit={handleSubmit}
            onToggleLinkedBarber={toggleLinkedBarber}
            setField={setField}
          />
        ) : (
          <AppCard className="border-dashed p-6 text-center text-on-surface-variant md:p-8">
            <div className="soft-empty">בחר שירות לעריכה או צור חדש.</div>
          </AppCard>
        )}

        <ServiceList
          barberMap={barberMap}
          onDelete={deleteService}
          onEdit={startEdit}
          onToggleActive={toggleActive}
          services={services}
        />
      </div>
    </AdminShell>
  );
}
