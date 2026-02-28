import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    DollarSign,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Globe,
    ArrowRightLeft,
    CheckCircle2,
    Calendar,
    Filter,
    Plus,
    BarChart3,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Calculator
} from 'lucide-react';

interface ExchangeRate {
    currency: string;
    code: string;
    rate: number;
    change: number;
    lastUpdated: string;
}

const MOCK_RATES: ExchangeRate[] = [
    { currency: 'Америк Доллар', code: 'USD', rate: 3385.50, change: 0.25, lastUpdated: '2024-03-22 10:00' },
    { currency: 'Евро', code: 'EUR', rate: 3672.40, change: -0.12, lastUpdated: '2024-03-22 10:00' },
    { currency: 'Хятад Юань', code: 'CNY', rate: 468.20, change: 0.05, lastUpdated: '2024-03-22 10:00' },
    { currency: 'Орос Рубль', code: 'RUB', rate: 36.80, change: -0.45, lastUpdated: '2024-03-22 10:00' }
];

export function MultiCurrencyPage() {
    const [rates] = useState<ExchangeRate[]>(MOCK_RATES);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Олон Валют"
                    subtitle="Гадаад валютын ханшийн хяналт, автомат шинэчлэлт болон валютын гүйлгээний тооцоолол"
                    action={{
                        label: "Ханш Шинэчлэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Currency Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Үндсэн Валют</h4>
                                <div className="text-2xl font-black">MNT (₮)</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Globe size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Холболт</h4>
                                <div className="text-2xl font-black text-success">Mongolbank API</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Ханшийн зөрүү</h4>
                                <div className="text-2xl font-black text-warning">+2.4М ₮</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><BarChart3 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Update Period</h4>
                                <div className="text-2xl font-black">Every Hour</div>
                            </div>
                            <div className="bg-muted/10 p-4 rounded-2xl text-muted group-hover:scale-110 transition-transform"><RefreshCw size={24} /></div>
                        </div>
                    </div>

                    {/* Converter Section */}
                    <div className="col-12 card p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-none shadow-inner flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                            <Calculator size={20} className="text-primary" />
                            <h3 className="text-lg font-black uppercase tracking-tight">Валют Хөрвүүлэгч</h3>
                        </div>
                        <div className="grid grid-cols-11 gap-4 items-center">
                            <div className="col-span-4 space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Дүн</label>
                                <div className="relative">
                                    <input className="input h-14 pl-12 text-lg font-black w-full" defaultValue="1000" />
                                    <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                                </div>
                            </div>
                            <div className="col-span-1 flex justify-center mt-6">
                                <button className="btn btn-ghost h-12 w-12 rounded-full border border-border-color/10 bg-white shadow-sm hover:rotate-180 transition-transform"><ArrowRightLeft size={20} /></button>
                            </div>
                            <div className="col-span-4 space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Хөрвүүлсэн</label>
                                <div className="relative">
                                    <input className="input h-14 pl-12 text-lg font-black w-full bg-surface-2" readOnly defaultValue="3,385,500" />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-black">₮</span>
                                </div>
                            </div>
                            <div className="col-span-2 mt-6">
                                <button className="btn btn-primary h-14 w-full font-black rounded-2xl shadow-lg shadow-primary/20">Тооцоолох</button>
                            </div>
                        </div>
                    </div>

                    {/* Rates Table */}
                    <div className="col-8">
                        <div className="card p-0 bg-surface-1 border-none shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border-color/10 flex justify-between items-center">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Өнөөдрийн Ханш</h3>
                                <div className="flex gap-2">
                                    <button className="btn btn-ghost h-8 px-3 text-[10px] font-black flex items-center gap-1"><Filter size={12} /> Шүүлтүүр</button>
                                    <button className="btn btn-ghost h-8 px-3 text-[10px] font-black flex items-center gap-1 text-primary"><Plus size={12} /> Нэмэх</button>
                                </div>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-2">
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Валют</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Нэр</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Ханш (₮)</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Өөрчлөлт</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Update</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rates.map(rate => (
                                        <tr key={rate.code} className="border-b border-border-color/5 hover:bg-surface-2 transition-colors group">
                                            <td className="p-4 text-center">
                                                <div className="h-10 w-10 bg-surface-3 rounded-full flex items-center justify-center font-black text-sm group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-border-color/10">
                                                    {rate.code}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-black text-sm">{rate.currency}</div>
                                                <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{rate.code}/MNT</div>
                                            </td>
                                            <td className="p-4 text-right font-black text-md">
                                                {rate.rate.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className={`inline-flex items-center gap-1 font-black text-xs ${rate.change > 0 ? 'text-success' : 'text-danger'}`}>
                                                    {rate.change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {Math.abs(rate.change)}%
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="text-[10px] font-bold text-muted flex items-center justify-end gap-1"><Calendar size={10} /> {rate.lastUpdated.split(' ')[1]}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Tools */}
                    <div className="col-4 flex flex-col gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm space-y-4 border-l-4 border-primary">
                            <h3 className="text-md font-black flex items-center gap-2"><AlertCircle size={18} className="text-primary" /> Ханшийн Мэдэгдэл</h3>
                            <p className="text-xs font-bold text-muted">Валютын ханш таны заасан хэмжээнд хүрэхэд имэйл болон пүш мессеж илгээнэ.</p>
                            <button className="btn btn-outline w-full text-xs font-black py-3 rounded-2xl">ТОХИРГОО ХИЙХ</button>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm space-y-6">
                            <h3 className="text-md font-black uppercase tracking-widest text-[10px] text-muted opacity-50">Trend Analysis</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                        <span className="text-xs font-black">USD/MNT</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-success font-black text-xs"><ArrowUpRight size={14} /> Bullish</div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-secondary" />
                                        <span className="text-xs font-black">EUR/MNT</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-danger font-black text-xs"><ArrowDownRight size={14} /> Bearish</div>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6 bg-primary text-white border-none shadow-xl flex flex-col gap-4 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                            <Globe size={128} className="absolute -bottom-8 -right-8 opacity-10 group-hover:scale-110 transition-all" />
                            <h3 className="text-lg font-black relative z-10">Тайлан Татах</h3>
                            <p className="text-xs font-bold opacity-80 relative z-10">Валютын ханшийн зөрүүний тайлан болон ашиг, алдагдлын хураангуй.</p>
                            <button className="btn bg-white/20 hover:bg-white/30 text-white border-none w-fit font-black px-6 rounded-2xl text-xs backdrop-blur-md relative z-10 uppercase tracking-widest py-3">EXCEL ТАТАХ</button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
