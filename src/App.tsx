import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerPortal from './pages/CustomerPortal';
import AdminDashboard from './pages/AdminPortal/Dashboard';
import AdminLogin from './pages/AdminPortal/Login';
import ServicesManagement from './pages/AdminPortal/Services';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';

export default function App() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user && user.email === 'eldar351@gmail.com') {
        const adminSnap = await getDocs(collection(db, 'admins'));
        if (adminSnap.empty) {
          // Initialize first admin
          await setDoc(doc(db, 'admins', user.uid), { email: user.email });
          console.log('Seeded initial admin');
          
          // Seed initial services/barbers if empty
          const sSnap = await getDocs(collection(db, 'services'));
          if (sSnap.empty) {
            const initialServices = [
              { name: 'Executive Haircut', description: 'A precision cut tailored to your bone structure.', durationMin: 45, price: 65, imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1', isActive: true },
              { name: 'Hot Towel Shave', description: 'The traditional ritual. Pre-shave oil, multiple hot towels.', durationMin: 30, price: 45, imageUrl: 'https://images.unsplash.com/photo-1593702295094-172c642935b8', isActive: true },
              { name: 'Beard Sculpting', description: 'Complete beard reshaping and line-up.', durationMin: 25, price: 35, imageUrl: 'https://images.unsplash.com/photo-1590540179852-2110a54f813a', isActive: true },
              { name: 'The Royal Package', description: 'The ultimate grooming experience.', durationMin: 90, price: 120, imageUrl: 'https://images.unsplash.com/photo-1621605815841-28d944683b83', isActive: true }
            ];
            for (const s of initialServices) await setDoc(doc(collection(db, 'services')), s);
          }
          
          const bSnap = await getDocs(collection(db, 'barbers'));
          if (bSnap.empty) {
             const items = [
               { name: 'Arthur Shelby', imageUrl: 'https://images.unsplash.com/photo-1581333100576-b73bbe923b91', specialty: 'Master', rating: 5, isActive: true },
               { name: 'Marcus Thorne', imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36', specialty: 'Fade Pro', rating: 5, isActive: true },
               { name: 'Elias Vance', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', specialty: 'Traditional', rating: 5, isActive: true }
             ];
             for (const b of items) await setDoc(doc(collection(db, 'barbers')), b);
          }
        }
      }
    });
    return () => unsub();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerPortal />} />
        <Route path="/book" element={<CustomerPortal />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/services" element={<ServicesManagement />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
