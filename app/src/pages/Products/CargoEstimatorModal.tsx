import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Loader2, Sparkles, Save, Check, AlertTriangle, Filter } from 'lucide-react';
import type { Product, CargoType } from '../../types';
import { estimateCargoForProducts, type CargoEstimation } from '../../services/ai/cargoEstimationService';
import { productService } from '../../services/db';
import { toast } from 'react-hot-toast';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    cargoTypes: CargoType[];
    bizId: string;
    geminiApiKey: string;
}

interface ProductCargoRow {
    productId: string;
    name: string;
    categoryName: string;
    image?: string;
    cargoTypeId: string;
    cargoValue: number;
    isIncluded: boolean;
    aiSuggestion?: CargoEstimation;
    hasExisting: boolean;
    isDirty: boolean;
}

type FilterMode = 'all' | 'unconfigured' | 'configured';

function initRows(prods: Product[], types: CargoType[]): ProductCargoRow[] {
    return prods
        .filter(p => !p.isDeleted && p.isActive !== false)
        .map(p => ({
            productId: p.id,
            name: p.name,
            categoryName: p.categoryName || '',
            image: p.images?.[0],
            cargoTypeId: p.cargoFee?.cargoTypeId || (types.length > 0 ? types[0].id : ''),
            cargoValue: p.cargoFee?.cargoValue || 1,
            isIncluded: p.cargoFee?.isIncluded || false,
            hasExisting: !!(p.cargoFee?.amount && p.cargoFee.amount > 0),
            isDirty: false,
        }));
}

export function CargoEstimatorModal({ isOpen, onClose, products: _products, cargoTypes, bizId, geminiApiKey }: Props) {
    const [rows, setRows] = useState<ProductCargoRow[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [filter, setFilter] = useState<FilterMode>('all');
    const [isEstimating, setIsEstimating] = useState(false);
    const [estimateProgress, setEstimateProgress] = useState({ current: 0, total: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });

    // Fetch ALL products from Firestore when modal opens
    useEffect(() => {
        if (!isOpen || !bizId) return;
        setIsLoadingProducts(true);
        const q = query(
            collection(db, 'businesses', bizId, 'products'),
            where('isDeleted', '==', false)
        );
        getDocs(q).then(snapshot => {
            const allProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            allProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setRows(initRows(allProducts, cargoTypes));
        }).catch(() => {
            toast.error('Бараа татахад алдаа гарлаа');
        }).finally(() => {
            setIsLoadingProducts(false);
        });
    }, [isOpen, bizId, cargoTypes]);

    const filteredRows = useMemo(() => {
        if (filter === 'unconfigured') return rows.filter(r => !r.hasExisting);
        if (filter === 'configured') return rows.filter(r => r.hasExisting);
        return rows;
    }, [rows, filter]);

    const stats = useMemo(() => ({
        total: rows.length,
        configured: rows.filter(r => r.hasExisting).length,
        unconfigured: rows.filter(r => !r.hasExisting).length,
        dirty: rows.filter(r => r.isDirty).length,
    }), [rows]);

    const getCargoFee = (row: ProductCargoRow) => {
        const type = cargoTypes.find(t => t.id === row.cargoTypeId);
        return type ? type.fee * row.cargoValue : 0;
    };

    const updateRow = (productId: string, updates: Partial<ProductCargoRow>) => {
        setRows(prev => prev.map(r =>
            r.productId === productId ? { ...r, ...updates, isDirty: true } : r
        ));
    };

    // ── AI Estimation ──
    const handleEstimate = async () => {
        if (!geminiApiKey) {
            toast.error('AI API Key тохируулаагүй байна.');
            return;
        }
        if (cargoTypes.length === 0) {
            toast.error('Каргоны төрөл тохируулаагүй байна.');
            return;
        }

        setIsEstimating(true);
        setEstimateProgress({ current: 0, total: filteredRows.length });

        try {
            const productsForAI = filteredRows.map(r => ({
                id: r.productId,
                name: r.name,
                categoryName: r.categoryName,
                image: r.image,
            }));

            const results = await estimateCargoForProducts(
                productsForAI,
                cargoTypes.map(ct => ({ id: ct.id, name: ct.name, fee: ct.fee })),
                geminiApiKey,
                (current, total) => setEstimateProgress({ current, total })
            );

            // Apply AI suggestions to rows
            setRows(prev => prev.map(r => {
                const suggestion = results[r.productId];
                if (!suggestion) return r;
                return {
                    ...r,
                    cargoTypeId: suggestion.suggestedCargoTypeId,
                    cargoValue: suggestion.suggestedCargoValue,
                    aiSuggestion: suggestion,
                    isDirty: true,
                };
            }));

            const count = Object.keys(results).length;
            toast.success(`${count} барааны карго AI-аар тогтоогдлоо`);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'AI бодоход алдаа гарлаа';
            toast.error(msg);
        } finally {
            setIsEstimating(false);
        }
    };

    // ── Bulk Save ──
    const handleSaveAll = async () => {
        const dirtyRows = rows.filter(r => r.isDirty);
        if (dirtyRows.length === 0) {
            toast('Өөрчлөлт байхгүй байна', { icon: 'ℹ️' });
            return;
        }

        setIsSaving(true);
        setSaveProgress({ current: 0, total: dirtyRows.length });
        let saved = 0;

        try {
            for (const row of dirtyRows) {
                const fee = getCargoFee(row);
                await productService.updateProduct(bizId, row.productId, {
                    cargoFee: {
                        amount: fee,
                        isIncluded: row.isIncluded,
                        cargoTypeId: row.cargoTypeId,
                        cargoValue: row.cargoValue,
                    },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any);
                saved++;
                setSaveProgress({ current: saved, total: dirtyRows.length });
            }

            // Mark all as saved
            setRows(prev => prev.map(r => ({ ...r, isDirty: false, hasExisting: true })));
            toast.success(`${saved} барааны карго хадгалагдлаа ✅`);
        } catch (error) {
            toast.error(`Хадгалахад алдаа гарлаа (${saved}/${dirtyRows.length} хадгалагдсан)`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 960, width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6c5ce7, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>📦 AI Карго Тогтоох</h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {stats.total} бараа · {stats.configured} тохируулсан · {stats.unconfigured} тохируулаагүй
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Toolbar */}
                <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {/* Filter */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        {([
                            { key: 'all' as FilterMode, label: `Бүгд (${stats.total})` },
                            { key: 'unconfigured' as FilterMode, label: `Тохируулаагүй (${stats.unconfigured})` },
                            { key: 'configured' as FilterMode, label: `Тохируулсан (${stats.configured})` },
                        ]).map(f => (
                            <button
                                key={f.key}
                                className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilter(f.key)}
                                style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: 8 }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1 }} />

                    {/* AI Estimate Button */}
                    <button
                        className="btn btn-secondary"
                        onClick={handleEstimate}
                        disabled={isEstimating || cargoTypes.length === 0}
                        style={{ gap: 6, padding: '7px 16px', fontSize: '0.85rem' }}
                    >
                        {isEstimating ? (
                            <><Loader2 size={15} className="animate-spin" /> AI бодож байна... ({estimateProgress.current}/{estimateProgress.total})</>
                        ) : (
                            <><Sparkles size={15} /> 🤖 AI Бодох</>
                        )}
                    </button>

                    {/* Save Button */}
                    <button
                        className="btn btn-primary gradient-btn"
                        onClick={handleSaveAll}
                        disabled={isSaving || stats.dirty === 0}
                        style={{ gap: 6, padding: '7px 16px', fontSize: '0.85rem' }}
                    >
                        {isSaving ? (
                            <><Loader2 size={15} className="animate-spin" /> Хадгалж байна... ({saveProgress.current}/{saveProgress.total})</>
                        ) : (
                            <><Save size={15} /> Хадгалах ({stats.dirty})</>
                        )}
                    </button>
                </div>

                {/* Loading State */}
                {isLoadingProducts && (
                    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: 12 }} />
                        <p style={{ fontWeight: 600 }}>Бүх бараа татаж байна...</p>
                    </div>
                )}

                {/* No cargo types warning */}
                {!isLoadingProducts && cargoTypes.length === 0 && (
                    <div style={{ padding: '20px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <AlertTriangle size={32} style={{ color: '#f59e0b', marginBottom: 8 }} />
                        <p style={{ fontWeight: 600 }}>Каргоны төрөл тохируулаагүй байна</p>
                        <p style={{ fontSize: '0.85rem' }}>Тохиргоо → Сорсинг хэсэгт каргоны төрлүүд (жижиг, дунд, том г.м.) нэмнэ үү.</p>
                    </div>
                )}

                {/* Table */}
                {!isLoadingProducts && cargoTypes.length > 0 && (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 16px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-soft)', position: 'sticky', top: 0, background: 'var(--surface-1)', zIndex: 1 }}>
                                    <th style={thStyle}>Бараа</th>
                                    <th style={{ ...thStyle, width: 100 }}>AI Санал</th>
                                    <th style={{ ...thStyle, width: 160 }}>Каргоны төрөл</th>
                                    <th style={{ ...thStyle, width: 80 }}>Овор</th>
                                    <th style={{ ...thStyle, width: 100 }}>Төлбөр</th>
                                    <th style={{ ...thStyle, width: 90 }}>Үнэд багтсан</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map(row => {
                                    const fee = getCargoFee(row);
                                    return (
                                        <tr key={row.productId} style={{ borderBottom: '1px solid var(--border-soft)', background: row.isDirty ? 'rgba(108,92,231,0.03)' : undefined }}>
                                            {/* Product Info */}
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    {row.image ? (
                                                        <img src={row.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                                                    ) : (
                                                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Package size={16} style={{ color: 'var(--text-muted)' }} />
                                                        </div>
                                                    )}
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{row.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.categoryName || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* AI Suggestion Badge */}
                                            <td style={tdStyle}>
                                                {row.aiSuggestion ? (
                                                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6, background: row.aiSuggestion.confidence >= 70 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: row.aiSuggestion.confidence >= 70 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                                                        {row.aiSuggestion.confidence}%
                                                    </span>
                                                ) : row.hasExisting ? (
                                                    <Check size={14} style={{ color: '#10b981' }} />
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                                                )}
                                            </td>

                                            {/* Cargo Type Dropdown */}
                                            <td style={tdStyle}>
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        className="input"
                                                        value={row.cargoTypeId}
                                                        onChange={e => updateRow(row.productId, { cargoTypeId: e.target.value })}
                                                        style={{ height: 32, fontSize: '0.8rem', paddingRight: 24 }}
                                                    >
                                                        {cargoTypes.map(ct => (
                                                            <option key={ct.id} value={ct.id}>{ct.name} ({ct.fee.toLocaleString()}₮)</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>

                                            {/* Cargo Value */}
                                            <td style={tdStyle}>
                                                <input
                                                    className="input"
                                                    type="number"
                                                    min={1}
                                                    max={99}
                                                    value={row.cargoValue}
                                                    onChange={e => updateRow(row.productId, { cargoValue: Math.max(1, Number(e.target.value) || 1) })}
                                                    style={{ height: 32, fontSize: '0.8rem', width: 60, textAlign: 'center' }}
                                                />
                                            </td>

                                            {/* Fee (calculated) */}
                                            <td style={{ ...tdStyle, fontWeight: 700, color: fee > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                {fee > 0 ? `₮${fee.toLocaleString()}` : '—'}
                                            </td>

                                            {/* Included Toggle */}
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    className="toggle-switch-ios"
                                                    checked={row.isIncluded}
                                                    onChange={e => updateRow(row.productId, { isIncluded: e.target.checked })}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredRows.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                <Filter size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                                <p>Энэ шүүлтүүрээр бараа олдсонгүй</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

const thStyle: React.CSSProperties = {
    padding: '10px 8px',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    color: 'var(--text-muted)',
};

const tdStyle: React.CSSProperties = {
    padding: '8px',
    verticalAlign: 'middle',
};
