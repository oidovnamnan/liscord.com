import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Layers, Palette } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const VARIANT_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'variantName', label: 'Вариант', type: 'text', required: true, placeholder: 'Хар / XL' },
    { name: 'sku', label: 'SKU', type: 'text' },
    { name: 'color', label: 'Өнгө', type: 'text' },
    { name: 'size', label: 'Хэмжээ', type: 'text' },
    { name: 'price', label: 'Үнэ', type: 'currency' },
    { name: 'stock', label: 'Үлдэгдэл', type: 'number' },
    { name: 'isActive', label: 'Идэвхтэй', type: 'toggle', defaultValue: true },
];
export function ProductVariantsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/productVariants`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header title="Бүтээгдэхүүний Вариант" action={{ label: '+ Вариант', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Бүтээгдэхүүн</th><th>Вариант</th><th>SKU</th><th>Өнгө</th><th>Хэмжээ</th><th>Үнэ</th><th>Үлдэгдэл</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> :
                                items.map(i => (<tr key={i.id} style={{ cursor: 'pointer', opacity: i.isActive === false ? 0.5 : 1 }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.productName}</td><td>{i.variantName}</td><td style={{ fontFamily: 'monospace' }}>{i.sku || '-'}</td><td>{i.color ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: i.color, border: '1px solid var(--border-color)' }} />{i.color}</span> : '-'}</td><td>{i.size || '-'}</td><td>{i.price ? i.price.toLocaleString() + ' ₮' : '-'}</td><td>{i.stock || 0}</td></tr>))}
                            </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Вариант" icon={<Layers size={20} />} collectionPath="businesses/{bizId}/productVariants" fields={VARIANT_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
