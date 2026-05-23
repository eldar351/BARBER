import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { AppCard, PrimaryButton } from './ui';
import { reportClientLog, serializeUnknownError } from '../lib/errorMonitoring';

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    void reportClientLog({
      level: 'error',
      source: 'client.react-boundary',
      message: error?.message || 'React render failure',
      context: {
        error: serializeUnknownError(error),
        componentStack: errorInfo?.componentStack,
      },
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background px-4 py-10 text-[#eadfee]" dir="rtl">
        <div className="mx-auto max-w-2xl">
          <AppCard className="editorial-shell p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-200">
                <AlertTriangle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="designer-kicker text-[11px] font-bold uppercase text-red-200">SYSTEM ERROR</p>
                <h1 className="mt-2 font-display text-2xl text-[#fff5eb]">המערכת נתקלה בשגיאה</h1>
                <p className="mt-3 text-sm leading-6 text-[#ece2e8]">
                  השגיאה נרשמה ללוגים. אפשר לרענן את המסך ולנסות שוב.
                </p>
                <PrimaryButton onClick={this.handleReload} className="mt-5 px-5 py-3">
                  <RotateCcw size={16} />
                  רענון המערכת
                </PrimaryButton>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    );
  }
}

export function GlobalErrorMonitor() {
  useEffect(() => {
    const handleWindowError = (event) => {
      void reportClientLog({
        level: 'error',
        source: 'client.window',
        message: event.message || 'Unhandled browser error',
        context: {
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          error: serializeUnknownError(event.error),
        },
      });
    };

    const handleRejection = (event) => {
      void reportClientLog({
        level: 'error',
        source: 'client.promise',
        message: 'Unhandled promise rejection',
        context: {
          reason: serializeUnknownError(event.reason),
        },
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
