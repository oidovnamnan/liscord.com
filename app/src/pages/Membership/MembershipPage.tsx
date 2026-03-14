/**
 * VIP Гишүүнчлэл Page
 * 
 * Shows VIP membership orders (orderNumber starts with VIP-) 
 * and active/expired memberships for management.
 */
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore } from '../../store';
import {
    Crown, Search, Clock, CheckCircle, AlertCircle, Users,
    Phone, Calendar, Package, Filter, ChevronDown
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

export function MembershipPage() {
    const { business } = useBusinessStore();
    const [orders, setOrders] = useState<VipOrder[]>([]);
    const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState<'orders' | 'members'>('orders');

    // Load VIP orders
    useEffect(() => {
        if (!business?.id) return;
        const q = query(
            collection(db, 'businesses', business.id, 'orders'),
            where('isDeleted', '==', false),
        );
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: VipOrder[] = [];
            snap.docs.forEach(d => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = d.data() as any;
                if (!data.orderNumber?.startsWith('VIP-')) return;
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : undefined);
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
                });
            });
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

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (tab === 'orders') {
            return orders.filter(o =>
                !q || o.orderNumber.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                o.customerPhone.includes(q)
            );
        }
        return memberships.filter(m =>
            !q || m.customerPhone.includes(q) || m.categoryId.toLowerCase().includes(q)
        );
    }, [tab, orders, memberships, searchQuery]);

    const stats = useMemo(() => ({
        totalOrders: orders.length,
        paidOrders: orders.filter(o => o.paymentStatus === 'paid').length,
        unpaidOrders: orders.filter(o => o.paymentStatus === 'unpaid').length,
        activeMembers: memberships.filter(m => m.status === 'active').length,
        expiredMembers: memberships.filter(m => m.status === 'expired').length,
        totalRevenue: orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
    }), [orders, memberships]);

    return (
        <div className="membership-page">
            {/* Header */}
            <div className="page-header-row" style={{ marginBottom: 24 }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Crown size={26} /> VIP Гишүүнчлэл
                    </h1>
                    <p className="page-subtitle">Гишүүнчлэлийн захиалга болон идэвхтэй гишүүдийг удирдах</p>
                </div>
            </div>

            {/* Stats */}
            <div className="membership-stats">
                <div className="membership-stat-card">
                    <div className="membership-stat-icon" style={{ background: 'rgba(108, 92, 231, 0.1)', color: 'var(--primary)' }}>
                        <Package size={20} />
                    </div>
                    <div>
                        <div className="membership-stat-value">{stats.totalOrders}</div>
                        <div className="membership-stat-label">Нийт захиалга</div>
                    </div>
                </div>
                <div className="membership-stat-card">
                    <div className="membership-stat-icon" style={{ background: 'rgba(0, 184, 148, 0.1)', color: '#00b894' }}>
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <div className="membership-stat-value">{stats.paidOrders}</div>
                        <div className="membership-stat-label">Төлсөн</div>
                    </div>
                </div>
                <div className="membership-stat-card">
                    <div className="membership-stat-icon" style={{ background: 'rgba(225, 112, 85, 0.1)', color: '#e17055' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <div className="membership-stat-value">{stats.unpaidOrders}</div>
                        <div className="membership-stat-label">Хүлээгдэж буй</div>
                    </div>
                </div>
                <div className="membership-stat-card">
                    <div className="membership-stat-icon" style={{ background: 'rgba(253, 203, 110, 0.15)', color: '#f39c12' }}>
                        <Users size={20} />
                    </div>
                    <div>
                        <div className="membership-stat-value">{stats.activeMembers}</div>
                        <div className="membership-stat-label">Идэвхтэй гишүүн</div>
                    </div>
                </div>
            </div>

            {/* Tabs + Search */}
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
                            <h3>VIP захиалга байхгүй</h3>
                            <p>VIP гишүүнчлэлийн захиалга ирэхэд энд харагдана</p>
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
                                    <span className={`membership-badge ${order.paymentStatus}`}>
                                        {order.paymentStatus === 'paid' ? (
                                            <><CheckCircle size={13} /> Төлсөн</>
                                        ) : (
                                            <><Clock size={13} /> Хүлээгдэж буй</>
                                        )}
                                    </span>
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
        </div>
    );
}
