import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Link,
    RefreshCw,
    ArrowRightLeft,
    Search,
    Filter,
    Plus,
    BarChart3,
    ArrowUpRight,
    Wallet,
    Shield,
    Lock,
    ExternalLink,
    Activity,
    CreditCard,
    MoreHorizontal
} from 'lucide-react';

interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    currency: string;
    balance: number;
    lastSync: string;
    status: 'connected' | 'disconnected' | 'error' | 'syncing';
}

const MOCK_ACCOUNTS: BankAccount[] = [
    {
        id: 'ACC-KHAN-001',
        bankName: 'Khan Bank',
        accountNumber: '5001234567',
        currency: 'MNT',
        balance: 45200000,
        lastSync: '10 mins ago',
        status: 'connected'
    },
    {
        id: 'ACC-GOLOMT-001',
        bankName: 'Golomt Bank',
        accountNumber: '1105001234',
        currency: 'USD',
        balance: 12450,
        lastSync: '2 hours ago',
        status: 'connected'
    },
    {
        id: 'ACC-TDB-001',
        bankName: 'TDB Bank',
        accountNumber: '4005001234',
        currency: 'MNT',
        balance: 1250000,
        lastSync: 'Error',
        status: 'error'
    }
];

export function BankSyncPage() {
    const [accounts] = useState<BankAccount[]>(MOCK_ACCOUNTS);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Банкны Холболт"
                    subtitle="Арилжааны банкуудтай шууд холбогдож гүйлгээ автоматаар синхрончлох, тулгалт хийх"
                    action={{
                        label: "Данс Холбох",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Security Overview */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-2 transition-all">
                            <div className="flex flex-col">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Үлдэгдэл</h4>
                                <div className="text-2xl font-black">88.4М ₮</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform shadow-inner"><Wallet size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-2 transition-all border-l-4 border-success">
                            <div className="flex flex-col">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Аюулгүй Байдал</h4>
                                <div className="text-2xl font-black text-success">AES-256 SSL</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform shadow-inner"><Shield size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-2 transition-all">
                            <div className="flex flex-col">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Синхрончлол</h4>
                                <div className="text-2xl font-black text-warning">Real-time</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform shadow-inner"><Activity size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-2 transition-all">
                            <div className="flex flex-col">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Connected Apps</h4>
                                <div className="text-2xl font-black text-muted">4 Banks</div>
                            </div>
                            <div className="bg-muted/10 p-4 rounded-2xl text-muted group-hover:scale-110 transition-transform shadow-inner"><Link size={24} /></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Дансны дугаар, гүйлгээний утгаар хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10 hover:bg-surface-2"><Filter size={18} /> Шүүлтүүр</button>
                            <button className="btn btn-primary h-11 px-8 flex items-center gap-2 font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"><RefreshCw size={18} /> БҮГДИЙГ ШИНЭЧЛЭХ</button>
                        </div>
                    </div>

                    {/* Accounts List */}
                    <div className="col-12 grid grid-cols-3 gap-6">
                        {accounts.map(account => (
                            <div key={account.id} className="card p-6 bg-surface-1 border-none shadow-sm hover-lift group relative overflow-hidden">
                                {account.status === 'syncing' && <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-progress" />}

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-surface-2 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform shadow-inner border border-border-color/10">
                                            <CreditCard size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black group-hover:text-primary transition-colors leading-tight">{account.bankName}</h3>
                                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1 flex items-center gap-1">
                                                <Lock size={10} /> {account.accountNumber}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${account.status === 'connected' ? 'bg-success/10 text-success' :
                                        account.status === 'error' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                                        }`}>
                                        {account.status === 'connected' ? 'ХОЛБОГДСОН' :
                                            account.status === 'error' ? 'АЛДАА' : 'ШИНЭЧЛЭЖ БАЙНА'}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-surface-2 p-4 rounded-2xl border border-border-color/5 group-hover:bg-surface-3 transition-colors">
                                        <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1 opacity-70">ОДООГИЙН ҮЛДЭГДЭЛ</div>
                                        <div className="text-2xl font-black">{account.balance.toLocaleString()} <span className="text-sm font-bold opacity-50">{account.currency}</span></div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-bold text-muted bg-surface-2/50 p-3 rounded-xl border border-border-color/5">
                                        <div className="flex items-center gap-2"><RefreshCw size={14} className={account.status === 'syncing' ? 'animate-spin' : ''} /> {account.lastSync}</div>
                                        <button className="text-primary hover:underline flex items-center gap-1">ТҮҮХ <ExternalLink size={12} /></button>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button className="btn btn-ghost flex-1 py-3 text-xs font-black bg-surface-2 rounded-2xl border border-border-color/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                                        ШИНЭЧЛЭХ <RefreshCw size={16} />
                                    </button>
                                    <button className="btn btn-ghost h-12 w-12 bg-surface-2 rounded-2xl border border-border-color/10 hover:bg-surface-3 transition-all flex items-center justify-center">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add Account Card */}
                        <div className="card p-6 border-dashed border-2 border-border-color/20 bg-transparent flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-all min-h-[350px] group">
                            <div className="bg-surface-2 p-6 rounded-full text-muted group-hover:bg-primary group-hover:text-white transition-all shadow-inner"><Plus size={48} /></div>
                            <div className="text-center">
                                <h3 className="text-lg font-black text-muted group-hover:text-primary transition-colors">Шинэ Данс Холбох</h3>
                                <p className="text-xs font-bold text-muted/60 mt-1 max-w-[200px]">Khan, Golomt, TDB, Xac зэрэг <br />бүх банкны API холболт</p>
                            </div>
                        </div>
                    </div>

                    {/* Reconciliation Preview Area */}
                    <div className="col-12 mt-4 card p-8 bg-surface-2 border-dashed border-2 flex flex-col items-center justify-center gap-6 min-h-[250px] shadow-inner relative overflow-hidden group">
                        <BarChart3 size={128} className="absolute inset-0 opacity-[0.03] text-primary" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="bg-primary/10 p-6 rounded-full text-primary mb-4 group-hover:scale-110 transition-transform"><ArrowRightLeft size={48} /></div>
                            <h3 className="text-2xl font-black mb-2">Гүйлгээ Тулгалт (Reconciliation)</h3>
                            <p className="max-w-md text-muted font-bold text-sm">Банкны хуулга болон систем дэх төлбөр тооцоог автоматаар тулгаж зөрүүг арилгах.</p>
                        </div>
                        <button className="relative z-10 btn btn-primary px-12 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                            ТУЛГАЛТ ЭХЛҮҮЛЭХ <ArrowUpRight size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
