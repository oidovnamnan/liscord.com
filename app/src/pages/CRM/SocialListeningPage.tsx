import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Zap,
    Search,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Activity,
    Globe,
    Instagram,
    Facebook,
    Twitter,
    MessageCircle,
    Trash2,
    Share2,
    AlertCircle,
    Target,
    BarChart3,
    Clock,
    Database
} from 'lucide-react';

interface SocialMention {
    id: string;
    platform: 'facebook' | 'instagram' | 'twitter' | 'web';
    user: string;
    content: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    time: string;
}

const MOCK_MENTIONS: SocialMention[] = [
    {
        id: 'MN-001',
        platform: 'facebook',
        user: 'Bat-Erdene',
        content: 'Liscord POS ашиглаж эхлээд маш их цаг хэмнэж байна. Баярлалаа!',
        sentiment: 'positive',
        time: '5 mins ago'
    },
    {
        id: 'MN-002',
        platform: 'instagram',
        user: 'marala_vlog',
        content: 'Шинэ салбар нээхэд Liscord-ийн систем хамгийн шилдэг нь байлаа.',
        sentiment: 'positive',
        time: '1 hour ago'
    },
    {
        id: 'MN-003',
        platform: 'web',
        user: 'Anonymous',
        content: 'Хүргэлт жаахан удаан байна, анхаарах хэрэгтэй.',
        sentiment: 'negative',
        time: '3 hours ago'
    }
];

export function SocialListeningPage() {
    const [mentions] = useState<SocialMention[]>(MOCK_MENTIONS);

    return (
        <HubLayout hubId="crm-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Сошиал Хяналт (Social Listening)"
                    subtitle="Брэндийн нэр дурдагдсан сошиал постууд, сэтгэгдлүүдийг AI ашиглан хянах, сэтгэл зүйн анализ хийх"
                    action={{
                        label: "Үг хянах нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Sentiment Insights */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт дурдалт</h4>
                                <div className="text-3xl font-black text-primary">1,240</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><MessageCircle size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Эерэг (Positive)</h4>
                                <div className="text-3xl font-black text-success">84%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Сөрөг (Negative)</h4>
                                <div className="text-3xl font-black text-danger">6%</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><TrendingDown size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">AI Analysis</h4>
                                <div className="text-xl font-black text-white">NLP ENGINE ON</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Түлхүүр үг, сошиал хаягаар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Бүх суваг</button>
                    </div>

                    {/* Mentions Feed & Charts */}
                    <div className="col-12 grid grid-cols-12 gap-6">
                        <div className="col-span-8 flex flex-col gap-4">
                            {mentions.map(mention => (
                                <div key={mention.id} className="card p-6 bg-surface-1 border-none shadow-sm hover-lift group">
                                    <div className="flex gap-6 items-start">
                                        <div className="relative">
                                            <div className="h-14 w-14 rounded-2xl bg-surface-2 flex items-center justify-center text-primary border border-border-color/10 group-hover:scale-110 transition-transform overflow-hidden font-black text-xl shadow-inner uppercase">
                                                {mention.user.substring(0, 1)}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-surface-1 p-1 shadow-md border border-border-color/10 flex items-center justify-center">
                                                {mention.platform === 'facebook' ? <Facebook size={12} className="text-[#1877F2]" /> :
                                                    mention.platform === 'instagram' ? <Instagram size={12} className="text-[#E4405F]" /> :
                                                        mention.platform === 'twitter' ? <Twitter size={12} className="text-[#1DA1F2]" /> : <Globe size={12} className="text-primary" />}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-sm font-black uppercase tracking-widest">{mention.user}</h3>
                                                <div className="flex items-center gap-1 text-[10px] font-black text-muted uppercase tracking-widest">
                                                    <Clock size={12} /> {mention.time}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-700 font-medium leading-relaxed mb-4">{mention.content}</p>
                                            <div className="flex justify-between items-center p-3 px-4 bg-surface-2/50 rounded-2xl border border-border-color/5 group-hover:bg-surface-3 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`badge badge-${mention.sentiment === 'positive' ? 'success' : mention.sentiment === 'negative' ? 'danger' : 'secondary'} font-black text-[10px] px-3 py-1 uppercase tracking-widest`}>
                                                        {mention.sentiment}
                                                    </div>
                                                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">AI SCORING 92%</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="btn btn-ghost p-2 rounded-xl text-muted hover:text-danger"><Trash2 size={16} /></button>
                                                    <button className="btn btn-primary p-2 h-10 w-10 rounded-xl shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
                                                        <ArrowRight size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Sentiment Breakdown Chart Simulation */}
                        <div className="col-span-4 flex flex-col gap-6">
                            <div className="card p-8 bg-surface-2 border-none shadow-lg flex flex-col items-center justify-center text-center group">
                                <div className="relative h-48 w-48 mb-8">
                                    <svg className="h-full w-full rotate-[-90deg]">
                                        <circle cx="96" cy="96" r="80" className="stroke-surface-3 stroke-[24] fill-none" />
                                        <circle cx="96" cy="96" r="80" className="stroke-success stroke-[24] fill-none" style={{ strokeDasharray: '502', strokeDashoffset: '80' }} />
                                        <circle cx="96" cy="96" r="80" className="stroke-danger stroke-[24] fill-none" style={{ strokeDasharray: '502', strokeDashoffset: '470' }} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                        <div className="text-4xl font-black text-primary">84%</div>
                                        <div className="text-[10px] font-black text-muted uppercase tracking-widest">Positive</div>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black mb-2">Sentiment Health</h3>
                                <p className="text-xs text-muted font-bold uppercase tracking-widest">Олон нийтийн хандлага маш сайн байна.</p>
                                <button className="btn btn-primary mt-8 w-full py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                    <BarChart3 size={20} /> ТАЙЛАН ҮЗЭХ
                                </button>
                            </div>

                            <div className="card p-6 bg-surface-2 border-none flex items-center gap-4 group cursor-pointer hover:bg-surface-3 transition-all">
                                <div className="bg-warning/10 p-3 rounded-xl text-warning group-hover:scale-110 transition-transform"><AlertCircle size={24} /></div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-black uppercase tracking-tight">Эрсдэлтэй хаяг</h4>
                                    <p className="text-[10px] text-muted font-bold tracking-widest uppercase">3 ШИНЭ NEGATIVE MENTION</p>
                                </div>
                                <Target size={20} className="text-muted" />
                            </div>
                        </div>
                    </div>

                    {/* Keyword Monitoring Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Database size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Brand Keywords & Competition</h3>
                                <p className="text-sm text-muted">Өөрийн болон өрсөлдөгч брэндийн нэрийг сошиал орчинд хянах түлхүүр үгсийн сан.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ҮГС ТОХИРУУЛАХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
