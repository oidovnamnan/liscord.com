import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Users, Clock, Table as TableIcon, Plus, DollarSign, Split, Printer, ChefHat } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const TABLE_FIELDS: CrudField[] = [
    { name: 'name', label: 'Ширээний нэр', type: 'text', required: true },
    { name: 'capacity', label: 'Суудлын тоо', type: 'number', required: true },
    {
        name: 'section', label: 'Бүс', type: 'select', defaultValue: 'Main', options: [
            { value: 'Main', label: 'Танхим' }, { value: 'VIP', label: 'VIP Өрөө' }, { value: 'Bar', label: 'Баар' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'empty', options: [
            { value: 'empty', label: 'Сул' }, { value: 'occupied', label: 'Суусан' }, { value: 'reserved', label: 'Захиалгатай' }, { value: 'dirty', label: 'Цэвэрлэх' },
        ]
    },
    { name: 'guests', label: 'Зочдын тоо', type: 'number' },
    { name: 'total', label: 'Нийт дүн', type: 'text' },
];

export function RestaurantPOSPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/restaurantTables`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setTables(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); // eslint-disable-line @typescript-eslint/no-explicit-any
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="industry-hub">
            <Header title="Рестораны ПОС" subtitle="Ширээ удирдах, захиалга авах, тооцоо бодох" />
            <div className="page-content mt-6 h-full">
                <div className="flex flex-col gap-8 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                            <button className="btn btn-primary rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Бүгд</button>
                            <button className="btn btn-outline rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Танхим</button>
                            <button className="btn btn-outline rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">VIP Өрөө</button>
                            <button className="btn btn-outline rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Баар</button>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success"></div><span className="text-[10px] font-black uppercase text-muted tracking-tighter">Сул</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div><span className="text-[10px] font-black uppercase text-muted tracking-tighter">Суусан</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-warning"></div><span className="text-[10px] font-black uppercase text-muted tracking-tighter">Захиалгатай</span></div>
                        </div>
                    </div>

                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {tables.length === 0 ? <div className="col-span-6 text-center py-12 text-muted">Ширээ бүртгэгдээгүй</div> :
                                tables.map(t => (
                                    <div key={t.id} onClick={() => { setEditingItem(t); setShowModal(true); }}
                                        className={`card p-6 border-2 transition-all cursor-pointer hover:scale-105 active:scale-95 flex flex-col items-center gap-4 relative overflow-hidden group
                                            ${t.status === 'occupied' ? 'border-primary bg-primary/5' :
                                                t.status === 'reserved' ? 'border-warning bg-warning/5' :
                                                    t.status === 'dirty' ? 'border-gray-300 bg-gray-50' : 'border-black/5 bg-white'}`}>
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform
                                            ${t.status === 'occupied' ? 'bg-primary text-white' :
                                                t.status === 'reserved' ? 'bg-warning text-white' :
                                                    t.status === 'dirty' ? 'bg-gray-400 text-white' : 'bg-surface-2 text-muted'}`}>
                                            <TableIcon size={32} />
                                        </div>
                                        <div className="text-center relative z-10">
                                            <h4 className="m-0 font-black text-gray-900 tracking-tight">{t.name}</h4>
                                            <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                                                <Users size={12} /> {t.guests || 0}/{t.capacity || 0}
                                            </div>
                                        </div>
                                        {t.status === 'occupied' && <div className="w-full mt-2 pt-2 border-t border-black/5 text-center"><span className="font-black text-primary tracking-tighter text-sm">{t.total}</span></div>}
                                        {t.status === 'dirty' && <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center"><span className="badge badge-accent font-black uppercase text-[10px] px-3 py-1">Цэвэрлэх</span></div>}
                                    </div>
                                ))}
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-4 mt-4">
                        <button className="btn btn-primary btn-lg h-16 rounded-3xl shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em]" onClick={() => { setEditingItem(null); setShowModal(true); }}>
                            <Plus size={24} strokeWidth={3} /> Ширээ нэмэх
                        </button>
                        <button className="btn btn-outline h-16 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]"><DollarSign size={16} /> Төлбөр</button>
                        <button className="btn btn-outline h-16 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]"><Split size={16} /> Хуваах</button>
                        <button className="btn btn-outline h-16 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]"><Printer size={16} /> Билл</button>
                    </div>

                    <button className="btn btn-accent h-20 rounded-2xl w-full max-w-xs mx-auto flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-accent/20">
                        <ChefHat size={20} /> Гал тогоо руу илгээх
                    </button>
                </div>
            </div>
            {showModal && <GenericCrudModal title="Ширээ" icon={<TableIcon size={20} />} collectionPath="businesses/{bizId}/restaurantTables" fields={TABLE_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
