/**
 * MessengerSettings — Settings Plugin for Facebook Messenger Module
 * 
 * Renders inside Тохиргоо → Залгаасууд → Facebook Messenger.
 * Covers: Connection settings — Webhook URL, tokens, page management.
 * AI горим + Түргэн хариулт нь Messenger хуудасны drawer-д шууд орно.
 */
import { useState, useEffect, useMemo } from 'react';
import { Link2, Shield, Save, Loader2, Plus, ExternalLink, XCircle, Copy, Check, MessageSquare } from 'lucide-react';
import { fbMessengerService, type FbSettings, type FbPageConfig } from '../../../services/fbMessengerService';
import { toast } from 'react-hot-toast';

export function MessengerSettings({ bizId }: { bizId: string }) {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<FbSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [settingsForm, setSettingsForm] = useState({ pageName: '', pageId: '', pageAccessToken: '' });

    useEffect(() => {
        if (!bizId) return;
        setLoading(true);
        fbMessengerService.getSettings(bizId)
            .then(s => {
                setSettings(s);
                if (s?.pages?.[0]) {
                    setSettingsForm({ pageName: s.pages[0].pageName, pageId: s.pages[0].pageId, pageAccessToken: s.pages[0].pageAccessToken });
                }
            })
            .finally(() => setLoading(false));
    }, [bizId]);

    const pages = settings?.pages || [];

    const webhookUrl = useMemo(() =>
        `https://www.liscord.com/api/fb-webhook?bizId=${bizId}`,
    [bizId]);

    const copyText = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        toast.success('Хуулагдлаа');
        setTimeout(() => setCopied(null), 2000);
    };

    const handleSave = async () => {
        if (!settingsForm.pageId) {
            toast.error('Page ID оруулна уу');
            return;
        }

        // For new pages, token is required
        const existingIdx = pages.findIndex(p => p.pageId === settingsForm.pageId);
        if (existingIdx < 0 && !settingsForm.pageAccessToken) {
            toast.error('Шинэ page-д Access Token оруулна уу');
            return;
        }

        setSaving(true);
        try {
            const newPage: FbPageConfig = {
                pageId: settingsForm.pageId,
                pageName: settingsForm.pageName || settingsForm.pageId,
                pageAccessToken: settingsForm.pageAccessToken,
                isActive: true,
            };

            if (existingIdx >= 0) {
                // Update existing — keep old token if user didn't paste a new one
                const updatedPages = [...pages];
                const finalToken = settingsForm.pageAccessToken || updatedPages[existingIdx].pageAccessToken;
                updatedPages[existingIdx] = { ...updatedPages[existingIdx], ...newPage, pageAccessToken: finalToken };
                await fbMessengerService.saveSettings(bizId, {
                    pages: updatedPages,
                    pageId: settingsForm.pageId,
                    pageName: settingsForm.pageName,
                    pageAccessToken: finalToken,
                    isConnected: true,
                });
                setSettings(prev => prev ? { ...prev, pages: updatedPages, isConnected: true } : prev);
            } else {
                // Add new page
                await fbMessengerService.addPage(bizId, newPage);
                setSettings(prev => prev ? { ...prev, pages: [...(prev.pages || []), newPage], isConnected: true } : prev);
            }

            // Subscribe webhooks
            try {
                await fetch('/api/fb-subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bizId }),
                });
            } catch { /* ignore subscribe errors */ }

            toast.success('Тохиргоо хадгалагдлаа');
        } catch {
            toast.error('Хадгалахад алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex-center" style={{ minHeight: '200px' }}>
            <Loader2 className="animate-spin" size={24} />
        </div>
    );

    return (
        <div className="settings-section animate-fade-in">
            {/* ── Connection Status ── */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon"><Shield size={20} /></div>
                    <h3>Холболтын төлөв</h3>
                </div>

                <div style={{
                    padding: '14px 18px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14,
                    background: settings?.isConnected ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                    border: `1px solid ${settings?.isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                }}>
                    <span style={{ fontSize: '1.5rem' }}>{settings?.isConnected ? '🟢' : '🔴'}</span>
                    <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: settings?.isConnected ? '#22c55e' : '#ef4444' }}>
                            {settings?.isConnected ? 'Холбогдсон' : 'Холбогдоогүй'}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {settings?.isConnected
                                ? `${pages.length} page холбогдсон${settings.connectedAt ? ` · ${settings.connectedAt.toLocaleDateString()}` : ''}`
                                : 'Facebook Page холбоогүй байна'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Webhook URL ── */}
            <div className="settings-card" style={{ marginTop: 24 }}>
                <div className="settings-card-header">
                    <div className="settings-card-icon"><Link2 size={20} /></div>
                    <h3>Webhook тохиргоо</h3>
                </div>

                <div className="settings-form">
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Webhook URL
                    </label>
                    <div onClick={() => copyText(webhookUrl, 'url')} style={{
                        padding: '12px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer',
                        background: 'var(--surface-1)', border: '1px solid var(--border-soft)', fontSize: '0.82rem', fontFamily: 'monospace', wordBreak: 'break-all',
                        transition: 'all 0.2s',
                    }}>
                        <code style={{ color: 'var(--text-primary)', flex: 1 }}>{webhookUrl}</code>
                        {copied === 'url' ? <Check size={16} style={{ color: '#22c55e', flexShrink: 0 }} /> : <Copy size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    </div>

                    {settings?.verifyToken && (
                        <>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Verify Token
                            </label>
                            <div onClick={() => copyText(settings.verifyToken, 'token')} style={{
                                padding: '12px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer',
                                background: 'var(--surface-1)', border: '1px solid var(--border-soft)', fontSize: '0.82rem', fontFamily: 'monospace',
                                transition: 'all 0.2s',
                            }}>
                                <code style={{ color: 'var(--text-primary)' }}>{settings.verifyToken}</code>
                                {copied === 'token' ? <Check size={16} style={{ color: '#22c55e', flexShrink: 0 }} /> : <Copy size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Access Token & Page Config ── */}
            <div className="settings-card" style={{ marginTop: 24 }}>
                <div className="settings-card-header">
                    <div className="settings-card-icon"><MessageSquare size={20} /></div>
                    <h3>Page тохиргоо</h3>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                    <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        Graph API Explorer <ExternalLink size={12} />
                    </a>
                    {' '}хэрэглүүрээр Access Token авна уу.
                </p>

                <div className="settings-form">
                    <div className="form-group">
                        <label className="form-label">Page Name</label>
                        <input className="input" value={settingsForm.pageName} onChange={e => setSettingsForm(p => ({ ...p, pageName: e.target.value }))} placeholder="My Page" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Page ID</label>
                        <input className="input" value={settingsForm.pageId} onChange={e => setSettingsForm(p => ({ ...p, pageId: e.target.value }))} placeholder="123456789" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Page Access Token</label>
                        <input className="input" value={settingsForm.pageAccessToken} onChange={e => setSettingsForm(p => ({ ...p, pageAccessToken: e.target.value }))} placeholder="Шинэ token paste хийнэ үү..." type="password" />
                        {settingsForm.pageAccessToken && (
                            <div style={{ fontSize: '0.75rem', color: settingsForm.pageAccessToken.length > 200 && settingsForm.pageAccessToken.length < 300 ? '#22c55e' : '#ef4444', marginTop: 4 }}>
                                Token урт: {settingsForm.pageAccessToken.length} тэмдэгт
                                {settingsForm.pageAccessToken.length > 300 && ' ⚠️ Хэт урт — давхар paste болсон байж магадгүй!'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Connected Pages */}
                {pages.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            📱 Холбогдсон Page-үүд ({pages.length})
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {pages.map(p => (
                                <div key={p.pageId} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                                    borderRadius: 12, background: p.pageId === settingsForm.pageId ? 'rgba(108,92,231,0.06)' : 'var(--surface-1)',
                                    border: `1.5px solid ${p.pageId === settingsForm.pageId ? 'var(--primary)' : 'var(--border-soft)'}`,
                                    transition: 'all 0.2s',
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.pageName || p.pageId}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.pageId}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setSettingsForm({ pageId: p.pageId, pageName: p.pageName, pageAccessToken: '' })} title="Засах — token шинээр оруулна" style={{ fontSize: '0.82rem' }}>✏️</button>
                                        {pages.length > 1 && (
                                            <button className="btn btn-ghost btn-sm" onClick={async () => {
                                                await fbMessengerService.removePage(bizId, p.pageId);
                                                setSettings(prev => prev ? { ...prev, pages: (prev.pages || []).filter(x => x.pageId !== p.pageId) } : prev);
                                                toast.success('Page устгагдлаа');
                                            }} title="Устгах" style={{ color: '#ef4444' }}>
                                                <XCircle size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => setSettingsForm({ pageId: '', pageName: '', pageAccessToken: '' })} style={{ marginTop: 10, gap: 6 }}>
                            <Plus size={14} /> Шинэ Page нэмэх
                        </button>
                    </div>
                )}

                <div className="divider" style={{ margin: '24px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary gradient-btn" onClick={handleSave} disabled={saving} style={{ minWidth: 160 }}>
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Хадгалах
                    </button>
                </div>
            </div>
        </div>
    );
}
