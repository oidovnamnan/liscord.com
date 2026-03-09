import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useBusinessStore } from '../../../store';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const DAY_LABELS = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];

export function OrderChart() {
    const { business } = useBusinessStore();
    const [data, setData] = useState<{ day: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;

        async function fetchWeeklyData() {
            try {
                const now = new Date();
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
                const dayCounts: Record<string, number> = {};
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(now.getDate() - i);
                    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
                    dayCounts[key] = 0;
                }

                // Count orders by day
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const ts = data.createdAt;
                    let date: Date;
                    if (ts?.toDate) {
                        date = ts.toDate();
                    } else if (ts instanceof Date) {
                        date = ts;
                    } else {
                        return;
                    }
                    const key = date.toISOString().slice(0, 10);
                    if (dayCounts[key] !== undefined) {
                        dayCounts[key]++;
                    }
                });

                // Convert to chart data
                const chartData = Object.keys(dayCounts).map(key => {
                    const d = new Date(key);
                    return {
                        day: DAY_LABELS[d.getDay()],
                        value: dayCounts[key],
                    };
                });

                setData(chartData);
            } catch (err) {
                console.error('OrderChart fetch error:', err);
                // Fallback to empty
                setData(Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return { day: DAY_LABELS[d.getDay()], value: 0 };
                }));
            } finally {
                setLoading(false);
            }
        }

        fetchWeeklyData();
    }, [business?.id]);

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const totalThisWeek = data.reduce((sum, d) => sum + d.value, 0);

    // Simple trend: compare first half vs second half
    const firstHalf = data.slice(0, 3).reduce((s, d) => s + d.value, 0);
    const secondHalf = data.slice(4).reduce((s, d) => s + d.value, 0);
    const trendUp = secondHalf >= firstHalf;

    if (loading) {
        return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <div className="dashboard-chart-container card animate-fade-in" style={{ '--index': 4 } as any}>
                <div className="chart-header">
                    <div>
                        <h3>Захиалгын явц</h3>
                        <p className="text-muted">Уншиж байна...</p>
                    </div>
                </div>
                <div className="chart-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={32} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                </div>
            </div>
        );
    }

    return (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <div className="dashboard-chart-container card animate-fade-in" style={{ '--index': 4 } as any}>
            <div className="chart-header">
                <div>
                    <h3>Захиалгын явц</h3>
                    <p className="text-muted">Сүүлийн 7 хоногт нийт {totalThisWeek} захиалга</p>
                </div>
                {totalThisWeek > 0 && (
                    <div className="chart-stat">
                        {trendUp ? (
                            <TrendingUp size={16} color="#0be881" />
                        ) : (
                            <TrendingDown size={16} color="var(--accent-orange)" />
                        )}
                        <span className={trendUp ? 'positive' : ''} style={{ color: trendUp ? '#0be881' : 'var(--accent-orange)' }}>
                            {trendUp ? 'Өсөлттэй' : 'Буурсан'}
                        </span>
                    </div>
                )}
            </div>

            <div className="chart-body">
                <div className="chart-bars">
                    {data.map((d, i) => (
                        <div key={i} className="chart-bar-wrap">
                            <div className="chart-bar-tooltip">{d.value}</div>
                            <div
                                className="chart-bar"
                                style={{
                                    height: d.value === 0 ? '4px' : `${(d.value / maxValue) * 100}%`,
                                    animationDelay: `${i * 0.1}s`,
                                    opacity: d.value === 0 ? 0.2 : 1,
                                }}
                            >
                                {d.value > 0 && <div className="chart-bar-glow" />}
                            </div>
                            <span className="chart-bar-label">{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
