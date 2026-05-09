import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if is admin in firestore
      const adminDoc = await getDoc(doc(db, 'admins', result.user.uid));
      if (adminDoc.exists()) {
        navigate('/admin/dashboard');
      } else {
        await auth.signOut();
        setError('You do not have administrative access.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const adminDoc = await getDoc(doc(db, 'admins', result.user.uid));
      if (adminDoc.exists()) {
        navigate('/admin/dashboard');
      } else {
        await auth.signOut();
        setError('You do not have administrative access.');
      }
    } catch (e: any) {
      setError('Invalid credentials or access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden" dir="rtl">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-container/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary-brand/5 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-[440px] bg-surface/80 backdrop-blur-xl border border-outline-brand/30 rounded-3xl p-10 md:p-12 shadow-2xl z-10"
      >
        <header className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 rounded-full bg-surface-high border border-outline-brand/50 flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="text-primary-brand w-8 h-8" />
          </div>
          <h1 className="font-display text-4xl text-primary-brand tracking-tight">BarberBooking Pro</h1>
          <p className="text-on-surface-variant text-lg">כניסת מנהל מערכת</p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500 text-sm">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div className="space-y-2 group">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant group-focus-within:text-primary-brand transition-colors">דוא&quot;ל</label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary-brand transition-colors" size={18}/>
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface-high border-b-2 border-outline-brand/50 focus:border-primary-brand focus:bg-surface-highest outline-none rounded-t-xl pr-12 pl-4 py-4 h-[56px] text-on-surface transition-all placeholder:opacity-30" 
                placeholder="admin@barberbooking.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant group-focus-within:text-primary-brand transition-colors">סיסמה</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary-brand transition-colors" size={18}/>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface-high border-b-2 border-outline-brand/50 focus:border-primary-brand focus:bg-surface-highest outline-none rounded-t-xl pr-12 pl-12 py-4 h-[56px] text-on-surface transition-all placeholder:opacity-30" 
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary-brand transition-colors"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full h-[56px] bg-primary-container text-white font-bold rounded-xl hover:bg-primary-brand transition-all shadow-xl flex items-center justify-center gap-2 group"
          >
            {isLoading ? 'מתחבר...' : 'התחברות למערכת'}
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-4">
           <div className="flex items-center gap-4">
              <div className="h-px bg-outline-brand/20 flex-1" />
              <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">או</span>
              <div className="h-px bg-outline-brand/20 flex-1" />
           </div>
           
           <button 
             onClick={handleGoogleLogin}
             disabled={isLoading}
             className="w-full py-4 border border-outline-brand/30 rounded-xl text-sm font-bold flex items-center justify-center gap-3 hover:bg-surface-high transition-all"
           >
             <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
             התחבר עם גוגל
           </button>
        </div>
        
        <p className="text-center mt-8 cursor-pointer text-primary-brand text-sm font-bold hover:underline">שכחת סיסמה?</p>
      </motion.div>
    </div>
  );
}
