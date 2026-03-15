import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Dumbbell, Calendar, Plus, Clock, User, CheckCircle2, Users } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const F: CrudField[] = [
    { name: 'member', label: 'Гишүүн', type: 'text', required: true },
    {
        name: 'plan', label: 'Эрхийн төрөл', type: 'select', required: true, options: [
            { value: 'monthly', label: 'Сарын' }, { value: 'quarterly', label: 'Улирлын' }, { value: 'yearly', label: 'Жилийн' }, { value: 'daypass', label: 'Нэг удаагийн' },
        ]
    },
    { name: 'phone', label: 'Утас', type: 'phone' },
    { name: 'trainer', label: 'Дасгалжуулагч', type: 'text' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'active', label: 'Идэвхтэй' }, { value: 'expired', label: 'Дууссан' }, { value: 'frozen', label: 'Зогсоосон' },
        ]
    },
    { name: 'expiryDate', label: 'Дуусах огноо', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function GymFitnessPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/gymMembers`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub">
            <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Dumbbell size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Фитнесс</h3>
                            <div className="fds-hero-desc">Фитнесс клубын удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        Гишүүн нэмэх
                    </button>
                </div>
            </div>
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт гишүүд</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Users size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй</h4><div className="text-3xl font-black text-success">{items.filter(i => i.status === 'active').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дууссан</h4><div className="text-3xl font-black text-danger">{items.filter(i => i.status === 'expired').length}</div></div><div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><Clock size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Fitness</h4><div className="text-xl font-black">GYM PRO</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Dumbbell size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th className="pl-6">Гишүүн</th><th>Эрхийн төрөл</th><th>Дасгалжуулагч</th><th>Дуусах огноо</th><th>Төлөв</th></tr></thead><tbody>
                            {items.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Гишүүн олдсонгүй</td></tr> :
                                items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}>
                                    <td className="pl-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><User size={16} /></div><span className="font-bold">{i.member}</span></div></td>
                                    <td className="font-bold uppercase text-[10px] tracking-widest text-muted">{i.plan}</td><td>{i.trainer || '-'}</td><td>{i.expiryDate || '-'}</td>
                                    <td><span className={`badge badge-${i.status === 'active' ? 'success' : i.status === 'frozen' ? 'warning' : 'danger'} text-[10px] font-black uppercase`}>{i.status === 'active' ? 'ИДЭВХТЭЙ' : i.status === 'frozen' ? 'ЗОГСООСОН' : 'ДУУССАН'}</span></td>
                                </tr>)}
                        </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Gym гишүүн" icon={<Dumbbell size={20} />} collectionPath="businesses/{bizId}/gymMembers" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
