import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Plus, Globe, MoreVertical, Trash2, Users, X, Loader2 } from 'lucide-react';
import { sourceService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { type OrderSource, type SocialAccount } from '../../../types';

export function SourceSettings({ bizId }: { bizId: string }) {
    const [sources, setSources] = useState<OrderSource[]>([]);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editingSource, setEditingSource] = useState<OrderSource | null>(null);
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

    useEffect(() => {
        if (!bizId) return;
        const u1 = sourceService.subscribeSources(bizId, setSources);
        const u2 = sourceService.subscribeAccounts(bizId, null, setAccounts);
        return () => { u1(); u2(); };
    }, [bizId]);

    const handleDeleteSource = async (id: string) => {
        if (!confirm('Энэ эх сурвалжийг устгах уу?')) return;
        try {
            await sourceService.updateSource(bizId, id, { isDeleted: true });
            toast.success('Устгагдлаа');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('Энэ хаягийг устгах уу?')) return;
        try {
            await sourceService.updateAccount(bizId, id, { isDeleted: true });
            toast.success('Устгагдлаа');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); }
    };

    const currentSource = sources.find(s => s.id === selectedSourceId);
    const filteredAccounts = accounts.filter(a => !selectedSourceId || a.sourceId === selectedSourceId);

    return (
        <div className="settings-section animate-fade-in">
            <h2>Эх сурвалж болон хаягууд</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 24 }}>
                <div className="settings-card" style={{ padding: 24, border: '1px solid var(--border-color)', borderRadius: 20 }}>
                    <div className="settings-card-header">
                        <div className="settings-card-icon"><Share2 size={20} /></div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0 }}>Эх сурвалжууд</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Захиалга хаанаас ирж буйг бүртгэх</p>
                        </div>
                        <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingSource(null); setShowSourceModal(true); }}>
                            <Plus size={14} /> Нэмэх
                        </button>
                    </div>
                    <div className="source-cards-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                        {sources.map(s => (
                            <div
                                key={s.id}
                                className={`card source-card ${selectedSourceId === s.id ? 'active' : ''}`}
                                style={{ padding: '16px 20px', cursor: 'pointer' }}
                                onClick={() => setSelectedSourceId(s.id)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ color: selectedSourceId === s.id ? 'var(--primary)' : 'var(--text-muted)' }}>
                                            <Globe size={18} />
                                        </div>
                                        <div style={{ fontWeight: selectedSourceId === s.id ? 700 : 500, fontSize: '1rem' }}>{s.name}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn btn-ghost btn-xs btn-icon" onClick={(e) => { e.stopPropagation(); setEditingSource(s); setShowSourceModal(true); }}><MoreVertical size={14} /></button>
                                        <button className="btn btn-ghost btn-xs btn-icon text-danger" onClick={(e) => { e.stopPropagation(); handleDeleteSource(s.id); }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {sources.length === 0 && (
                            <div className="empty-state-illustrative">
                                <Share2 size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                                <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>Эх сурвалж бүртгэгдээгүй байна</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="settings-card" style={{ padding: 24, border: '1px solid var(--border-color)', borderRadius: 20 }}>
                    <div className="settings-card-header">
                        <div className="settings-card-icon" style={{ background: 'var(--bg-soft)', color: 'var(--text-primary)' }}><Users size={20} /></div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0 }}>{currentSource ? `${currentSource.name} хаягууд` : 'Бүх хаягууд'}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Тухайн суваг дээрх албан ёсны пэйжүүд</p>
                        </div>
                        <button className="btn btn-primary btn-sm gradient-btn" disabled={!selectedSourceId} onClick={() => setShowAccountModal(true)}>
                            <Plus size={14} /> Хаяг нэмэх
                        </button>
                    </div>

                    <div className="account-cards-grid" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
                        {filteredAccounts.map(a => (
                            <div key={a.id} className="card account-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                                        {a.name.charAt(0)}
                                    </div>
                                    <div style={{ fontWeight: 500 }}>{a.name}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {!selectedSourceId && <span className="account-badge">{sources.find(s => s.id === a.sourceId)?.name}</span>}
                                    <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDeleteAccount(a.id)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}

                        {selectedSourceId && filteredAccounts.length === 0 && (
                            <div className="empty-state-illustrative" style={{ padding: '40px 20px' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <Plus size={20} style={{ opacity: 0.4 }} />
                                </div>
                                <p style={{ fontWeight: 500, marginBottom: 4 }}>Хаяг бүртгэгдээгүй байна</p>
                                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>"{currentSource?.name}" эх сурвалжид хамаарах хаяг/пэйж нэмнэ үү</p>
                            </div>
                        )}

                        {!selectedSourceId && sources.length > 0 && (
                            <div className="empty-state-illustrative" style={{ padding: '40px 20px' }}>
                                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Зүүн талын жагсаалтаас эх сурвалж сонгож хаяг удирдана уу</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showSourceModal && <OrderSourceModal bizId={bizId} onClose={() => setShowSourceModal(false)} editingSource={editingSource} />}
            {showAccountModal && <SocialAccountModal bizId={bizId} sourceId={selectedSourceId!} sourceName={currentSource?.name || ''} onClose={() => setShowAccountModal(false)} />}
        </div>
    );
}

function OrderSourceModal({ bizId, onClose, editingSource }: { bizId: string; onClose: () => void; editingSource: OrderSource | null }) {
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            const data = { name: fd.get('name') as string };
            if (editingSource) await sourceService.updateSource(bizId, editingSource.id, data);
            else await sourceService.createSource(bizId, data);
            toast.success('Амжилттай');
            onClose();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };
    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, borderRadius: 24 }}>
                <div className="modal-header" style={{ padding: '24px 24px 12px' }}>
                    <h2 style={{ fontSize: '1.4rem' }}>{editingSource ? 'Эх сурвалж засах' : 'Шинэ эх сурвалж'}</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ padding: '0 28px 28px' }}>
                        <div className="input-group">
                            <label className="input-label">Эх сурвалжийн нэр</label>
                            <input className="input" name="name" defaultValue={editingSource?.name} placeholder="Жишээ: Facebook, Instagram, TikTok..." required autoFocus style={{ height: 48, borderRadius: 12 }} />
                        </div>
                    </div>
                    <div className="modal-footer" style={{ padding: '0 28px 28px', border: 'none', gap: 12 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 50, borderRadius: 16 }}>Болих</button>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ flex: 1, height: 50, borderRadius: 16 }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Хадгалах'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

function SocialAccountModal({ bizId, sourceId, sourceName, onClose }: { bizId: string; sourceId: string; sourceName: string; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            await sourceService.createAccount(bizId, { name: fd.get('name') as string, sourceId });
            toast.success('Амжилттай');
            onClose();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };
    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, borderRadius: 24 }}>
                <div className="modal-header" style={{ padding: '24px 24px 12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Шинэ хаяг / Пэйж</h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Эх сурвалж: <strong>{sourceName}</strong></span>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ padding: '0 28px 28px' }}>
                        <div className="input-group">
                            <label className="input-label">Пэйж буюу хаягийн нэр</label>
                            <input className="input" name="name" placeholder="Жишээ: Liscord Shop, Facebook Page A..." required autoFocus style={{ height: 48, borderRadius: 12 }} />
                        </div>
                    </div>
                    <div className="modal-footer" style={{ padding: '0 28px 28px', border: 'none', gap: 12 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 50, borderRadius: 16 }}>Болих</button>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ flex: 1, height: 50, borderRadius: 16 }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Нэмэх'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
