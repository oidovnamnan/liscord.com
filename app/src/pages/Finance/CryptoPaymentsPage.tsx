import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Bitcoin,
    ShieldCheck,
    RefreshCw,
    History,
    QrCode,
    Search,
    Filter,
    Plus,
    CheckCircle2,
    ArrowUpRight,
    TrendingUp,
    Activity,
    Lock,
    Globe,
    Zap,
    Wallet,
    Download,
    Mail,
    ArrowRightLeft,
    Coins,
    Gem,
    Link,
    XCircle
} from 'lucide-react';

interface CryptoTransaction {
    id: string;
    currency: string;
    amount: number;
    amountInMnt: number;
    status: 'completed' | 'pending' | 'failed';
    date: string;
    txHash: string;
}

const MOCK_TRANS: CryptoTransaction[] = [
    {
        id: 'TX-BTC-001',
        currency: 'BTC',
        amount: 0.0125,
        amountInMnt: 2854000,
        status: 'completed',
        date: '2024-03-22 14:20',
        txHash: '0x123...abc'
    },
    {
        id: 'TX-USDT-001',
        currency: 'USDT',
        amount: 1540.50,
        amountInMnt: 5214000,
        status: 'pending',
        date: '2024-03-22 15:05',
        txHash: '0xdef...ghi'
    },
    {
        id: 'TX-ETH-001',
        currency: 'ETH',
        amount: 0.85,
        amountInMnt: 9840000,
        status: 'completed',
        date: '2024-03-22 16:15',
        txHash: '0xjkl...mno'
    }
];

export function CryptoPaymentsPage() {
    const [transactions] = useState<CryptoTransaction[]>(MOCK_TRANS);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Крипто Төлбөр"
                    subtitle="Крипто валютаар төлбөр хүлээн авах, түүх хянах болон төгрөг рүү автоматаар хөрвүүлэх"
                    action={{
                        label: "Wallet Холбох",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Crypto Overview */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Bitcoin size={128} className="absolute -right-8 -top-8 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Эзэмшил</h4>
                                <div className="text-2xl font-black">240.2М ₮</div>
                                <div className="flex items-center gap-1 text-success text-[10px] font-bold mt-1 uppercase tracking-widest leading-none">
                                    <TrendingUp size={12} /> +12.4% (24h)
                                </div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary relative z-10 shadow-inner group-hover:bg-primary group-hover:text-white transition-all"><Wallet size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Zap size={128} className="absolute -right-8 -top-8 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Supported Assets</h4>
                                <div className="text-2xl font-black">24 Coins</div>
                                <div className="flex items-center gap-2 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <Bitcoin size={14} className="text-orange-500" />
                                    <Coins size={14} className="text-blue-500" />
                                    <Gem size={14} className="text-purple-500" />
                                </div>
                            </div>
                            <div className="bg-success text-white p-4 rounded-2xl shadow-lg shadow-success/20 relative z-10 group-hover:scale-110 transition-transform"><CheckCircle2 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Globe size={128} className="absolute -right-8 -top-8 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Auto-Settlement</h4>
                                <div className="text-2xl font-black text-primary">INSTANT</div>
                                <div className="text-[10px] font-bold text-muted uppercase mt-1 tracking-widest leading-none">To Khan Bank MNT</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary relative z-10 shadow-inner"><ArrowRightLeft size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-warning">
                            <div className="flex flex-col">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Аюулгүй Байдал</h4>
                                <div className="text-2xl font-black text-warning">COLD STORAGE</div>
                                <div className="flex items-center gap-1 text-warning text-[10px] font-bold mt-1 uppercase tracking-widest overflow-hidden">
                                    <Lock size={12} /> Double-Enforced
                                </div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning relative z-10 shadow-inner group-hover:bg-warning group-hover:text-white transition-all"><ShieldCheck size={24} /></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Гүйлгээний ID, Hash, эсвэл валютаар хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10 hover:bg-surface-2"><Filter size={18} /> Шүүлтүүр</button>
                            <button className="btn btn-primary h-11 px-10 flex items-center gap-3 font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"><QrCode size={18} /> ТӨЛБӨР ХҮЛЭЭН АВАХ</button>
                        </div>
                    </div>

                    {/* Recent Transactions List */}
                    <div className="col-8">
                        <div className="card p-0 bg-surface-1 border-none shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border-color/10 flex justify-between items-center bg-surface-2/20">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Сүүлийн Гүйлгээнүүд</h3>
                                <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-2"><History size={14} /> Бүгдийг харах</button>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-2">
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Төрөл</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Хэмжээ</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Хөрвүүлсэн (₮)</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Төлөв</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Hash</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="border-b border-border-color/5 hover:bg-surface-2 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-black text-sm flex items-center gap-2">
                                                        {tx.currency === 'BTC' ? <Bitcoin size={16} className="text-orange-500" /> : <Coins size={16} className="text-secondary" />}
                                                        {tx.currency}
                                                    </div>
                                                    <div className="text-[10px] text-muted font-bold tracking-widest">{tx.date}</div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="font-black text-md">{tx.amount.toLocaleString(undefined, { minimumFractionDigits: tx.currency === 'BTC' ? 8 : 2 })}</div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="font-black text-primary text-md">≈ {tx.amountInMnt.toLocaleString()} ₮</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1 ${tx.status === 'completed' ? 'bg-success/10 text-success' :
                                                    tx.status === 'failed' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                                                    }`}>
                                                    {tx.status === 'completed' ? <CheckCircle2 size={12} /> :
                                                        tx.status === 'failed' ? <XCircle size={12} /> : <RefreshCw size={12} className="animate-spin" />}
                                                    {tx.status === 'completed' ? 'БОЛСОН' :
                                                        tx.status === 'failed' ? 'АЛДАА' : 'ХҮЛЭЭГДЭЖ БУЙ'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button className="text-[10px] font-black text-muted hover:text-primary transition-colors flex items-center gap-1 mx-auto bg-surface-2 px-3 py-1.5 rounded-lg border border-border-color/10">
                                                    {tx.txHash} <Link size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Portfolio & Analytics Preview */}
                    <div className="col-4 space-y-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm space-y-4 border-l-4 border-primary">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-md font-black flex items-center gap-2 tracking-tight uppercase"><Activity size={18} className="text-primary" /> Live Chart</h3>
                                <div className="flex gap-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                                    <span className="text-[10px] font-black text-success">LIVE</span>
                                </div>
                            </div>
                            <div className="p-4 bg-surface-2 rounded-2xl flex flex-col items-center justify-center gap-4 min-h-[180px] border border-border-color/10 shadow-inner relative overflow-hidden group">
                                <TrendingUp size={128} className="absolute inset-0 opacity-[0.03] text-primary" />
                                <TrendingUp size={48} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
                                <div className="text-center relative z-10">
                                    <div className="text-2xl font-black text-primary">₮ 214.2М</div>
                                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Total Balance Growth</div>
                                </div>
                            </div>
                        </div>

                        {/* Integration Cards */}
                        <div className="card p-6 bg-surface-1 border-none shadow-sm space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted border-b border-border-color/5 pb-2">Ухаалаг үйлдлүүд</h3>
                            <button className="btn btn-ghost w-full bg-surface-2/50 hover:bg-primary/10 hover:text-primary transition-all p-4 rounded-xl flex items-center justify-between border border-border-color/5">
                                <div className="flex items-center gap-3">
                                    <Download size={20} className="text-primary" />
                                    <div className="text-left">
                                        <div className="text-xs font-black">Тайлан татах</div>
                                        <div className="text-[9px] font-bold text-muted uppercase">PDF, CSV, EXCEL</div>
                                    </div>
                                </div>
                                <ArrowUpRight size={18} />
                            </button>
                            <button className="btn btn-ghost w-full bg-surface-2/50 hover:bg-secondary/10 hover:text-secondary transition-all p-4 rounded-xl flex items-center justify-between border border-border-color/5">
                                <div className="flex items-center gap-3">
                                    <Mail size={20} className="text-secondary" />
                                    <div className="text-left">
                                        <div className="text-xs font-black">Нэхэмжлэх илгээх</div>
                                        <div className="text-[9px] font-bold text-muted uppercase">By Wallet Address</div>
                                    </div>
                                </div>
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
