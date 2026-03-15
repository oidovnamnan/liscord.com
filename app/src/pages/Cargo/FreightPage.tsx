import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Ship,
    Search,
    Globe,
    Truck,
    ArrowRight,
    Zap,
    CheckCircle2,
    Database,
    Activity,
    Anchor,
    Plane,
    Box,
    Calendar,
    Share2,
    MoreVertical
} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const FREIGHT_FIELDS: CrudField[] = [
    { name: 'origin', label: 'Гарах газар', type: 'text', required: true },
    { name: 'destination', label: 'Хүрэх газар', type: 'text', required: true },
    {
        name: 'mode', label: 'Тээврийн хэлбэр', type: 'select', required: true, options: [
            { value: 'sea', label: '🚢 Усан зам' },
            { value: 'air', label: '✈️ Агаарын' },
            { value: 'road', label: '🚛 Авто' },
            { value: 'rail', label: '🚂 Төмөр зам' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'loading', options: [
            { value: 'loading', label: 'Ачиж буй' },
            { value: 'at-sea', label: 'Тээвэрт' },
            { value: 'arrived', label: 'Хүлээн авсан' },
            { value: 'cleared', label: 'Татвар төлсөн' },
        ]
    },
    { name: 'containerNum', label: 'Контейнер / AWB дугаар', type: 'text' },
    { name: 'eta', label: 'ETA огноо', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function FreightPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/freight`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setShipments(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="logistics-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Ship size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Тээвэрлэлт</h3>
                            <div className="fds-hero-desc">Тээвэрлэлтийн удирдлага</div>
                        </div>
                    </div>
                </div>
            </div>

                <div className="grid-12 gap-6 mt-6">
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт тээвэр</h4>
                                <div className="text-3xl font-black text-primary">{shipments.length}</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Globe size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Замд яваа</h4>
                                <div className="text-3xl font-black text-secondary">{shipments.filter(s => s.status === 'at-sea' || s.status === 'loading').length}</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Ship size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Ирсэн</h4>
                                <div className="text-3xl font-black text-success">{shipments.filter(s => s.status === 'arrived' || s.status === 'cleared').length}</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Freight Tracking</h4>
                                <div className="text-xl font-black">MULTI-HUB SYNC</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Контейнер номер, ачааны төрөл, ID хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Төрөл</button>
                    </div>

                    <div className="col-12 grid grid-cols-1 gap-4">
                        {loading ? (
                            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                        ) : shipments.length === 0 ? (
                            <div className="card" style={{ padding: 60, textAlign: 'center' }}><Ship size={48} color="var(--text-muted)" /><h3>Тээвэр олдсонгүй</h3></div>
                        ) : (
                            shipments.map(s => (
                                <div key={s.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1 group" style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(s); setShowModal(true); }}>
                                    <div className="flex flex-col md:flex-row items-stretch">
                                        <div className={`p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[140px] bg-surface-2 ${s.status === 'cleared' ? 'text-success' :
                                            s.status === 'at-sea' ? 'text-primary' :
                                                s.status === 'loading' ? 'text-warning' : 'text-secondary'
                                            }`}>
                                            <div className="h-14 w-14 rounded-3xl bg-surface-3 border-2 border-border-color/10 flex items-center justify-center font-black text-xl text-primary shadow-inner rotate-3 group-hover:rotate-0 transition-all">
                                                {s.mode === 'sea' ? <Anchor size={24} /> :
                                                    s.mode === 'air' ? <Plane size={24} /> :
                                                        s.mode === 'rail' ? <Ship size={24} /> : <Truck size={24} />}
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-widest mt-2">{s.mode || 'road'}</div>
                                        </div>

                                        <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-black">{s.origin}</h3>
                                                    <ArrowRight size={20} className="text-muted" />
                                                    <h3 className="text-xl font-black">{s.destination}</h3>
                                                </div>
                                                <div className="flex gap-4 text-[10px] font-black text-muted uppercase tracking-widest">
                                                    <span className="flex items-center gap-1 text-primary"><Box size={12} /> {s.containerNum || '-'}</span>
                                                    <span className="flex items-center gap-1"><Calendar size={12} /> {s.eta || '-'} ETA</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 w-full md:w-auto">
                                                <span className={`badge font-black text-[10px] px-6 py-2 uppercase tracking-widest badge-${s.status === 'cleared' ? 'success' :
                                                    s.status === 'at-sea' ? 'primary' :
                                                        s.status === 'loading' ? 'warning' : 'secondary'
                                                    }`}>
                                                    {s.status === 'cleared' ? 'ТАТВАР ТӨЛСӨН' :
                                                        s.status === 'at-sea' ? 'ТЭЭВЭРТ' :
                                                            s.status === 'loading' ? 'АЧИЖ БУЙ' : 'ХҮЛЭЭН АВСАН'}
                                                </span>
                                                <div className="h-10 w-px bg-border-color/10 mx-2" />
                                                <button className="btn btn-primary h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                    <MoreVertical size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Database size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Global AIS/Flight Tracking</h3>
                                <p className="text-sm text-muted">Олон улсын усан болон агаарын тээврийн байршлыг AIS/FlightRadar системээр бодит хугацаанд хянах.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">СИСТЕМ ХОЛБОХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && <GenericCrudModal title="Олон улсын тээвэр" icon={<Ship size={20} />} collectionPath="businesses/{bizId}/freight" fields={FREIGHT_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
