import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Wifi, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const REMOTE_FIELDS: CrudField[] = [
    { name: 'employeeName', label: 'Ажилтан', type: 'text', required: true },
    { name: 'date', label: 'Огноо', type: 'date', required: true },
    { name: 'location', label: 'Байршил', type: 'text', placeholder: 'Гэрээсээ, Кофе шоп гэх мэт' },
    { name: 'hoursWorked', label: 'Ажилласан цаг', type: 'number' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'active', label: 'Ажиллаж буй' },
            { value: 'completed', label: 'Дууссан' },
        ]
    },
    { name: 'tasksCompleted', label: 'Гүйцэтгэсэн ажил', type: 'textarea', span: 2 },
];

export function RemoteTrackerPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/remoteWork`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Wifi size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Зайнаас Ажиллах</h3>
                            <div className="fds-hero-desc">Зайнаас ажиллах бүртгэл</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Бүртгэх
                    </button>
                </div>
            </div>
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Ажилтан</th><th>Огноо</th><th>Байршил</th><th>Цаг</th><th>Төлөв</th></tr></thead>
                            <tbody>{records.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> :
                                records.map(r => (
                                    <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(r); setShowModal(true); }}>
                                        <td style={{ fontWeight: 600 }}>{r.employeeName}</td>
                                        <td>{r.date || '-'}</td>
                                        <td><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{r.location || '-'}</td>
                                        <td style={{ fontWeight: 600 }}>{r.hoursWorked || 0}ц</td>
                                        <td><span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-info'}`}>{r.status === 'completed' ? 'Дууссан' : 'Ажиллаж буй'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Зайнаас ажиллах" icon={<Wifi size={20} />} collectionPath="businesses/{bizId}/remoteWork" fields={REMOTE_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
