import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Plus, MoreVertical, Trash2, Loader2, Zap } from 'lucide-react';
import { cargoService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { type CargoType } from '../../../types';

const DEFAULT_CARGO_TYPES = [
    { name: 'Жижиг бараа', fee: 3000, unit: 'ш' },
    { name: 'Жижгэвтэр бараа', fee: 5000, unit: 'ш' },
    { name: 'Дунд бараа', fee: 7500, unit: 'ш' },
    { name: 'Томовтор бараа', fee: 10000, unit: 'ш' },
    { name: 'Том бараа', fee: 15000, unit: 'ш' },
    { name: 'Их том бараа', fee: 50000, unit: 'ш' },
    { name: 'Алкоголь (1л)', fee: 9000, unit: 'л' },
];

export function CargoSettings({ bizId }: { bizId: string }) {
    const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState<CargoType | null>(null);

    useEffect(() => {
        if (!bizId) return;
        const unsubscribe = cargoService.subscribeCargoTypes(bizId, setCargoTypes);
        return () => unsubscribe();
    }, [bizId]);

    const handleDelete = async (id: string) => {
        if (!confirm('Энэ каргоны төрлийг устгах уу?')) return;
        try {
            await cargoService.updateCargoType(bizId, id, { isDeleted: true });
            toast.success('Устгагдлаа');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); }
    };

    return (
        <div className="settings-section animate-fade-in">
            <h2>Карго холболт</h2>
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon"><Globe size={20} /></div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0 }}>Каргоны төрлүүд</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Захиалга үүсгэх үед ашиглагдах каргоны үнийн тохиргоо.</p>
                    </div>
                    <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingType(null); setShowModal(true); }}>
                        <Plus size={14} /> Төрөл нэмэх
                    </button>
                </div>

                <div className="cargo-types-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
                    {cargoTypes.map(type => {
                        const sortedTiers = (type.pricingTiers || []).sort((a, b) => a.minQty - b.minQty);
                        return (
                        <div key={type.id} className="card cargo-type-card" style={{ padding: '16px 20px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{type.name}</div>
                                    <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.25rem' }}>
                                        ₮{type.fee.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {type.unit}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingType(type); setShowModal(true); }}>
                                        <MoreVertical size={14} />
                                    </button>
                                    <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete(type.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            {sortedTiers.length > 0 && (
                                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>📊 Шатлалт үнэ</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.05)', fontSize: '0.78rem' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--primary)', minWidth: 60 }}>1–{sortedTiers[0].minQty - 1} {type.unit}</span>
                                        <span style={{ fontWeight: 700 }}>₮{type.fee.toLocaleString()}</span>
                                    </div>
                                    {sortedTiers.map((tier, i) => {
                                        const nextTier = sortedTiers[i + 1];
                                        const rangeLabel = nextTier
                                            ? `${tier.minQty}–${nextTier.minQty - 1} ${type.unit}`
                                            : `${tier.minQty}+ ${type.unit}`;
                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.05)', fontSize: '0.78rem' }}>
                                                <span style={{ fontWeight: 600, color: '#10b981', minWidth: 60 }}>{rangeLabel}</span>
                                                <span style={{ fontWeight: 700 }}>₮{tier.fee.toLocaleString()}</span>
                                                {tier.fee < type.fee && (
                                                    <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600, marginLeft: 'auto' }}>
                                                        −{Math.round(((type.fee - tier.fee) / type.fee) * 100)}%
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );})}
                    {cargoTypes.length === 0 && (
                        <div className="empty-state-mini" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: 'var(--bg-soft)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                            <Globe size={32} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.5 }} />
                            <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Каргоны төрөл бүртгэгдээгүй байна</div>
                            <button
                                className="btn btn-primary btn-sm gradient-btn"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                onClick={async () => {
                                    try {
                                        for (const ct of DEFAULT_CARGO_TYPES) {
                                            await cargoService.createCargoType(bizId, ct);
                                        }
                                        toast.success(`${DEFAULT_CARGO_TYPES.length} каргоны төрөл нэмэгдлээ`);
                                    } catch { toast.error('Алдаа гарлаа'); }
                                }}
                            >
                                <Zap size={14} /> Стандарт төлбөрүүд нэмэх
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <CargoTypeModal
                    bizId={bizId}
                    onClose={() => setShowModal(false)}
                    editingType={editingType}
                />
            )}
        </div>
    );
}

function CargoTypeModal({ bizId, onClose, editingType }: { bizId: string; onClose: () => void; editingType: CargoType | null }) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(editingType?.name || '');
    const [fee, setFee] = useState(editingType?.fee?.toString() || '');
    const [unit, setUnit] = useState(editingType?.unit || 'ш');
    const [tiers, setTiers] = useState<{ minQty: number; fee: number }[]>(
        editingType?.pricingTiers || []
    );

    const addTier = () => {
        const lastMin = tiers.length > 0 ? Math.max(...tiers.map(t => t.minQty)) : 1;
        setTiers([...tiers, { minQty: lastMin + 5, fee: Number(fee) || 0 }]);
    };

    const updateTier = (idx: number, field: 'minQty' | 'fee', value: number) => {
        setTiers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
    };

    const removeTier = (idx: number) => {
        setTiers(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);
        const data = {
            name,
            fee: Number(fee),
            unit,
            pricingTiers: sortedTiers.length > 0 ? sortedTiers : [],
        };

        setLoading(true);
        try {
            if (editingType) {
                await cargoService.updateCargoType(bizId, editingType.id, data);
            } else {
                await cargoService.createCargoType(bizId, data);
            }
            toast.success('Амжилттай');
            onClose();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                <div className="modal-header">
                    <h2>{editingType ? 'Төрөл засах' : 'Шинэ каргоны төрөл'}</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Төрлийн нэр</label>
                            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Жишээ: Жижиг бараа" required autoFocus />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Суурь төлбөр (₮)</label>
                                <input className="input" type="number" value={fee} onChange={e => setFee(e.target.value)} placeholder="2000" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Хэмжих нэгж</label>
                                <select className="input select" value={unit} onChange={e => setUnit(e.target.value)}>
                                    <option value="ш">ш (ширхэг)</option>
                                    <option value="кг">кг (килограмм)</option>
                                    <option value="л">л (литр)</option>
                                    <option value="м3">м3 (куб метр)</option>
                                </select>
                            </div>
                        </div>

                        {/* Pricing Tiers */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>📊 Тоо хэмжээний шатлал</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Олон авахад хямдрах тохиргоо</div>
                                </div>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={addTier} style={{ gap: 4, fontSize: '0.8rem' }}>
                                    <Plus size={14} /> Шатлал
                                </button>
                            </div>

                            {tiers.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {/* Base tier info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', minWidth: 80 }}>1 ~ {tiers.length > 0 ? tiers.sort((a, b) => a.minQty - b.minQty)[0].minQty - 1 : '∞'} {unit}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>₮{Number(fee).toLocaleString()}</span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(суурь үнэ)</span>
                                    </div>

                                    {/* Additional tiers */}
                                    {tiers.sort((a, b) => a.minQty - b.minQty).map((tier, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                className="input"
                                                type="number"
                                                min={2}
                                                value={tier.minQty}
                                                onChange={e => updateTier(idx, 'minQty', Number(e.target.value))}
                                                style={{ width: 70, height: 36, textAlign: 'center', fontSize: '0.85rem' }}
                                            />
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>+ {unit} →</span>
                                            <input
                                                className="input"
                                                type="number"
                                                value={tier.fee}
                                                onChange={e => updateTier(idx, 'fee', Number(e.target.value))}
                                                style={{ flex: 1, height: 36, fontSize: '0.85rem' }}
                                                placeholder="Төлбөр"
                                            />
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₮</span>
                                            <button type="button" className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => removeTier(idx)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {tiers.length === 0 && (
                                <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-soft)', borderRadius: 10 }}>
                                    Тоо хэмжээнээс үл хамааран суурь үнээр тооцогдоно
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Хадгалах'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
