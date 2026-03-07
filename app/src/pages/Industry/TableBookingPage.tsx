import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { CalendarDays, Plus, Users, Clock, CheckCircle2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const F: CrudField[] = [
    { name: 'guest', label: 'Зочин', type: 'text', required: true },
    { name: 'phone', label: 'Утас', type: 'phone' },
    { name: 'partySize', label: 'Хүний тоо', type: 'number', required: true },
    { name: 'date', label: 'Огноо', type: 'date', required: true },
    { name: 'time', label: 'Цаг', type: 'text', required: true },
    { name: 'table', label: 'Ширээ', type: 'text' },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'confirmed', options: [{ value: 'confirmed', label: 'Баталсан' }, { value: 'arrived', label: 'Ирсэн' }, { value: 'cancelled', label: 'Цуцалсан' }, { value: 'noshow', label: 'Ирээгүй' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function TableBookingPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/tableBookings`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><Header title="Ширээ захиалга" subtitle="Зочдын ширээ захиалга, хуваарийн удирдлага" action={{ label: 'Захиалга нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><CalendarDays size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Баталсан</h4><div className="text-3xl font-black text-success">{items.filter(i => i.status === 'confirmed').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт зочин</h4><div className="text-3xl font-black text-info">{items.reduce((s, c) => s + (c.partySize || 0), 0)}</div></div><div className="bg-info/10 p-4 rounded-2xl text-info group-hover:scale-110 transition-transform"><Users size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Booking</h4><div className="text-xl font-black">TABLE SYS</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Clock size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th className="pl-6">Зочин</th><th>Утас</th><th>Хүн</th><th>Огноо</th><th>Цаг</th><th>Ширээ</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Захиалга олдсонгүй</td></tr> : items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}><td className="pl-6 py-4 font-bold">{i.guest}</td><td>{i.phone || '-'}</td><td className="font-black">{i.partySize}</td><td>{i.date}</td><td>{i.time}</td><td>{i.table || '-'}</td><td><span className={`badge badge-${i.status === 'confirmed' ? 'success' : i.status === 'arrived' ? 'primary' : i.status === 'cancelled' ? 'danger' : 'warning'} text-[10px] font-black uppercase`}>{i.status}</span></td></tr>)}</tbody></table>)}</div>
            </div>
            {showModal && <GenericCrudModal title="Ширээ захиалга" icon={<CalendarDays size={20} />} collectionPath="businesses/{bizId}/tableBookings" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
