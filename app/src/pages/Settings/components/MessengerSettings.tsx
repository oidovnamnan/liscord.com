/**
 * MessengerSettings — Settings Plugin for Facebook Messenger Module
 * 
 * Renders inside Тохиргоо → Залгаасууд → Facebook Messenger.
 * Covers: AI mode per-page, schedule, and canned responses.
 */
import { useState, useEffect } from 'react';
import { MessageSquare, Save, Loader2, Plus, Trash2, Clock, X, Bot, Zap } from 'lucide-react';
import { fbMessengerService, type AiMode, type AiScheduleEntry, type FbPageConfig, type FbSettings, type FbCannedResponse } from '../../../services/fbMessengerService';
import { toast } from 'react-hot-toast';

export function MessengerSettings({ bizId }: { bizId: string }) {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<FbSettings | null>(null);
    const [cannedResponses, setCannedResponses] = useState<FbCannedResponse[]>([]);
    const [editingCanned, setEditingCanned] = useState<FbCannedResponse[]>([]);
    const [newCannedKey, setNewCannedKey] = useState('');
    const [newCannedText, setNewCannedText] = useState('');
    const [savingCanned, setSavingCanned] = useState(false);

    useEffect(() => {
        if (!bizId) return;
        setLoading(true);
        Promise.all([
            fbMessengerService.getSettings(bizId),
            fbMessengerService.getCannedResponses(bizId),
        ]).then(([s, c]) => {
            setSettings(s);
            setCannedResponses(c);
            setEditingCanned([...c]);
        }).finally(() => setLoading(false));
    }, [bizId]);

    const pages = settings?.pages || [];

    // Quick set all pages mode
    const handleSetAllPages = async (mode: AiMode) => {
        for (const p of pages) {
            await fbMessengerService.updatePageAIMode(bizId, p.pageId, mode);
        }
        setSettings(prev => {
            if (!prev) return prev;
            return { ...prev, pages: (prev.pages || []).map(p => ({ ...p, aiMode: mode })) };
        });
        toast.success(`Бүх page: ${mode === 'manual' ? '🔴 Гар' : mode === 'assist' ? '🟡 Туслах' : '🟢 Автомат'}`);
    };

    // Per-page mode change
    const handlePageMode = async (pageId: string, mode: AiMode) => {
        await fbMessengerService.updatePageAIMode(bizId, pageId, mode);
        setSettings(prev => {
            if (!prev) return prev;
            return { ...prev, pages: (prev.pages || []).map(p => p.pageId === pageId ? { ...p, aiMode: mode } : p) };
        });
        const pageName = pages.find(p => p.pageId === pageId)?.pageName || pageId;
        toast.success(`${pageName}: ${mode === 'manual' ? '🔴 Гар' : mode === 'assist' ? '🟡 Туслах' : '🟢 Автомат'}`);
    };

    // Schedule helpers
    const addScheduleEntry = async (page: FbPageConfig) => {
        const current = page.schedule || [];
        const newEntry: AiScheduleEntry = { startTime: '09:00', endTime: '18:00', mode: 'auto' };
        const updated = [...current, newEntry];
        await fbMessengerService.updatePageSchedule(bizId, page.pageId, updated);
        setSettings(prev => prev ? { ...prev, pages: (prev.pages || []).map(p => p.pageId === page.pageId ? { ...p, schedule: updated } : p) } : prev);
        toast.success('Хуваарь нэмэгдлээ');
    };

    const updateScheduleEntry = async (pageId: string, schedule: AiScheduleEntry[], idx: number, field: string, value: string | number[]) => {
        const updated = [...schedule];
        updated[idx] = { ...updated[idx], [field]: value };
        await fbMessengerService.updatePageSchedule(bizId, pageId, updated);
        setSettings(prev => prev ? { ...prev, pages: (prev.pages || []).map(p => p.pageId === pageId ? { ...p, schedule: updated } : p) } : prev);
    };

    const removeScheduleEntry = async (pageId: string, schedule: AiScheduleEntry[], idx: number) => {
        const updated = schedule.filter((_, i) => i !== idx);
        await fbMessengerService.updatePageSchedule(bizId, pageId, updated);
        setSettings(prev => prev ? { ...prev, pages: (prev.pages || []).map(p => p.pageId === pageId ? { ...p, schedule: updated } : p) } : prev);
        toast.success('Хуваарь устгагдлаа');
    };

    // Canned responses
    const handleAddCanned = () => {
        if (!newCannedKey || !newCannedText) return;
        const key = newCannedKey.startsWith('/') ? newCannedKey : `/${newCannedKey}`;
        setEditingCanned(prev => [...prev, { key, text: newCannedText }]);
        setNewCannedKey('');
        setNewCannedText('');
    };

    const handleSaveCanned = async () => {
        setSavingCanned(true);
        try {
            await fbMessengerService.saveCannedResponses(bizId, editingCanned);
            setCannedResponses([...editingCanned]);
            toast.success('Түргэн хариулт хадгалагдлаа');
        } catch {
            toast.error('Алдаа гарлаа');
        } finally {
            setSavingCanned(false);
        }
    };

    if (loading) return (
        <div className="flex-center" style={{ minHeight: '200px' }}>
            <Loader2 className="animate-spin" size={24} />
        </div>
    );

    if (!settings || !settings.isConnected) return (
        <div className="settings-section animate-fade-in">
            <div className="settings-card">
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <MessageSquare size={40} style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.4 }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>Facebook Messenger холбогдоогүй</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto' }}>
                        Эхлээд Messenger хуудас руу орж Facebook Page-ээ холбоно уу. Холболт хийсний дараа энд AI тохиргоо, түргэн хариулт гарч ирнэ.
                    </p>
                </div>
            </div>
        </div>
    );

    const allManual = pages.every(p => (p.aiMode || 'manual') === 'manual');
    const anyAuto = pages.some(p => (p.aiMode || 'manual') === 'auto');

    const MODE_CONFIG = [
        { mode: 'manual' as AiMode, icon: '🔴', label: 'Гар', desc: 'AI хариулахгүй', color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.3)' },
        { mode: 'assist' as AiMode, icon: '🟡', label: 'Туслах', desc: 'AI санал болгоно', color: '#eab308', bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.3)' },
        { mode: 'auto' as AiMode, icon: '🟢', label: 'Автомат', desc: 'AI автомат хариулна', color: '#22c55e', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.3)' },
    ];

    return (
        <div className="settings-section animate-fade-in">
            {/* ── AI Mode Settings ── */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon"><Bot size={20} /></div>
                    <h3>AI Хариулагч тохиргоо</h3>
                </div>

                {/* Status banner */}
                <div style={{
                    padding: '14px 18px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14,
                    background: allManual ? 'rgba(239,68,68,0.06)' : anyAuto ? 'rgba(34,197,94,0.06)' : 'rgba(234,179,8,0.06)',
                    border: `1px solid ${allManual ? 'rgba(239,68,68,0.15)' : anyAuto ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)'}`,
                }}>
                    <span style={{ fontSize: '1.5rem' }}>{allManual ? '🔴' : anyAuto ? '🟢' : '🟡'}</span>
                    <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: allManual ? '#ef4444' : anyAuto ? '#22c55e' : '#eab308' }}>
                            {allManual ? 'AI унтарсан' : anyAuto ? 'AI автомат идэвхтэй' : 'AI туслах горим'}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {allManual ? 'Бүх page дээр AI хариулахгүй — гараар хариулна' : anyAuto ? 'AI мессежид автомат хариулж байна' : 'AI санал болгоно, та батлах хэрэгтэй'}
                        </div>
                    </div>
                </div>

                {/* Quick set all pages */}
                {pages.length > 1 && (
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ⚡ Бүх page нэг дор тохируулах
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {MODE_CONFIG.map(m => (
                                <button key={m.mode} onClick={() => handleSetAllPages(m.mode)} style={{
                                    flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-soft)',
                                    background: 'var(--surface-1)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    color: m.color, transition: 'all 0.2s',
                                }}>
                                    {m.icon} Бүгдийг {m.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="divider" />

                {/* Per-page AI mode */}
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📱 Пэйж тус бүрийн AI горим ({pages.length})
                </label>

                {pages.map(page => {
                    const pageAiMode = page.aiMode || settings?.aiMode || 'manual';
                    return (
                        <div key={page.pageId} style={{
                            marginBottom: 16, padding: '16px 18px', borderRadius: 14,
                            background: 'var(--surface-1)', border: '1.5px solid var(--border-soft)',
                        }}>
                            {/* Page Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    📱 {page.pageName || page.pageId}
                                </div>
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 100,
                                    background: pageAiMode === 'auto' ? 'rgba(34,197,94,0.12)' : pageAiMode === 'assist' ? 'rgba(234,179,8,0.12)' : 'rgba(239,68,68,0.12)',
                                    color: pageAiMode === 'auto' ? '#16a34a' : pageAiMode === 'assist' ? '#ca8a04' : '#dc2626',
                                }}>
                                    {pageAiMode === 'auto' ? '🟢 Автомат' : pageAiMode === 'assist' ? '🟡 Туслах' : '🔴 Гар'}
                                </span>
                            </div>

                            {/* Mode Cards */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                {MODE_CONFIG.map(m => (
                                    <button key={m.mode} onClick={() => handlePageMode(page.pageId, m.mode)} style={{
                                        flex: 1, padding: '14px 8px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                                        background: pageAiMode === m.mode ? m.bg : 'transparent',
                                        border: `2px solid ${pageAiMode === m.mode ? m.border : 'var(--border-soft)'}`,
                                        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                    }}>
                                        <span style={{ fontSize: '1.3rem' }}>{m.icon}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: pageAiMode === m.mode ? m.color : 'var(--text-muted)' }}>{m.label}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{m.desc}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Schedule */}
                            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--border-soft)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Clock size={13} /> Хуваарь
                                    </span>
                                    <button onClick={() => addScheduleEntry(page)} style={{
                                        display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600,
                                        color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
                                    }}>
                                        <Plus size={13} /> Нэмэх
                                    </button>
                                </div>
                                {(page.schedule || []).length === 0 && (
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 4px', fontStyle: 'italic' }}>Хуваарьгүй — дээрх горим 24/7 ажиллана</p>
                                )}
                                {(page.schedule || []).map((entry, idx) => (
                                    <div key={idx} style={{ marginBottom: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(108,92,231,0.04)', border: '1px solid rgba(108,92,231,0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <input type="time" value={entry.startTime} onChange={e => updateScheduleEntry(page.pageId, page.schedule || [], idx, 'startTime', e.target.value)}
                                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-soft)', fontSize: '0.82rem', background: 'var(--surface-1)' }} />
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>–</span>
                                            <input type="time" value={entry.endTime} onChange={e => updateScheduleEntry(page.pageId, page.schedule || [], idx, 'endTime', e.target.value)}
                                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-soft)', fontSize: '0.82rem', background: 'var(--surface-1)' }} />
                                            <select value={entry.mode} onChange={e => updateScheduleEntry(page.pageId, page.schedule || [], idx, 'mode', e.target.value)}
                                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-soft)', fontSize: '0.82rem', flex: 1, background: 'var(--surface-1)' }}>
                                                <option value="auto">🟢 Автомат</option>
                                                <option value="assist">🟡 Туслах</option>
                                                <option value="manual">🔴 Гар</option>
                                            </select>
                                            <button onClick={() => removeScheduleEntry(page.pageId, page.schedule || [], idx)}
                                                style={{ background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#ef4444' }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'].map((label, dayIdx) => {
                                                const isActive = !entry.days || entry.days.length === 0 || entry.days.includes(dayIdx);
                                                return (
                                                    <button key={dayIdx} onClick={() => {
                                                        const currentDays = entry.days && entry.days.length > 0 ? [...entry.days] : [0,1,2,3,4,5,6];
                                                        const newDays = currentDays.includes(dayIdx) ? currentDays.filter(d => d !== dayIdx) : [...currentDays, dayIdx];
                                                        updateScheduleEntry(page.pageId, page.schedule || [], idx, 'days', newDays.length === 7 ? [] : newDays);
                                                    }} style={{
                                                        width: 30, height: 28, borderRadius: 6, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                                        background: isActive ? 'var(--primary)' : 'var(--surface-2)',
                                                        color: isActive ? '#fff' : 'var(--text-muted)',
                                                        border: 'none', transition: 'all 0.2s',
                                                    }}>
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Canned Responses ── */}
            <div className="settings-card" style={{ marginTop: 24 }}>
                <div className="settings-card-header">
                    <div className="settings-card-icon"><Zap size={20} /></div>
                    <h3>Түргэн хариулт</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                    Чатанд <code>/товчлол</code> бичиж хурдан хариулт оруулна. Жнь: <code>/баярлалаа</code>
                </p>

                <div className="settings-form">
                    {editingCanned.map((r, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                            background: 'var(--surface-1)', borderRadius: 10, marginBottom: 6,
                            border: '1px solid var(--border-soft)',
                        }}>
                            <code style={{
                                background: 'var(--primary-tint)', color: 'var(--primary)', padding: '3px 10px',
                                borderRadius: 6, fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap',
                            }}>{r.key}</code>
                            <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{r.text}</span>
                            <button onClick={() => setEditingCanned(prev => prev.filter((_, j) => j !== i))}
                                style={{ background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#ef4444' }}>
                                <X size={13} />
                            </button>
                        </div>
                    ))}

                    {editingCanned.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Түргэн хариулт байхгүй байна. Доорх маягтаар нэмнэ үү.
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <input className="input" placeholder="/товчлол" value={newCannedKey}
                            onChange={e => setNewCannedKey(e.target.value)} style={{ width: 120, flex: '0 0 120px' }} />
                        <input className="input" placeholder="Хариу текст" value={newCannedText}
                            onChange={e => setNewCannedText(e.target.value)} style={{ flex: 1 }} />
                        <button className="btn btn-outline btn-sm" onClick={handleAddCanned} disabled={!newCannedKey || !newCannedText}
                            style={{ padding: '8px 14px', borderRadius: 8 }}>
                            <Plus size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                        <button className="btn btn-primary gradient-btn" onClick={handleSaveCanned} disabled={savingCanned} style={{ minWidth: 140 }}>
                            {savingCanned ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Хадгалах
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
