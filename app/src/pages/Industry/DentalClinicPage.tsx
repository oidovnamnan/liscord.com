import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Stethoscope, Calendar, Plus, Clock, User, CheckCircle2, Heart} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const F: CrudField[] = [
    { name: 'patient', label: 'Өвчтөн', type: 'text', required: true },
    {
        name: 'treatment', label: 'Эмчилгээ', type: 'select', required: true, options: [
            { value: 'checkup', label: 'Үзлэг' }, { value: 'cleaning', label: 'Цэвэрлэгээ' },
            { value: 'filling', label: 'Ломбо' }, { value: 'extraction', label: 'Шүд авалт' },
            { value: 'rootCanal', label: 'Сувгийн эмчилгээ' }, { value: 'implant', label: 'Имплант' },
        ]
    },
    { name: 'dentist', label: 'Эмч', type: 'text', required: true },
    { name: 'date', label: 'Огноо', type: 'date' },
    { name: 'time', label: 'Цаг', type: 'text' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'scheduled', options: [
            { value: 'scheduled', label: 'Товлосон' }, { value: 'in-progress', label: 'Явж буй' }, { value: 'completed', label: 'Дууссан' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function DentalClinicPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/dentalAppointments`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub">
            <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Heart size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Шүдний Эмнэлэг</h3>
                            <div className="fds-hero-desc">Шүдний эмнэлгийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        Шинэ цаг
                    </button>
                </div>
            </div>
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт цаг</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Calendar size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дууссан</h4><div className="text-3xl font-black text-success">{items.filter(i => i.status === 'completed').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хүлээж буй</h4><div className="text-3xl font-black text-warning">{items.filter(i => i.status === 'scheduled').length}</div></div><div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Clock size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th className="pl-6">Өвчтөн</th><th>Эмчилгээ</th><th>Эмч</th><th>Огноо/Цаг</th><th>Төлөв</th></tr></thead><tbody>
                            {items.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> :
                                items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}>
                                    <td className="pl-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><User size={16} /></div><span className="font-bold">{i.patient}</span></div></td>
                                    <td>{i.treatment}</td><td>{i.dentist}</td><td>{i.date} {i.time}</td>
                                    <td><span className={`badge badge-${i.status === 'completed' ? 'success' : i.status === 'in-progress' ? 'primary' : 'secondary'} text-[10px] font-black uppercase`}>{i.status === 'completed' ? 'ДУУССАН' : i.status === 'in-progress' ? 'ЯВЖ БУЙ' : 'ТОВЛОСОН'}</span></td>
                                </tr>)}
                        </tbody></table>)}
                </div>
                <button className="btn btn-primary h-14 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 max-w-xs mx-auto" onClick={() => { setEditingItem(null); setShowModal(true) }}><Plus size={20} /> Цаг нэмэх</button>
            </div>
            {showModal && <GenericCrudModal title="Шүдний цаг" icon={<Stethoscope size={20} />} collectionPath="businesses/{bizId}/dentalAppointments" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
