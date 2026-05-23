import { Link } from 'react-router-dom';

export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      דלג לתוכן הראשי
    </a>
  );
}

export function PublicAccessibilityFooter() {
  return (
    <footer className="app-shell pb-8 pt-4 text-sm text-[#d7cad2]" role="contentinfo">
      <div className="rounded-3xl border border-white/6 bg-surface/70 px-4 py-4 text-center">
        <Link to="/accessibility-statement" className="font-bold text-primary-brand underline-offset-4 hover:underline">
          הצהרת נגישות
        </Link>
      </div>
    </footer>
  );
}
