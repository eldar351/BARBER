import { ShieldCheck, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminBackButton, AdminMiniStat, AdminSectionHeading, AdminShell } from '../../components/admin/AdminShell';
import { FeedbackNotice, SecondaryButton } from '../../components/ui';
import { AdminUsersCreateCard, AdminUsersList } from '../../features/admin/adminUsersComponents';
import { useAdminUsersManagement } from '../../features/admin/useAdminUsersManagement';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const users = useAdminUsersManagement();

  return (
    <AdminShell
      title="משתמשי אדמין"
      description="שליטה בגישת הניהול של העסק: הוספה, בקרה וביטול גישה ממקום אחד."
      eyebrow="ACCESS CONTROL"
      backAction={<AdminBackButton onClick={() => navigate('/admin/dashboard')} />}
      actions={
        <SecondaryButton onClick={() => navigate('/admin/dashboard')} className="w-full px-5 py-4 sm:w-auto">
          <ShieldCheck size={18} />
          חזרה לדשבורד
        </SecondaryButton>
      }
    >
      <div className="space-y-4 md:space-y-6">
        <AdminSectionHeading
          eyebrow="ADMIN SURFACE"
          title="מי יכול להיכנס למערכת"
          description="כאן מגדירים ומבקרים גישת ניהול, כדי לפתוח הרשאות חדשות בלי לשבור את תהליך העבודה הקיים."
          aside={
            <>
              <AdminMiniStat label="מנהלים" value={users.admins.length} helper="חשבונות עם גישה פעילה" />
              <AdminMiniStat label="מחובר" value={users.admin?.email || 'לא מזוהה'} helper="המשתמש הנוכחי בממשק" />
            </>
          }
        />

        {users.error && <FeedbackNotice tone="error">{users.error}</FeedbackNotice>}

        <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
          <AdminUsersCreateCard
            form={users.form}
            isCreating={users.isCreating}
            onChange={users.updateField}
            onSubmit={users.submit}
            onReset={users.resetForm}
            validationError={users.validationError}
          />

          <div className="space-y-4">
            {users.isLoading ? (
              <FeedbackNotice tone="info">טוען את רשימת המנהלים...</FeedbackNotice>
            ) : (
              <AdminUsersList
                admins={users.admins}
                currentAdminId={users.admin?.id}
                deletingId={users.deletingId}
                onDelete={users.removeAdmin}
              />
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-outline-brand/18 bg-surface-high/65 p-4 text-sm leading-7 text-[#d8cad2]">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-primary-brand">
              <UserPlus size={16} />
            </div>
            <div>
              <p className="font-bold text-[#fff5eb]">המלצת תפעול</p>
              <p className="mt-1">
                פתח משתמש נפרד לכל איש צוות שמטפל בניהול, כדי לשמור בקרה טובה יותר ולמנוע שיתוף סיסמאות.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
