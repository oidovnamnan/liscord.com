import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ListOrdered, Plus, ChevronUp, ChevronDown, MoreVertical, Trash2, X, Loader2 } from 'lucide-react';
import { orderStatusService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { type OrderStatusConfig } from '../../../types';

export function StatusesTab({ bizId }: { bizId: string }) {
    const [statuses, setStatuses] = useState<OrderStatusConfig[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingStatus, setEditingStatus] = useState<OrderStatusConfig | null>(null);

    useEffect(() => {
        if (!bizId) return;
        return orderStatusService.subscribeStatuses(bizId, (data) => {
            // Sort by order
            setStatuses(data.sort((a, b) => a.order - b.order));
        });
    }, [bizId]);

    const handleDelete = async (id: string, isSystem: boolean) => {
        if (isSystem) return toast.error('Системийн төлөвийг устгах боломжгүй');
        if (!confirm('Энэ төлөвийг устгах уу?')) return;
        try {
            await orderStatusService.deleteStatus(bizId, id);
            toast.success('Устгагдлаа');
        } catch (e) { toast.error('Алдаа гарлаа'); }
    };

    const [moving, setMoving] = useState(false);

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (moving) return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= statuses.length) return;

        setMoving(true);
        const newStatuses = [...statuses];
        [newStatuses[index], newStatuses[newIndex]] = [newStatuses[newIndex], newStatuses[index]];

        try {
            // Update all to ensure sequential unique orders to avoid unstable sorting in DB
            await Promise.all(newStatuses.map((s, idx) =>
                orderStatusService.updateStatus(bizId, s.id, { order: idx })
            ));
        } catch (e) {
            toast.error('Дараалал солиход алдаа гарлаа');
        } finally {
            setMoving(false);
        }
    };

    return (
        <div className="settings-section animate-fade-in" style={{ padding: '0 var(--space-xs)' }}>
            <div className="section-header-compact" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="icon-badge"><ListOrdered size={18} /></div>
                    <div>
                        <h3 style={{ margin: 0 }}>Захиалгын төлөвүүд</h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Захиалгын явцыг хянах төлөвүүдийг тохируулна уу</p>
                    </div>
                </div>
                <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingStatus(null); setShowModal(true); }}>
                    <Plus size={14} /> Төлөв нэмэх
                </button>
            </div>

            <div className="status-settings-grid">
                {statuses.map((s, idx) => (
                    <div
                        key={s.id}
                        className={`card status-config-card ${!s.isActive ? 'is-inactive' : ''}`}
                        style={{
                            padding: '16px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderLeft: `4px solid ${s.color}`,
                            opacity: s.isActive ? 1 : 0.6
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="reorder-actions" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <button
                                    className="btn btn-ghost btn-xs btn-icon"
                                    style={{ padding: 2, height: 20, width: 20 }}
                                    onClick={() => handleMove(idx, 'up')}
                                    disabled={idx === 0 || moving}
                                >
                                    <ChevronUp size={12} />
                                </button>
                                <button
                                    className="btn btn-ghost btn-xs btn-icon"
                                    style={{ padding: 2, height: 20, width: 20 }}
                                    onClick={() => handleMove(idx, 'down')}
                                    disabled={idx === statuses.length - 1 || moving}
                                >
                                    <ChevronDown size={12} />
                                </button>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{s.label}</div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {s.isSystem && <span style={{ fontSize: '0.65rem', background: 'var(--bg-soft)', padding: '2px 6px', borderRadius: 4, opacity: 0.7 }}>СИСТЕМ</span>}
                                {!s.isActive && <span style={{ fontSize: '0.65rem', background: '#ef444420', color: '#ef4444', padding: '2px 6px', borderRadius: 4 }}>ИДЭВХГҮЙ</span>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-xs btn-icon" onClick={(e) => { e.stopPropagation(); setEditingStatus(s); setShowModal(true); }} disabled={moving}><MoreVertical size={14} /></button>
                            {!s.isSystem && (
                                <button className="btn btn-ghost btn-xs btn-icon text-danger" onClick={(e) => { e.stopPropagation(); handleDelete(s.id, s.isSystem); }} disabled={moving}><Trash2 size={14} /></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && <OrderStatusModal bizId={bizId} onClose={() => setShowModal(false)} editingStatus={editingStatus} nextOrder={statuses.length} />}
        </div>
    );
}

function OrderStatusModal({ bizId, onClose, editingStatus, nextOrder }: { bizId: string; onClose: () => void; editingStatus: OrderStatusConfig | null; nextOrder: number }) {
    const [loading, setLoading] = useState(false);
    const [color, setColor] = useState(editingStatus?.color || '#3b82f6');
    const [isActive, setIsActive] = useState(editingStatus ? editingStatus.isActive : true);

    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#334155', '#0f172a',
        '#06b6d4', '#84cc16', '#a855f7', '#f97316', '#14b8a6', '#475569'
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            const label = fd.get('label') as string;
            const data: Partial<OrderStatusConfig> = {
                label,
                color,
                order: editingStatus?.order || nextOrder,
                isActive,
                isSystem: editingStatus?.isSystem ?? false
            };

            if (editingStatus) {
                await orderStatusService.updateStatus(bizId, editingStatus.id, data);
            } else {
                // Generate a simple ID from label, fallback to random if empty (e.g. Mongolian)
                const slug = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                const id = slug || `status_${Date.now()}`;
                await orderStatusService.addStatus(bizId, { ...data, id });
            }
            toast.success('Амжилттай хадгалагдлаа');
            onClose();
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    return createPortal(
        <div className="modal-backdrop premium-backdrop" onClick={onClose}>
            <div className="modal premium-modal animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            {editingStatus ? 'Төлөв засах' : 'Шинэ төлөв'}
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {editingStatus ? 'Мэдээллийг шинэчлэх' : 'Шинэ дамжлага нэмэх'}
                        </p>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ borderRadius: '12px' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="input-group">
                            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-primary)' }}>Төлөвийн нэр</label>
                            <input
                                className="input"
                                name="label"
                                defaultValue={editingStatus?.label}
                                placeholder="Жишээ: Хүлээн авсан..."
                                required
                                autoFocus
                                style={{ height: 48, borderRadius: 12, fontSize: '1rem', padding: '0 16px' }}
                            />
                        </div>

                        <div className="input-group" style={{ marginTop: 20 }}>
                            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--text-primary)' }}>Өнгө сонгох</label>
                            <div className="color-swatch-grid" style={{ gap: 10 }}>
                                {colors.map(c => (
                                    <div
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`color-swatch ${color === c ? 'active' : ''}`}
                                        style={{ background: c, height: 36, borderRadius: 10 }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="premium-toggle-card">
                            <div style={{ flex: 1, paddingRight: 12 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Төлөв идэвхтэй</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 2, fontWeight: 500 }}>
                                    Шинээр захиалга үүсгэхэд харагдана
                                </div>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 46, borderRadius: 12, fontWeight: 700 }}>Болих</button>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ flex: 1, height: 46, borderRadius: 12 }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Хадгалах'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
