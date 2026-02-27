import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Plus, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { cargoService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { type CargoType } from '../../../types';

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
        } catch (e) { toast.error('Алдаа гарлаа'); }
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
                    {cargoTypes.map(type => (
                        <div key={type.id} className="card cargo-type-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '16px 20px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
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
                    ))}
                    {cargoTypes.length === 0 && (
                        <div className="empty-state-mini" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: 'var(--bg-soft)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                            <Globe size={32} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.5 }} />
                            <div style={{ color: 'var(--text-muted)' }}>Каргоны төрөл бүртгэгдээгүй байна</div>
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data = {
            name: fd.get('name') as string,
            fee: Number(fd.get('fee')),
            unit: fd.get('unit') as string,
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
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <div className="modal-header">
                    <h2>{editingType ? 'Төрөл засах' : 'Шинэ каргоны төрөл'}</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Төрлийн нэр</label>
                            <input className="input" name="name" defaultValue={editingType?.name} placeholder="Жишээ: Жижиг бараа" required autoFocus />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Төлбөр (₮)</label>
                                <input className="input" name="fee" type="number" defaultValue={editingType?.fee} placeholder="2000" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Хэмжих нэгж</label>
                                <select className="input select" name="unit" defaultValue={editingType?.unit || 'ш'}>
                                    <option value="ш">ш (ширхэг)</option>
                                    <option value="кг">кг (килограмм)</option>
                                    <option value="л">л (литр)</option>
                                    <option value="м3">м3 (куб метр)</option>
                                </select>
                            </div>
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
