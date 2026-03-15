import { useState, useEffect } from 'react';
import { Building2, UserPlus, Filter, Link, ShieldCheck, Mail, Phone, Store, Search, Handshake} from 'lucide-react';
import { HubLayout } from '../../components/common/HubLayout';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const B2B_FIELDS: CrudField[] = [
    { name: 'name', label: 'Байгууллагын нэр', type: 'text', required: true },
    {
        name: 'type', label: 'Хамтын ажиллагаа', type: 'select', required: true, options: [
            { value: 'Distributor', label: 'Дистрибьютор' },
            { value: 'Retailer', label: 'Жижиглэн' },
            { value: 'Wholesaler', label: 'Бөөний' },
        ]
    },
    { name: 'email', label: 'И-мэйл', type: 'email' },
    { name: 'phone', label: 'Утас', type: 'phone' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'active', label: 'Нэвтрэх эрхтэй' },
            { value: 'pending', label: 'Хүлээгдэж буй' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function B2BPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/b2bPartners`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="services-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Handshake size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">B2B</h3>
                            <div className="fds-hero-desc">Бизнес хоорондын худалдаа</div>
                        </div>
                    </div>
                </div>
            </div>

                <div className="page-content">
                    <div style={{ background: 'linear-gradient(135deg, var(--primary), #8e44ad)', padding: '32px', borderRadius: 'var(--radius-lg)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 30px rgba(108, 92, 231, 0.2)', marginBottom: '32px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>B2B Харилцагчийн Портал</h2>
                            <p style={{ opacity: 0.9, maxWidth: '600px', lineHeight: 1.5, marginBottom: '20px' }}>Бөөний нөхцөлөөр бараа татдаг харилцагчиддаа зориулж тусдаа портал нээж өгөөрэй.</p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn" style={{ background: 'white', color: 'var(--primary)' }}><Link size={18} /> Порталын холбоос хуулах</button>
                                <button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}><Store size={18} /> Дэлгэцийн харагдац хянах</button>
                            </div>
                        </div>
                        <Building2 size={120} style={{ opacity: 0.2, transform: 'rotate(-10deg)', marginRight: '40px' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div className="search-bar" style={{ width: '300px' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="Байгууллагын нэрээр хайх..." className="input" style={{ paddingLeft: 36 }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-outline"><Filter size={18} /> Ангилал</button>
                            <button className="btn btn-primary gradient-btn" onClick={() => { setEditingItem(null); setShowModal(true); }}><UserPlus size={18} /> Харилцагч нэмэх</button>
                        </div>
                    </div>

                    <div className="data-table-container">
                        {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                            <table className="data-table">
                                <thead><tr><th>Байгууллагын нэр</th><th>Хамтын ажиллагаа</th><th>Холбоо барих</th><th>Төлөв</th><th style={{ textAlign: 'right' }}>Үйлдэл</th></tr></thead>
                                <tbody>
                                    {partners.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Харилцагч олдсонгүй</td></tr> :
                                        partners.map(p => (
                                            <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(p); setShowModal(true); }}>
                                                <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>{(p.name || '?').charAt(0)}</div>
                                                    {p.name}
                                                </td>
                                                <td><span style={{ color: 'var(--text-secondary)' }}>{p.type}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} /> {p.email}</span>
                                                        <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}><Phone size={12} /> {p.phone}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                                        <ShieldCheck size={12} style={{ marginRight: 4 }} />
                                                        {p.status === 'active' ? 'Нэвтрэх эрхтэй' : 'Хүлээгдэж буй'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}><button className="btn btn-outline btn-sm">Дэлгэрэнгүй</button></td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            {showModal && <GenericCrudModal title="B2B Харилцагч" icon={<Building2 size={20} />} collectionPath="businesses/{bizId}/b2bPartners" fields={B2B_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
