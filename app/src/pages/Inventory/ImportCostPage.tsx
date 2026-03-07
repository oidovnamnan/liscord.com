import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Calculator,
    Search,
    Zap,
    ArrowRight,
    Globe,
    Truck,
    RefreshCw,
    Download,
    Activity,
    Landmark,
    ClipboardList,
    TrendingUp
} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const IMPORT_COST_FIELDS: CrudField[] = [
    { name: 'product', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'fobPrice', label: 'FOB Үнэ (USD)', type: 'number', required: true },
    { name: 'shipping', label: 'Тээвэр & Логистик (USD)', type: 'number' },
    { name: 'duty', label: 'Татвар & Гааль (USD)', type: 'number' },
    { name: 'totalCost', label: 'Нийт өртөг (USD)', type: 'number' },
    { name: 'margin', label: 'Ашиг %', type: 'number' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'draft', options: [
            { value: 'draft', label: 'Ноорог' },
            { value: 'calculated', label: 'Тооцож дууссан' },
            { value: 'approved', label: 'Баталгаажсан' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function ImportCostPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [costs, setCosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/importCosts`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setCosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Өртөг Тооцоолол (Landed Cost)"
                    subtitle="Импортын барааны анхны үнэ, тээвэр, татвар болон бусад зардлыг нэгтгэсэн бодит өртөг тооцоолох"
                    action={{
                        label: "Шинэ тооцоолол",
                        onClick: () => { setEditingItem(null); setShowModal(true); }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт тооцоолол</h4>
                                <div className="text-3xl font-black text-primary">{costs.length}</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Calculator size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Баталгаажсан</h4>
                                <div className="text-3xl font-black text-secondary">{costs.filter(c => c.status === 'approved').length}</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Globe size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж ашиг</h4>
                                <div className="text-3xl font-black text-warning">{costs.length > 0 ? Math.round(costs.reduce((s, c) => s + (c.margin || 0), 0) / costs.length) : 0}%</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">AI COGS</h4>
                                <div className="text-xl font-black">AUTO-LANDED ON</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Бүтээгдэхүүн, тооцооллын ID хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Сүүлийнх</button>
                    </div>

                    <div className="col-12 card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                        {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="pl-6 py-4">Бүтээгдэхүүн</th>
                                        <th>FOB Үнэ (USD)</th>
                                        <th>Тээвэр & Логистик</th>
                                        <th>Татвар & Гааль</th>
                                        <th>Нийт өртөг</th>
                                        <th>Ашиг %</th>
                                        <th>Төлөв</th>
                                        <th className="pr-6 text-right">Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {costs.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Тооцоолол олдсонгүй</td></tr> :
                                        costs.map(cost => (
                                            <tr key={cost.id} className="hover:bg-surface-2 transition-all group" style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(cost); setShowModal(true); }}>
                                                <td className="pl-6 py-5">
                                                    <div className="flex flex-col">
                                                        <div className="font-bold text-sm tracking-tight">{cost.product}</div>
                                                        <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">{cost.id.substring(0, 8)}</div>
                                                    </div>
                                                </td>
                                                <td><div className="text-sm font-black text-muted">${(cost.fobPrice || 0).toLocaleString()}</div></td>
                                                <td>
                                                    <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest">
                                                        <Truck size={12} className="text-primary" /> ${(cost.shipping || 0).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-1 text-[10px] font-black text-warning uppercase tracking-widest">
                                                        <Landmark size={12} className="text-warning" /> ${(cost.duty || 0).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td><div className="text-sm font-black text-primary-dark tracking-tighter">${(cost.totalCost || 0).toLocaleString()}</div></td>
                                                <td><div className="badge badge-outline text-[10px] font-black text-success border-success/20">+{cost.margin || 0}%</div></td>
                                                <td>
                                                    <span className={`badge font-black text-[10px] px-3 py-1 uppercase tracking-widest badge-${cost.status === 'approved' ? 'success' :
                                                        cost.status === 'calculated' ? 'primary' : 'secondary'
                                                        }`}>
                                                        {cost.status === 'approved' ? 'БАТАЛГААЖСАН' :
                                                            cost.status === 'calculated' ? 'ТООЦОЖ ДУУССАН' : 'НООРОГ'}
                                                    </span>
                                                </td>
                                                <td className="pr-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button className="btn btn-ghost p-2 rounded-xl group-hover:text-primary transition-colors"><Download size={18} /></button>
                                                        <button className="btn btn-primary p-2 h-10 w-10 rounded-xl shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
                                                            <ArrowRight size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><ClipboardList size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Гаалийн тарифын тохиргоо (HS Codes)</h3>
                                <p className="text-sm text-muted">Барааны HS кодыг ашиглан гааль, НӨАТ болон бусад татварыг автоматаар тохируулах.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ТАРИФ ТОХИРУУЛАХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><RefreshCw size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && <GenericCrudModal title="Өртөг тооцоолол" icon={<Calculator size={20} />} collectionPath="businesses/{bizId}/importCosts" fields={IMPORT_COST_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
