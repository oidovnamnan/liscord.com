import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Layout as LayoutIcon,
    Search,
    MapPin,
    ChevronRight,
    Database,
    Layers,
    Plus,
    Loader2,
    ArrowLeft,
    Box,
    ThermometerSnowflake,
    Trash2
} from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { warehouseService } from '../../services/db';
import type { Warehouse, WarehouseZone, Shelf } from '../../types';
import { toast } from 'react-hot-toast';

export function WarehouseManagementPage() {
    const { business } = useBusinessStore();
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
    const [zones, setZones] = useState<WarehouseZone[]>([]);
    const [shelves, setShelves] = useState<Shelf[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAddWarehouse, setShowAddWarehouse] = useState(false);
    const [showAddZone, setShowAddZone] = useState(false);
    const [showAddShelf, setShowAddShelf] = useState(false);

    useEffect(() => {
        if (!business?.id) return;
        setLoading(true);
        const unsub = warehouseService.subscribeWarehouses(business.id, (data) => {
            setWarehouses(data);
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    useEffect(() => {
        if (!business?.id || !selectedWarehouse) return;
        const u1 = warehouseService.subscribeZones(business.id, selectedWarehouse.id, setZones);
        const u2 = warehouseService.subscribeShelves(business.id, selectedWarehouse.id, setShelves);
        return () => { u1(); u2(); };
    }, [business?.id, selectedWarehouse]);

    if (!selectedWarehouse) {
        return (
            <HubLayout hubId="inventory-hub">
                <div className="page-container animate-fade-in">
                    <Header
                        title="Агуулахын Удирдлага"
                        subtitle="Танай бизнесийн нийт агуулах болон логистикийн цэгүүд"
                        action={{
                            label: "Агуулах нэмэх",
                            onClick: () => setShowAddWarehouse(true)
                        }}
                    />

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 text-muted">
                            <Loader2 className="animate-spin mb-4" size={40} />
                            <p className="font-bold">Агуулахууд ачаалж байна...</p>
                        </div>
                    ) : warehouses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-border-color rounded-3xl mt-6 text-center">
                            <Database size={64} className="text-muted mb-4 opacity-20" />
                            <h3 className="text-xl font-black mb-2">Агуулах бүртгэгдээгүй байна</h3>
                            <p className="text-muted max-w-sm font-bold mb-6">Бараа материалаа цэгцлэх, нөөцөө удирдахын тулд эхний агуулахаа үүсгэнэ үү.</p>
                            <button className="btn btn-primary px-8" onClick={() => setShowAddWarehouse(true)}>
                                <Plus size={18} /> Эхний агуулах нэмэх
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                            {warehouses.map(w => (
                                <div key={w.id} className="card p-6 cursor-pointer group hover:bg-surface-2 transition-all border-none shadow-sm flex flex-col gap-6" onClick={() => setSelectedWarehouse(w)}>
                                    <div className="flex justify-between items-start">
                                        <div className="bg-primary/10 p-3 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                                            <Database size={24} />
                                        </div>
                                        <span className="badge badge-success">Идэвхтэй</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black mb-1">{w.name}</h3>
                                        <div className="flex items-center gap-2 text-xs font-black text-muted uppercase tracking-widest">
                                            <MapPin size={12} /> {w.location || 'Байршил тогтоогоогүй'}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 border-t border-border-color/10 pt-4">
                                        <div className="flex-1">
                                            <div className="text-[10px] font-black text-muted uppercase tracking-tighter">Төрөл</div>
                                            <div className="text-sm font-bold">{w.type.toUpperCase()}</div>
                                        </div>
                                        <div className="flex-1 text-right">
                                            <button className="btn btn-ghost btn-sm group-hover:text-primary">
                                                Удирдах <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {showAddWarehouse && (
                    <AddWarehouseModal onClose={() => setShowAddWarehouse(false)} />
                )}
            </HubLayout>
        );
    }

    // Detail View: Selected Warehouse
    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                    <button className="btn btn-ghost btn-icon bg-surface-2 rounded-2xl" onClick={() => setSelectedWarehouse(null)}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black">{selectedWarehouse.name}</h2>
                        <p className="text-muted text-sm font-bold italic">{selectedWarehouse.location}</p>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Warehouse Stats Summary */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="card p-6 border-none shadow-sm flex flex-col gap-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted">Агуулахын Мэдээлэл</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-border-color/10">
                                    <span className="text-sm font-bold text-muted">Төрөл:</span>
                                    <span className="badge badge-info">{selectedWarehouse.type}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border-color/10">
                                    <span className="text-sm font-bold text-muted">Нийт бүс:</span>
                                    <span className="font-black">{zones.length}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm font-bold text-muted">Нийт тавиур:</span>
                                    <span className="font-black">{shelves.length}</span>
                                </div>
                            </div>
                            <button className="btn btn-danger btn-sm text-xs font-black mt-4 w-full" onClick={async () => {
                                if (confirm('Та энэ агуулахыг устгахад итгэлтэй байна уу?')) {
                                    if (business?.id) {
                                        await warehouseService.deleteWarehouse(business.id, selectedWarehouse.id);
                                        toast.success('Агуулах устгагдлаа');
                                        setSelectedWarehouse(null);
                                    }
                                }
                            }}>
                                <Trash2 size={14} /> Агуулах устгах
                            </button>
                        </div>

                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-lg relative overflow-hidden">
                            <Box size={80} className="absolute -bottom-6 -right-6 opacity-10" />
                            <h3 className="text-lg font-black mb-2 relative z-10">Түргэн хайлт</h3>
                            <p className="text-xs opacity-80 mb-4 font-bold relative z-10">Barcode эсвэл SKU ашиглан байршлыг шууд олох</p>
                            <div className="relative z-10">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                                <input className="input pl-10 border-none bg-white/20 text-white placeholder-white/60 h-10 w-full rounded-xl" placeholder="Дугаар оруулна уу..." />
                            </div>
                        </div>
                    </div>

                    {/* Zones & Shelves Management */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black">Агуулахын бүсүүд</h3>
                            <button className="btn btn-primary btn-sm rounded-xl font-black" onClick={() => setShowAddZone(true)}>
                                <Plus size={16} /> Бүс нэмэх
                            </button>
                        </div>

                        {zones.length === 0 ? (
                            <div className="card p-12 border-none shadow-sm flex flex-col items-center justify-center text-center">
                                <Layers size={48} className="text-muted opacity-20 mb-4" />
                                <p className="font-bold text-muted">Бүс нэмээгүй байна</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {zones.map(z => (
                                    <div key={z.id} className="card p-5 border-none shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-surface-2 rounded-xl flex items-center justify-center text-primary border border-border-color/5">
                                                    {z.type === 'cold' ? <ThermometerSnowflake size={20} /> : <LayoutIcon size={20} />}
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm">{z.name}</div>
                                                    <div className="text-[10px] text-muted font-bold uppercase">{z.type}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">
                                                {shelves.filter(s => s.zoneId === z.id).length} тавиур
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {shelves.filter(s => s.zoneId === z.id).map(s => (
                                                <div key={s.id} className="text-[10px] font-black bg-surface-3 px-2 py-1 rounded-md border border-border-color/10 hover:border-primary cursor-default" title={`Level: ${s.level}`}>
                                                    {s.locationCode}
                                                </div>
                                            ))}
                                            <button className="text-[10px] font-black text-primary hover:underline" onClick={() => setShowAddShelf(true)}>
                                                + Тавиур нэмэх
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showAddZone && (
                <AddZoneModal warehouseId={selectedWarehouse.id} onClose={() => setShowAddZone(false)} />
            )}
            {showAddShelf && (
                <AddShelfModal warehouseId={selectedWarehouse.id} zones={zones} onClose={() => setShowAddShelf(false)} />
            )}
        </HubLayout>
    );
}

function AddWarehouseModal({ onClose }: { onClose: () => void }) {
    const { business } = useBusinessStore();
    const [name, setName] = useState('');
    const [type, setType] = useState<Warehouse['type']>('main');
    const [location, setLocation] = useState('');
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!business?.id || !name) return;
        setSaving(true);
        try {
            await warehouseService.createWarehouse(business.id, {
                businessId: business.id,
                name,
                type,
                location
            });
            toast.success('Агуулах нэмэгдлээ');
            onClose();
        } catch (err) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    }

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="font-black">Шинэ агуулах</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-4">
                        <div className="input-group">
                            <label className="input-label">Нэр</label>
                            <input className="input" placeholder="Жишээ: Төв агуулах" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Төрөл</label>
                            <select className="input select" value={type} onChange={e => setType(e.target.value as Warehouse['type'])}>
                                <option value="main">Төв агуулах</option>
                                <option value="secondary">Туслах агуулах</option>
                                <option value="retail">Дэлгүүр / POS</option>
                                <option value="dark_store">Dark Store</option>
                                <option value="transit">Транзит / Гаага</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Хаяг / Байршил</label>
                            <input className="input" placeholder="Жишээ: БЗД, 1-р хороо..." value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader2 className="animate-spin" size={16} /> : 'Үүсгэх'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

function AddZoneModal({ warehouseId, onClose }: { warehouseId: string; onClose: () => void }) {
    const { business } = useBusinessStore();
    const [name, setName] = useState('');
    const [type, setType] = useState<WarehouseZone['type']>('racking');
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!business?.id || !name) return;
        setSaving(true);
        try {
            await warehouseService.createZone(business.id, warehouseId, { name, type });
            toast.success('Бүс нэмэгдлээ');
            onClose();
        } catch (err) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    }

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="font-black">Шинэ бүс (Zone)</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-4">
                        <div className="input-group">
                            <label className="input-label">Бүсийн нэр</label>
                            <input className="input" placeholder="Жишээ: А хэсэг, Хөргүүр 1" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Төрөл</label>
                            <select className="input select" value={type} onChange={e => setType(e.target.value as WarehouseZone['type'])}>
                                <option value="racking">Тавиур (Racking)</option>
                                <option value="pallet">Палет (Pallet)</option>
                                <option value="cold">Хүйтэн хадгалалт</option>
                                <option value="dry">Хуурай агуулах</option>
                                <option value="bin">Хайрцаг / Bin</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>Хадгалах</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

function AddShelfModal({ warehouseId, zones, onClose }: { warehouseId: string; zones: WarehouseZone[]; onClose: () => void }) {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const [zoneId, setZoneId] = useState(zones[0]?.id || '');
    const [code, setCode] = useState('');
    const [level, setLevel] = useState('1');
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!business?.id || !code) return;
        setSaving(true);
        try {
            await warehouseService.createShelf(business.id, warehouseId, {
                zoneId,
                locationCode: code,
                level,
                isFull: false,
                createdBy: user?.displayName || 'System'
            });
            toast.success('Тавиур нэмэгдлээ');
            onClose();
        } catch (err) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    }

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="font-black">Тавиур / Хаяг нэмэх</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-4">
                        <div className="input-group">
                            <label className="input-label">Бүс</label>
                            <select className="input select" value={zoneId} onChange={e => setZoneId(e.target.value)} required>
                                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Байршлын код</label>
                            <input className="input" placeholder="Жишээ: A-101, B-04" value={code} onChange={e => setCode(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Түвшин (Level)</label>
                            <input className="input" placeholder="1, 2, 3..." value={level} onChange={e => setLevel(e.target.value)} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>Хадгалах</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
