import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Star, ShieldCheck, Clock, DollarSign, Award, ChevronRight, Filter } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const F: CrudField[] = [
    { name: 'name', label: 'Компани нэр', type: 'text', required: true },
    { name: 'score', label: 'Нийт оноо (1-5)', type: 'number', required: true, defaultValue: 4 },
    { name: 'count', label: 'Нийт аялал', type: 'number', defaultValue: 0 },
    { name: 'price', label: 'Үнийн оноо (1-5)', type: 'number', defaultValue: 3 },
    { name: 'speed', label: 'Хурдны оноо (1-5)', type: 'number', defaultValue: 3 },
    { name: 'safety', label: 'Аюулгүй байдал (1-5)', type: 'number', defaultValue: 3 },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [{ value: 'preferred', label: 'Онцлох' }, { value: 'active', label: 'Идэвхтэй' }, { value: 'under_review', label: 'Шалгаж буй' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function VendorRatingPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/vendorRatings`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line

    const renderStars = (score: number) => (<div className="flex gap-0.5 text-warning">{[1, 2, 3, 4, 5].map(i => (<Star key={i} size={14} fill={i <= Math.floor(score) ? 'currentColor' : 'none'} />))}</div>);
    const best = items.length > 0 ? items.reduce((a, b) => (a.score || 0) > (b.score || 0) ? a : b) : null;

    return (
        <HubLayout hubId="logistics-hub">
            <Header title="Тээвэрлэгчийн Үнэлгээ" subtitle="Гадаад болон дотоод тээврийн компаниудын гүйцэтгэлийн мониторинг" action={{ label: "Үнэлгээ нэмэх", onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid-3 gap-6">
                    <div className="card p-5 bg-surface-1 flex flex-col gap-2 border-b-4 border-b-success"><div className="text-xs text-muted uppercase font-bold tracking-wider">Шилдэг тээвэрлэгч</div><div className="flex items-center gap-2"><Award className="text-warning" /><span className="text-lg font-bold">{best?.name || 'Тодорхойгүй'}</span></div></div>
                    <div className="card p-5 bg-surface-1 flex flex-col gap-2 border-b-4 border-b-primary"><div className="text-xs text-muted uppercase font-bold tracking-wider">Нийт тээвэрлэгч</div><div className="text-2xl font-bold">{items.length}</div></div>
                    <div className="card p-5 bg-surface-1 flex flex-col gap-2 border-b-4 border-b-warning"><div className="text-xs text-muted uppercase font-bold tracking-wider">Дундаж оноо</div><div className="text-2xl font-bold">{items.length > 0 ? (items.reduce((s, c) => s + (c.score || 0), 0) / items.length).toFixed(1) : '0'}</div></div>
                </div>
                <div className="card p-0 overflow-hidden">
                    <div className="p-4 border-b bg-surface-2 flex justify-between items-center"><h3 className="m-0 text-sm font-bold uppercase text-muted">Тээвэрлэгчдийн жагсаалт</h3><button className="btn btn-ghost btn-sm"><Filter size={14} /> Шүүх</button></div>
                    <div className="overflow-x-auto">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table w-full"><thead><tr className="text-left bg-surface-1 text-xs uppercase text-muted"><th className="p-4">Компани</th><th className="p-4">Нийт оноо</th><th className="p-4">Үнэ</th><th className="p-4">Хурд</th><th className="p-4">Аюулгүй</th><th className="p-4">Төлөв</th><th className="p-4"></th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Тээвэрлэгч олдсонгүй</td></tr> : items.map(v => (
                                <tr key={v.id} className="border-b hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => { setEditingItem(v); setShowModal(true) }}>
                                    <td className="p-4 flex flex-col"><span className="font-bold">{v.name}</span><span className="text-xs text-muted">{v.count || 0} аялал хийсэн</span></td>
                                    <td className="p-4"><div className="flex flex-col gap-1"><span className="font-bold">{v.score || 0}</span>{renderStars(v.score || 0)}</div></td>
                                    <td className="p-4"><div className="flex gap-0.5 text-success">{Array(Math.min(v.price || 0, 5)).fill(0).map((_, i) => <DollarSign key={i} size={12} />)}</div></td>
                                    <td className="p-4"><div className="flex gap-0.5 text-primary">{Array(Math.min(v.speed || 0, 5)).fill(0).map((_, i) => <Clock key={i} size={12} />)}</div></td>
                                    <td className="p-4"><div className="flex gap-0.5 text-secondary">{Array(Math.min(v.safety || 0, 5)).fill(0).map((_, i) => <ShieldCheck key={i} size={12} />)}</div></td>
                                    <td className="p-4"><span className={`badge badge-sm ${v.status === 'preferred' ? 'badge-success' : v.status === 'active' ? 'badge-primary' : 'badge-danger'}`}>{v.status === 'preferred' ? 'Онцлох' : v.status === 'active' ? 'Идэвхтэй' : 'Шалгаж буй'}</span></td>
                                    <td className="p-4 text-right"><button className="btn btn-ghost btn-sm"><ChevronRight size={16} /></button></td>
                                </tr>))}</tbody></table>)}</div>
                </div>
            </div>
            {showModal && <GenericCrudModal title="Тээвэрлэгчийн үнэлгээ" icon={<Star size={20} />} collectionPath="businesses/{bizId}/vendorRatings" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
