import { Activity } from 'lucide-react';
import { AdminBackButton, AdminMiniStat, AdminSectionHeading, AdminShell } from '../../components/admin/AdminShell';
import { FeedbackNotice, SecondaryButton } from '../../components/ui';
import { SystemLogsList, SystemLogsToolbar } from '../../features/admin/systemLogsComponents';
import { useSystemLogs } from '../../features/admin/useSystemLogs';
import { useNavigate } from 'react-router-dom';

export default function SystemLogsPage() {
  const navigate = useNavigate();
  const { logs, search, setSearch, level, setLevel, isLoading, isRefreshing, error, reload } = useSystemLogs();

  return (
    <AdminShell
      title="לוגים של המערכת"
      description="תצוגה מרוכזת של שגיאות, אזהרות ואירועי מערכת מהשרת ומהלקוח לצורך איתור תקלות מהיר."
      eyebrow="SYSTEM OBSERVABILITY"
      realtime={false}
      backAction={<AdminBackButton onClick={() => navigate('/admin/dashboard')} />}
      actions={
        <SecondaryButton onClick={() => navigate('/admin/dashboard')} className="w-full px-5 py-4 sm:w-auto">
          <Activity size={18} />
          חזרה לתורים
        </SecondaryButton>
      }
    >
      <div className="space-y-4 md:space-y-6">
        <AdminSectionHeading
          eyebrow="INCIDENT DESK"
          title="רואים מה קרה, בלי לחפש בין שכבות"
          description="הלוגים מרוכזים כאן כדי לאתר מהר תקלות חיות, רעשים, ואירועים שחוזרים על עצמם."
          aside={
            <>
              <AdminMiniStat label="רשומות" value={logs.length} helper="אחרי הסינון הנוכחי" />
              <AdminMiniStat label="מצב" value={isRefreshing ? 'מרענן' : isLoading ? 'טוען' : 'מוכן'} helper="סטטוס טעינת הממשק" />
            </>
          }
        />

        <SystemLogsToolbar
          search={search}
          onSearchChange={setSearch}
          level={level}
          onLevelChange={setLevel}
          onRefresh={reload}
          isRefreshing={isRefreshing}
        />

        {error && <FeedbackNotice tone="error">{error}</FeedbackNotice>}

        {isLoading ? (
          <FeedbackNotice tone="info">טוען לוגים מהמערכת...</FeedbackNotice>
        ) : (
          <SystemLogsList logs={logs} />
        )}
      </div>
    </AdminShell>
  );
}
