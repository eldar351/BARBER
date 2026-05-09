import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Service } from '../../types';
import { cn } from '../../lib/utils';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Scissors, 
  Clock, 
  DollarSign 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    description: '',
    durationMin: 30,
    price: 35,
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=300&h=300',
    isActive: true
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/admin/login');
      return;
    }
    const unsub = onSnapshot(collection(db, 'services'), (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    });
    return () => unsub();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'services'), formData);
        setIsAdding(false);
      }
      setFormData({ name: '', description: '', durationMin: 30, price: 35, imageUrl: formData.imageUrl, isActive: true });
    } catch (e) {
      alert('Error saving service');
    }
  };

  const startEdit = (srv: Service) => {
    setEditingId(srv.id);
    setFormData(srv);
    setIsAdding(false);
  };

  const deleteService = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteDoc(doc(db, 'services', id));
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 md:p-12">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="font-display text-4xl mb-2">Service Management</h1>
          <p className="text-on-surface-variant">Configure your grooming offerings and pricing.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingId(null); }}
          className="bg-primary-brand text-on-primary-brand px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
        >
          <Plus size={20}/> New Service
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {(isAdding || editingId) && (
          <form onSubmit={handleSubmit} className="bg-surface-high rounded-3xl p-8 border border-primary-brand/40 shadow-2xl space-y-6">
            <h3 className="font-display text-2xl text-primary-brand uppercase tracking-wider">{editingId ? 'Edit Service' : 'New Service'}</h3>
            <div className="space-y-4">
              <Input label="Service Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Description</label>
                <textarea 
                  className="w-full bg-background border border-outline-brand/30 rounded-xl px-4 py-3 h-24 resize-none outline-none focus:border-primary-brand" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Duration (Min)" type="number" value={formData.durationMin} onChange={v => setFormData({...formData, durationMin: Number(v)})} />
                <Input label="Price ($)" type="number" value={formData.price} onChange={v => setFormData({...formData, price: Number(v)})} />
              </div>
              <Input label="Image URL" value={formData.imageUrl} onChange={v => setFormData({...formData, imageUrl: v})} />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="flex-1 bg-primary-brand text-on-primary-brand py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <Save size={18}/> {editingId ? 'Update' : 'Save'}
              </button>
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setIsAdding(false); }}
                className="bg-surface border border-outline-brand px-4 rounded-xl text-on-surface-variant"
              >
                <X size={18}/>
              </button>
            </div>
          </form>
        )}

        {services.map(srv => (
          <div key={srv.id} className="bg-surface rounded-3xl p-6 border border-outline-brand/20 flex flex-col gap-4 shadow-lg group">
            <div className="flex justify-between items-start">
              <h3 className="font-display text-2xl">{srv.name}</h3>
              <div className={cn("w-10 h-6 rounded-full relative transition-colors", srv.isActive ? "bg-primary-container" : "bg-outline-brand/20")}>
                <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", srv.isActive ? "right-1" : "right-5")} />
              </div>
            </div>
            <p className="text-sm text-on-surface-variant line-clamp-2 italic">{srv.description}</p>
            <div className="flex gap-6 mt-2 text-xs font-bold uppercase tracking-wider text-primary-brand">
              <div className="flex items-center gap-2"><Clock size={14}/> {srv.durationMin} MIN</div>
              <div className="flex items-center gap-2"><DollarSign size={14}/> {srv.price}</div>
            </div>
            <div className="flex gap-2 mt-auto pt-4 border-t border-outline-brand/10">
              <button onClick={() => startEdit(srv)} className="flex-1 border border-outline-brand/30 hover:border-primary-brand hover:text-primary-brand py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all">
                <Edit2 size={14}/> Edit
              </button>
              <button onClick={() => deleteService(srv.id)} className="p-2.5 border border-outline-brand/30 hover:border-red-500 hover:text-red-500 rounded-xl transition-all">
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
      <input 
        type={type}
        className="w-full bg-background border border-outline-brand/30 rounded-xl px-4 py-3 outline-none focus:border-primary-brand" 
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
