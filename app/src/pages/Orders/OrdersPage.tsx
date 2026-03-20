import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, MoreVertical, Loader2, X, User, Package, CreditCard, Trash2, CheckSquare, Settings, ShoppingCart, List, LayoutGrid, ShieldAlert } from 'lucide-react';
import '../Inventory/InventoryPage.css';
import { useBusinessStore, useAuthStore } from '../../store';
import { toast } from 'react-hot-toast';
import {
    productService,
    orderService,
    sourceService,
    customerService,
    orderStatusService,
    cargoService
} from '../../services/db';
import type { OrderSource, SocialAccount, OrderStatusConfig, CargoType } from '../../types';
import { OrderDetailModal } from './OrderDetailModal';
import { SendToProviderModal } from './SendToProviderModal';
import type { Order } from '../../types';
import { fmt } from '../../utils/format';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionGate } from '../../components/common/PermissionGate';
import { SecurityModal } from '../../components/common/SecurityModal';
import './OrdersPage.css';


const paymentConfig: Record<string, { label: string; cls: string }> = {
    unpaid: { label: 'Төлөгдөөгүй', cls: 'badge-unpaid' },
    partial: { label: 'Хэсэгчлэн', cls: 'badge-partial' },
    paid: { label: 'Төлөгдсөн', cls: 'badge-paid' },
};

const sourceIcons: Record<string, string> = {
    facebook: '🔵',
    instagram: '📸',
    tiktok: '🎵',
    website: '🌐',
    phone: '📞',
    pos: '🏪',
    other: '📦',
};

export function OrdersPage() {
    const { business } = useBusinessStore();
    const { hasPermission } = usePermissions();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [statuses, setStatuses] = useState<OrderStatusConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeletePin, setShowDeletePin] = useState(false);
    const [pendingDeleteAction, setPendingDeleteAction] = useState<'single' | 'bulk' | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
    const [showSendToProviderModal, setShowSendToProviderModal] = useState(false);
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
    const [stats, setStats] = useState({ revenue: 0, new: 0, processing: 0, delivered: 0 });
    const { user } = useAuthStore();
    const menuRef = useRef<HTMLDivElement>(null);
    const bulkStatusRef = useRef<HTMLSelectElement>(null);
    const [ordersLimit, setOrdersLimit] = useState(50);
    const [hasMore, setHasMore] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
        return (localStorage.getItem('liscord_ordersView') as 'table' | 'card') || 'table';
    });

    const handleViewChange = (mode: 'table' | 'card') => {
        setViewMode(mode);
        localStorage.setItem('liscord_ordersView', mode);
    };

    useEffect(() => {
        // Calculate stats — ONLY from paid/confirmed orders (unpaid = fake)
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const paidOrders = orders.filter(o => !o.isDeleted && (o.paymentStatus === 'paid' || o.paymentStatus === 'partial') && o.orderType !== 'membership');

        const todayPaid = paidOrders.filter(o => {
            const date = o.createdAt instanceof Date ? o.createdAt : new Date();
            return date >= startOfToday;
        });

        const newStats = {
            revenue: todayPaid.reduce((sum, o) => sum + (o.financials?.totalAmount || 0), 0),
            new: paidOrders.filter(o => o.status === 'new').length,
            processing: paidOrders.filter(o => o.status === 'confirmed' || o.status === 'sourced').length,
            delivered: paidOrders.filter(o => o.status === 'arrived').length
        };
        setStats(newStats);
    }, [orders]);

    useEffect(() => {
        if (!business?.id) return;

        const unOrder = orderService.subscribeOrders(business.id, (data) => {
            setOrders(data);
            setHasMore(data.length === ordersLimit);
            setLoading(false);
        }, statusFilter, ordersLimit);

        const unStatus = orderStatusService.subscribeStatuses(business.id, (data) => {
            setStatuses(data);
        });

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            unOrder();
            unStatus();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [business?.id, statusFilter, ordersLimit]);

    // ═══ Auto-delete unpaid orders older than configured hours ═══
    const autoDeletedRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        if (!business?.id || orders.length === 0) return;
        const expiryHours = business.settings?.unpaidOrderExpiryHours ?? 24;
        if (expiryHours <= 0) return; // 0 means disabled
        const expiryMs = expiryHours * 60 * 60 * 1000;
        const now = Date.now();

        const expiredOrders = orders.filter(o =>
            !o.isDeleted &&
            o.paymentStatus === 'unpaid' &&
            o.createdAt instanceof Date &&
            (now - o.createdAt.getTime()) > expiryMs &&
            !autoDeletedRef.current.has(o.id)
        );

        if (expiredOrders.length === 0) return;

        (async () => {
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
            const { db: fireDb } = await import('../../services/firebase');
            for (const order of expiredOrders) {
                autoDeletedRef.current.add(order.id);
                try {
                    await updateDoc(doc(fireDb, 'businesses', business.id, 'orders', order.id), {
                        isDeleted: true,
                        cancelReason: `Төлбөр төлөгдөөгүй ${expiryHours}ц — автомат устгагдсан`,
                        deletedReason: 'auto_expired_unpaid',
                        updatedAt: serverTimestamp(),
                    });
                    console.log(`[AutoDelete] Order #${order.orderNumber} expired after ${expiryHours}h`);
                } catch (e) {
                    console.warn('[AutoDelete] Failed:', order.id, e);
                }
            }
        })();
    }, [orders, business?.id, business?.settings?.unpaidOrderExpiryHours]);

    const filtered = orders.filter(o => {
        const matchSearch = !search ||
            o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.phone.includes(search);

        if (search) return matchSearch;

        // Date Filter logic
        if (dateFilter !== 'all') {
            const date = o.createdAt instanceof Date ? o.createdAt : new Date();
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (dateFilter === 'today' && date < startOfToday) return false;

            if (dateFilter === 'yesterday') {
                const startOfYesterday = new Date(startOfToday);
                startOfYesterday.setDate(startOfYesterday.getDate() - 1);
                const endOfYesterday = new Date(startOfToday);
                if (date < startOfYesterday || date >= endOfYesterday) return false;
            }

            if (dateFilter === 'week') {
                const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                if (date < weekAgo) return false;
            }

            if (dateFilter === 'month') {
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                if (date < monthAgo) return false;
            }
        }

        // 'cancelled' tab shows both explicitly deleted orders and those with 'cancelled' status
        if (statusFilter === 'cancelled') {
            return matchSearch && (o.isDeleted || o.status?.toLowerCase() === 'cancelled');
        }

        // 'all' shows absolutely everything
        if (statusFilter === 'all') return matchSearch;

        // Other statuses only show non-deleted matching orders
        return matchSearch && !o.isDeleted && o.status?.toLowerCase() === statusFilter.toLowerCase();
    });

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const next = new Set(selectedOrderIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedOrderIds(next);
    };

    const toggleAll = () => {
        if (selectedOrderIds.size === filtered.length) {
            setSelectedOrderIds(new Set());
        } else {
            setSelectedOrderIds(new Set(filtered.map(o => o.id)));
        }
    };

    const startBulkDelete = () => {
        if (!business || selectedOrderIds.size === 0) return;
        setPendingDeleteAction('bulk');
        setShowDeletePin(true);
    };

    const executeBulkDelete = async () => {
        if (!business || selectedOrderIds.size === 0) return;
        setLoading(true);
        try {
            await orderService.batchDeleteOrders(business.id, Array.from(selectedOrderIds), 'Олноор устгав', user);
            setSelectedOrderIds(new Set());
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
            toast.success('Захиалгуудыг устгалаа');
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            toast.error('Алдаа: ' + (e as any).message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!business) return;
        setLoading(true);
        try {
            await orderService.deleteOrder(business.id, id, deleteReason, user);
            setDeleteOrderId(null);
            setDeleteReason('');
            setShowDeleteModal(false);
            toast.success('Захиалга устгагдлаа');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
                {/* ── Premium Hero ── */}
                <div className="ord-hero">
                    <div className="ord-hero-top">
                        <div className="ord-hero-left">
                            <div className="ord-hero-icon"><ShoppingCart size={24} /></div>
                            <div>
                                <h2 className="ord-hero-title">Борлуулалтын Захиалга</h2>
                                <div className="ord-hero-desc">{loading ? 'Уншиж байна...' : `Нийт ${orders.filter(o => !o.isDeleted && o.paymentStatus !== 'unpaid').length} баталгаажсан захиалга`}</div>
                            </div>
                        </div>
                        <PermissionGate permission="orders.create">
                            <button className="ord-hero-btn" onClick={() => setShowCreate(true)}>
                                <Plus size={18} />
                                <span>Шинэ захиалга</span>
                            </button>
                        </PermissionGate>
                    </div>
                    <div className="ord-hero-stats">
                        <div className="ord-hero-stat">
                            <div className="ord-hero-stat-value">{fmt(stats.revenue)}</div>
                            <div className="ord-hero-stat-label">Өнөөдрийн орлого (баталгаажсан)</div>
                        </div>
                        <div className="ord-hero-stat">
                            <div className="ord-hero-stat-value">{stats.new}</div>
                            <div className="ord-hero-stat-label">Шинэ захиалга</div>
                        </div>
                        <div className="ord-hero-stat">
                            <div className="ord-hero-stat-value">{stats.processing}</div>
                            <div className="ord-hero-stat-label">Захиалагдсан</div>
                        </div>
                        <div className="ord-hero-stat">
                            <div className="ord-hero-stat-value">{stats.delivered}</div>
                            <div className="ord-hero-stat-label">Бараа ирсэн</div>
                        </div>
                    </div>
                </div>

                {/* ── Card Container (toolbar + content) ── */}
                <div className="ord-card">
                {/* Toolbar: Search + Filters */}
                <div className="orders-toolbar animate-fade-in">
                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input
                            className="input orders-search-input"
                            placeholder="Захиалга, нэр, утас хайх..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="orders-filters" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                            className="input"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ minWidth: 140, height: 42, borderRadius: 12, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0 36px 0 14px', background: 'var(--surface-1)', border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                        >
                            {statuses.filter(s => s.isActive || s.id === 'cancelled' || s.id === 'all').map(s => {
                                const count = s.id === 'all'
                                    ? orders.length
                                    : s.id === 'cancelled'
                                        ? orders.filter(o => o.isDeleted || o.status?.toLowerCase() === 'cancelled').length
                                        : orders.filter(o => o.status?.toLowerCase() === s.id.toLowerCase() && !o.isDeleted).length;
                                return (
                                    <option key={s.id} value={s.id}>
                                        {s.label} ({count})
                                    </option>
                                );
                            })}
                        </select>
                        <select
                            className="input"
                            value={dateFilter}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            style={{ minWidth: 120, height: 42, borderRadius: 12, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0 36px 0 14px', background: 'var(--surface-1)', border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                        >
                            <option value="all">Бүгд</option>
                            <option value="today">Өнөөдөр</option>
                            <option value="yesterday">Өчигдөр</option>
                            <option value="week">7 хоног</option>
                        </select>
                        <div className="ot-view-toggle">
                            <button
                                className={`ot-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => handleViewChange('table')}
                            >
                                <List size={18} />
                            </button>
                            <button
                                className={`ot-view-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => handleViewChange('card')}
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orders List — Table or Card View */}
                {loading ? (
                    <div className="loading-state">
                        <Loader2 size={32} className="animate-spin" />
                        <p>Захиалга ачаалж байна...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3>Захиалга олдсонгүй</h3>
                        <p>Хайлтын нөхцөлөө өөрчилнө үү</p>
                    </div>
                ) : viewMode === 'table' ? (
                    /* ═══ TABLE VIEW ═══ */
                    <div className="ot-container animate-fade-in">
                        <table className="ot-table">
                            <thead>
                                <tr>
                                    <th className="ot-th-check">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrderIds.size === filtered.length && filtered.length > 0}
                                            onChange={toggleAll}
                                            className="ot-checkbox"
                                        />
                                    </th>
                                    <th>Захиалга</th>
                                    <th>Статус</th>
                                    <th>Харилцагч</th>
                                    <th>Бараа</th>
                                    <th className="ot-th-right">Дүн</th>
                                    <th>Төлбөр</th>
                                    <th>Огноо</th>
                                    <th className="ot-th-actions"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(order => {
                                    const statusConf = statuses.find(s => s.id.toLowerCase() === order.status?.toLowerCase());
                                    const statusColor = order.isDeleted ? '#ef4444' : (statusConf?.color || '#3b82f6');
                                    const statusLabel = order.isDeleted ? 'Цуцлагдсан' : (statusConf?.label || order.status);
                                    const itemSummary = order.items.length > 0
                                        ? order.items[0].name + (order.items.length > 1 ? ` +${order.items.length - 1}` : '')
                                        : '—';
                                    const createdAt = order.createdAt instanceof Date ? order.createdAt : null;

                                    return (
                                        <tr
                                            key={order.id}
                                            className={`ot-row ${selectedOrderIds.has(order.id) ? 'ot-row-selected' : ''} ${order.isDeleted ? 'ot-row-deleted' : ''}`}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <td className="ot-td-check">
                                                <input
                                                    type="checkbox"
                                                    className="ot-checkbox"
                                                    checked={selectedOrderIds.has(order.id)}
                                                    onChange={() => { }}
                                                    onClick={(e) => toggleSelection(e, order.id)}
                                                />
                                            </td>
                                            <td>
                                                <span className="ot-order-number">#{order.orderNumber}</span>
                                            </td>
                                            <td>
                                                <span
                                                    className="ot-status-badge"
                                                    style={{
                                                        background: statusColor + '18',
                                                        color: statusColor,
                                                        border: `1px solid ${statusColor}30`
                                                    }}
                                                >
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="ot-customer">
                                                    <span className="ot-customer-name">{order.customer.name}</span>
                                                    {order.customer.phone && (
                                                        <span className="ot-customer-phone">{order.customer.phone}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="ot-items-summary" title={order.items.map(i => i.name).join(', ')}>
                                                    {itemSummary}
                                                </span>
                                            </td>
                                            <td className="ot-td-right">
                                                <span className="ot-amount">{fmt(order.financials.totalAmount)}</span>
                                            </td>
                                            <td>
                                                <span className={`ot-payment-badge ${order.paymentStatus}`}>
                                                    {paymentConfig[order.paymentStatus]?.label || order.paymentStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="ot-date">
                                                    {createdAt
                                                        ? `${createdAt.getMonth() + 1}/${createdAt.getDate()} ${createdAt.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}`
                                                        : '—'}
                                                </span>
                                                {order.source && (
                                                    <span className="ot-source">{sourceIcons[order.source] || '📦'}</span>
                                                )}
                                            </td>
                                            <td className="ot-td-actions">
                                                <div className="order-actions-dropdown" ref={openMenuId === order.id ? menuRef : null}>
                                                    <button
                                                        className={`ot-action-btn ${openMenuId === order.id ? 'active' : ''}`}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(openMenuId === order.id ? null : order.id);
                                                        }}
                                                    >
                                                        <MoreVertical size={14} />
                                                    </button>
                                                    {openMenuId === order.id && (
                                                        <div className="pro-dropdown-menu" onClick={e => e.stopPropagation()}>
                                                            <button className="pro-dropdown-item" onClick={() => { setSelectedOrder(order); setOpenMenuId(null); }}>
                                                                <Package size={14} /> Дэлгэрэнгүй
                                                            </button>
                                                            {hasPermission('orders.change_status') && (
                                                                <button className="pro-dropdown-item" onClick={() => { setOpenMenuId(null); }}>
                                                                    <CheckSquare size={14} /> Статус солих
                                                                </button>
                                                            )}
                                                            {hasPermission('orders.delete') && (
                                                                <>
                                                                    <hr />
                                                                    <button
                                                                        className="pro-dropdown-item text-danger"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setDeleteOrderId(order.id);
                                                                            setPendingDeleteAction('single');
                                                                            setShowDeletePin(true);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                    >
                                                                        <Trash2 size={14} /> Устгах
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* ═══ CARD VIEW ═══ */
                    <div className="orders-list stagger-children animate-fade-in">
                        {filtered.map(order => {
                            const statusConf = statuses.find(s => s.id.toLowerCase() === order.status?.toLowerCase());
                            const statusColor = order.isDeleted ? '#ef4444' : (statusConf?.color || '#3b82f6');
                            const statusLabel = order.isDeleted ? 'Цуцлагдсан' : (statusConf?.label || order.status);

                            return (
                                <div
                                    key={order.id}
                                    className={`order-card pro-layout ${order.isDeleted ? 'is-deleted' : ''} stagger-item`}
                                    style={{ '--status-color': statusColor } as React.CSSProperties}
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <div className="pro-status-border"></div>
                                    <div className="order-card-inner">
                                        {/* Header */}
                                        <div className="pro-card-header">
                                            <div className="header-id-group">
                                                <input
                                                    type="checkbox"
                                                    className="order-checkbox"
                                                    checked={selectedOrderIds.has(order.id)}
                                                    onChange={() => { }}
                                                    onClick={(e) => toggleSelection(e, order.id)}
                                                />
                                                <span className="order-id">#{order.orderNumber}</span>
                                                <span
                                                    className="pro-badge"
                                                    style={{
                                                        background: statusColor + '20',
                                                        color: statusColor,
                                                        border: `1px solid ${statusColor}40`
                                                    }}
                                                >
                                                    {statusLabel}
                                                </span>
                                            </div>
                                            <div className="header-actions-group">
                                                <span className="pro-date">
                                                    {order.createdAt instanceof Date
                                                        ? `${order.createdAt.toLocaleDateString('mn-MN')} ${order.createdAt.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}`
                                                        : 'Саяхан'}
                                                </span>
                                                <div className="order-actions-dropdown" ref={openMenuId === order.id ? menuRef : null}>
                                                    <button
                                                        className={`pro-btn-ghost btn-icon ${openMenuId === order.id ? 'active' : ''}`}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(openMenuId === order.id ? null : order.id);
                                                        }}
                                                    >
                                                        <MoreVertical size={14} />
                                                    </button>
                                                    {openMenuId === order.id && (
                                                        <div className="pro-dropdown-menu" onClick={e => e.stopPropagation()}>
                                                            <button className="pro-dropdown-item" onClick={() => { setSelectedOrder(order); setOpenMenuId(null); }}>
                                                                <Package size={14} /> Дэлгэрэнгүй
                                                            </button>
                                                            {hasPermission('orders.change_status') && (
                                                                <button className="pro-dropdown-item" onClick={() => { setOpenMenuId(null); }}>
                                                                    <CheckSquare size={14} /> Статус солих
                                                                </button>
                                                            )}
                                                            {hasPermission('orders.delete') && (
                                                                <>
                                                                    <hr />
                                                                    <button
                                                                        className="pro-dropdown-item text-danger"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setDeleteOrderId(order.id);
                                                                            setPendingDeleteAction('single');
                                                                            setShowDeletePin(true);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                    >
                                                                        <Trash2 size={14} /> Устгах
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="pro-card-main">
                                            <div className="pro-product-listing">
                                                {order.items.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} className="pro-item-row">
                                                        <div className="pro-item-thumb">
                                                            {item.image ? <img src={item.image} alt="" /> : <Package size={16} />}
                                                        </div>
                                                        <div className="pro-item-info">
                                                            <span className="pro-item-name">{item.name}</span>
                                                            <div className="pro-item-meta">
                                                                {item.variant && <span className="pro-variant">{item.variant}</span>}
                                                                <span className="pro-qty">x{item.quantity}</span>
                                                            </div>
                                                        </div>
                                                        <div className="pro-item-price">{fmt(item.totalPrice)}</div>
                                                    </div>
                                                ))}
                                                {order.items.length > 2 && (
                                                    <div className="pro-items-overflow">
                                                        <Package size={12} /> +{order.items.length - 2} бараа
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Customer & Source */}
                                        <div className="pro-card-meta-bar">
                                            <div className="pro-meta-item">
                                                <User size={12} className="meta-icon" />
                                                <span className="pro-customer-name">{order.customer.name}</span>
                                                {order.customer.phone && <span className="pro-customer-phone">· {order.customer.phone}</span>}
                                            </div>
                                            {order.source && (
                                                <div className="pro-source-tag">
                                                    {sourceIcons[order.source] || '📦'} {order.source}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="pro-card-footer">
                                            <div className="pro-financial-summary">
                                                <div className="pro-total-label">НИЙТ ДҮН</div>
                                                <div className="pro-total-value">{fmt(order.financials.totalAmount)}</div>
                                            </div>
                                            <span className={`pro-payment-badge ${order.paymentStatus}`}>
                                                {paymentConfig[order.paymentStatus]?.label}
                                            </span>
                                        </div>
                                    </div>
                                    {order.isDeleted && order.cancelReason && (
                                        <div className="order-cancel-reason-hint" title={order.cancelReason}>
                                            🔒 {order.cancelReason}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {hasMore && orders.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <button
                            className="btn btn-secondary"
                            style={{ minWidth: '200px' }}
                            onClick={() => setOrdersLimit(prev => prev + 50)}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : `Дараагийн 50 (Одоо ${orders.length})`}
                        </button>
                    </div>
                )}
                </div>{/* /ord-card */}

                {/* Bulk Action Bar */}
                {selectedOrderIds.size > 0 && (
                    <div className="orders-bulk-action-bar animate-fade-in">
                        <div className="bulk-selection-info">
                            <span className="bulk-count">{selectedOrderIds.size}</span>
                            <span>сонгосон</span>
                            <button className="btn-text btn-sm" onClick={() => setSelectedOrderIds(new Set())}>✕</button>
                        </div>
                        <div className="bulk-actions">
                            {hasPermission('orders.manage_delivery') && (
                                <button className="btn btn-primary btn-sm gradient-btn" onClick={() => setShowSendToProviderModal(true)}>
                                    🚚 Илгээх
                                </button>
                            )}
                            {hasPermission('orders.change_status') && (
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowBulkStatusModal(true)}>
                                    <Settings size={14} /> Төлөв
                                </button>
                            )}
                            {hasPermission('orders.delete') && (
                                <button className="btn btn-danger btn-sm" onClick={startBulkDelete}>
                                    <Trash2 size={14} /> Устгах
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showSendToProviderModal && business && (
                <SendToProviderModal
                    orders={orders.filter(o => selectedOrderIds.has(o.id))}
                    onClose={() => setShowSendToProviderModal(false)}
                    onSuccess={() => {
                        setShowSendToProviderModal(false);
                        setSelectedOrderIds(new Set());
                    }}
                />
            )}

            {selectedOrder && business && (
                <OrderDetailModal
                    bizId={business.id}
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    statuses={statuses}
                />
            )}

            {/* ═══ Step 1: PIN Security Gate ═══ */}
            {showDeletePin && (
                <SecurityModal
                    title="🔒 Захиалга устгах баталгаажуулалт"
                    description={pendingDeleteAction === 'bulk'
                        ? `Сонгосон ${selectedOrderIds.size} захиалгыг устгахын тулд нууц үгээ оруулна уу.`
                        : 'Захиалга устгахын тулд системийн нууц үгээ оруулна уу.'}
                    onSuccess={() => {
                        setShowDeletePin(false);
                        if (pendingDeleteAction === 'single') {
                            setShowDeleteModal(true);
                        } else {
                            setShowDeleteConfirm(true);
                        }
                    }}
                    onClose={() => { setShowDeletePin(false); setPendingDeleteAction(null); setDeleteOrderId(null); }}
                />
            )}

            {/* ═══ Step 2a: Single Delete — Reason Modal ═══ */}
            {showDeleteModal && deleteOrderId && createPortal(
                <div className="modal-backdrop animate-fade-in" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div className="modal-header">
                            <h2>Захиалга устгах</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <p className="text-muted">Захиалгыг устгах шалтгаанаа бичнэ үү. Энэ нь аудитын түүхэнд үлдэнэ.</p>
                            <div className="input-group">
                                <label className="input-label">Шалтгаан <span className="text-danger">*</span></label>
                                <textarea
                                    className="input"
                                    rows={3}
                                    placeholder="Жишээ: Үйлчлүүлэгч цуцалсан, Давхардсан захиалга..."
                                    value={deleteReason}
                                    onChange={e => setDeleteReason(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Буцах</button>
                            <button
                                className="btn btn-danger"
                                onClick={() => {
                                    handleDelete(deleteOrderId);
                                }}
                                disabled={!deleteReason.trim()}
                            >
                                <Trash2 size={18} /> Устгах
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ═══ Step 2b: Bulk Delete — Type УСТГАХ Confirm ═══ */}
            {showDeleteConfirm && createPortal(
                <div className="modal-backdrop" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} style={{ zIndex: 9999 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, borderRadius: 24, padding: 32 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                            <div style={{
                                width: 64, height: 64,
                                background: 'rgba(239,68,68,0.1)',
                                color: '#ef4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: 16
                            }}>
                                <ShieldAlert size={32} />
                            </div>
                            <div>
                                <h3 style={{ color: '#ef4444', fontSize: '1.15rem', fontWeight: 700, marginBottom: 4 }}>Сүүлчийн баталгаажуулалт</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                    <strong>{selectedOrderIds.size}</strong> захиалга бүрмөсөн устах болно.<br />
                                    Буцаах <strong>боломжгүй</strong>. Баталгаажуулахын тулд <strong>УСТГАХ</strong> гэж бичнэ үү.
                                </p>
                            </div>

                            <input
                                className="input"
                                style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, letterSpacing: 2 }}
                                placeholder="УСТГАХ"
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                autoFocus
                            />

                            <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
                                <button className="btn btn-secondary" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} style={{ flex: 1, height: 48 }}>
                                    Цуцлах
                                </button>
                                <button
                                    className="btn"
                                    onClick={executeBulkDelete}
                                    disabled={deleteConfirmText !== 'УСТГАХ' || loading}
                                    style={{
                                        flex: 1, height: 48,
                                        background: deleteConfirmText === 'УСТГАХ' ? '#ef4444' : '#ccc',
                                        color: '#fff', fontWeight: 700, border: 'none', borderRadius: 14,
                                        cursor: deleteConfirmText === 'УСТГАХ' ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    {loading ? <Loader2 size={18} className="spin" /> : <><Trash2 size={16} /> Устгах ({selectedOrderIds.size})</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showBulkStatusModal && createPortal(
                <div className="modal-backdrop animate-fade-in" onClick={() => setShowBulkStatusModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Олноор төлөв өөрчлөх</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowBulkStatusModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body p-6">
                            <p className="mb-4 text-muted">Сонгосон {selectedOrderIds.size} захиалгуудын төлөвийг өөрчлөхдөө доорхоос сонгоно уу.</p>
                            <div className="input-group">
                                <label className="input-label">Шинэ төлөв</label>
                                <select className="input select" ref={bulkStatusRef}>
                                    {statuses.filter(s => s.isActive).map(s => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowBulkStatusModal(false)}>Буцах</button>
                            <button className="btn btn-primary" onClick={async () => {
                                const newStatus = bulkStatusRef.current?.value;
                                if (!newStatus) return;
                                if (!business) return;

                                const statusConfig = statuses.find(s => s.id === newStatus);
                                const historyItem = {
                                    statusId: newStatus,
                                    statusLabel: statusConfig?.label || newStatus,
                                    at: new Date(),
                                    note: 'Олноор төлөв өөрчилсөн',
                                    byName: user?.displayName || 'Ажилтан',
                                    byUid: user?.uid
                                };

                                setLoading(true);
                                try {
                                    await orderService.batchUpdateOrdersStatus(business.id, Array.from(selectedOrderIds), newStatus, historyItem, user);
                                    setSelectedOrderIds(new Set());
                                    setShowBulkStatusModal(false);
                                    toast.success(`${selectedOrderIds.size} захиалгын төлөв шинэчлэгдлээ`);
                                } catch (e) {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    toast.error('Алдаа гарлаа: ' + (e as any).message);
                                } finally {
                                    setLoading(false);
                                }
                            }}>
                                <CheckSquare size={18} /> Хадгалах
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showCreate && (
                <CreateOrderModal
                    onClose={() => setShowCreate(false)}
                    nextNumber={`${business?.settings.orderPrefix || 'ORD'}-${String((business?.settings.orderCounter || 0) + 1).padStart(4, '0')}`}
                    statuses={statuses}
                />
            )}
        </>
    );
}

function CreateOrderModal({ onClose, nextNumber, statuses }: {
    onClose: () => void;
    nextNumber: string;
    statuses: OrderStatusConfig[];
}) {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();

    // Data lists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [allProducts, setAllProducts] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [showCustomerResults, setShowCustomerResults] = useState(false);

    // Customer Info
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [customer, setCustomer] = useState('');
    const [phone, setPhone] = useState('');
    const [socialHandle, setSocialHandle] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [address, setAddress] = useState('');

    // Dynamic Data
    const [allSources, setAllSources] = useState<OrderSource[]>([]);
    const [allAccounts, setAllAccounts] = useState<SocialAccount[]>([]);

    // Item Search & Details
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [manualItemName, setManualItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [color, setColor] = useState('');
    const [size, setSize] = useState('');
    const [unitPrice, setUnitPrice] = useState('0');

    // Cargo specific
    const [allCargoTypes, setAllCargoTypes] = useState<CargoType[]>([]);
    const [selectedCargoTypeId, setSelectedCargoTypeId] = useState<string>('');
    const [cargoMeasure, setCargoMeasure] = useState<number>(1);

    // List of added items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);

    // Fees & Totals
    const [deliveryFee, setDeliveryFee] = useState('0');
    const [payCargoNow, setPayCargoNow] = useState(() => {
        const saved = localStorage.getItem('liscord_payCargoNow');
        return saved !== null ? saved === 'true' : true;
    });

    // Payment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [paymentMethod, setPaymentMethod] = useState<any>('bank');
    const [paidAmount, setPaidAmount] = useState('0');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        localStorage.setItem('liscord_payCargoNow', payCargoNow.toString());
    }, [payCargoNow]);

    useEffect(() => {
        if (!business?.id) return;

        // Fetch products
        const unsubProducts = productService.subscribeProducts(business.id, (data) => {
            setAllProducts(data);
        });

        // Fetch sources
        const unsubSources = sourceService.subscribeSources(business.id, (data) => {
            setAllSources(data);
            if (data.length > 0 && !sourceId) {
                // Auto-select first source (or default if we had that in business settings)
                setSourceId(data[0].id);
            }
        });

        // Fetch cargo types if cargo business
        let unsubCargoTypes = () => { };
        if (business.category === 'cargo') {
            unsubCargoTypes = cargoService.subscribeCargoTypes(business.id, (data) => {
                setAllCargoTypes(data);
                if (data.length > 0 && !selectedCargoTypeId) {
                    setSelectedCargoTypeId(data[0].id);
                }
            });
        }

        // Fetch all accounts for this business
        const unsubAccounts = sourceService.subscribeAccounts(business.id, null, (data) => {
            setAllAccounts(data);
        });

        // Fetch customers for autocomplete
        const unsubCustomers = customerService.subscribeCustomers(business.id, (data) => {
            setAllCustomers(data);
        });

        return () => {
            unsubProducts();
            unsubSources();
            unsubAccounts();
            unsubCustomers();
            unsubCargoTypes();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business?.id, sourceId, business?.category]); // Added sourceId to dependencies to re-evaluate auto-selection if sourceId changes

    const filteredProducts = searchQuery.length > 0
        ? allProducts.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSelectProduct = (p: any) => {
        setSelectedProduct(p);
        setUnitPrice(p.pricing.salePrice.toString());
        setSearchQuery('');
        setShowResults(false);
    };

    // Dynamic Preview calculation
    const getPreviewItems = () => {
        const cargoType = allCargoTypes.find(c => c.id === selectedCargoTypeId);
        const name = selectedProduct ? selectedProduct.name : manualItemName || (cargoType ? `Карго: ${cargoType.name}` : '');
        if (!name) return items;

        const variant = [color, size].filter(Boolean).join(' / ');
        const unitPriceNum = Number(unitPrice);

        let unitCargoFee = selectedProduct?.cargoFee && !selectedProduct.cargoFee.isIncluded ? selectedProduct.cargoFee.amount : 0;

        if (business?.category === 'cargo' && cargoType) {
            unitCargoFee = cargoType.fee * cargoMeasure;
        }

        // Check if item with same identity already exists
        const existingItemIndex = items.findIndex(item =>
            item.productId === (selectedProduct?.id || null) &&
            item.name === name &&
            item.variant === variant &&
            item.unitPrice === unitPriceNum &&
            item.unitCargoFee === unitCargoFee
        );

        if (existingItemIndex > -1) {
            // MERGE: preview quantity increase
            const updatedItems = [...items];
            const existingItem = updatedItems[existingItemIndex];
            const newQuantity = existingItem.quantity + quantity;

            updatedItems[existingItemIndex] = {
                ...existingItem,
                quantity: newQuantity,
                totalPrice: newQuantity * unitPriceNum
            };
            return updatedItems;
        } else {
            // ADD NEW: preview addition
            const pendingItem = {
                productId: selectedProduct?.id || null,
                name: name,
                variant: variant,
                quantity: quantity,
                unitPrice: unitPriceNum,
                costPrice: selectedProduct?.pricing?.costPrice || 0,
                totalPrice: unitPriceNum * quantity,
                unitCargoFee: unitCargoFee,
                image: selectedProduct?.images?.[0] || null
            };
            return [...items, pendingItem];
        }
    };

    const handleAddItem = () => {
        const name = selectedProduct ? selectedProduct.name : manualItemName;
        if (!name) return;

        // Finalize the preview into real items
        setItems(getPreviewItems());

        // Reset item inputs
        setSelectedProduct(null);
        setManualItemName('');
        setQuantity(1);
        setColor('');
        setSize('');
        setUnitPrice('0');
        setSearchQuery('');
        setCargoMeasure(1);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateItemTotal = () => getPreviewItems().reduce((sum, item) => sum + item.totalPrice, 0);
    const calculateCargoTotal = () => getPreviewItems().reduce((sum, item) => sum + (item.unitCargoFee * item.quantity), 0);

    const calculateTotal = () => {
        const itemTotal = calculateItemTotal();
        const totalCargo = calculateCargoTotal();
        const total = itemTotal + Number(deliveryFee) + (payCargoNow ? totalCargo : 0);
        return total;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer || !business || !user) return;

        const finalItems = getPreviewItems();
        if (finalItems.length === 0) return;

        setLoading(true);
        try {
            const finalTotal = calculateTotal();
            const paid = Number(paidAmount);
            const cargoTotal = calculateCargoTotal();

            // Auto-set status: if fully paid → confirmed, else → new
            const initialStatus = paid >= finalTotal
                ? 'confirmed'
                : (statuses.find(s => s.isActive && s.id !== 'all')?.id || 'new');

            await orderService.createOrder(business.id, {
                orderNumber: nextNumber,
                status: initialStatus,
                paymentStatus: paid >= finalTotal ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
                customer: {
                    id: selectedCustomerId,
                    name: customer,
                    phone: phone,
                    socialHandle: socialHandle || undefined
                },
                sourceId: sourceId || undefined,
                accountId: accountId || undefined,
                deliveryAddress: address,
                items: finalItems,
                financials: {
                    subtotal: calculateItemTotal(),
                    discountType: 'fixed',
                    discountValue: 0,
                    discountAmount: 0,
                    deliveryFee: Number(deliveryFee),
                    cargoFee: cargoTotal,
                    cargoIncluded: finalItems.every(i => i.unitCargoFee === 0),
                    totalAmount: finalTotal,
                    payments: paid > 0 ? [{
                        id: crypto.randomUUID(),
                        amount: paid,
                        method: paymentMethod,
                        note: 'Урьдчилгаа төлбөр',
                        paidAt: new Date(),
                        recordedBy: user.uid
                    }] : [],
                    paidAmount: paid,
                    balanceDue: finalTotal - paid,
                },
                createdBy: user.uid,
                createdByName: user.displayName,
                isDeleted: false,
                notes: payCargoNow ? '' : 'Карго ирэхээр төлнө',
                internalNotes: '',
                statusHistory: [],
                tags: []
            });
            onClose();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
                <div className="modal-header">
                    <h2>Шинэ захиалга — {nextNumber}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* SECTION 1: CUSTOMER */}
                        <div className="modal-section">
                            <div className="modal-section-title"><User size={14} /> Харилцагчийн мэдээлэл</div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group" style={{ position: 'relative' }}>
                                    <label className="input-label">Утасны дугаар <span className="required">*</span></label>
                                    <input
                                        className="input"
                                        placeholder="8811-XXXX"
                                        value={phone}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setPhone(val);
                                            if (val.length >= 4) {
                                                const matches = allCustomers.filter(c =>
                                                    c.phone?.includes(val) ||
                                                    c.name?.toLowerCase().includes(val.toLowerCase())
                                                ).slice(0, 5);
                                                setFilteredCustomers(matches);
                                                setShowCustomerResults(matches.length > 0);
                                            } else {
                                                setShowCustomerResults(false);
                                            }
                                        }}
                                        required
                                        onBlur={() => setTimeout(() => setShowCustomerResults(false), 200)}
                                    />
                                    {showCustomerResults && (
                                        <div className="product-results" style={{ top: '100%', left: 0, right: 0, zIndex: 100, marginBottom: 0 }}>
                                            {filteredCustomers.map(c => (
                                                <div
                                                    key={c.id}
                                                    className="product-result-item"
                                                    onClick={() => {
                                                        setSelectedCustomerId(c.id || null);
                                                        setCustomer(c.name || '');
                                                        setPhone(c.phone || '');
                                                        setSocialHandle(c.socialHandle || '');
                                                        if (c.sourceId) setSourceId(c.sourceId);
                                                        if (c.accountId) setAccountId(c.accountId);
                                                        if (c.address) setAddress(c.address);
                                                        setShowCustomerResults(false);
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.phone} {c.socialHandle && `• ${c.socialHandle}`}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Сошиал хаяг (IG/FB) <span className="required">*</span></label>
                                    <input className="input" placeholder="@username" value={socialHandle} onChange={e => setSocialHandle(e.target.value)} required />
                                </div>
                            </div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Харилцагчийн нэр</label>
                                    <input className="input" placeholder="Жишээ: Болд" value={customer} onChange={e => setCustomer(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Эх сурвалж</label>
                                    <select className="input select" value={sourceId} onChange={e => { setSourceId(e.target.value); setAccountId(''); }}>
                                        <option value="">Сонгох...</option>
                                        {allSources.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Пэйж / Хаяг</label>
                                    <select className="input select" value={accountId} onChange={e => setAccountId(e.target.value)} disabled={!sourceId}>
                                        <option value="">Сонгох...</option>
                                        {allAccounts.filter(a => a.sourceId === sourceId).map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Хүргэлтийн хаяг</label>
                                <input className="input" placeholder="Жишээ: БЗД, 26-р хороо, Хүннү 2222, 101-102 тоот" value={address} onChange={e => setAddress(e.target.value)} />
                            </div>
                        </div>

                        {/* SECTION 2: ITEMS LIST */}
                        <div className="modal-section">
                            <div className="modal-section-title"><Package size={14} /> Сонгосон бараанууд ({items.length})</div>

                            {items.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {items.map((item, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: 10,
                                            background: 'var(--bg-soft)',
                                            borderRadius: 8,
                                            border: '1px solid var(--border-primary)'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {item.variant} • {fmt(item.unitPrice)} x {item.quantity}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fmt(item.totalPrice)}</div>
                                            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeItem(idx)}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 10px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                                        Нийт бараа: {fmt(calculateItemTotal())}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Захиалгад бараа нэмээгүй байна.
                                </div>
                            )}
                        </div>

                        {/* SECTION 3: ADD NEW ITEM */}
                        <div className="modal-section" style={{ border: '1px dashed var(--primary)', background: 'var(--primary-light)' }}>
                            <div className="modal-section-title" style={{ color: 'var(--primary)' }}><Plus size={14} /> Бараа нэмэх</div>

                            {!selectedProduct ? (
                                <div className="product-search-container">
                                    <div className="input-group">
                                        <div style={{ position: 'relative' }}>
                                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input
                                                className="input"
                                                style={{ paddingLeft: 36 }}
                                                placeholder="Барааны нэр эсвэл SKU бичнэ үү..."
                                                value={searchQuery}
                                                onChange={e => {
                                                    setSearchQuery(e.target.value);
                                                    setShowResults(true);
                                                }}
                                                onFocus={() => setShowResults(true)}
                                            />
                                        </div>
                                    </div>

                                    {showResults && filteredProducts.length > 0 && (
                                        <div className="product-search-results">
                                            {filteredProducts.map(p => (
                                                <div key={p.id} className="product-search-item" onClick={() => handleSelectProduct(p)}>
                                                    <img src={p.images?.[0] || 'https://via.placeholder.com/40'} className="product-search-img" alt="" />
                                                    <div className="product-search-info">
                                                        <span className="product-search-name">{p.name}</span>
                                                        <span className="product-search-sku">{p.sku}</span>
                                                    </div>
                                                    <div className="product-search-price">{fmt(p.pricing.salePrice)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {searchQuery && filteredProducts.length === 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            <div className="input-group">
                                                <input className="input" placeholder="Барааны нэр" value={manualItemName} onChange={e => setManualItemName(e.target.value)} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="selected-product-preview" style={{ background: 'white' }}>
                                    <img src={selectedProduct.images?.[0] || 'https://via.placeholder.com/40'} className="product-search-img" alt="" />
                                    <div className="product-search-info">
                                        <span className="product-search-name">{selectedProduct.name}</span>
                                        <span className="product-search-sku">{selectedProduct.sku}</span>
                                    </div>
                                    <div className="product-search-price">{fmt(Number(unitPrice))}</div>
                                    <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedProduct(null)}>
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {(selectedProduct || manualItemName) && (
                                <>
                                    <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                        <div className="input-group">
                                            <label className="input-label">Тоо ширхэг</label>
                                            <input className="input" type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Өнгө</label>
                                            <input className="input" placeholder="Хар" value={color} onChange={e => setColor(e.target.value)} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Хэмжээ</label>
                                            <input className="input" placeholder="XL" value={size} onChange={e => setSize(e.target.value)} />
                                        </div>
                                    </div>

                                    {business?.category === 'cargo' && allCargoTypes.length > 0 && (
                                        <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                                            <div className="input-group">
                                                <label className="input-label">Каргоны төрөл</label>
                                                <select className="input select" value={selectedCargoTypeId} onChange={e => setSelectedCargoTypeId(e.target.value)}>
                                                    {allCargoTypes.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name} ({fmt(c.fee)}/{c.unit})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Хэмжээ ({allCargoTypes.find(c => c.id === selectedCargoTypeId)?.unit || 'хэмжигдэхүүн'})</label>
                                                <input className="input" type="number" step="0.01" min="0" value={cargoMeasure} onChange={e => setCargoMeasure(Number(e.target.value))} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                                        <div className="input-group">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <label className="input-label" style={{ margin: 0 }}>Нэгж үнэ</label>
                                            </div>
                                            <input className="input" type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                style={{ width: '100%' }}
                                                onClick={handleAddItem}
                                            >
                                                Жагсаалтанд нэмэх
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* SECTION 4: DELIVERY & CARGO */}
                        <div className="modal-section" style={{ background: 'rgba(var(--primary-rgb), 0.05)' }}>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Хүргэлтийн төлбөр</label>
                                    <input className="input" type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Нийт карго ({calculateCargoTotal() > 0 ? "Ирж яваа" : "Үнэдээ орсон"})</label>
                                    <div className="input" style={{ background: 'var(--bg-soft)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                        {fmt(calculateCargoTotal())}
                                    </div>
                                </div>
                            </div>

                            {calculateCargoTotal() > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                    <input type="checkbox" id="payCargoNow" checked={payCargoNow} onChange={e => setPayCargoNow(e.target.checked)} />
                                    <label htmlFor="payCargoNow" style={{ fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>Каргоныг одоо төлөх (Бусад тохиолдолд ирэхээр нь төлнө)</label>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border-primary)' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Нийт захиалгын дүн:</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                                    {fmt(calculateTotal())}
                                </span>
                            </div>
                        </div>

                        {/* SECTION 5: PAYMENT */}
                        <div className="modal-section" style={{ borderColor: 'var(--primary)', borderStyle: 'dashed' }}>
                            <div className="modal-section-title"><CreditCard size={14} /> Төлбөр бүртгэх</div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Төлбөрийн хэлбэр</label>
                                    <select className="input select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                        <option value="bank">Дансаар (Хаан/Голомт)</option>
                                        <option value="qpay">QPay</option>
                                        <option value="cash">Бэлнээр</option>
                                        <option value="card">Картаар</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Төлсөн дүн (Урьдчилгаа)</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <input className="input" type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setPaidAmount((calculateTotal() * 0.5).toString())}
                                                style={{ fontSize: '0.65rem', padding: '2px 8px', height: 24 }}
                                            >
                                                50%
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setPaidAmount(calculateTotal().toString())}
                                                style={{ fontSize: '0.65rem', padding: '2px 8px', height: 24 }}
                                            >
                                                100%
                                            </button>
                                            <div style={{ flex: 1 }}></div>
                                            {Number(paidAmount) < calculateTotal() && Number(paidAmount) > 0 && (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                                    Үлдэгдэл: {fmt(calculateTotal() - Number(paidAmount))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Болих</button>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !customer || items.length === 0}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Захиалга үүсгэх</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
