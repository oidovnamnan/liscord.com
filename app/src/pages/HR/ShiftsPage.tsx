import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Clock, Users, UserCircle, CalendarDays } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const SHIFT_FIELDS: CrudField[] = [
    { name: 'employeeName', label: 'Ажилтан', type: 'text', required: true },
    { name: 'role', label: 'Албан тушаал', type: 'text' },
    { name: 'date', label: 'Огноо', type: 'date', required: true },
    {
        name: 'shiftType', label: 'Ээлж', type: 'select', required: true, options: [
            { value: 'morning', label: '🌅 Өглөө (08:00-16:00)' },
            { value: 'afternoon', label: '🌤 Өдөр (16:00-00:00)' },
            { value: 'night', label: '🌙 Шөнө (00:00-08:00)' },
            { value: 'day-off', label: '📴 Амралт' },
        ]
    },
    { name: 'hours', label: 'Цаг', type: 'number', defaultValue: '8' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'scheduled', options: [
            { value: 'scheduled', label: 'Хуваарилсан' },
            { value: 'attended', label: 'Ирсэн' },
            { value: 'missed', label: 'Ирээгүй' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

const shiftTypeLabels: Record<string, { label: string; color: string }> = {
    morning: { label: '🌅 Өглөө', color: '#2ecc71' },
    afternoon: { label: '🌤 Өдөр', color: '#f39c12' },
    night: { label: '🌙 Шөнө', color: '#9b59b6' },
    'day-off': { label: '📴 Амралт', color: '#95a5a6' },
};

export function ShiftsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/shifts`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setShifts(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header title="Ээлжийн Хуваарь" action={{ label: '+ Ээлж нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '20px 0' }}>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(52,152,219,0.1)', color: '#3498db' }}><Users size={20} /></div>
                            <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{shifts.length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт ээлж</div></div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(46,204,113,0.1)', color: '#2ecc71' }}><Clock size={20} /></div>
                            <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{shifts.filter(s => s.status === 'attended').length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ирсэн</div></div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(241,196,15,0.1)', color: '#f1c40f' }}><CalendarDays size={20} /></div>
                            <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{shifts.filter(s => s.status === 'scheduled').length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Хуваарилсан</div></div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }}><Clock size={20} /></div>
                            <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{shifts.reduce((sum, s) => sum + (s.hours || 0), 0)}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт цаг</div></div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : (
                        <table className="table">
                            <thead><tr><th>Ажилтан</th><th>Тушаал</th><th>Огноо</th><th>Ээлж</th><th>Цаг</th><th>Төлөв</th></tr></thead>
                            <tbody>
                                {shifts.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Ээлж олдсонгүй</td></tr>
                                ) : (
                                    shifts.map(s => (
                                        <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(s); setShowModal(true); }}>
                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserCircle size={18} /><span style={{ fontWeight: 600 }}>{s.employeeName}</span></div></td>
                                            <td style={{ color: 'var(--text-muted)' }}>{s.role || '-'}</td>
                                            <td>{s.date || '-'}</td>
                                            <td><span className="badge" style={{ background: `${(shiftTypeLabels[s.shiftType] || {}).color || '#999'}22`, color: (shiftTypeLabels[s.shiftType] || {}).color || '#999' }}>{(shiftTypeLabels[s.shiftType] || {}).label || s.shiftType}</span></td>
                                            <td style={{ fontWeight: 600 }}>{s.hours || 0}ц</td>
                                            <td><span className={`badge ${s.status === 'attended' ? 'badge-success' : s.status === 'missed' ? 'badge-danger' : 'badge-warning'}`}>{s.status === 'attended' ? 'Ирсэн' : s.status === 'missed' ? 'Ирээгүй' : 'Хуваарилсан'}</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <GenericCrudModal title="Ээлж" icon={<Clock size={20} />} collectionPath="businesses/{bizId}/shifts" fields={SHIFT_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />
            )}
        </HubLayout>
    );
}
