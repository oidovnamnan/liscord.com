import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Star, Award } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const VENDOR_FIELDS: CrudField[] = [
    { name: 'vendorName', label: 'Нийлүүлэгч', type: 'text', required: true },
    { name: 'category', label: 'Ангилал', type: 'text' },
    { name: 'qualityRating', label: 'Чанар (1-5)', type: 'number', required: true },
    { name: 'deliveryRating', label: 'Хүргэлт (1-5)', type: 'number' },
    { name: 'priceRating', label: 'Үнэ (1-5)', type: 'number' },
    { name: 'communicationRating', label: 'Харилцаа (1-5)', type: 'number' },
    { name: 'overallRating', label: 'Нийт (1-5)', type: 'number' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function VendorRatingPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/vendorRatings`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    const renderStars = (n: number) => Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill={i < n ? '#f1c40f' : 'none'} color={i < n ? '#f1c40f' : '#ccc'} />);
    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Star size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Нийлүүлэгч Үнэлгээ</h3>
                            <div className="fds-hero-desc">Нийлүүлэгчдийн гүйцэтгэл</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Үнэлгээ
                    </button>
                </div>
            </div>
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Нийлүүлэгч</th><th>Ангилал</th><th>Чанар</th><th>Хүргэлт</th><th>Үнэ</th><th>Нийт</th></tr></thead>
                            <tbody>{vendors.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Үнэлгээ олдсонгүй</td></tr> :
                                vendors.map(v => (<tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(v); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{v.vendorName}</td><td>{v.category || '-'}</td><td><div style={{ display: 'flex' }}>{renderStars(v.qualityRating || 0)}</div></td><td><div style={{ display: 'flex' }}>{renderStars(v.deliveryRating || 0)}</div></td><td><div style={{ display: 'flex' }}>{renderStars(v.priceRating || 0)}</div></td><td><div style={{ display: 'flex' }}>{renderStars(v.overallRating || 0)}</div></td></tr>))}
                            </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Нийлүүлэгч үнэлгээ" icon={<Award size={20} />} collectionPath="businesses/{bizId}/vendorRatings" fields={VENDOR_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
