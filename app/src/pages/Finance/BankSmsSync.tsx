import { useState, useEffect } from 'react';
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
    Loader2,
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore } from '../../store';
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
    createdAt?: any;
}

export function BankSmsSyncPage() {
    const navigate = useNavigate();
    const { business } = useBusinessStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'pending' | 'ignored'>('all');
    const [logs, setLogs] = useState<SmsLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [pairingKey, setPairingKey] = useState<string | null>(null);

    // Load pairing key from business doc
    useEffect(() => {
        if (!business?.id) return;
        const loadKey = async () => {
            try {
                const bizRef = doc(db, 'businesses', business.id);
                const snap = await getDoc(bizRef);
                const data = snap.data();
                if (data?.smsBridgeKey) {
                    setPairingKey(data.smsBridgeKey);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to load bridge key:', err);
                setLoading(false);
            }
        };
        loadKey();
    }, [business?.id]);

    // Subscribe to sms_inbox in real-time
    useEffect(() => {
        if (!pairingKey) return;

        const q = query(
            collection(db, 'sms_inbox'),
            where('pairingKey', '==', pairingKey),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: SmsLog[] = snapshot.docs.map(docSnap => {
                const d = docSnap.data();
                const createdAt = d.createdAt?.toDate?.() || new Date(d.timestamp || Date.now());
                const timeStr = createdAt.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });

                // Extract note/utga from SMS body
                let note = '';
                const utgaMatch = d.body?.match(/(?:utga|утга|note)[:\s]*([^\n,]+)/i);
                if (utgaMatch) {
                    note = utgaMatch[1].trim();
                } else {
                    note = d.body?.substring(0, 50) || '';
                }

                return {
                    id: docSnap.id,
                    body: d.body || '',
                    sender: d.sender || '',
                    amount: d.amount || 0,
                    bank: d.bank || d.sender || '',
                    note,
                    time: timeStr,
                    status: d.status === 'matched' ? 'matched' : d.status === 'ignored' ? 'ignored' : 'pending',
                    orderId: d.orderId || undefined,
                    createdAt,
                };
            });
            setLogs(items);
            setLoading(false);
        }, (error) => {
            console.error('SMS inbox subscription error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pairingKey]);

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
                                <span className="sms-stat-label">Нийт орлого</span>
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

                    {/* Loading */}
                    {loading ? (
                        <div className="sms-empty">
                            <Loader2 size={32} className="spin" />
                            <h4>Ачааллаж байна...</h4>
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        <>
                            {/* Table (desktop) */}
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

                            {/* Mobile Cards */}
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
                        </>
                    ) : (
                        <div className="sms-empty">
                            <Smartphone size={32} />
                            <h4>Мэдээлэл алга</h4>
                            <p>
                                {search ? 'Хайлтанд тохирох гүйлгээ олдсонгүй.' :
                                    !pairingKey ? 'Bridge апп тохиргоо хийгдээгүй байна.' :
                                        'Bridge апп холбогдсон боловч SMS ирээгүй байна.'}
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

                </div>
            </div>
        </>
    );
}
