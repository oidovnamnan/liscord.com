import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import {
    Search,
    Settings,
    ExternalLink,
    CircleCheck,
    Clock,
    AlertCircle,
    ArrowUpRight,
    Filter,
    TrendingUp,
    Smartphone,
} from 'lucide-react';
import './BankSmsSync.css';

interface SmsLog {
    id: string;
    body: string;
    sender: string;
    amount: number;
    bank: string;
    note: string;
    time: string;
    status: 'matched' | 'pending' | 'ignored';
    orderId?: string;
}

export function BankSmsSyncPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'pending' | 'ignored'>('all');

    // Mock data — replace with real Firestore data
    const [logs] = useState<SmsLog[]>([
        {
            id: '1', body: 'Orlogo: 50,000.00 MNT. Dans: 5000123456, Utga: ORD-8891', sender: '19001917',
            amount: 50000, bank: 'Khan Bank', note: 'ORD-8891', time: '12:30', status: 'matched', orderId: 'ORD-8891'
        },
        {
            id: '2', body: 'Golomt Bank: 125,000.00 MNT orlogo orloo. Note: Tsauna set', sender: 'Golomt',
            amount: 125000, bank: 'Golomt Bank', note: 'Tsauna set', time: '10:15', status: 'pending'
        },
        {
            id: '3', body: 'TDB: Orlogo 75,000 MNT. Guilgeenii utga: Belen tulult', sender: '1500',
            amount: 75000, bank: 'TDB', note: 'Бэлэн Төлөлт', time: '09:45', status: 'pending'
        },
    ]);

    const filteredLogs = logs.filter(log => {
        const matchSearch = !search ||
            log.note.toLowerCase().includes(search.toLowerCase()) ||
            log.bank.toLowerCase().includes(search.toLowerCase()) ||
            log.amount.toString().includes(search);
        const matchStatus = statusFilter === 'all' || log.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: logs.reduce((s, l) => s + l.amount, 0),
        matched: logs.filter(l => l.status === 'matched').length,
        pending: logs.filter(l => l.status === 'pending').length,
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'matched': return <span className="badge badge-delivered"><CircleCheck size={12} /> Холбогдсон</span>;
            case 'pending': return <span className="badge badge-preparing"><Clock size={12} /> Хүлээгдэж буй</span>;
            case 'ignored': return <span className="badge badge-soft"><AlertCircle size={12} /> Алгассан</span>;
            default: return null;
        }
    };

    return (
        <>
            <Header title="SMS Банк Орлого" subtitle="Банкны SMS орлогыг хянах, захиалгатай холбох" />
            <div className="page">
                <div className="sms-income-layout animate-fade-in">

                    {/* Stats Row */}
                    <div className="sms-stats-row">
                        <div className="sms-stat-card">
                            <TrendingUp size={18} />
                            <div>
                                <span className="sms-stat-value">{stats.total.toLocaleString()}₮</span>
                                <span className="sms-stat-label">Өнөөдрийн нийт</span>
                            </div>
                        </div>
                        <div className="sms-stat-card">
                            <CircleCheck size={18} />
                            <div>
                                <span className="sms-stat-value">{stats.matched}</span>
                                <span className="sms-stat-label">Холбогдсон</span>
                            </div>
                        </div>
                        <div className="sms-stat-card">
                            <Clock size={18} />
                            <div>
                                <span className="sms-stat-value">{stats.pending}</span>
                                <span className="sms-stat-label">Хүлээгдэж буй</span>
                            </div>
                        </div>
                        <button
                            className="sms-stat-card sms-stat-action"
                            onClick={() => navigate('/app/settings?tab=sms-income-sync')}
                        >
                            <Settings size={18} />
                            <div>
                                <span className="sms-stat-value">Тохиргоо</span>
                                <span className="sms-stat-label">Bridge холболт</span>
                            </div>
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="sms-toolbar">
                        <div className="sms-search-wrap">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Хайх... (банк, утга, дүн)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="sms-filter-tabs">
                            <Filter size={14} />
                            {(['all', 'matched', 'pending', 'ignored'] as const).map(f => (
                                <button
                                    key={f}
                                    className={`sms-filter-tab ${statusFilter === f ? 'active' : ''}`}
                                    onClick={() => setStatusFilter(f)}
                                >
                                    {f === 'all' ? 'Бүгд' : f === 'matched' ? 'Холбогдсон' : f === 'pending' ? 'Хүлээгдэж' : 'Алгассан'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table / Feed */}
                    {filteredLogs.length > 0 ? (
                        <div className="sms-table-wrap">
                            <table className="sms-table">
                                <thead>
                                    <tr>
                                        <th>Цаг</th>
                                        <th>Банк</th>
                                        <th>Дүн</th>
                                        <th>Утга</th>
                                        <th>Төлөв</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map(log => (
                                        <tr key={log.id}>
                                            <td className="sms-cell-time">
                                                <span>{log.time}</span>
                                                <span className="sms-cell-sender">{log.sender}</span>
                                            </td>
                                            <td>
                                                <span className="sms-bank-badge">{log.bank}</span>
                                            </td>
                                            <td className="sms-cell-amount">
                                                <ArrowUpRight size={14} />
                                                +{log.amount.toLocaleString()}₮
                                            </td>
                                            <td className="sms-cell-note">
                                                {log.orderId ? (
                                                    <span className="sms-order-link">{log.orderId}</span>
                                                ) : (
                                                    <span className="sms-note-text">{log.note}</span>
                                                )}
                                            </td>
                                            <td>{getStatusBadge(log.status)}</td>
                                            <td>
                                                {log.status === 'pending' && (
                                                    <button className="sms-match-btn">
                                                        Холбох
                                                    </button>
                                                )}
                                                {log.status === 'matched' && log.orderId && (
                                                    <button className="sms-link-btn">
                                                        <ExternalLink size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="sms-empty">
                            <Smartphone size={32} />
                            <h4>Мэдээлэл алга</h4>
                            <p>
                                {search ? 'Хайлтанд тохирох гүйлгээ олдсонгүй.' : 'Bridge апп холбогдоогүй эсвэл SMS ирээгүй байна.'}
                            </p>
                            {!search && (
                                <button
                                    className="sms-setup-link"
                                    onClick={() => navigate('/app/settings?tab=sms-income-sync')}
                                >
                                    <Settings size={16} />
                                    Bridge тохируулах
                                </button>
                            )}
                        </div>
                    )}

                    {/* Mobile Cards (shown on small screens instead of table) */}
                    <div className="sms-mobile-cards">
                        {filteredLogs.map(log => (
                            <div key={log.id} className="sms-mobile-card">
                                <div className="sms-mobile-top">
                                    <span className="sms-bank-badge">{log.bank}</span>
                                    {getStatusBadge(log.status)}
                                </div>
                                <div className="sms-mobile-amount">
                                    <ArrowUpRight size={16} />
                                    +{log.amount.toLocaleString()}₮
                                </div>
                                <div className="sms-mobile-meta">
                                    <span>{log.time} · {log.sender}</span>
                                    <span>{log.note}</span>
                                </div>
                                {log.status === 'pending' && (
                                    <button className="sms-match-btn sms-match-btn-full">Захиалгатай холбох</button>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </>
    );
}
