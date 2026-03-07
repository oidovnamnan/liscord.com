import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { RefreshCw, Plus, Globe, CheckCircle2, AlertTriangle, ShoppingBag } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const F: CrudField[] = [
    { name: 'platform', label: 'Платформ', type: 'select', required: true, options: [{ value: 'shopee', label: 'Shopee' }, { value: 'lazada', label: 'Lazada' }, { value: 'amazon', label: 'Amazon' }, { value: 'etsy', label: 'Etsy' }, { value: 'other', label: 'Бусад' }] },
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'sku', label: 'SKU', type: 'text' },
    { name: 'price', label: 'Үнэ', type: 'currency' },
    { name: 'stock', label: 'Үлдэгдэл', type: 'number' },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'synced', options: [{ value: 'synced', label: 'Синк хийгдсэн' }, { value: 'pending', label: 'Хүлээгдэж буй' }, { value: 'error', label: 'Алдаатай' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function MarketplaceSyncPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/marketplaceSync`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><Header title="Marketplace Sync" subtitle="Олон платформд бүтээгдэхүүн, үлдэгдэл, үнийг синхрончлох" action={{ label: 'Бүтээгдэхүүн нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Globe size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Синк OK</h4><div className="text-3xl font-black text-success">{items.filter(i => i.status === 'synced').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Алдаатай</h4><div className="text-3xl font-black text-danger">{items.filter(i => i.status === 'error').length}</div></div><div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><AlertTriangle size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Sync</h4><div className="text-xl font-black">MULTI-CHANNEL</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><RefreshCw size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th className="pl-6">Бүтээгдэхүүн</th><th>Платформ</th><th>SKU</th><th>Үнэ</th><th>Үлдэгдэл</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> : items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}><td className="pl-6 py-4 font-bold">{i.productName}</td><td className="text-[10px] font-black uppercase tracking-widest"><span className="badge badge-outline">{i.platform}</span></td><td>{i.sku || '-'}</td><td>{(i.price || 0).toLocaleString()}₮</td><td>{i.stock || 0}</td><td><span className={`badge badge-${i.status === 'synced' ? 'success' : i.status === 'error' ? 'danger' : 'warning'} text-[10px] font-black uppercase`}>{i.status || 'pending'}</span></td></tr>)}</tbody></table>)}</div>
            </div>
            {showModal && <GenericCrudModal title="Marketplace" icon={<ShoppingBag size={20} />} collectionPath="businesses/{bizId}/marketplaceSync" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
