import { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuthStore, useBusinessStore } from '../../store';
import { X, CheckCircle, Package, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import type { Order, ReturnType, ReturnReason, ReturnAction, ReturnItem } from '../../types';

interface Props {
    bizId: string;
    order: Order;
    onClose: () => void;
    onCreated?: () => void;
}

const REASON_OPTIONS: { value: ReturnReason; label: string }[] = [
    { value: 'source_unavailable', label: 'Сорс нөөц дууссан' },
    { value: 'delivery_late', label: 'Хүргэлт удааширсан' },
    { value: 'defective', label: 'Эвдэрч хэмхэрсэн' },
    { value: 'wrong_item', label: 'Буруу бараа ирсэн' },
    { value: 'not_as_described', label: 'Тайлбарт нийцээгүй' },
    { value: 'other', label: 'Бусад' },
];

const TYPE_OPTIONS: { value: ReturnType; label: string; desc: string }[] = [
    { value: 'source_return', label: '📦 Сорс буцаалт', desc: 'Сорсинг хийхэд нөөц дууссан / хугацаа хэтэрсэн' },
    { value: 'late_delivery', label: '⏱️ Хүргэлт удааширсан', desc: 'Хүргэлт хугацаандаа хийгдээгүй' },
    { value: 'product_issue', label: '📸 Бараа асуудалтай', desc: 'Эвдэрсэн, буруу бараа ирсэн' },
];

export function CreateReturnModal({ bizId, order, onClose, onCreated }: Props) {
    const { user } = useAuthStore();
    const employee = useBusinessStore(s => s.employee);

    const [returnType, setReturnType] = useState<ReturnType>('source_return');
    const [reason, setReason] = useState<ReturnReason>('source_unavailable');
    const [reasonNote, setReasonNote] = useState('');
    const [includeDelivery, setIncludeDelivery] = useState(false);
    const [saving, setSaving] = useState(false);

    // Double-return prevention: fetch existing returns for this order
    const [returnedQtyMap, setReturnedQtyMap] = useState<Record<string, number>>({});
    const [existingReturnCount, setExistingReturnCount] = useState(0);

    useEffect(() => {
        const fetchExisting = async () => {
            try {
                const q = query(
                    collection(db, `businesses/${bizId}/returns`),
                    where('orderId', '==', order.id)
                );
                const snap = await getDocs(q);
                const map: Record<string, number> = {};
                let count = 0;
                snap.docs.forEach(d => {
                    const data = d.data();
                    if (data.status === 'rejected') return; // Rejected returns don't count
                    count++;
                    (data.items || []).forEach((item: { productId: string; quantity: number }) => {
                        map[item.productId] = (map[item.productId] || 0) + item.quantity;
                    });
                });
                setReturnedQtyMap(map);
                setExistingReturnCount(count);
            } catch (e) {
                console.error('Failed to fetch existing returns:', e);
            }
        };
        fetchExisting();
    }, [bizId, order.id]);

    // Item selection
    const [selectedItems, setSelectedItems] = useState<Record<string, {
        selected: boolean;
        quantity: number;
        action: ReturnAction;
    }>>(() => {
        const initial: Record<string, { selected: boolean; quantity: number; action: ReturnAction }> = {};
        (order.items || []).forEach((item, i) => {
            const alreadyReturned = returnedQtyMap[item.productId || ''] || 0;
            const remainingQty = Math.max(0, item.quantity - alreadyReturned);
            initial[i] = { selected: false, quantity: remainingQty, action: 'restock' };
        });
        return initial;
    });

    // Bank account for refund
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState(order.customer.name || '');

    // Proportional refund calculation
    const refundCalc = useMemo(() => {
        const subtotal = order.financials?.subtotal || 0;
        const totalPaid = order.financials?.totalAmount || 0;

        let itemsRefund = 0;
        const items: ReturnItem[] = [];

        Object.entries(selectedItems).forEach(([idx, sel]) => {
            if (!sel.selected) return;
            const item = order.items[Number(idx)];
            if (!item) return;

            const itemTotal = item.unitPrice * sel.quantity;
            // Proportional: (itemTotal / subtotal) * totalPaid
            const proportional = subtotal > 0 ? Math.round((itemTotal / subtotal) * totalPaid) : itemTotal;
            itemsRefund += proportional;

            items.push({
                productId: item.productId || '',
                name: item.name,
                image: item.image || '',
                quantity: sel.quantity,
                originalQuantity: item.quantity,
                unitPrice: item.unitPrice,
                proportionalRefund: proportional,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                productType: (item as any).productType || 'ready',
                action: sel.action,
            });
        });

        const deliveryRefund = includeDelivery ? (order.financials?.deliveryFee || 0) : 0;
        const total = itemsRefund + deliveryRefund;

        return { items, itemsRefund, deliveryRefund, total };
    }, [selectedItems, includeDelivery, order]);

    const allItemsSelected = Object.values(selectedItems).every(s => s.selected);

    const handleSave = async () => {
        if (refundCalc.items.length === 0) {
            toast.error('Буцаах бараа сонгоно уу');
            return;
        }
        setSaving(true);
        try {
            const returnDoc = {
                orderId: order.id,
                orderNumber: order.orderNumber,
                customer: {
                    id: order.customer.id || null,
                    name: order.customer.name,
                    phone: order.customer.phone,
                },
                refundAccount: (bankName && accountNumber) ? { bankName, accountNumber, accountHolder } : null,
                type: returnType,
                items: refundCalc.items,
                includeDeliveryFee: includeDelivery,
                deliveryFeeRefund: refundCalc.deliveryRefund,
                reason,
                reasonNote: reasonNote || '',
                evidenceUrls: [],
                refundAmount: refundCalc.total,
                status: 'pending',
                statusHistory: [{
                    status: 'pending',
                    at: new Date(),
                    by: user?.uid || '',
                    byName: employee?.name || user?.displayName || 'System',
                    note: 'Буцаалт үүсгэсэн',
                }],
                financeNote: '',
                createdBy: user?.uid || '',
                createdByName: employee?.name || user?.displayName || 'System',
                createdByRole: 'operator',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const ref = await addDoc(collection(db, `businesses/${bizId}/returns`), returnDoc);

            // Mark order
            const orderRef = doc(db, `businesses/${bizId}/orders`, order.id);
            await updateDoc(orderRef, {
                returnStatus: allItemsSelected && includeDelivery ? 'full' : 'partial',
                returnIds: [...(order.returnIds || []), ref.id],
            });

            toast.success('Буцаалт амжилттай үүслээ');
            onCreated?.();
            onClose();
        } catch (e) {
            console.error('Failed to create return:', e);
            toast.error('Буцаалт үүсгэхэд алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 620, maxHeight: '90vh', overflow: 'auto' }}>
                <div className="modal-header">
                    <h2>🔄 Буцаалт үүсгэх — #{order.orderNumber}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Existing returns warning */}
                    {existingReturnCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                            <div style={{ fontSize: '0.82rem', color: '#92400e' }}>
                                Энэ захиалга дээр <strong>{existingReturnCount}</strong> буцаалт бүртгэгдсэн байна. Буцаагдаагүй барааны тоог автоматаар тооцсон.
                            </div>
                        </div>
                    )}
                    {/* Return Type */}
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                            Буцаалтын төрөл
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {TYPE_OPTIONS.map(opt => (
                                <label key={opt.value} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                                    border: `2px solid ${returnType === opt.value ? 'var(--primary)' : 'var(--border-color)'}`,
                                    background: returnType === opt.value ? 'rgba(var(--primary-rgb), 0.04)' : 'transparent',
                                    transition: 'all 0.15s ease'
                                }}>
                                    <input type="radio" checked={returnType === opt.value} onChange={() => setReturnType(opt.value)} style={{ display: 'none' }} />
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        border: `2px solid ${returnType === opt.value ? 'var(--primary)' : 'var(--border-color)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        {returnType === opt.value && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{opt.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Item Selection */}
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                            Буцаах бараа
                        </label>
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
                            {order.items.map((item, i) => {
                                const alreadyReturned = returnedQtyMap[item.productId || ''] || 0;
                                const maxReturnable = Math.max(0, item.quantity - alreadyReturned);
                                const isFullyReturned = maxReturnable === 0;
                                return (
                                <div key={i} style={{
                                    padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                                    borderBottom: i < order.items.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    background: isFullyReturned ? 'rgba(239, 68, 68, 0.03)' : selectedItems[i]?.selected ? 'rgba(var(--primary-rgb), 0.03)' : 'transparent',
                                    opacity: isFullyReturned ? 0.5 : 1,
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems[i]?.selected || false}
                                        disabled={isFullyReturned}
                                        onChange={e => setSelectedItems(prev => ({
                                            ...prev, [i]: { ...prev[i], selected: e.target.checked }
                                        }))}
                                        style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                                    />
                                    {item.image ?
                                        <img src={item.image} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} /> :
                                        <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Package size={16} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    }
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {item.unitPrice.toLocaleString()}₮ × {item.quantity}ш
                                            {alreadyReturned > 0 && (
                                                <span style={{ color: '#ef4444', marginLeft: 6 }}>
                                                    ({alreadyReturned}ш буцаагдсан)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {selectedItems[i]?.selected && !isFullyReturned && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="number"
                                                min={1}
                                                max={maxReturnable}
                                                value={Math.min(selectedItems[i].quantity, maxReturnable)}
                                                onChange={e => setSelectedItems(prev => ({
                                                    ...prev, [i]: { ...prev[i], quantity: Math.min(maxReturnable, Math.max(1, Number(e.target.value))) }
                                                }))}
                                                style={{ width: 55, height: 32, borderRadius: 6, textAlign: 'center', border: '1px solid var(--border-color)', fontSize: '0.82rem', fontWeight: 700 }}
                                            />
                                            <select
                                                value={selectedItems[i].action}
                                                onChange={e => setSelectedItems(prev => ({
                                                    ...prev, [i]: { ...prev[i], action: e.target.value as ReturnAction }
                                                }))}
                                                style={{ height: 32, borderRadius: 6, fontSize: '0.75rem', border: '1px solid var(--border-color)', padding: '0 8px' }}
                                            >
                                                <option value="restock">Нөөцөд</option>
                                                <option value="write_off">Актлах</option>
                                                <option value="return_to_source">Сорс руу</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                              );
                            })}
                        </div>
                    </div>

                    {/* Delivery Fee */}
                    {(order.financials?.deliveryFee || 0) > 0 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-soft)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={includeDelivery}
                                onChange={e => setIncludeDelivery(e.target.checked)}
                                style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                            />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                Хүргэлтийн зардал буцаах ({(order.financials?.deliveryFee || 0).toLocaleString()}₮)
                            </span>
                        </label>
                    )}

                    {/* Reason */}
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                            Шалтгаан
                        </label>
                        <select
                            className="input"
                            value={reason}
                            onChange={e => setReason(e.target.value as ReturnReason)}
                            style={{ height: 42, borderRadius: 10, fontSize: '0.85rem' }}
                        >
                            {REASON_OPTIONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        <textarea
                            className="input"
                            placeholder="Нэмэлт тайлбар..."
                            value={reasonNote}
                            onChange={e => setReasonNote(e.target.value)}
                            rows={2}
                            style={{ marginTop: 8, borderRadius: 10, fontSize: '0.82rem', resize: 'none' }}
                        />
                    </div>

                    {/* Bank Account */}
                    <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                            Буцаалтын данс (заавал биш)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <input className="input" placeholder="Банкны нэр" value={bankName} onChange={e => setBankName(e.target.value)} style={{ height: 40, borderRadius: 8, fontSize: '0.82rem' }} />
                            <input className="input" placeholder="Дансны дугаар" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} style={{ height: 40, borderRadius: 8, fontSize: '0.82rem' }} />
                        </div>
                        <input className="input" placeholder="Данс эзэмшигч" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} style={{ height: 40, borderRadius: 8, fontSize: '0.82rem', marginTop: 8 }} />
                    </div>

                    {/* Refund Summary */}
                    <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Барааны буцаалт:</span>
                            <span style={{ fontWeight: 600 }}>{refundCalc.itemsRefund.toLocaleString()}₮</span>
                        </div>
                        {refundCalc.deliveryRefund > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Хүргэлтийн зардал:</span>
                                <span style={{ fontWeight: 600 }}>{refundCalc.deliveryRefund.toLocaleString()}₮</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '2px solid var(--border-color)', paddingTop: 8, marginTop: 4, color: 'var(--primary)' }}>
                            <span>Нийт буцаалт:</span>
                            <span>{refundCalc.total.toLocaleString()}₮</span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Цуцлах</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving || refundCalc.items.length === 0}
                        style={{ minWidth: 140 }}
                    >
                        {saving ? 'Хадгалж байна...' : '🔄 Буцаалт үүсгэх'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
