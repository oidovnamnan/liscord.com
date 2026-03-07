import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Ship, Plane, Globe, Search, ChevronRight, Calendar, MapPin, Plus } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const F: CrudField[] = [
    { name: 'number', label: 'Тээвэр дугаар', type: 'text', required: true },
    { name: 'mode', label: 'Тээврийн төрөл', type: 'select', required: true, options: [{ value: 'sea', label: 'Далай' }, { value: 'air', label: 'Агаар' }, { value: 'rail', label: 'Төмөр зам' }, { value: 'road', label: 'Авто' }] },
    { name: 'origin', label: 'Гарах газар', type: 'text', required: true },
    { name: 'destination', label: 'Хүрэх газар', type: 'text', required: true },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'shipped', options: [{ value: 'shipped', label: 'Ачигдсан' }, { value: 'at_port', label: 'Боомт дээр' }, { value: 'customs', label: 'Гааль дээр' }, { value: 'arrived', label: 'Ирсэн' }] },
    { name: 'date', label: 'Төлөвлөсөн огноо', type: 'date' },
    { name: 'cost', label: 'Тээврийн зардал', type: 'currency' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function FreightPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/freightShipments`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; cls: string }> = { 'shipped': { label: 'Ачигдсан', cls: 'badge-shipping' }, 'at_port': { label: 'Боомт дээр', cls: 'badge-preparing' }, 'customs': { label: 'Гааль дээр', cls: 'badge-confirmed' }, 'arrived': { label: 'Ирсэн', cls: 'badge-delivered' } };
        const s = config[status] || { label: status, cls: 'badge-preparing' };
        return <span className={`badge ${s.cls}`}>{s.label}</span>;
    };

    return (
        <HubLayout hubId="logistics-hub">
            <Header title="Олон Улсын Тээвэр" subtitle="Далай, агаар болон авто тээврийн аялалуудыг хянах" action={{ label: "Шинэ тээвэр", onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="flex gap-4">
                    <div className="card flex-1 p-4 bg-surface-1 flex items-center gap-4"><div className="p-3 bg-primary-light rounded-lg text-primary"><Ship size={24} /></div><div><div className="text-xl font-bold">{items.filter(i => i.mode === 'sea').length}</div><div className="text-xs text-muted">Далайн тээвэр</div></div></div>
                    <div className="card flex-1 p-4 bg-surface-1 flex items-center gap-4"><div className="p-3 bg-secondary-light rounded-lg text-secondary"><Plane size={24} /></div><div><div className="text-xl font-bold">{items.filter(i => i.mode === 'air').length}</div><div className="text-xs text-muted">Агаарын тээвэр</div></div></div>
                    <div className="card flex-1 p-4 bg-surface-1 flex items-center gap-4"><div className="p-3 bg-success-light rounded-lg text-success"><Globe size={24} /></div><div><div className="text-xl font-bold">₮{(items.reduce((s, c) => s + (c.cost || 0), 0) / 1000000).toFixed(1)}M</div><div className="text-xs text-muted">Нийт тээвэрлэлтийн үнэ</div></div></div>
                </div>
                <div className="card p-0">
                    <div className="p-4 border-b flex justify-between items-center"><div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} /><input type="text" className="input pl-10" placeholder="Билл дугаар, контейнер дугаар..." /></div></div>
                    <div className="overflow-x-auto">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table w-full"><thead><tr><th className="p-4 text-left">Тээврийн №</th><th className="p-4 text-left">Төрөл</th><th className="p-4 text-left">Маршрут</th><th className="p-4 text-left">Төлөв</th><th className="p-4 text-left">Огноо</th><th className="p-4">Зардал</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Тээвэр олдсонгүй</td></tr> : items.map(s => (
                                <tr key={s.id} className="hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => { setEditingItem(s); setShowModal(true) }}>
                                    <td className="p-4 font-bold">{s.number}</td>
                                    <td className="p-4"><div className="flex items-center gap-2">{s.mode === 'sea' ? <Ship size={14} className="text-primary" /> : <Plane size={14} className="text-secondary" />}<span className="capitalize">{s.mode}</span></div></td>
                                    <td className="p-4"><div className="flex items-center gap-2 text-sm"><span>{s.origin}</span><ChevronRight size={12} className="text-muted" /><span>{s.destination}</span></div></td>
                                    <td className="p-4">{getStatusBadge(s.status)}</td>
                                    <td className="p-4"><div className="flex items-center gap-2 text-sm text-muted"><Calendar size={14} />{s.date || '-'}</div></td>
                                    <td className="p-4 font-bold text-primary">₮{(s.cost || 0).toLocaleString()}</td>
                                </tr>))}</tbody></table>)}</div>
                </div>
            </div>
            {showModal && <GenericCrudModal title="Олон улсын тээвэр" icon={<Ship size={20} />} collectionPath="businesses/{bizId}/freightShipments" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
