import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Box, Printer, Check, Search, Package, Tag, Plus } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const F: CrudField[] = [
    { name: 'orderNumber', label: 'Захиалгын №', type: 'text', required: true },
    { name: 'customer', label: 'Харилцагч', type: 'text', required: true },
    { name: 'itemCount', label: 'Барааны тоо', type: 'number', required: true },
    { name: 'boxType', label: 'Хайрцаг', type: 'select', options: [{ value: 'small', label: 'Small (30x20x15cm)' }, { value: 'medium', label: 'Medium (45x30x25cm)' }, { value: 'large', label: 'Large (60x40x40cm)' }] },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'packing', options: [{ value: 'packing', label: 'Савлаж буй' }, { value: 'ready', label: 'Бэлэн' }, { value: 'shipped', label: 'Илгээсэн' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function PackingPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/packingOrders`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line

    return (
        <HubLayout hubId="logistics-hub">
            <Header title="Савлалт & Шошгожилт" subtitle="Барааг хайрцаглах, баглах болон хүргэлтийн шошго хэвлэх" action={{ label: "Савлах", onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid-3 gap-4">
                    <div className="card p-5 bg-surface-1 border-l-4 border-l-primary flex justify-between items-center"><div><div className="text-2xl font-bold">{items.filter(i => i.status === 'packing').length}</div><div className="text-xs text-muted uppercase font-bold">Савлаж буй</div></div><Box className="text-primary opacity-40" size={32} /></div>
                    <div className="card p-5 bg-surface-1 border-l-4 border-l-success flex justify-between items-center"><div><div className="text-2xl font-bold">{items.filter(i => i.status === 'ready').length}</div><div className="text-xs text-muted uppercase font-bold">Бэлэн болсон</div></div><Check className="text-success opacity-40" size={32} /></div>
                    <div className="card p-5 bg-surface-1 border-l-4 border-l-secondary flex justify-between items-center"><div><div className="text-2xl font-bold">{items.reduce((s, c) => s + (c.itemCount || 0), 0)}</div><div className="text-xs text-muted uppercase font-bold">Нийт бараа</div></div><Tag className="text-secondary opacity-40" size={32} /></div>
                </div>
                <div className="card p-0">
                    <div className="p-4 border-b flex items-center justify-between"><h3 className="m-0 text-sm font-bold uppercase text-muted">Савлах захиалгууд</h3><div className="relative max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} /><input type="text" className="input input-sm pl-9" placeholder="Захиалгын №..." /></div></div>
                    <div className="overflow-x-auto">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table w-full"><thead><tr><th className="p-4 text-left">Захиалгын №</th><th className="p-4 text-left">Харилцагч</th><th className="p-4 text-right">Барааны тоо</th><th className="p-4 text-left">Хайрцаг</th><th className="p-4 text-left">Төлөв</th><th className="p-4"></th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Савлах захиалга олдсонгүй</td></tr> : items.map(o => (
                                <tr key={o.id} className="hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => { setEditingItem(o); setShowModal(true) }}>
                                    <td className="p-4 font-bold">{o.orderNumber}</td>
                                    <td className="p-4">{o.customer}</td>
                                    <td className="p-4 text-right font-bold">{o.itemCount}</td>
                                    <td className="p-4 text-sm text-muted">{o.boxType || '-'}</td>
                                    <td className="p-4"><span className={`badge ${o.status === 'ready' ? 'badge-success' : o.status === 'shipped' ? 'badge-delivered' : 'badge-preparing'}`}>{o.status === 'ready' ? 'Бэлэн' : o.status === 'shipped' ? 'Илгээсэн' : 'Савлаж буй'}</span></td>
                                    <td className="p-4 text-right"><button className="btn btn-ghost btn-sm"><Printer size={14} /></button></td>
                                </tr>))}</tbody></table>)}</div>
                </div>
            </div>
            {showModal && <GenericCrudModal title="Савлалт" icon={<Box size={20} />} collectionPath="businesses/{bizId}/packingOrders" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
