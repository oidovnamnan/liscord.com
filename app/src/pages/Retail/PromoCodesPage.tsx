import { useState, useEffect, useMemo } from 'react';
import { Ticket, Plus, Search, Copy, Check, Zap, Gift, BarChart3, Users, Clock, Percent, Tag, Trash2, ToggleLeft, ToggleRight, Crown, Shuffle } from 'lucide-react';
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
    const [tab, setTab] = useState<Tab>('static');
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingCode, setEditingCode] = useState<PromoCode | null>(null);

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
        if (!business?.id || !confirm(`"${c.code}" кодыг устгах уу?`)) return;
        await deleteDoc(doc(db, 'businesses', business.id, 'promoCodes', c.id));
    };

    const copyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
        { id: 'static', label: 'Тогтмол', icon: <Tag size={16} />, count: codes.filter(c => c.mode === 'static').length },
        { id: 'dynamic', label: 'Динамик', icon: <Zap size={16} />, count: codes.filter(c => c.mode === 'dynamic' && !c.parentId).length },
        { id: 'user_gen', label: 'Хэрэглэгчийн', icon: <Gift size={16} />, count: codes.filter(c => c.mode === 'user_generated').length },
        { id: 'usage', label: 'Ашиглалт', icon: <BarChart3 size={16} />, count: codes.filter(c => c.usageCount > 0).length },
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
                {tab !== 'usage' && (
                    <button className="promo-add-btn" onClick={() => openCreate(tab === 'dynamic' ? 'dynamic' : tab === 'user_gen' ? 'user_generated' : 'static')}>
                        <Plus size={18} />
                        <span>
                            {tab === 'static' ? 'Шинэ код' : tab === 'dynamic' ? 'Шинэ кампанит' : 'Тохиргоо нэмэх'}
                        </span>
                    </button>
                )}
            </div>

            {/* Code List */}
            <div className="promo-list">
                {loading ? (
                    <div className="promo-empty">Ачаалж байна...</div>
                ) : filtered.length === 0 ? (
                    <div className="promo-empty">
                        <Ticket size={40} />
                        <p>{tab === 'usage' ? 'Ашиглагдсан код олдсонгүй' : 'Промо код байхгүй байна'}</p>
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="promo-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="promo-modal" onClick={e => e.stopPropagation()}>
                        <h3>{editingCode ? 'Код засах' : tab === 'dynamic' ? 'Динамик кампанит' : tab === 'user_gen' ? 'Хэрэглэгчийн код тохиргоо' : 'Шинэ промо код'}</h3>

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

                            {(tab === 'dynamic' || tab === 'user_gen') && (
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

                            {tab === 'user_gen' && (
                                <div className="promo-field">
                                    <label>Хэрэглэгч тутамд эрхийн тоо</label>
                                    <input type="number" value={formCreditsPerUser} onChange={e => setFormCreditsPerUser(e.target.value)} />
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
        </div>
    );
}
