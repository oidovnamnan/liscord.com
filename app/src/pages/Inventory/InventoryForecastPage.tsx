import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { TrendingUp } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const FORECAST_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'currentStock', label: 'Одоогийн үлдэгдэл', type: 'number', required: true },
    { name: 'avgDailySales', label: 'Өдрийн дундаж борлуулалт', type: 'number' },
    { name: 'reorderPoint', label: 'Дахин захиалах цэг', type: 'number' },
    { name: 'leadTimeDays', label: 'Нийлүүлэх хугацаа (өдөр)', type: 'number' },
    { name: 'forecastedDemand', label: 'Таамагласан эрэлт', type: 'number' },
    {
        name: 'period', label: 'Хугацаа', type: 'select', options: [
            { value: 'weekly', label: '7 хоног' }, { value: 'monthly', label: 'Сар' }, { value: 'quarterly', label: 'Улирал' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function InventoryForecastPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/inventoryForecasts`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><TrendingUp size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Таамаглал</h3>
                            <div className="fds-hero-desc">Нөөцийн таамаглал, шинжилгээ</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Таамаглал
                    </button>
                </div>
            </div>
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Бүтээгдэхүүн</th><th>Үлдэгдэл</th><th>Дундаж/өдөр</th><th>Reorder цэг</th><th>Эрэлт</th><th>Хугацаа</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Таамаглал олдсонгүй</td></tr> :
                                items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.productName}</td><td style={{ color: (i.currentStock || 0) <= (i.reorderPoint || 0) ? '#e74c3c' : 'inherit' }}>{i.currentStock || 0}</td><td>{i.avgDailySales || 0}</td><td>{i.reorderPoint || '-'}</td><td style={{ fontWeight: 600 }}>{i.forecastedDemand || '-'}</td><td><span className="badge">{i.period || '-'}</span></td></tr>))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Нөөцийн таамаглал" icon={<TrendingUp size={20} />} collectionPath="businesses/{bizId}/inventoryForecasts" fields={FORECAST_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
