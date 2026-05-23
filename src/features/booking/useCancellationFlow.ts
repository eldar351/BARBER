import { useCallback, useState } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/toast';
import { captureClientError } from '../../lib/errorMonitoring';

type CancellationStep = 'lookup' | 'verify' | 'done';

export function useCancellationFlow() {
  const { showToast } = useToast();
  const [step, setStep] = useState<CancellationStep>('lookup');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [code, setCode] = useState('');
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [error, setError] = useState('');

  const canRequestCode = customerPhone.trim().length >= 8 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim());
  const canVerifyCode = /^\d{4}$/.test(code.trim());

  const requestCode = useCallback(async () => {
    if (!canRequestCode) return;
    setIsRequestingCode(true);
    setError('');
    try {
      await api('/api/public/appointments/cancellation-code/request', {
        method: 'POST',
        body: JSON.stringify({
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
        }),
      });
      setStep('verify');
      showToast('אם נמצאה הזמנה מתאימה, קוד אימות נשלח למייל.', 'success');
    } catch (error) {
      captureClientError(error, 'cancellation.request-code', 'בקשת קוד ביטול נכשלה');
      setError(error instanceof Error ? error.message : 'שליחת הקוד נכשלה.');
      showToast(error instanceof Error ? error.message : 'שליחת הקוד נכשלה.', 'error');
    } finally {
      setIsRequestingCode(false);
    }
  }, [canRequestCode, customerEmail, customerPhone, showToast]);

  const verifyCode = useCallback(async () => {
    if (!canVerifyCode) return;
    setIsVerifyingCode(true);
    setError('');
    try {
      await api('/api/public/appointments/cancellation-code/verify', {
        method: 'POST',
        body: JSON.stringify({
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          code: code.trim(),
        }),
      });
      setStep('done');
      showToast('בקשת הביטול נשלחה לאישור אדמין.', 'success');
    } catch (error) {
      captureClientError(error, 'cancellation.verify-code', 'אימות קוד ביטול נכשל');
      setError(error instanceof Error ? error.message : 'אימות הקוד נכשל.');
      showToast(error instanceof Error ? error.message : 'אימות הקוד נכשל.', 'error');
    } finally {
      setIsVerifyingCode(false);
    }
  }, [canVerifyCode, code, customerEmail, customerPhone, showToast]);

  const reset = useCallback(() => {
    setStep('lookup');
    setCustomerPhone('');
    setCustomerEmail('');
    setCode('');
    setError('');
  }, []);

  return {
    step,
    customerPhone,
    setCustomerPhone,
    customerEmail,
    setCustomerEmail,
    code,
    setCode,
    isRequestingCode,
    isVerifyingCode,
    error,
    canRequestCode,
    canVerifyCode,
    requestCode,
    verifyCode,
    reset,
  };
}
