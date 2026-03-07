import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Settings, Globe, Shield, Users, Key, ChevronRight, Plus, CheckCircle2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const F: CrudField[] = [
    { name: 'settingName', label: 'Тохиргооны нэр', type: 'text', required: true },
    { name: 'settingValue', label: 'Утга', type: 'text', required: true },
    { name: 'category', label: 'Ангилал', type: 'select', options: [{ value: 'branding', label: 'Брэндийн мэдээлэл' }, { value: 'access', label: 'Нэвтрэх эрх' }, { value: 'features', label: 'Тохиргоо' }, { value: 'integrations', label: 'Холболт' }] },
    { name: 'isActive', label: 'Идэвхтэй', type: 'select', defaultValue: 'yes', options: [{ value: 'yes', label: 'Тийм' }, { value: 'no', label: 'Үгүй' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function CustomerPortalPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/customerPortalSettings`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line

    return (
        <HubLayout hubId="crm-hub">
            <Header title="Харилцагчийн портал" subtitle="Харилцагчдад зориулсан порталын тохиргоо, нэвтрэх эрх" action={{ label: 'Тохиргоо нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт тохиргоо</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary"><Settings size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй</h4><div className="text-3xl font-black text-success">{items.filter(i => i.isActive === 'yes').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success"><CheckCircle2 size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Холболт</h4><div className="text-3xl font-black text-info">{items.filter(i => i.category === 'integrations').length}</div></div><div className="bg-info/10 p-4 rounded-2xl text-info"><Globe size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Customer</h4><div className="text-xl font-black">PORTAL</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md"><Shield size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th className="pl-6">Тохиргоо</th><th>Утга</th><th>Ангилал</th><th>Идэвхтэй</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Тохиргоо олдсонгүй</td></tr> : items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}><td className="pl-6 py-4 font-bold">{i.settingName}</td><td>{i.settingValue}</td><td><span className="badge badge-outline text-[10px] font-black uppercase">{i.category}</span></td><td><span className={`badge badge-${i.isActive === 'yes' ? 'success' : 'danger'} text-[10px]`}>{i.isActive === 'yes' ? 'Тийм' : 'Үгүй'}</span></td></tr>)}</tbody></table>)}</div>
            </div>
            {showModal && <GenericCrudModal title="Порталын тохиргоо" icon={<Globe size={20} />} collectionPath="businesses/{bizId}/customerPortalSettings" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
