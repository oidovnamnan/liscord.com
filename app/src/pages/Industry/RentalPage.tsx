import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Key, Plus, Calendar, Clock, CheckCircle2, DollarSign, KeyRound} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const F: CrudField[] = [
    { name: 'item', label: 'Түрээсийн зүйл', type: 'text', required: true },
    { name: 'customer', label: 'Түрээслэгч', type: 'text', required: true },
    { name: 'startDate', label: 'Эхлэх', type: 'date' }, { name: 'endDate', label: 'Дуусах', type: 'date' },
    { name: 'dailyRate', label: 'Өдрийн үнэ', type: 'currency' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'active', label: 'Идэвхтэй' }, { value: 'returned', label: 'Буцаасан' }, { value: 'overdue', label: 'Хоцорсон' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function RentalPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/rentals`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><KeyRound size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Түрээс</h3>
                            <div className="fds-hero-desc">Түрээсийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        Түрээс нэмэх
                    </button>
                </div>
            </div>
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Key size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй</h4><div className="text-3xl font-black text-success">{items.filter(i => i.status === 'active').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хоцорсон</h4><div className="text-3xl font-black text-danger">{items.filter(i => i.status === 'overdue').length}</div></div><div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><Clock size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Rental</h4><div className="text-xl font-black">RENT PRO</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><DollarSign size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th className="pl-6">Зүйл</th><th>Түрээслэгч</th><th>Эхлэх</th><th>Дуусах</th><th>Үнэ/өдөр</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> : items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}><td className="pl-6 py-4 font-bold">{i.item}</td><td>{i.customer}</td><td>{i.startDate || '-'}</td><td>{i.endDate || '-'}</td><td>{(i.dailyRate || 0).toLocaleString()}₮</td><td><span className={`badge badge-${i.status === 'active' ? 'success' : i.status === 'overdue' ? 'danger' : 'secondary'} text-[10px] font-black uppercase`}>{i.status === 'active' ? 'ИДЭВХТЭЙ' : i.status === 'overdue' ? 'ХОЦОРСОН' : 'БУЦААСАН'}</span></td></tr>)}</tbody></table>)}</div>
            </div>
            {showModal && <GenericCrudModal title="Түрээс" icon={<Key size={20} />} collectionPath="businesses/{bizId}/rentals" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
