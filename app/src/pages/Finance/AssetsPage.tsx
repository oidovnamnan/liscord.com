import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Laptop, Building2, Truck, Briefcase, Search, Edit2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const ASSET_FIELDS: CrudField[] = [
    { name: 'name', label: 'Хөрөнгийн нэр', type: 'text', required: true, span: 2 },
    {
        name: 'category', label: 'Ангилал', type: 'select', required: true, options: [
            { value: 'electronics', label: '💻 Электроник' },
            { value: 'furniture', label: '🪑 Тавилга' },
            { value: 'vehicle', label: '🚛 Тээврийн хэрэгсэл' },
            { value: 'equipment', label: '🔧 Тоног төхөөрөмж' },
            { value: 'real_estate', label: '🏢 Үл хөдлөх' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'active', label: 'Ашиглагдаж буй' },
            { value: 'maintenance', label: 'Засварт' },
            { value: 'disposed', label: 'Устгасан' },
            { value: 'storage', label: 'Агуулахад' },
        ]
    },
    { name: 'purchasePrice', label: 'Авсан үнэ', type: 'currency', required: true },
    { name: 'currentValue', label: 'Одоогийн үнэ цэнэ', type: 'currency' },
    { name: 'purchaseDate', label: 'Авсан огноо', type: 'date' },
    { name: 'location', label: 'Байршил', type: 'text' },
    { name: 'assignedTo', label: 'Хариуцагч', type: 'text' },
    { name: 'serialNumber', label: 'Серийн дугаар', type: 'text' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

const categoryIcons: Record<string, typeof Laptop> = {
    electronics: Laptop, real_estate: Building2, vehicle: Truck, equipment: Briefcase
};

export function AssetsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/assets`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const filtered = assets.filter(a => (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || a.purchasePrice || 0), 0);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header title="Хөрөнгийн Бүртгэл" action={{ label: '+ Хөрөнгө нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '20px 0' }}>
                    <div className="card" style={{ padding: 20 }}><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт хөрөнгө</div><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{assets.length}</div></div>
                    <div className="card" style={{ padding: 20 }}><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт үнэ цэнэ</div><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalValue.toLocaleString()} ₮</div></div>
                    <div className="card" style={{ padding: 20 }}><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ашиглагдаж буй</div><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{assets.filter(a => a.status === 'active').length}</div></div>
                </div>
                <div style={{ marginBottom: 16 }}><div className="search-box" style={{ maxWidth: 400 }}><Search size={18} /><input type="text" placeholder="Хөрөнгийн нэрээр хайх..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : filtered.length === 0 ? (
                        <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><Laptop size={48} color="var(--text-muted)" /><h3>Хөрөнгө олдсонгүй</h3></div>
                    ) : (
                        filtered.map(a => {
                            const IconComp = categoryIcons[a.category] || Briefcase;
                            return (
                                <div key={a.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(a); setShowModal(true); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-soft)' }}><IconComp size={20} color="var(--primary)" /></div>
                                        <span className={`badge ${a.status === 'active' ? 'badge-success' : a.status === 'maintenance' ? 'badge-warning' : 'badge-soft'}`}>{a.status === 'active' ? 'Ашиглагдаж буй' : a.status === 'maintenance' ? 'Засварт' : a.status || 'Бусад'}</span>
                                    </div>
                                    <h4 style={{ margin: '0 0 8px' }}>{a.name}</h4>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.location && <span>{a.location} • </span>}{a.assignedTo && <span>{a.assignedTo}</span>}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 12, color: 'var(--primary)' }}>{(a.currentValue || a.purchasePrice || 0).toLocaleString()} ₮</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Хөрөнгө" icon={<Briefcase size={20} />} collectionPath="businesses/{bizId}/assets" fields={ASSET_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
