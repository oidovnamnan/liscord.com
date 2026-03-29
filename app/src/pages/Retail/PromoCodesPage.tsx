import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Plus, Search, Copy, Check, Zap, Gift, BarChart3, Users, Clock, Percent, Tag, Trash2, ToggleLeft, ToggleRight, Crown, Shuffle, Settings, Sparkles, Save, Loader2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDocs, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { PromoCode } from '../../types';
import './PromoCodesPage.css';

type Tab = 'static' | 'dynamic' | 'user_gen' | 'usage';

function generateCode(prefix = 'PRX'): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return `${prefix}-${code}`;
}

function formatDate(d: any): string {
    if (!d) return '—';
    const date = d?.toDate ? d.toDate() : d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PromoCodesPage() {
    const { business } = useBusinessStore();
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>('usage');
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);

    // Form state
    const [formCode, setFormCode] = useState('');
    const [formType, setFormType] = useState<'fixed' | 'percentage'>('percentage');
    const [formValue, setFormValue] = useState('');
    const [formTarget, setFormTarget] = useState<'all' | 'vip' | 'regular'>('all');
    const [formUsageType, setFormUsageType] = useState<'one_time' | 'unlimited'>('one_time');
    const [formUsageLimit, setFormUsageLimit] = useState('0');
    const [formMinOrder, setFormMinOrder] = useState('0');
    const [formMaxDiscount, setFormMaxDiscount] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    // Dynamic fields
    const [formMinPercent, setFormMinPercent] = useState('3');
    const [formMaxPercent, setFormMaxPercent] = useState('10');
    // User gen fields
    const [formCreditsPerUser, setFormCreditsPerUser] = useState('5');

    const [saving, setSaving] = useState(false);

    // Lucky config state
    const [luckyEnabled, setLuckyEnabled] = useState(false);
    const [luckyMinPercent, setLuckyMinPercent] = useState(3);
    const [luckyMaxPercent, setLuckyMaxPercent] = useState(10);
    const [luckyCredits, setLuckyCredits] = useState(5);
    const [luckyExpireDays, setLuckyExpireDays] = useState(30);
    const [luckySaving, setLuckySaving] = useState(false);
    const [luckyLoaded, setLuckyLoaded] = useState(false);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(
            collection(db, 'businesses', business.id, 'promoCodes'),
            orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(q, snap => {
            setCodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as PromoCode)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    // Load Lucky config
    useEffect(() => {
        if (!business?.id || luckyLoaded) return;
        (async () => {
            try {
                const { doc: docRef, getDoc } = await import('firebase/firestore');
                const cfgDoc = await getDoc(docRef(db, 'businesses', business.id, 'module_settings', 'promo-codes'));
                if (cfgDoc.exists()) {
                    const d = cfgDoc.data();
                    setLuckyEnabled(d.luckyEnabled ?? false);
                    setLuckyMinPercent(d.luckyMinPercent ?? 3);
                    setLuckyMaxPercent(d.luckyMaxPercent ?? 10);
                    setLuckyCredits(d.luckyCreditsPerUser ?? 5);
                    setLuckyExpireDays(d.luckyCodeExpireDays ?? 30);
                }
            } catch { /* ignore */ }
            setLuckyLoaded(true);
        })();
    }, [business?.id, luckyLoaded]);

    const saveLuckyConfig = async () => {
        if (!business?.id) return;
        setLuckySaving(true);
        try {
            const { doc: docRef, setDoc: sd, collection: col, query: q, where: w, getDocs: gd, addDoc: ad, updateDoc: ud } = await import('firebase/firestore');
            // Save config
            await sd(docRef(db, 'businesses', business.id, 'module_settings', 'promo-codes'), {
                luckyEnabled, luckyMinPercent, luckyMaxPercent, luckyCreditsPerUser: luckyCredits, luckyCodeExpireDays: luckyExpireDays,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            // Create/update user_generated config doc
            if (luckyEnabled) {
                const ugSnap = await gd(q(col(db, 'businesses', business.id, 'promoCodes'), w('mode', '==', 'user_generated'), w('code', '==', 'LUCKY-CONFIG')));
                const ugConfig = { creditsPerUser: luckyCredits, minPercent: luckyMinPercent, maxPercent: luckyMaxPercent };
                if (ugSnap.empty) {
                    await ad(col(db, 'businesses', business.id, 'promoCodes'), {
                        businessId: business.id, code: 'LUCKY-CONFIG', type: 'percentage', value: 0, mode: 'user_generated',
                        target: 'all', usageType: 'one_time', usageLimit: 0, usageCount: 0, usedBy: [],
                        startDate: serverTimestamp(), endDate: new Date('2099-12-31'),
                        minOrderAmount: 0, isActive: true, isDeleted: false,
                        userGenConfig: ugConfig, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
                    });
                } else {
                    await ud(docRef(db, 'businesses', business.id, 'promoCodes', ugSnap.docs[0].id), {
                        isActive: true, userGenConfig: ugConfig, updatedAt: serverTimestamp(),
                    });
                }
            }
            alert('Lucky тохиргоо хадгалагдлаа!');
        } catch (e) { console.error(e); alert('Алдаа гарлаа'); }
        setLuckySaving(false);
    };

    const filtered = useMemo(() => {
        let list = codes;
        if (tab === 'static') list = codes.filter(c => c.mode === 'static');
        else if (tab === 'dynamic') list = codes.filter(c => c.mode === 'dynamic' && !c.parentId);
        else if (tab === 'user_gen') list = codes.filter(c => c.mode === 'user_generated');
        else if (tab === 'usage') list = codes.filter(c => c.usageCount > 0);

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(c => c.code.toLowerCase().includes(q) || (c.assignedTo || '').includes(q));
        }
        return list;
    }, [codes, tab, searchQuery]);

    const stats = useMemo(() => ({
        total: codes.length,
        active: codes.filter(c => c.isActive).length,
        totalUsage: codes.reduce((s, c) => s + (c.usageCount || 0), 0),
        staticCount: codes.filter(c => c.mode === 'static').length,
    }), [codes]);

    const resetForm = () => {
        setFormCode(generateCode());
        setFormType('percentage');
        setFormValue('');
        setFormTarget('all');
        setFormUsageType('one_time');
        setFormUsageLimit('0');
        setFormMinOrder('0');
        setFormMaxDiscount('');
        setFormStartDate(new Date().toISOString().split('T')[0]);
        setFormEndDate('');
        setFormMinPercent('3');
        setFormMaxPercent('10');
        setFormCreditsPerUser('5');
        setEditingCode(null);
    };

    const openCreate = (mode: 'static' | 'dynamic' | 'user_generated') => {
        resetForm();
        if (mode === 'dynamic') {
            setFormCode(`DYN-${Date.now().toString(36).toUpperCase()}`);
        } else if (mode === 'user_generated') {
            setFormCode('USER-GEN');
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!business?.id) return;
        setSaving(true);

        const mode = tab === 'dynamic' ? 'dynamic' : tab === 'user_gen' ? 'user_generated' : 'static';

        const data: Record<string, any> = {
            businessId: business.id,
            code: formCode.toUpperCase(),
            type: formType,
            value: Number(formValue) || 0,
            mode,
            target: formTarget,
            usageType: formUsageType,
            usageLimit: Number(formUsageLimit) || 0,
            usageCount: 0,
            usedBy: [],
            startDate: formStartDate ? Timestamp.fromDate(new Date(formStartDate)) : serverTimestamp(),
            endDate: formEndDate ? Timestamp.fromDate(new Date(formEndDate + 'T23:59:59')) : Timestamp.fromDate(new Date('2099-12-31')),
            minOrderAmount: Number(formMinOrder) || 0,
            maxDiscountAmount: Number(formMaxDiscount) || null,
            isActive: true,
            isDeleted: false,
            updatedAt: serverTimestamp(),
        };

        if (mode === 'dynamic') {
            data.dynamicConfig = {
                minPercent: Number(formMinPercent) || 3,
                maxPercent: Number(formMaxPercent) || 10,
                totalCodes: 0,
                generatedCount: 0,
            };
        }

        if (mode === 'user_generated') {
            data.userGenConfig = {
                creditsPerUser: Number(formCreditsPerUser) || 5,
                minPercent: Number(formMinPercent) || 3,
                maxPercent: Number(formMaxPercent) || 10,
            };
        }

        try {
            if (editingCode) {
                await updateDoc(doc(db, 'businesses', business.id, 'promoCodes', editingCode.id), data);
            } else {
                data.createdAt = serverTimestamp();
                await addDoc(collection(db, 'businesses', business.id, 'promoCodes'), data);
            }
            setShowModal(false);
        } catch (e) {
            console.error('Save promo code error:', e);
        }
        setSaving(false);
    };

    const handleDistribute = async (campaign: PromoCode) => {
        if (!business?.id || !campaign.dynamicConfig) return;
        const conf = campaign.dynamicConfig;

        // Fetch all customers
        const custSnap = await getDocs(query(
            collection(db, 'businesses', business.id, 'customers'),
            where('isDeleted', '==', false)
        ));

        let count = 0;
        for (const cDoc of custSnap.docs) {
            const cust = cDoc.data();
            const phone = cust.phone;
            if (!phone) continue;

            // Check target
            if (campaign.target === 'vip' && !cust.isVip) continue;
            if (campaign.target === 'regular' && cust.isVip) continue;

            // Generate random percentage
            const pct = Math.floor(Math.random() * (conf.maxPercent - conf.minPercent + 1)) + conf.minPercent;
            const code = generateCode('DYN');

            await addDoc(collection(db, 'businesses', business.id, 'promoCodes'), {
                businessId: business.id,
                code,
                type: 'percentage',
                value: pct,
                mode: 'dynamic',
                target: campaign.target,
                usageType: 'one_time',
                usageLimit: 1,
                usageCount: 0,
                usedBy: [],
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                minOrderAmount: campaign.minOrderAmount || 0,
                isActive: true,
                isDeleted: false,
                parentId: campaign.id,
                assignedTo: phone,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            count++;
        }

        // Update campaign
        await updateDoc(doc(db, 'businesses', business.id, 'promoCodes', campaign.id), {
            'dynamicConfig.generatedCount': count,
            'dynamicConfig.totalCodes': count,
            updatedAt: serverTimestamp(),
        });

        alert(`${count} хэрэглэгчид промо код амжилттай хуваарилагдлаа!`);
    };

    const toggleActive = async (c: PromoCode) => {
        if (!business?.id) return;
        await updateDoc(doc(db, 'businesses', business.id, 'promoCodes', c.id), {
            isActive: !c.isActive,
            updatedAt: serverTimestamp(),
        });
    };

    const handleDelete = async (c: PromoCode) => {
        setDeleteTarget(c);
    };

    const confirmDelete = async () => {
        if (!business?.id || !deleteTarget) return;
        await deleteDoc(doc(db, 'businesses', business.id, 'promoCodes', deleteTarget.id));
        setDeleteTarget(null);
    };

    const copyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
        { id: 'usage', label: 'Ашиглалт', icon: <BarChart3 size={16} />, count: codes.filter(c => c.usageCount > 0).length },
        { id: 'static', label: 'Тогтмол', icon: <Tag size={16} />, count: codes.filter(c => c.mode === 'static').length },
        { id: 'dynamic', label: 'Динамик', icon: <Zap size={16} />, count: codes.filter(c => c.mode === 'dynamic' && !c.parentId).length },
        { id: 'user_gen', label: 'Lucky', icon: <Sparkles size={16} />, count: codes.filter(c => c.mode === 'user_generated').length },
    ];

    return (
        <div className="promo-page">
            {/* Hero Stats */}
            <div className="promo-hero">
                <div className="promo-hero-icon"><Ticket size={28} /></div>
                <div className="promo-hero-info">
                    <h2>Промо Код</h2>
                    <p>Хямдралын код үүсгэж, харилцагчдадаа тараана</p>
                </div>
                <div className="promo-stats-grid">
                    <div className="promo-stat">
                        <span className="promo-stat-value">{stats.total}</span>
                        <span className="promo-stat-label">Нийт код</span>
                    </div>
                    <div className="promo-stat">
                        <span className="promo-stat-value">{stats.active}</span>
                        <span className="promo-stat-label">Идэвхтэй</span>
                    </div>
                    <div className="promo-stat">
                        <span className="promo-stat-value">{stats.totalUsage}</span>
                        <span className="promo-stat-label">Ашиглалт</span>
                    </div>
                </div>
                <button className="promo-settings-btn" onClick={() => navigate('/app/settings?tab=promo-codes')} title="Тохиргоо">
                    <Settings size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="promo-tabs">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        className={`promo-tab ${tab === t.id ? 'active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.icon}
                        <span>{t.label}</span>
                        {t.count > 0 && <span className="promo-tab-count">{t.count}</span>}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="promo-toolbar">
                <div className="promo-search">
                    <Search size={16} />
                    <input placeholder="Код хайх..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {tab === 'static' && (
                    <button className="promo-add-btn" onClick={() => openCreate('static')}>
                        <Plus size={18} />
                        <span>Шинэ код</span>
                    </button>
                )}
                {tab === 'dynamic' && (
                    <button className="promo-add-btn" onClick={() => openCreate('dynamic')}>
                        <Plus size={18} />
                        <span>Шинэ кампанит</span>
                    </button>
                )}
                {tab === 'user_gen' && (
                    <button className="promo-add-btn" onClick={saveLuckyConfig} disabled={luckySaving}>
                        {luckySaving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        <span>Үүсгэх</span>
                    </button>
                )}
            </div>

            {/* Lucky Settings Panel */}
            {tab === 'user_gen' && (
                <div style={{ background: 'var(--bg-soft, #f9fafb)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Sparkles size={18} style={{ color: '#f59e0b' }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Lucky Код тохиргоо</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #888)' }}>Хэрэглэгч профайлаасаа код үүсгэх боломж</div>
                            </div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" checked={luckyEnabled} onChange={e => setLuckyEnabled(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                            <div style={{
                                width: 44, height: 24, borderRadius: 12,
                                background: luckyEnabled ? '#6366f1' : '#d1d5db',
                                transition: 'background 0.2s', position: 'relative'
                            }}>
                                <div style={{
                                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                    position: 'absolute', top: 3, left: luckyEnabled ? 23 : 3,
                                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                                }} />
                            </div>
                        </label>
                    </div>

                    {luckyEnabled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #777)', textTransform: 'uppercase', marginBottom: 4 }}>Хамгийн бага %</label>
                                    <input type="number" min={1} max={90} value={luckyMinPercent} onChange={e => setLuckyMinPercent(Number(e.target.value))}
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ddd)', fontSize: '0.9rem', fontWeight: 700 }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #777)', textTransform: 'uppercase', marginBottom: 4 }}>Хамгийн их %</label>
                                    <input type="number" min={1} max={90} value={luckyMaxPercent} onChange={e => setLuckyMaxPercent(Number(e.target.value))}
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ddd)', fontSize: '0.9rem', fontWeight: 700 }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #777)', textTransform: 'uppercase', marginBottom: 4 }}>Эрхийн тоо</label>
                                    <input type="number" min={1} max={50} value={luckyCredits} onChange={e => setLuckyCredits(Number(e.target.value))}
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ddd)', fontSize: '0.9rem', fontWeight: 700 }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #777)', textTransform: 'uppercase', marginBottom: 4 }}>Хугацаа (хоног)</label>
                                    <input type="number" min={1} max={365} value={luckyExpireDays} onChange={e => setLuckyExpireDays(Number(e.target.value))}
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #ddd)', fontSize: '0.9rem', fontWeight: 700 }} />
                                </div>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, #f0f0ff, #fdf0ff)', border: '1px solid #e0d4fc', borderRadius: 10, padding: 12, textAlign: 'center', fontSize: '0.82rem' }}>
                                <span style={{ color: '#6b7280' }}>Хэрэглэгч </span>
                                <strong style={{ color: '#6366f1' }}>{luckyMinPercent}-{luckyMaxPercent}%</strong>
                                <span style={{ color: '#6b7280' }}> хямдрал · </span>
                                <strong style={{ color: '#6366f1' }}>{luckyCredits}</strong>
                                <span style={{ color: '#6b7280' }}> эрх · </span>
                                <strong style={{ color: '#6366f1' }}>{luckyExpireDays}</strong>
                                <span style={{ color: '#6b7280' }}> хоногийн хүчинтэй</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Usage Stats Table */}
            {tab === 'usage' && (
                <div style={{ marginBottom: 16 }}>
                    {loading ? (
                        <div className="promo-empty">Ачаалж байна...</div>
                    ) : (() => {
                        const allUsed = codes.filter(c => c.usageCount > 0).sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
                        const totalUsage = allUsed.reduce((s, c) => s + (c.usageCount || 0), 0);
                        const uniqueUsers = new Set(allUsed.flatMap(c => c.usedBy || []));
                        const totalDiscount = allUsed.reduce((s, c) => {
                            if (c.type === 'percentage') return s + (c.usageCount || 0) * c.value;
                            return s + (c.usageCount || 0) * c.value;
                        }, 0);
                        return (
                            <>
                                {/* Summary cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                                    {[
                                        { label: 'Нийт ашиглалт', value: totalUsage, color: '#6366f1' },
                                        { label: 'Ашигласан код', value: allUsed.length, color: '#10b981' },
                                        { label: 'Хэрэглэгчид', value: uniqueUsers.size, color: '#f59e0b' },
                                        { label: 'Нийт код', value: codes.length, color: '#8b5cf6' },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: 'var(--bg-soft, #f9fafb)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #888)', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {allUsed.length === 0 ? (
                                    <div className="promo-empty">
                                        <BarChart3 size={40} />
                                        <p>Ашиглагдсан код олдсонгүй</p>
                                    </div>
                                ) : (
                                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border, #e5e7eb)' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-soft, #f3f4f6)' }}>
                                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted, #777)' }}>Код</th>
                                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted, #777)' }}>Төрөл</th>
                                                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted, #777)' }}>Хямдрал</th>
                                                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted, #777)' }}>Ашиглалт</th>
                                                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted, #777)' }}>Хязгаар</th>
                                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted, #777)' }}>Ашигласан хэрэглэгчид</th>
                                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted, #777)' }}>Хүчинтэй</th>
                                                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted, #777)' }}>Төлөв</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allUsed.map((c, i) => (
                                                    <tr key={c.id} style={{ borderTop: '1px solid var(--border, #eee)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-soft, #fafafa)' }}>
                                                        <td style={{ padding: '10px 14px' }}>
                                                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.88rem', letterSpacing: 1 }}>{c.code}</span>
                                                        </td>
                                                        <td style={{ padding: '10px 14px' }}>
                                                            <span style={{
                                                                display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                                                                background: c.mode === 'static' ? '#dbeafe' : c.mode === 'dynamic' ? '#fef3c7' : '#ede9fe',
                                                                color: c.mode === 'static' ? '#1d4ed8' : c.mode === 'dynamic' ? '#b45309' : '#6d28d9',
                                                            }}>
                                                                {c.mode === 'static' ? 'Тогтмол' : c.mode === 'dynamic' ? 'Динамик' : 'Lucky'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#6366f1' }}>
                                                            {c.type === 'percentage' ? `${c.value}%` : `₮${c.value.toLocaleString()}`}
                                                        </td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#10b981' }}>{c.usageCount}</span>
                                                        </td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted, #888)' }}>
                                                            {c.usageLimit || '∞'}
                                                        </td>
                                                        <td style={{ padding: '10px 14px' }}>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                                {(c.usedBy || []).length === 0 ? (
                                                                    <span style={{ color: 'var(--text-muted, #aaa)', fontSize: '0.78rem' }}>—</span>
                                                                ) : (c.usedBy || []).map((phone: string, idx: number) => (
                                                                    <span key={idx} style={{
                                                                        display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                                                                        background: 'var(--bg-soft, #f0f0f0)', fontSize: '0.75rem', fontWeight: 600
                                                                    }}>
                                                                        {phone}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: 'var(--text-muted, #888)' }}>
                                                            {formatDate(c.startDate)} — {formatDate(c.endDate)}
                                                        </td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                            {c.isActive ? (
                                                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                                                            ) : (
                                                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}

            {/* Code List (non-usage tabs) */}
            {tab !== 'usage' && (
            <div className="promo-list">
                {loading ? (
                    <div className="promo-empty">Ачаалж байна...</div>
                ) : filtered.length === 0 ? (
                    <div className="promo-empty">
                        <Ticket size={40} />
                        <p>Промо код байхгүй байна</p>
                    </div>
                ) : filtered.map(c => (
                    <div key={c.id} className={`promo-card ${!c.isActive ? 'inactive' : ''}`}>
                        <div className="promo-card-header">
                            <div className="promo-card-code-row">
                                <span className="promo-card-code">{c.code}</span>
                                <button className="promo-copy-btn" onClick={() => copyCode(c.code, c.id)}>
                                    {copiedId === c.id ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                            <div className="promo-card-badges">
                                <span className={`promo-badge promo-badge-${c.type}`}>
                                    {c.type === 'percentage' ? `${c.value}%` : `₮${c.value.toLocaleString()}`}
                                </span>
                                <span className={`promo-badge promo-badge-target-${c.target}`}>
                                    {c.target === 'vip' ? <><Crown size={11} /> VIP</> : c.target === 'regular' ? 'Энгийн' : 'Бүгд'}
                                </span>
                                <span className={`promo-badge ${c.usageType === 'one_time' ? 'promo-badge-once' : 'promo-badge-multi'}`}>
                                    {c.usageType === 'one_time' ? '1 удаа' : 'Олон удаа'}
                                </span>
                            </div>
                        </div>

                        <div className="promo-card-details">
                            {c.assignedTo && (
                                <div className="promo-detail"><Users size={13} /> {c.assignedTo}</div>
                            )}
                            <div className="promo-detail"><Clock size={13} /> {formatDate(c.startDate)} — {formatDate(c.endDate)}</div>
                            <div className="promo-detail"><BarChart3 size={13} /> {c.usageCount}/{c.usageLimit || '∞'} ашиглалт</div>
                            {c.minOrderAmount > 0 && (
                                <div className="promo-detail">₮{c.minOrderAmount.toLocaleString()}-с дееш</div>
                            )}
                        </div>

                        <div className="promo-card-actions">
                            {c.mode === 'dynamic' && !c.parentId && c.dynamicConfig && (
                                <button className="promo-action-btn distribute" onClick={() => handleDistribute(c)}>
                                    <Shuffle size={14} /> Хуваарилах ({c.dynamicConfig.generatedCount || 0})
                                </button>
                            )}
                            <button className="promo-action-btn" onClick={() => toggleActive(c)}>
                                {c.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                            <button className="promo-action-btn delete" onClick={() => handleDelete(c)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="promo-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="promo-modal" onClick={e => e.stopPropagation()}>
                        <h3>{editingCode ? 'Код засах' : tab === 'dynamic' ? 'Динамик кампанит' : 'Шинэ промо код'}</h3>

                        <div className="promo-form">
                            {tab === 'static' && (
                                <>
                                    <div className="promo-field">
                                        <label>Код</label>
                                        <div className="promo-code-input">
                                            <input value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase())} />
                                            <button onClick={() => setFormCode(generateCode())} title="Random"><Shuffle size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="promo-field-row">
                                        <div className="promo-field">
                                            <label>Төрөл</label>
                                            <select value={formType} onChange={e => setFormType(e.target.value as any)}>
                                                <option value="percentage">Хувь (%)</option>
                                                <option value="fixed">Тогтмол дүн (₮)</option>
                                            </select>
                                        </div>
                                        <div className="promo-field">
                                            <label>Хэмжээ</label>
                                            <input type="number" value={formValue} onChange={e => setFormValue(e.target.value)} placeholder={formType === 'percentage' ? '10' : '5000'} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {tab === 'dynamic' && (
                                <div className="promo-field-row">
                                    <div className="promo-field">
                                        <label>Хамгийн бага %</label>
                                        <input type="number" value={formMinPercent} onChange={e => setFormMinPercent(e.target.value)} />
                                    </div>
                                    <div className="promo-field">
                                        <label>Хамгийн их %</label>
                                        <input type="number" value={formMaxPercent} onChange={e => setFormMaxPercent(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            <div className="promo-field">
                                <label>Зорилтот хэрэглэгч</label>
                                <div className="promo-radio-group">
                                    {(['all', 'vip', 'regular'] as const).map(t => (
                                        <button key={t} className={`promo-radio ${formTarget === t ? 'active' : ''}`} onClick={() => setFormTarget(t)}>
                                            {t === 'vip' && <Crown size={14} />}
                                            {t === 'all' ? 'Бүгд' : t === 'vip' ? 'VIP' : 'Энгийн'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {tab === 'static' && (
                                <div className="promo-field">
                                    <label>Ашиглалт</label>
                                    <div className="promo-radio-group">
                                        <button className={`promo-radio ${formUsageType === 'one_time' ? 'active' : ''}`} onClick={() => setFormUsageType('one_time')}>1 удаа</button>
                                        <button className={`promo-radio ${formUsageType === 'unlimited' ? 'active' : ''}`} onClick={() => setFormUsageType('unlimited')}>Олон удаа</button>
                                    </div>
                                </div>
                            )}

                            {formUsageType === 'unlimited' && (
                                <div className="promo-field">
                                    <label>Нийт хязгаар (0 = хязгааргүй)</label>
                                    <input type="number" value={formUsageLimit} onChange={e => setFormUsageLimit(e.target.value)} />
                                </div>
                            )}

                            <div className="promo-field-row">
                                <div className="promo-field">
                                    <label>Эхлэх огноо</label>
                                    <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                                </div>
                                <div className="promo-field">
                                    <label>Дуусах огноо</label>
                                    <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} />
                                </div>
                            </div>

                            <div className="promo-field-row">
                                <div className="promo-field">
                                    <label>Хамгийн бага захиалга (₮)</label>
                                    <input type="number" value={formMinOrder} onChange={e => setFormMinOrder(e.target.value)} />
                                </div>
                                {formType === 'percentage' && (
                                    <div className="promo-field">
                                        <label>Макс хямдрал (₮)</label>
                                        <input type="number" value={formMaxDiscount} onChange={e => setFormMaxDiscount(e.target.value)} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="promo-modal-actions">
                            <button className="promo-btn-cancel" onClick={() => setShowModal(false)}>Болих</button>
                            <button className="promo-btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div className="promo-modal-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="promo-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
                        <h3 style={{ marginBottom: 8 }}>Код устгах</h3>
                        <p style={{ color: 'var(--text-muted, #888)', fontSize: '0.9rem', marginBottom: 20 }}>
                            <strong style={{ fontFamily: 'monospace', fontSize: '1.05rem' }}>{deleteTarget.code}</strong> кодыг устгахдаа итгэлтэй байна уу?
                        </p>
                        <div className="promo-modal-actions" style={{ justifyContent: 'center' }}>
                            <button className="promo-btn-cancel" onClick={() => setDeleteTarget(null)}>Болих</button>
                            <button className="promo-btn-save" onClick={confirmDelete}
                                style={{ background: '#ef4444' }}>
                                Устгах
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
