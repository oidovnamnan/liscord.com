/**
 * VIP Гишүүнчлэл Page
 * 
 * Shows VIP membership orders (orderNumber starts with VIP-) 
 * and active/expired memberships for management.
 * 
 * - Orders split into Баталгаажсан (paid) / Баталгаажаагүй (unpaid) sub-tabs
 * - Unpaid orders older than 24 hours are auto-deleted (soft-delete)
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, Timestamp, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore } from '../../store';
import {
    Crown, Search, Clock, CheckCircle, AlertCircle, Users,
    Phone, Calendar, Package, Trash2, Timer
} from 'lucide-react';
import { format } from 'date-fns';
import './MembershipPage.css';

interface VipOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    items: { name: string; quantity: number; salePrice: number }[];
    total: number;
    paymentStatus: string;
    createdAt?: Date;
    notes?: string;
    membershipCategoryId?: string;
    membershipDurationDays?: number;
}

interface MembershipRecord {
    id: string;
    categoryId: string;
    customerPhone: string;
    purchasedAt: Date;
    expiresAt: Date;
    amountPaid: number;
    status: 'active' | 'expired';
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function MembershipPage() {
    const { business } = useBusinessStore();
    const [orders, setOrders] = useState<VipOrder[]>([]);
    const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState<'orders' | 'members'>('orders');
    const [orderSubTab, setOrderSubTab] = useState<'confirmed' | 'unconfirmed'>('confirmed');
    const autoDeletedRef = useRef<Set<string>>(new Set());

    // Load VIP orders + auto-delete unpaid >24h
    useEffect(() => {
        if (!business?.id) return;
        const q = query(
            collection(db, 'businesses', business.id, 'orders'),
            where('isDeleted', '==', false),
        );
        const unsub = onSnapshot(q, async (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: VipOrder[] = [];
            const now = Date.now();

            for (const d of snap.docs) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = d.data() as any;
                if (!data.orderNumber?.startsWith('VIP-')) continue;
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : undefined);

                // Auto-delete unpaid orders older than 24 hours
                if (
                    data.paymentStatus !== 'paid' &&
                    createdAt &&
                    now - createdAt.getTime() > TWENTY_FOUR_HOURS &&
                    !autoDeletedRef.current.has(d.id)
                ) {
                    autoDeletedRef.current.add(d.id);
                    try {
                        await updateDoc(doc(db, 'businesses', business.id, 'orders', d.id), {
                            isDeleted: true,
                            deletedAt: Timestamp.now(),
                            deletedReason: 'auto_expired_vip_24h',
                        });
                    } catch (e) {
                        console.warn('[Membership] Auto-delete failed:', d.id, e);
                    }
                    continue; // Don't show this order
                }

                result.push({
                    id: d.id,
                    orderNumber: data.orderNumber,
                    customerName: data.customer?.name || data.customerName || '',
                    customerPhone: data.customer?.phone || data.customerPhone || '',
                    items: data.items || [],
                    total: data.financials?.totalAmount || data.total || 0,
                    paymentStatus: data.paymentStatus || 'unpaid',
                    createdAt,
                    notes: data.notes || '',
                    membershipCategoryId: data.membershipCategoryId || '',
                    membershipDurationDays: data.membershipDurationDays || 30,
                });
            }
            result.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
            setOrders(result);
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    // Load memberships
    useEffect(() => {
        if (!business?.id) return;
        const unsub = onSnapshot(
            collection(db, 'businesses', business.id, 'memberships'),
            (snap) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result: MembershipRecord[] = snap.docs.map(d => {
                    const data = d.data();
                    const purchasedAt = data.purchasedAt instanceof Timestamp ? data.purchasedAt.toDate() : new Date(data.purchasedAt);
                    const expiresAt = data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : new Date(data.expiresAt);
                    const isExpired = expiresAt < new Date();
                    return {
                        id: d.id,
                        categoryId: data.categoryId || '',
                        customerPhone: data.customerPhone || '',
                        purchasedAt,
                        expiresAt,
                        amountPaid: data.amountPaid || 0,
                        status: isExpired ? 'expired' : 'active',
                    };
                });
                result.sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());
                setMemberships(result);
            }
        );
        return () => unsub();
    }, [business?.id]);

    const confirmedOrders = useMemo(() => orders.filter(o => o.paymentStatus === 'paid'), [orders]);
    const unconfirmedOrders = useMemo(() => orders.filter(o => o.paymentStatus !== 'paid'), [orders]);

    const displayOrders = orderSubTab === 'confirmed' ? confirmedOrders : unconfirmedOrders;

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (tab === 'orders') {
            return displayOrders.filter(o =>
                !q || o.orderNumber.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                o.customerPhone.includes(q)
            );
        }
        return memberships.filter(m =>
            !q || m.customerPhone.includes(q) || m.categoryId.toLowerCase().includes(q)
        );
    }, [tab, displayOrders, memberships, searchQuery]);

    const stats = useMemo(() => ({
        totalOrders: orders.length,
        paidOrders: confirmedOrders.length,
        unpaidOrders: unconfirmedOrders.length,
        activeMembers: memberships.filter(m => m.status === 'active').length,
    }), [orders, confirmedOrders, unconfirmedOrders, memberships]);

    // Confirm payment + auto-create membership
    const [confirming, setConfirming] = useState<string | null>(null);
    const handleConfirmPayment = async (order: VipOrder) => {
        if (!business?.id) return;
        
        // Ask for confirmation first
        const ok = window.confirm(
            `${order.orderNumber} захиалгын төлбөр ₮${order.total.toLocaleString()} баталгаажуулах уу?\n\nХэрэглэгч: ${order.customerPhone}\n\nБаталгаажуулсны дараа гишүүнчлэл автоматаар идэвхжинэ.`
        );
        if (!ok) return;
        
        setConfirming(order.id);
        try {
            // 1. Update order paymentStatus to 'paid'
            await updateDoc(doc(db, 'businesses', business.id, 'orders', order.id), {
                paymentStatus: 'paid',
                'financials.paidAmount': order.total,
                'financials.balanceDue': 0,
                'financials.payments': [{
                    method: 'manual',
                    amount: order.total,
                    date: Timestamp.now(),
                    note: 'Админ баталгаажуулсан',
                }],
            });

            // 2. Auto-create membership record
            if (order.membershipCategoryId) {
                const expDate = new Date();
                expDate.setDate(expDate.getDate() + (order.membershipDurationDays || 30));
                const cleanPhone = order.customerPhone.replace(/^\+?976/, '');
                await addDoc(collection(db, 'businesses', business.id, 'memberships'), {
                    customerPhone: cleanPhone,
                    categoryId: order.membershipCategoryId,
                    orderId: order.id,
                    purchasedAt: serverTimestamp(),
                    expiresAt: Timestamp.fromDate(expDate),
                    amountPaid: order.total,
                    status: 'active',
                    createdBy: 'admin_confirm',
                });
            }
        } catch (err) {
            console.error('Failed to confirm membership payment:', err);
        } finally {
            setConfirming(null);
        }
    };

    // Helper: time remaining before auto-delete
    const getTimeRemaining = (createdAt?: Date) => {
        if (!createdAt) return '';
        const deadline = createdAt.getTime() + TWENTY_FOUR_HOURS;
        const remaining = deadline - Date.now();
        if (remaining <= 0) return 'Устгагдах гэж байна...';
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}ц ${mins}м үлдсэн`;
    };

    return (
        <div className="membership-page">
            {/* ── Premium VIP Hero ── */}
            <div className="vip-hero">
                <div className="vip-hero-top">
                    <div className="vip-hero-left">
                        <div className="vip-hero-icon"><Crown size={24} /></div>
                        <div>
                            <h1 className="vip-hero-title">VIP Гишүүнчлэл</h1>
                            <div className="vip-hero-desc">Гишүүнчлэлийн захиалга болон идэвхтэй гишүүдийг удирдах</div>
                        </div>
                    </div>
                </div>
                <div className="vip-hero-stats">
                    <div className="vip-hero-stat">
                        <div className="vip-hero-stat-value">{stats.totalOrders}</div>
                        <div className="vip-hero-stat-label">Нийт захиалга</div>
                    </div>
                    <div className="vip-hero-stat">
                        <div className="vip-hero-stat-value">{stats.paidOrders}</div>
                        <div className="vip-hero-stat-label">Баталгаажсан</div>
                    </div>
                    <div className="vip-hero-stat">
                        <div className="vip-hero-stat-value">{stats.unpaidOrders}</div>
                        <div className="vip-hero-stat-label">Баталгаажаагүй</div>
                    </div>
                    <div className="vip-hero-stat">
                        <div className="vip-hero-stat-value">{stats.activeMembers}</div>
                        <div className="vip-hero-stat-label">Идэвхтэй гишүүн</div>
                    </div>
                </div>
            </div>

            {/* ── Card: Toolbar + Content ── */}
            <div className="vip-card">

            {/* Main Tabs + Search */}
            <div className="membership-toolbar">
                <div className="membership-tabs">
                    <button className={`membership-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
                        <Package size={16} /> Захиалгууд ({orders.length})
                    </button>
                    <button className={`membership-tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
                        <Users size={16} /> Гишүүд ({memberships.length})
                    </button>
                </div>
                <div className="membership-search-wrap">
                    <Search size={16} />
                    <input
                        className="membership-search"
                        placeholder="Хайх..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Order Sub-tabs */}
            {tab === 'orders' && (
                <div className="membership-subtabs">
                    <button
                        className={`membership-subtab ${orderSubTab === 'confirmed' ? 'active confirmed' : ''}`}
                        onClick={() => setOrderSubTab('confirmed')}
                    >
                        <CheckCircle size={14} /> Баталгаажсан ({confirmedOrders.length})
                    </button>
                    <button
                        className={`membership-subtab ${orderSubTab === 'unconfirmed' ? 'active unconfirmed' : ''}`}
                        onClick={() => setOrderSubTab('unconfirmed')}
                    >
                        <Clock size={14} /> Баталгаажаагүй ({unconfirmedOrders.length})
                    </button>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="membership-loading">
                    <div className="spinner" /> Ачаалж байна...
                </div>
            ) : tab === 'orders' ? (
                <div className="membership-orders-list">
                    {(filtered as VipOrder[]).length === 0 ? (
                        <div className="membership-empty">
                            <div className="membership-empty-icon"><Crown size={32} /></div>
                            <h3>{orderSubTab === 'confirmed' ? 'Баталгаажсан захиалга байхгүй' : 'Баталгаажаагүй захиалга байхгүй'}</h3>
                            <p>{orderSubTab === 'confirmed' ? 'Төлбөр бататгаажсан VIP захиалгууд энд харагдана' : 'Төлбөр хүлээгдэж буй VIP захиалгууд энд харагдана (24ц дотор устгагдана)'}</p>
                        </div>
                    ) : (
                        (filtered as VipOrder[]).map(order => (
                            <div key={order.id} className={`membership-order-card ${order.paymentStatus}`}>
                                <div className="membership-order-left">
                                    <div className="membership-order-avatar">
                                        <Crown size={18} />
                                    </div>
                                    <div className="membership-order-info">
                                        <div className="membership-order-top">
                                            <span className="membership-order-number">{order.orderNumber}</span>
                                            {order.createdAt && (
                                                <span className="membership-order-date">
                                                    {format(order.createdAt, 'MM/dd HH:mm')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="membership-order-customer">{order.customerName || order.customerPhone}</div>
                                        <div className="membership-order-phone">
                                            <Phone size={12} /> {order.customerPhone}
                                        </div>
                                    </div>
                                </div>
                                <div className="membership-order-meta">
                                    <div className="membership-order-items">
                                        {order.items.map((it, i) => (
                                            <span key={i} className="membership-order-item-name">{it.name}</span>
                                        ))}
                                    </div>
                                    <div className="membership-order-amount">₮{order.total.toLocaleString()}</div>
                                </div>
                                <div className="membership-order-status">
                                {order.paymentStatus === 'paid' ? (
                                        <span className="membership-badge paid">
                                            <CheckCircle size={13} /> Баталгаажсан
                                        </span>
                                    ) : (
                                        <div className="membership-unpaid-info">
                                            <button
                                                className="membership-confirm-btn"
                                                onClick={() => handleConfirmPayment(order)}
                                                disabled={confirming === order.id}
                                            >
                                                {confirming === order.id ? '...' : '✅ Баталгаажуулах'}
                                            </button>
                                            <span className="membership-auto-delete-timer">
                                                <Timer size={11} /> {getTimeRemaining(order.createdAt)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="membership-members-list">
                    {(filtered as MembershipRecord[]).length === 0 ? (
                        <div className="membership-empty">
                            <div className="membership-empty-icon"><Users size={32} /></div>
                            <h3>Гишүүд байхгүй</h3>
                            <p>VIP гишүүнчлэл идэвхжсэн хэрэглэгчид энд харагдана</p>
                        </div>
                    ) : (
                        (filtered as MembershipRecord[]).map(m => {
                            const daysLeft = Math.max(0, Math.ceil((m.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                            return (
                                <div key={m.id} className={`membership-member-card ${m.status}`}>
                                    <div className="membership-member-left">
                                        <div className={`membership-member-avatar ${m.status}`}>
                                            <Crown size={18} />
                                        </div>
                                        <div className="membership-member-info">
                                            <div className="membership-member-phone">
                                                <Phone size={13} /> {m.customerPhone}
                                            </div>
                                            <div className="membership-member-dates">
                                                <Calendar size={12} />
                                                {format(m.purchasedAt, 'yyyy.MM.dd')} — {format(m.expiresAt, 'yyyy.MM.dd')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="membership-member-meta">
                                        <div className="membership-member-amount">₮{m.amountPaid.toLocaleString()}</div>
                                        <span className={`membership-badge ${m.status}`}>
                                            {m.status === 'active' ? (
                                                <><CheckCircle size={13} /> {daysLeft} хоног</>
                                            ) : (
                                                <><AlertCircle size={13} /> Дууссан</>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            </div>{/* /vip-card */}
        </div>
    );
}
