import { AdminMiniStat, AdminSectionHeading, AdminShell, DashboardDateBadge } from '../../components/admin/AdminShell';
import { DashboardBoard, DashboardFilters, DashboardInsights, DashboardStats, EditAppointmentModal, QuickAddAppointment, SettingsPanel } from '../../features/admin/dashboardComponents';
import { useAdminDashboard } from '../../features/admin/useAdminDashboard';

export default function AdminDashboard() {
  const dashboard = useAdminDashboard();

  return (
    <AdminShell
      title="ניהול תורים"
      description="דשבורד שטוח ומהיר: מבינים מצב עסק ב־3 שניות ופועלים בקליק."
      actions={<DashboardDateBadge />}
    >
      <div className="grid gap-4 md:gap-6 xl:grid-cols-[minmax(0,1.55fr)_380px]">
        <div className="order-2 space-y-6 xl:order-1">
          <AdminSectionHeading
            eyebrow="TODAY'S FLOW"
            title="לוח העבודה של היום"
            description="סינון מהיר, טיפול בתורים, ומבט מיידי על צווארי בקבוק לפני שהם נהיים בעיה."
            aside={
              <>
                <AdminMiniStat label="מאושרים" value={dashboard.counts.confirmed} helper="תורים סגורים ליום העבודה" />
                <AdminMiniStat label="ממתינים" value={dashboard.counts.pending} helper="דורש תגובה או אישור" />
              </>
            }
          />
          <DashboardStats counts={dashboard.counts} statusFilter={dashboard.statusFilter} setStatusFilter={dashboard.setStatusFilter} />
          <DashboardFilters
            search={dashboard.search}
            setSearch={dashboard.setSearch}
            statusFilter={dashboard.statusFilter}
            setStatusFilter={dashboard.setStatusFilter}
          />

          {dashboard.error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{dashboard.error}</div>}

          <DashboardBoard
            filteredAppointments={dashboard.filteredAppointments}
            updateStatus={dashboard.updateStatus}
            openEditAppointment={dashboard.openEditAppointment}
            rejectCancellationRequest={dashboard.rejectCancellationRequest}
          />
        </div>

        <aside className="order-1 space-y-4 md:space-y-6 xl:order-2 xl:sticky xl:top-8 xl:self-start">
          <QuickAddAppointment
            isOpen={dashboard.isQuickAddOpen}
            setIsOpen={dashboard.setIsQuickAddOpen}
            form={dashboard.quickForm}
            setForm={dashboard.setQuickForm}
            services={dashboard.services}
            barbers={dashboard.barbers}
            createAppointment={dashboard.createAppointment}
            isCreating={dashboard.isCreatingAppointment}
          />

          {dashboard.nextPending && (
            <DashboardInsights
              counts={dashboard.counts}
              nextTask={dashboard.nextPending}
              updateStatus={dashboard.updateStatus}
              openEditAppointment={dashboard.openEditAppointment}
            />
          )}

          {dashboard.settings && (
            <SettingsPanel
              settings={dashboard.settings}
              updateSetting={dashboard.updateSetting}
              saveSettings={dashboard.saveSettings}
            />
          )}
        </aside>
      </div>

      <EditAppointmentModal
        isOpen={dashboard.isEditOpen}
        setIsOpen={dashboard.setIsEditOpen}
        form={dashboard.editForm}
        setForm={dashboard.setEditForm}
        services={dashboard.services}
        barbers={dashboard.barbers}
        saveAppointment={dashboard.saveAppointment}
        isSaving={dashboard.isSavingAppointment}
        rejectCancellationRequest={() => {
          if (dashboard.editingAppointmentId) void dashboard.rejectCancellationRequest(dashboard.editingAppointmentId);
        }}
      />
    </AdminShell>
  );
}
