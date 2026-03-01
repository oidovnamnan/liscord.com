import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    Trash2,
    Store,
    Truck
} from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { warehouseService } from '../../services/db';
import type { Warehouse, WarehouseZone, Shelf } from '../../types';
import { toast } from 'react-hot-toast';
import './WarehouseManagementPage.css';

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

    const getWarehouseIcon = (type: string) => {
        switch (type) {
            case 'retail': return <Store size={24} />;
            case 'transit': return <Truck size={24} />;
            default: return <Database size={24} />;
        }
    };

    if (!selectedWarehouse) {
        return (
            <HubLayout hubId="inventory-hub">
                <div className="wms-page">
                    <div className="page-section-header">
                        <div>
                            <h2 className="page-section-title">Агуулахын Удирдлага</h2>
                            <p className="page-section-subtitle">Танай бизнесийн нийт агуулах болон логистикийн цэгүүд</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddWarehouse(true)}>
                            <Plus size={16} /> Агуулах нэмэх
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 text-muted">
                            <Loader2 className="animate-spin mb-4" size={40} />
                            <p className="font-bold">Агуулахууд ачаалж байна...</p>
                        </div>
                    ) : warehouses.length === 0 ? (
                        <div className="wms-empty-state">
                            <div className="wms-empty-icon">
                                <Database size={40} />
                            </div>
                            <h3 className="wms-empty-title">Агуулах бүртгэгдээгүй байна</h3>
                            <p className="wms-empty-desc">Бараа материалаа цэгцлэх, нөөцөө удирдахын тулд эхний агуулахаа үүсгэнэ үү.</p>
                            <button className="btn btn-primary" onClick={() => setShowAddWarehouse(true)}>
                                <Plus size={18} /> Эхний агуулах нэмэх
                            </button>
                        </div>
                    ) : (
                        <div className="wms-grid mt-6">
                            {warehouses.map(w => (
                                <div key={w.id} className="wms-card" onClick={() => setSelectedWarehouse(w)}>
                                    <div className="wms-card-header">
                                        <div className={`wms-card-icon ${w.type}`}>
                                            {getWarehouseIcon(w.type)}
                                        </div>
                                        <span className="badge badge-success" style={{ fontWeight: 800 }}>Идэвхтэй</span>
                                    </div>
                                    <div>
                                        <h3 className="wms-card-title">{w.name}</h3>
                                        <div className="wms-card-location">
                                            <MapPin size={12} /> {w.location || 'Байршил тогтоогоогүй'}
                                        </div>
                                    </div>
                                    <div className="wms-card-footer">
                                        <div>
                                            <div className="wms-card-type-label">Төрөл</div>
                                            <div className="wms-card-type-value">{w.type.toUpperCase()}</div>
                                        </div>
                                        <div className="wms-card-action">
                                            Удирдах <ChevronRight size={16} />
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
            <div className="wms-page">
                <div className="wms-detail-header">
                    <button className="wms-back-btn" onClick={() => setSelectedWarehouse(null)}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="wms-detail-title">{selectedWarehouse.name}</h2>
                        <p className="wms-detail-subtitle">{selectedWarehouse.location || 'Байршил тогтоогоогүй'}</p>
                    </div>
                </div>

                <div className="wms-detail-layout">
                    {/* Warehouse Stats Summary (Sidebar) */}
                    <div className="wms-sidebar">
                        <div className="wms-summary-card">
                            <h4 className="wms-summary-header">Агуулахын Мэдээлэл</h4>
                            <div className="wms-summary-item">
                                <span className="wms-summary-label">Төрөл:</span>
                                <span className="badge badge-info font-bold">{selectedWarehouse.type}</span>
                            </div>
                            <div className="wms-summary-item">
                                <span className="wms-summary-label">Нийт бүс (Zone):</span>
                                <span className="wms-summary-value">{zones.length}</span>
                            </div>
                            <div className="wms-summary-item">
                                <span className="wms-summary-label">Нийт тавиур:</span>
                                <span className="wms-summary-value">{shelves.length}</span>
                            </div>

                            <button className="btn btn-danger btn-sm font-bold w-full mt-6" onClick={async () => {
                                if (confirm('Та энэ агуулахыг устгахад итгэлтэй байна уу?')) {
                                    if (business?.id) {
                                        await warehouseService.deleteWarehouse(business.id, selectedWarehouse.id);
                                        toast.success('Агуулах устгагдлаа');
                                        setSelectedWarehouse(null);
                                    }
                                }
                            }}>
                                <Trash2 size={16} /> Агуулах устгах
                            </button>
                        </div>

                        <div className="wms-quicksearch-card">
                            <Box size={140} className="wms-quicksearch-bg-icon" />
                            <h3 className="wms-quicksearch-title">Түргэн хайлт</h3>
                            <p className="wms-quicksearch-desc">Баркод эсвэл SKU ашиглан барааны байршлыг шууд хайж олох боломжтой.</p>
                            <div className="wms-quicksearch-input-wrap">
                                <Search size={18} className="wms-quicksearch-icon" />
                                <input className="wms-quicksearch-input" placeholder="Дугаар оруулна уу..." />
                            </div>
                        </div>
                    </div>

                    {/* Zones & Shelves Management (Main Content) */}
                    <div className="wms-main-content">
                        <div className="wms-section-header">
                            <h3 className="wms-section-title">Агуулахын бүсүүд</h3>
                            <button className="btn btn-primary btn-sm rounded-xl font-bold" onClick={() => setShowAddZone(true)}>
                                <Plus size={16} /> Бүс нэмэх
                            </button>
                        </div>

                        {zones.length === 0 ? (
                            <div className="wms-zone-empty">
                                <Layers size={48} className="wms-zone-empty-icon" />
                                <p className="font-bold text-muted text-lg">Бүс нэмээгүй байна</p>
                                <p className="text-sm text-muted mt-2 opacity-70">Агуулахыг бүсчилснээр бараагаа хялбар олох боломжтой болно.</p>
                            </div>
                        ) : (
                            <div className="wms-zones-grid">
                                {zones.map(z => (
                                    <div key={z.id} className="wms-zone-card">
                                        <div className="wms-zone-header">
                                            <div className="wms-zone-info">
                                                <div className={`wms-zone-icon ${z.type === 'cold' ? 'cold' : ''}`}>
                                                    {z.type === 'cold' ? <ThermometerSnowflake size={20} /> : <LayoutIcon size={20} />}
                                                </div>
                                                <div>
                                                    <div className="wms-zone-name">{z.name}</div>
                                                    <div className="wms-zone-type">{z.type}</div>
                                                </div>
                                            </div>
                                            <div className="wms-zone-count">
                                                {shelves.filter(s => s.zoneId === z.id).length} тавиур
                                            </div>
                                        </div>

                                        <div className="wms-shelves-list">
                                            {shelves.filter(s => s.zoneId === z.id).map(s => (
                                                <div key={s.id} className="wms-shelf-badge" title={`Түвшин: ${s.level}`}>
                                                    <span>{s.locationCode}</span>
                                                </div>
                                            ))}
                                            <button className="wms-add-shelf-btn" onClick={() => setShowAddShelf(true)}>
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

    const [creationMode, setCreationMode] = useState<'single' | 'bulk'>('single');
    const [zoneId, setZoneId] = useState(zones[0]?.id || '');
    const [level, setLevel] = useState('1');
    const [saving, setSaving] = useState(false);

    // Single mode
    const [code, setCode] = useState('');

    // Bulk mode
    const [prefix, setPrefix] = useState('A');
    const [startNum, setStartNum] = useState(1);
    const [endNum, setEndNum] = useState(15);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!business?.id) return;
        setSaving(true);
        try {
            if (creationMode === 'single') {
                if (!code) throw new Error('Байршлын код оруулна уу');
                await warehouseService.createShelf(business.id, warehouseId, {
                    zoneId,
                    locationCode: code,
                    level,
                    isFull: false,
                    createdBy: user?.displayName || 'System'
                });
            } else {
                if (startNum > endNum) throw new Error('Эхлэх дугаар дуусах дугаараас бага байх ёстой');
                const batchPromises = [];
                for (let i = startNum; i <= endNum; i++) {
                    const shelfCode = `${prefix}${i}`;
                    batchPromises.push(warehouseService.createShelf(business.id, warehouseId, {
                        zoneId,
                        locationCode: shelfCode,
                        level,
                        isFull: false,
                        createdBy: user?.displayName || 'System'
                    }));
                }
                await Promise.all(batchPromises);
            }
            toast.success(creationMode === 'single' ? 'Тавиур нэмэгдлээ' : 'Тавиурууд амжилттай нэмэгдлээ');
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    }

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="font-black">Тавиур нэмэх</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body space-y-4">
                        <div className="flex p-1 mb-2 border rounded-xl" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-color)' }}>
                            <button
                                type="button"
                                className={`flex-1 text-sm px-4 py-2 rounded-lg transition-all ${creationMode === 'single' ? 'bg-primary text-white font-bold shadow' : 'text-muted font-medium opacity-80'}`}
                                onClick={() => setCreationMode('single')}
                            >
                                Нэгээр (Single)
                            </button>
                            <button
                                type="button"
                                className={`flex-1 text-sm px-4 py-2 rounded-lg transition-all ${creationMode === 'bulk' ? 'bg-primary text-white font-bold shadow' : 'text-muted font-medium opacity-80'}`}
                                onClick={() => setCreationMode('bulk')}
                            >
                                Олноор (Bulk)
                            </button>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Бүс</label>
                            <select className="input select" value={zoneId} onChange={e => setZoneId(e.target.value)} required>
                                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                            </select>
                        </div>

                        {creationMode === 'single' ? (
                            <div className="input-group">
                                <label className="input-label">Байршлын код</label>
                                <input className="input" placeholder="Жишээ: A-101, B-04" value={code} onChange={e => setCode(e.target.value)} required={creationMode === 'single'} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="input-group col-span-3">
                                    <label className="input-label">Угтвар үсэг (Prefix)</label>
                                    <input className="input" placeholder="Жишээ: A эсвэл B-" value={prefix} onChange={e => setPrefix(e.target.value)} required={creationMode === 'bulk'} />
                                </div>
                                <div className="input-group col-span-1">
                                    <label className="input-label">Эхлэхээс (From)</label>
                                    <input type="number" className="input" value={startNum} onChange={e => setStartNum(parseInt(e.target.value))} required={creationMode === 'bulk'} min="1" />
                                </div>
                                <div className="input-group col-span-1 flex items-center justify-center pt-8">
                                    <span className="text-muted font-bold">—</span>
                                </div>
                                <div className="input-group col-span-1">
                                    <label className="input-label">Хүртэл (To)</label>
                                    <input type="number" className="input" value={endNum} onChange={e => setEndNum(parseInt(e.target.value))} required={creationMode === 'bulk'} min="1" />
                                </div>
                                <div className="col-span-3 text-xs text-muted opacity-80 mt-1">
                                    Нийт <strong>{Math.max(0, endNum - startNum + 1)}</strong> тавиур үүснэ. (Жишээ: {prefix}{startNum}, {prefix}{startNum + 1} ...)
                                </div>
                            </div>
                        )}

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
