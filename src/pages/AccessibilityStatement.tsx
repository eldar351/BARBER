import { PublicAccessibilityFooter } from '../components/accessibility';
import { AppCard } from '../components/ui';

export default function AccessibilityStatement() {
  const updatedAt = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-ios-screen bg-background text-[#eadfee]" dir="rtl">
      <main id="main-content" className="app-shell py-6 md:py-10" role="main" tabIndex={-1}>
        <AppCard className="editorial-shell mx-auto max-w-4xl p-5 md:p-8">
          <article lang="he" dir="rtl" className="space-y-6">
            <header className="space-y-3">
              <p className="designer-kicker text-[11px] font-bold uppercase">ACCESSIBILITY</p>
              <h1 className="font-display text-3xl text-[#fff5eb] md:text-4xl">הצהרת נגישות</h1>
              <p className="max-w-3xl text-sm leading-7 text-[#ddd1d8] md:text-base">
                מערכת BARBER מחויבת לשיפור נגישות השירות הדיגיטלי עבור כלל המשתמשים, בהתאם לעקרונות התקן הישראלי 5568
                ולדרישות WCAG ברמה AA.
              </p>
            </header>

            <section className="space-y-3">
              <h2 className="font-display text-2xl text-[#fff5eb]">התאמות שבוצעו</h2>
              <ul className="list-disc space-y-2 pr-5 text-sm leading-7 text-[#ddd1d8]">
                <li>מבנה RTL מלא עם `lang=\"he\"` וניווט עקבי במקלדת.</li>
                <li>קישור דילוג לתוכן הראשי, landmarks ברורים ועמודי `main`/`nav`/`footer`.</li>
                <li>שיוך תקין בין labels לשדות, הודעות מצב דינמיות ו־toastים עם `aria-live`.</li>
                <li>פוקוס נראה לעין, כפתורים בגודל נוח, ודיאלוגים עם `aria-modal`.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-2xl text-[#fff5eb]">תמיכה טכנולוגית</h2>
              <p className="text-sm leading-7 text-[#ddd1d8]">
                המערכת נבנתה לשימוש עם ניווט מקלדת וקוראי מסך נפוצים כמו NVDA, JAWS ו־VoiceOver, וכן לעבודה מלאה בעברית וב־RTL.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-2xl text-[#fff5eb]">פנייה בנושא נגישות</h2>
              <p className="text-sm leading-7 text-[#ddd1d8]">
                אם נתקלת בבעיה, ניתן לפנות לבית העסק דרך ערוצי הקשר הרשמיים של BARBER ולציין שמדובר בפניית נגישות.
              </p>
              <p className="text-sm leading-7 text-[#ddd1d8]">
                לצורך עמידה מלאה בדרישות החוק, מומלץ להשלים גם פרטי רכז/ת נגישות וערוץ קשר ייעודי בתוך עמוד זה.
              </p>
            </section>

            <p className="border-t border-outline-brand/16 pt-4 text-xs text-[#cbbfd2]">תאריך עדכון אחרון: {updatedAt}</p>
          </article>
        </AppCard>
      </main>

      <PublicAccessibilityFooter />
    </div>
  );
}
