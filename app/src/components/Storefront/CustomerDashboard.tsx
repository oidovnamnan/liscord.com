import { useState, useEffect } from 'react';
import { X, User, Crown, Package, MapPin, Bell, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Business } from '../../types';
import { Timestamp } from 'firebase/firestore';

interface CustomerDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    business: Business;
    phone: string;
    onOpenMembership?: () => void;
}

interface MembershipDetail {
    id: string;
    categoryId: string;
    categoryName?: string;
    expiresAt: Date;
    purchasedAt: Date;
    amountPaid: number;
    status: 'active' | 'expired';
    daysRemaining: number;
}

interface OrderItem {
    id: string;
    orderNumber?: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: Date;
    items?: { name: string; quantity: number; price: number }[];
}

interface CustomerAddress {
    district: string;
    subDistrict: string;
    building: string;
    floor: string;
    entrance: string;
    doorCode: string;
    notes: string;
}

type TabKey = 'profile' | 'orders' | 'address' | 'notifications';

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
    { key: 'profile', label: 'Бүртгэл', icon: User },
    { key: 'orders', label: 'Захиалга', icon: Package },
    { key: 'address', label: 'Хаяг', icon: MapPin },
    { key: 'notifications', label: 'Мэдэгдэл', icon: Bell },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Хүлээгдэж буй', color: '#e67e22', bg: '#fef3e2' },
    processing: { label: 'Бэлтгэж байна', color: '#3498db', bg: '#ebf5fb' },
    paid: { label: 'Төлбөр хийгдсэн', color: '#27ae60', bg: '#eafaf1' },
    delivered: { label: 'Хүргэгдсэн', color: '#2ecc71', bg: '#e8f8f0' },
    cancelled: { label: 'Цуцлагдсан', color: '#e74c3c', bg: '#fdecea' },
};

export function CustomerDashboard({ isOpen, onClose, business, phone, onOpenMembership }: CustomerDashboardProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('profile');
    const [memberships, setMemberships] = useState<MembershipDetail[]>([]);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [address, setAddress] = useState<CustomerAddress>({
        district: '', subDistrict: '', building: '', floor: '', entrance: '', doorCode: '', notes: ''
    });
    const [loadingMemberships, setLoadingMemberships] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [addressSaved, setAddressSaved] = useState(false);

    // Load memberships
    useEffect(() => {
        if (!isOpen || !phone || !business?.id) return;
        loadMemberships();
    }, [isOpen, phone, business?.id]);

    // Load address from localStorage
    useEffect(() => {
        if (!business?.id || !phone) return;
        const saved = localStorage.getItem(`customer_address_${business.id}_${phone}`);
        if (saved) {
            try { setAddress(JSON.parse(saved)); } catch { /* ignore */ }
        }
    }, [business?.id, phone]);

    const loadMemberships = async () => {
        if (!business?.id || !phone) return;
        setLoadingMemberships(true);
        try {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const { db } = await import('../../services/firebase');
            const ref = collection(db, 'businesses', business.id, 'memberships');
            const q = query(ref, where('customerPhone', '==', phone.replace(/[^\d]/g, '')));
            const snap = await getDocs(q);
            const now = new Date();
            const details: MembershipDetail[] = snap.docs.map(d => {
                const data = d.data();
                const expiresAt = data.expiresAt instanceof Timestamp
                    ? data.expiresAt.toDate()
                    : new Date(data.expiresAt);
                const purchasedAt = data.purchasedAt instanceof Timestamp
                    ? data.purchasedAt.toDate()
                    : data.purchasedAt ? new Date(data.purchasedAt) : new Date();
                const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                return {
                    id: d.id,
                    categoryId: data.categoryId,
                    expiresAt,
                    purchasedAt,
                    amountPaid: data.amountPaid || 0,
                    status: (expiresAt > now ? 'active' : 'expired') as 'active' | 'expired',
                    daysRemaining,
                };
            }).sort((a, b) => (a.status === 'active' ? -1 : 1));
            setMemberships(details);
        } catch (err) {
            console.error('Load memberships:', err);
        } finally {
            setLoadingMemberships(false);
        }
    };

    // Load orders
    useEffect(() => {
        if (!isOpen || !phone || !business?.id || activeTab !== 'orders') return;
        loadOrders();
    }, [isOpen, phone, business?.id, activeTab]);

    const loadOrders = async () => {
        if (!business?.id || !phone) return;
        setLoadingOrders(true);
        try {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const { db } = await import('../../services/firebase');
            const ref = collection(db, 'businesses', business.id, 'orders');
            const normalizedPhone = phone.replace(/[^\d]/g, '');
            const q = query(ref, where('customerPhone', '==', normalizedPhone));
            const snap = await getDocs(q);
            const items: OrderItem[] = snap.docs.map(d => {
                const data = d.data();
                const createdAt = data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate()
                    : data.createdAt ? new Date(data.createdAt) : new Date();
                return {
                    id: d.id,
                    orderNumber: data.orderNumber || d.id.slice(-6).toUpperCase(),
                    totalAmount: data.totalAmount || 0,
                    paymentStatus: data.paymentStatus || 'pending',
                    createdAt,
                    items: data.items || [],
                };
            }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setOrders(items);
        } catch (err) {
            console.error('Load orders:', err);
        } finally {
            setLoadingOrders(false);
        }
    };

    const saveAddress = () => {
        if (!business?.id || !phone) return;
        localStorage.setItem(`customer_address_${business.id}_${phone}`, JSON.stringify(address));
        // Also save to Firestore for cross-device access
        (async () => {
            try {
                const { doc, setDoc } = await import('firebase/firestore');
                const { db } = await import('../../services/firebase');
                const addrRef = doc(db, 'businesses', business.id, 'customer_addresses', phone.replace(/[^\d]/g, ''));
                await setDoc(addrRef, { ...address, phone: phone.replace(/[^\d]/g, ''), updatedAt: new Date().toISOString() }, { merge: true });
            } catch { /* silent */ }
        })();
        setAddressSaved(true);
        setTimeout(() => setAddressSaved(false), 2000);
    };

    const formatDate = (d: Date) => {
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    const formatCurrency = (n: number) => `₮${n.toLocaleString()}`;

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="cd-backdrop" onClick={onClose} />
            {/* Drawer */}
            <div className="cd-drawer">
                {/* Header */}
                <div className="cd-header">
                    <div className="cd-header-user">
                        <div className="cd-avatar">
                            <User size={22} />
                        </div>
                        <div>
                            <div className="cd-phone">{phone}</div>
                            <div className="cd-member-badge">
                                {memberships.some(m => m.status === 'active')
                                    ? <><Crown size={12} /> VIP Гишүүн</>
                                    : 'Хэрэглэгч'}
                            </div>
                        </div>
                    </div>
                    <button className="cd-close" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div className="cd-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`cd-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="cd-content">
                    {activeTab === 'profile' && (
                        <div className="cd-section">
                            <h3 className="cd-section-title">VIP Гишүүнчлэл</h3>
                            {loadingMemberships ? (
                                <div className="cd-loading">Ачаалж байна...</div>
                            ) : memberships.length === 0 ? (
                                <div className="cd-empty">
                                    <Crown size={32} strokeWidth={1.5} style={{ color: '#ccc' }} />
                                    <p>Идэвхтэй гишүүнчлэл байхгүй</p>
                                    {onOpenMembership && (
                                        <button className="cd-btn-primary" onClick={() => { onClose(); onOpenMembership(); }}>
                                            Гишүүнчлэл авах
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="cd-membership-list">
                                    {memberships.map(m => (
                                        <div key={m.id} className={`cd-membership-card ${m.status}`}>
                                            <div className="cd-membership-header">
                                                <div className="cd-membership-status">
                                                    {m.status === 'active' ? (
                                                        <><CheckCircle size={16} /> Идэвхтэй</>
                                                    ) : (
                                                        <><AlertTriangle size={16} /> Дууссан</>
                                                    )}
                                                </div>
                                                {m.status === 'active' && (
                                                    <div className="cd-days-remaining">
                                                        {m.daysRemaining} хоног үлдсэн
                                                    </div>
                                                )}
                                            </div>
                                            <div className="cd-membership-details">
                                                <div className="cd-detail-row">
                                                    <span>Эхэлсэн</span>
                                                    <span>{formatDate(m.purchasedAt)}</span>
                                                </div>
                                                <div className="cd-detail-row">
                                                    <span>Дуусах</span>
                                                    <span>{formatDate(m.expiresAt)}</span>
                                                </div>
                                                <div className="cd-detail-row">
                                                    <span>Төлсөн</span>
                                                    <span>{formatCurrency(m.amountPaid)}</span>
                                                </div>
                                            </div>
                                            {m.status === 'expired' && onOpenMembership && (
                                                <button className="cd-btn-renew" onClick={() => { onClose(); onOpenMembership(); }}>
                                                    <RefreshCw size={14} /> Сунгах
                                                </button>
                                            )}
                                            {m.status === 'active' && (
                                                <div className="cd-progress-bar">
                                                    <div className="cd-progress-fill" style={{
                                                        width: `${Math.max(5, (m.daysRemaining / 365) * 100)}%`
                                                    }} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="cd-section">
                            <h3 className="cd-section-title">Захиалгууд</h3>
                            {loadingOrders ? (
                                <div className="cd-loading">Ачаалж байна...</div>
                            ) : orders.length === 0 ? (
                                <div className="cd-empty">
                                    <Package size={32} strokeWidth={1.5} style={{ color: '#ccc' }} />
                                    <p>Захиалга байхгүй</p>
                                </div>
                            ) : (
                                <div className="cd-orders-list">
                                    {orders.map(order => {
                                        const statusInfo = STATUS_LABELS[order.paymentStatus] || STATUS_LABELS.pending;
                                        return (
                                            <div key={order.id} className="cd-order-card">
                                                <div className="cd-order-top">
                                                    <div className="cd-order-number">#{order.orderNumber}</div>
                                                    <div className="cd-order-status" style={{
                                                        color: statusInfo.color,
                                                        background: statusInfo.bg
                                                    }}>
                                                        {statusInfo.label}
                                                    </div>
                                                </div>
                                                <div className="cd-order-info">
                                                    <span className="cd-order-date">
                                                        <Clock size={13} /> {formatDate(order.createdAt)}
                                                    </span>
                                                    <span className="cd-order-amount">{formatCurrency(order.totalAmount)}</span>
                                                </div>
                                                {order.items && order.items.length > 0 && (
                                                    <div className="cd-order-items">
                                                        {order.items.slice(0, 3).map((item, idx) => (
                                                            <div key={idx} className="cd-order-item">
                                                                <span>{item.name}</span>
                                                                <span>x{item.quantity}</span>
                                                            </div>
                                                        ))}
                                                        {order.items.length > 3 && (
                                                            <div className="cd-order-more">+{order.items.length - 3} бараа</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'address' && (
                        <div className="cd-section">
                            <h3 className="cd-section-title">Хүргэлтийн хаяг</h3>
                            <div className="cd-address-form">
                                <div className="cd-form-group">
                                    <label>Дүүрэг</label>
                                    <input value={address.district} onChange={e => setAddress(a => ({ ...a, district: e.target.value }))} placeholder="Хан-Уул" />
                                </div>
                                <div className="cd-form-group">
                                    <label>Хороо</label>
                                    <input value={address.subDistrict} onChange={e => setAddress(a => ({ ...a, subDistrict: e.target.value }))} placeholder="1-р хороо" />
                                </div>
                                <div className="cd-form-row">
                                    <div className="cd-form-group">
                                        <label>Байр / Гэр</label>
                                        <input value={address.building} onChange={e => setAddress(a => ({ ...a, building: e.target.value }))} placeholder="Skytel Tower" />
                                    </div>
                                    <div className="cd-form-group">
                                        <label>Давхар</label>
                                        <input value={address.floor} onChange={e => setAddress(a => ({ ...a, floor: e.target.value }))} placeholder="12" />
                                    </div>
                                </div>
                                <div className="cd-form-row">
                                    <div className="cd-form-group">
                                        <label>Орц</label>
                                        <input value={address.entrance} onChange={e => setAddress(a => ({ ...a, entrance: e.target.value }))} placeholder="2" />
                                    </div>
                                    <div className="cd-form-group">
                                        <label>Хаалганы код</label>
                                        <input value={address.doorCode} onChange={e => setAddress(a => ({ ...a, doorCode: e.target.value }))} placeholder="1234#" />
                                    </div>
                                </div>
                                <div className="cd-form-group">
                                    <label>Нэмэлт тэмдэглэл</label>
                                    <textarea value={address.notes} onChange={e => setAddress(a => ({ ...a, notes: e.target.value }))} placeholder="Барилгын урд талд зогсоно уу..." rows={3} />
                                </div>
                                <button className="cd-btn-primary" onClick={saveAddress}>
                                    {addressSaved ? '✓ Хадгаллаа!' : 'Хадгалах'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="cd-section">
                            <h3 className="cd-section-title">Мэдэгдэл</h3>
                            <div className="cd-notifications">
                                {memberships.filter(m => m.status === 'active' && m.daysRemaining <= 30).map(m => (
                                    <div key={`exp-${m.id}`} className="cd-notification warn">
                                        <AlertTriangle size={16} />
                                        <div>
                                            <div className="cd-notif-title">VIP хугацаа дуусахад {m.daysRemaining} хоног</div>
                                            <div className="cd-notif-time">{formatDate(m.expiresAt)} хүртэл</div>
                                        </div>
                                    </div>
                                ))}
                                {memberships.filter(m => m.status === 'active').map(m => (
                                    <div key={`active-${m.id}`} className="cd-notification success">
                                        <CheckCircle size={16} />
                                        <div>
                                            <div className="cd-notif-title">VIP гишүүнчлэл идэвхтэй</div>
                                            <div className="cd-notif-time">{formatDate(m.purchasedAt)}-д бүртгэгдсэн</div>
                                        </div>
                                    </div>
                                ))}
                                {orders.filter(o => o.paymentStatus === 'paid').slice(0, 3).map(o => (
                                    <div key={`order-${o.id}`} className="cd-notification info">
                                        <Package size={16} />
                                        <div>
                                            <div className="cd-notif-title">Захиалга #{o.orderNumber} төлбөр баталгаажсан</div>
                                            <div className="cd-notif-time">{formatDate(o.createdAt)}</div>
                                        </div>
                                    </div>
                                ))}
                                {memberships.length === 0 && orders.length === 0 && (
                                    <div className="cd-empty">
                                        <Bell size={32} strokeWidth={1.5} style={{ color: '#ccc' }} />
                                        <p>Мэдэгдэл байхгүй</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="cd-footer">
                    <button className="cd-btn-logout" onClick={() => {
                        localStorage.removeItem(`membership_phone_${business.id}`);
                        onClose();
                        window.location.reload();
                    }}>
                        Гарах
                    </button>
                </div>
            </div>
        </>
    );
}
