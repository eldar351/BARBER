import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => removeToast(id), 3400);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

function ToastViewport({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4" aria-live="polite" aria-atomic="true">
      <div className="flex w-full max-w-md flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onClose={() => onClose(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const ToastCard: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const toneMap = {
    success: {
      wrap: 'border-emerald-400/20 bg-[#15241d]/92 text-emerald-50',
      icon: <CheckCircle2 size={18} className="text-emerald-300" />,
    },
    error: {
      wrap: 'border-red-400/20 bg-[#2a181b]/92 text-red-50',
      icon: <AlertCircle size={18} className="text-red-300" />,
    },
    info: {
      wrap: 'border-primary-brand/20 bg-[#241d21]/92 text-[#fff4e8]',
      icon: <Info size={18} className="text-primary-brand" />,
    },
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className={cn('pointer-events-auto flex items-start gap-3 rounded-[24px] border px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl', toneMap[toast.tone].wrap)}
      role={toast.tone === 'error' ? 'alert' : 'status'}
    >
      <div className="mt-0.5 shrink-0">{toneMap[toast.tone].icon}</div>
      <div className="min-w-0 flex-1 text-sm font-medium leading-6">{toast.message}</div>
      <button type="button" onClick={onClose} aria-label="סגירת ההודעה" className="shrink-0 rounded-full p-1 text-white/60 transition hover:bg-white/8 hover:text-white">
        <X size={16} />
      </button>
    </motion.div>
  );
};
