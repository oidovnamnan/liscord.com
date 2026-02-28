import { TrendingUp } from 'lucide-react';

export function OrderChart() {
    // A simple CSS-based bar chart to match the premium Landing Page feel
    // without adding large charting libraries yet.
    const data = [
        { day: 'Да', value: 65 },
        { day: 'Мя', value: 45 },
        { day: 'Лх', value: 85 },
        { day: 'Пү', value: 30 },
        { day: 'Ба', value: 90 },
        { day: 'Бя', value: 75 },
        { day: 'Ня', value: 55 },
    ];

    const maxValue = Math.max(...data.map(d => d.value));

    return (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <div className="dashboard-chart-container card animate-fade-in" style={{ '--index': 4 } as any}>
            <div className="chart-header">
                <div>
                    <h3>Захиалгын явц</h3>
                    <p className="text-muted">Сүүлийн 7 хоногийн нэгтгэл</p>
                </div>
                <div className="chart-stat">
                    <TrendingUp size={16} color="#0be881" />
                    <span className="positive">+18%</span>
                </div>
            </div>

            <div className="chart-body">
                <div className="chart-bars">
                    {data.map((d, i) => (
                        <div key={i} className="chart-bar-wrap">
                            <div className="chart-bar-tooltip">{d.value}</div>
                            <div
                                className="chart-bar"
                                style={{
                                    height: `${(d.value / maxValue) * 100}%`,
                                    animationDelay: `${i * 0.1}s`
                                }}
                            >
                                <div className="chart-bar-glow" />
                            </div>
                            <span className="chart-bar-label">{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
