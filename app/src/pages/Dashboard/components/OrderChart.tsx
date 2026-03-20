import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useBusinessStore } from '../../../store';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const DAY_LABELS = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];
const DAY_FULL = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

function fmtShort(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString();
}

interface DayData {
    day: string;
    dayFull: string;
    date: string;
    count: number;
    revenue: number;
    isToday: boolean;
}

export function OrderChart() {
    const { business } = useBusinessStore();
    const [data, setData] = useState<DayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!business?.id) return;

        async function fetchWeeklyData() {
            try {
                const now = new Date();
                const todayStr = now.toISOString().slice(0, 10);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 6);
                sevenDaysAgo.setHours(0, 0, 0, 0);

                const ordersRef = collection(db, 'businesses', business!.id, 'orders');
                const q = query(
                    ordersRef,
                    where('isDeleted', '==', false),
                    where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
                );

                const snapshot = await getDocs(q);

                // Initialize 7 days
                const dayMap: Record<string, { count: number; revenue: number }> = {};
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(now.getDate() - i);
                    const key = d.toISOString().slice(0, 10);
                    dayMap[key] = { count: 0, revenue: 0 };
                }

                // Only count paid/confirmed orders (skip unpaid fake orders)
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    // Skip unpaid and membership orders
                    if (data.paymentStatus === 'unpaid' || data.orderType === 'membership') return;
                    if (data.status === 'cancelled') return;

                    const ts = data.createdAt;
                    let date: Date;
                    if (ts?.toDate) date = ts.toDate();
                    else if (ts instanceof Date) date = ts;
                    else return;

                    const key = date.toISOString().slice(0, 10);
                    if (dayMap[key] !== undefined) {
                        dayMap[key].count++;
                        dayMap[key].revenue += data.financials?.totalAmount || data.totalAmount || 0;
                    }
                });

                const chartData: DayData[] = Object.keys(dayMap).map(key => {
                    const d = new Date(key);
                    return {
                        day: DAY_LABELS[d.getDay()],
                        dayFull: DAY_FULL[d.getDay()],
                        date: `${d.getMonth() + 1}/${d.getDate()}`,
                        count: dayMap[key].count,
                        revenue: dayMap[key].revenue,
                        isToday: key === todayStr,
                    };
                });

                setData(chartData);
            } catch (err) {
                console.error('OrderChart fetch error:', err);
                setData(Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const todayStr = new Date().toISOString().slice(0, 10);
                    const key = d.toISOString().slice(0, 10);
                    return { day: DAY_LABELS[d.getDay()], dayFull: DAY_FULL[d.getDay()], date: `${d.getMonth() + 1}/${d.getDate()}`, count: 0, revenue: 0, isToday: key === todayStr };
                }));
            } finally {
                setLoading(false);
            }
        }

        fetchWeeklyData();
    }, [business?.id]);

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
    const totalOrders = data.reduce((sum, d) => sum + d.count, 0);
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

    const firstHalf = data.slice(0, 3).reduce((s, d) => s + d.count, 0);
    const secondHalf = data.slice(4).reduce((s, d) => s + d.count, 0);
    const trendUp = secondHalf >= firstHalf;

    if (loading) {
        return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <div className="chart-v2" style={{ '--index': 4 } as any}>
                <div className="chart-v2-header">
                    <div>
                        <h3 className="chart-v2-title">Захиалгын явц</h3>
                        <p className="chart-v2-sub">Уншиж байна...</p>
                    </div>
                </div>
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={32} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                </div>
            </div>
        );
    }

    return (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <div className="chart-v2" style={{ '--index': 4 } as any}>
            {/* Header */}
            <div className="chart-v2-header">
                <div>
                    <h3 className="chart-v2-title">
                        <BarChart3 size={18} style={{ marginRight: 8, color: 'var(--primary)' }} />
                        Захиалгын явц
                    </h3>
                    <p className="chart-v2-sub">
                        Сүүлийн 7 хоног · <strong>{totalOrders}</strong> захиалга · <strong>₮{fmtShort(totalRevenue)}</strong>
                    </p>
                </div>
                {totalOrders > 0 && (
                    <div className={`chart-v2-trend ${trendUp ? 'up' : 'down'}`}>
                        {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{trendUp ? 'Өсөлттэй' : 'Буурсан'}</span>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="chart-v2-body" ref={chartRef}>
                {/* Grid lines */}
                <div className="chart-v2-gridlines">
                    {[0.25, 0.5, 0.75, 1].map(pct => (
                        <div key={pct} className="chart-v2-gridline" style={{ bottom: `${pct * 100}%` }}>
                            <span className="chart-v2-gridlabel">{Math.round(maxCount * pct)}</span>
                        </div>
                    ))}
                </div>

                {/* Bars */}
                <div className="chart-v2-bars">
                    {data.map((d, i) => {
                        const barH = d.count === 0 ? 3 : (d.count / maxCount) * 100;
                        const revenueH = d.revenue === 0 ? 1 : (d.revenue / maxRevenue) * 100;
                        const isHovered = hoveredIdx === i;

                        return (
                            <div
                                key={i}
                                className={`chart-v2-col ${d.isToday ? 'today' : ''} ${isHovered ? 'hovered' : ''}`}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                            >
                                {/* Tooltip */}
                                {isHovered && (
                                    <div className="chart-v2-tooltip">
                                        <div className="chart-v2-tooltip-title">{d.dayFull} ({d.date})</div>
                                        <div className="chart-v2-tooltip-row">
                                            <span className="chart-v2-tooltip-dot" style={{ background: '#6366f1' }} />
                                            <span>{d.count} захиалга</span>
                                        </div>
                                        <div className="chart-v2-tooltip-row">
                                            <span className="chart-v2-tooltip-dot" style={{ background: '#10b981' }} />
                                            <span>₮{fmtShort(d.revenue)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Bar area */}
                                <div className="chart-v2-bar-area">
                                    {/* Revenue bar (behind, wider, lighter) */}
                                    <div
                                        className="chart-v2-bar-revenue"
                                        style={{
                                            height: `${revenueH}%`,
                                            animationDelay: `${i * 80}ms`,
                                        }}
                                    />
                                    {/* Count bar (front, thinner, vibrant) */}
                                    <div
                                        className="chart-v2-bar-count"
                                        style={{
                                            height: `${barH}%`,
                                            animationDelay: `${i * 80 + 50}ms`,
                                            opacity: d.count === 0 ? 0.15 : 1,
                                        }}
                                    >
                                        {d.count > 0 && (
                                            <div className="chart-v2-bar-value">{d.count}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Label */}
                                <div className="chart-v2-label">
                                    <span className="chart-v2-day">{d.day}</span>
                                    <span className="chart-v2-date">{d.date}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="chart-v2-legend">
                <div className="chart-v2-legend-item">
                    <span className="chart-v2-legend-dot" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }} />
                    <span>Захиалга</span>
                </div>
                <div className="chart-v2-legend-item">
                    <span className="chart-v2-legend-dot" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }} />
                    <span>Орлого</span>
                </div>
            </div>
        </div>
    );
}
