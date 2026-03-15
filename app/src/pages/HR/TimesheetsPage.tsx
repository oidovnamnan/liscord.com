import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Clock, User, CheckCircle2, Timer} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const TIMESHEET_FIELDS: CrudField[] = [
    { name: 'employeeName', label: 'Ажилтан', type: 'text', required: true },
    { name: 'date', label: 'Огноо', type: 'date', required: true },
    { name: 'hoursWorked', label: 'Ажилласан цаг', type: 'number', required: true },
    { name: 'overtime', label: 'Илүү цаг', type: 'number', defaultValue: '0' },
    { name: 'project', label: 'Төсөл/Ажил', type: 'text' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'submitted', options: [
            { value: 'submitted', label: 'Илгээсэн' },
            { value: 'approved', label: 'Баталсан' },
            { value: 'rejected', label: 'Татгалзсан' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function TimesheetsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sheets, setSheets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/timesheets`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setSheets(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const totalHours = sheets.reduce((s, t) => s + (t.hoursWorked || 0), 0);
    const totalOvertime = sheets.reduce((s, t) => s + (t.overtime || 0), 0);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Timer size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Цагийн Бүртгэл</h3>
                            <div className="fds-hero-desc">Ажлын цагийн бүртгэл</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Бүртгэх
                    </button>
                </div>
            </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '20px 0' }}>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{sheets.length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт бүртгэл</div></div>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3498db' }}>{totalHours}ц</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт цаг</div></div>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e74c3c' }}>{totalOvertime}ц</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Илүү цаг</div></div>
                </div>
                <div className="card" style={{ padding: 0 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Ажилтан</th><th>Огноо</th><th>Цаг</th><th>Илүү</th><th>Төсөл</th><th>Төлөв</th></tr></thead>
                            <tbody>{sheets.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> :
                                sheets.map(s => (
                                    <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(s); setShowModal(true); }}>
                                        <td style={{ fontWeight: 600 }}><User size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{s.employeeName}</td>
                                        <td>{s.date || '-'}</td>
                                        <td style={{ fontWeight: 600 }}>{s.hoursWorked}ц</td>
                                        <td style={{ color: (s.overtime || 0) > 0 ? '#e74c3c' : 'inherit' }}>{s.overtime || 0}ц</td>
                                        <td>{s.project || '-'}</td>
                                        <td><span className={`badge ${s.status === 'approved' ? 'badge-success' : s.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>{s.status === 'approved' ? 'Баталсан' : s.status === 'rejected' ? 'Татгалзсан' : 'Илгээсэн'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Цагийн бүртгэл" icon={<Clock size={20} />} collectionPath="businesses/{bizId}/timesheets" fields={TIMESHEET_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
