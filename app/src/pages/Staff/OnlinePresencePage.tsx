import { useState, useEffect, useMemo } from 'react';
import { Radio, Search, Wifi, WifiOff, Clock, Users, Eye } from 'lucide-react';
import { collection, getDocs, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore } from '../../store';
import './OnlinePresence.css';

interface EmployeePresence {
    id: string;
    name: string;
    position?: string;
    photoURL?: string;
    lastActiveAt: Date | null;
    status: 'online' | 'idle' | 'offline';
}

interface Visitor {
    id: string;
    lastActiveAt: Date | null;
    page?: string;
    userAgent?: string;
}

function getStatus(lastActiveAt: Date | null): 'online' | 'idle' | 'offline' {
    if (!lastActiveAt) return 'offline';
    const diffMs = Date.now() - lastActiveAt.getTime();
    const diffMin = diffMs / 60000;
    if (diffMin <= 2) return 'online';
    if (diffMin <= 10) return 'idle';
    return 'offline';
}

function timeAgo(date: Date | null): string {
    if (!date) return 'Мэдээлэлгүй';
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Одоо';
    if (diffMin < 60) return `${diffMin} мин өмнө`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} цаг өмнө`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} өдрийн өмнө`;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(w => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function getDeviceType(ua?: string): string {
    if (!ua) return '🖥️';
    const lower = ua.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) return '📱';
    if (lower.includes('tablet') || lower.includes('ipad')) return '📱';
    return '🖥️';
}

const STATUS_LABEL: Record<string, string> = {
    online: 'Онлайн',
    idle: 'Идэвхгүй',
    offline: 'Оффлайн',
};

export function OnlinePresencePage() {
    const { business } = useBusinessStore();
    const [employees, setEmployees] = useState<EmployeePresence[]>([]);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch employees with lastActiveAt
    useEffect(() => {
        if (!business?.id) return;
        let cancelled = false;

        async function load() {
            try {
                const snap = await getDocs(collection(db, 'businesses', business!.id, 'employees'));
                const emps: EmployeePresence[] = snap.docs.map(d => {
                    const data = d.data();
                    const lastActiveAt = data.lastActiveAt?.toDate?.() || null;
                    return {
                        id: d.id,
                        name: data.name || 'Нэргүй',
                        position: data.positionName || data.position || '',
                        photoURL: data.photoURL,
                        lastActiveAt,
                        status: getStatus(lastActiveAt),
                    };
                });
                if (!cancelled) setEmployees(emps);
            } catch (err) {
                console.error('OnlinePresence load error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        const interval = setInterval(load, 30000);
        return () => { cancelled = true; clearInterval(interval); };
    }, [business?.id]);

    // Real-time visitor subscription
    useEffect(() => {
        if (!business?.id) return;

        const twoMinAgo = Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000));
        const visitorQ = query(
            collection(db, 'businesses', business.id, 'visitors'),
            where('lastActiveAt', '>=', twoMinAgo)
        );

        const unsub = onSnapshot(visitorQ, (snap) => {
            setVisitors(snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    lastActiveAt: data.lastActiveAt?.toDate?.() || null,
                    page: data.page,
                    userAgent: data.userAgent,
                };
            }));
        }, () => setVisitors([]));

        return () => unsub();
    }, [business?.id]);

    // Filter + sort
    const filtered = useMemo(() => {
        let list = employees;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(e => e.name.toLowerCase().includes(q) || (e.position || '').toLowerCase().includes(q));
        }
        const order = { online: 0, idle: 1, offline: 2 };
        return [...list].sort((a, b) => order[a.status] - order[b.status]);
    }, [employees, search]);

    const counts = useMemo(() => ({
        online: employees.filter(e => e.status === 'online').length,
        idle: employees.filter(e => e.status === 'idle').length,
        offline: employees.filter(e => e.status === 'offline').length,
    }), [employees]);

    if (loading) {
        return (
            <div className="loading-screen">
                <Radio size={28} className="animate-spin" />
                <span>Уншиж байна...</span>
            </div>
        );
    }

    return (
        <div className="online-presence-page">
            {/* Hero */}
            <div className="page-hero">
                <div className="page-hero-left">
                    <div className="page-hero-icon"><Radio size={24} /></div>
                    <div>
                        <h1 className="page-hero-title">Онлайн Хяналт</h1>
                        <p className="page-hero-subtitle">Ажилтнууд & зочдын одоогийн идэвхжилт</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="presence-stats">
                <div className="presence-stat-card online">
                    <div className="presence-stat-icon"><Wifi size={20} /></div>
                    <div className="presence-stat-info">
                        <div className="presence-stat-value">{counts.online}</div>
                        <div className="presence-stat-label">Ажилтан</div>
                    </div>
                </div>
                <div className="presence-stat-card" style={{ background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.15)' }}>
                    <div className="presence-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}><Eye size={20} /></div>
                    <div className="presence-stat-info">
                        <div className="presence-stat-value">{visitors.length}</div>
                        <div className="presence-stat-label">Зочид</div>
                    </div>
                </div>
                <div className="presence-stat-card idle">
                    <div className="presence-stat-icon"><Clock size={20} /></div>
                    <div className="presence-stat-info">
                        <div className="presence-stat-value">{counts.idle}</div>
                        <div className="presence-stat-label">Идэвхгүй</div>
                    </div>
                </div>
                <div className="presence-stat-card offline">
                    <div className="presence-stat-icon"><WifiOff size={20} /></div>
                    <div className="presence-stat-info">
                        <div className="presence-stat-value">{counts.offline}</div>
                        <div className="presence-stat-label">Оффлайн</div>
                    </div>
                </div>
            </div>

            {/* Visitors Section */}
            {visitors.length > 0 && (
                <div className="presence-employee-list" style={{ marginBottom: 16 }}>
                    <div className="presence-list-header">
                        <div className="presence-list-title"><Eye size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Зочид (Storefront)</div>
                        <div className="presence-list-count" style={{ color: '#3b82f6' }}>{visitors.length} онлайн</div>
                    </div>
                    {visitors.map(v => (
                        <div key={v.id} className="presence-employee-row">
                            <div className="presence-avatar-wrap">
                                <div className="presence-avatar" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', fontSize: '0.9rem' }}>
                                    {getDeviceType(v.userAgent)}
                                </div>
                                <div className="presence-dot online" />
                            </div>
                            <div className="presence-emp-info">
                                <div className="presence-emp-name">Зочин</div>
                                <div className="presence-emp-position">{v.page || '/s/...'}</div>
                            </div>
                            <div className="presence-emp-status">
                                <div className="presence-status-label online">
                                    <Eye size={14} />
                                    Үзэж байна
                                </div>
                                <div className="presence-last-seen">{timeAgo(v.lastActiveAt)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Search + List */}
            <div className="presence-employee-list">
                <div className="presence-list-header">
                    <div className="presence-list-title">Ажилтнууд</div>
                    <div className="presence-list-count">{filtered.length} / {employees.length}</div>
                </div>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-primary)' }}>
                    <div className="presence-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Нэр, албан тушаал хайх..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {filtered.length === 0 && (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Users size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                        <div>Ажилтан олдсонгүй</div>
                    </div>
                )}

                {filtered.map(emp => (
                    <div key={emp.id} className="presence-employee-row">
                        <div className="presence-avatar-wrap">
                            {emp.photoURL ? (
                                <img src={emp.photoURL} alt="" className="presence-avatar" style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className="presence-avatar">{getInitials(emp.name)}</div>
                            )}
                            <div className={`presence-dot ${emp.status}`} />
                        </div>
                        <div className="presence-emp-info">
                            <div className="presence-emp-name">{emp.name}</div>
                            {emp.position && <div className="presence-emp-position">{emp.position}</div>}
                        </div>
                        <div className="presence-emp-status">
                            <div className={`presence-status-label ${emp.status}`}>
                                {emp.status === 'online' && <Wifi size={14} />}
                                {emp.status === 'idle' && <Clock size={14} />}
                                {emp.status === 'offline' && <WifiOff size={14} />}
                                {STATUS_LABEL[emp.status]}
                            </div>
                            <div className="presence-last-seen">
                                {emp.status === 'online' ? 'Одоо идэвхтэй' : timeAgo(emp.lastActiveAt)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
