import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Search,
    Zap,
    Layout,
    Database,
    Activity,
    Palette,
    Image,
    Type,
    Share2,
    Smartphone,
    Monitor,
    Target,
    MoreVertical,
    Save,
    Send
} from 'lucide-react';

export function EmailBuilderPage() {
    return (
        <HubLayout hubId="crm-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Имэйл Дизайнер (Email Builder)"
                    subtitle="Drag-and-drop ашиглан мэргэжлийн маркетинг имэйл, newsletter болон авто-хариулагч бүтээх"
                    action={{
                        label: "Шинэ имэйл",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт загвар</h4>
                                <div className="text-3xl font-black text-primary">24</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Layout size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Илгээгдсэн</h4>
                                <div className="text-3xl font-black text-secondary">4.5k</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Send size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нээлт (Open Rate)</h4>
                                <div className="text-3xl font-black text-success">38%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><Target size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">AI Content</h4>
                                <div className="text-xl font-black text-white">SMART COPY ON</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Загварын нэр, ангиллаар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Ангилал</button>
                    </div>

                    {/* Email Editor / Template Grid */}
                    <div className="col-12 grid grid-cols-12 gap-6">
                        <div className="col-span-3 flex flex-col gap-4">
                            <h3 className="text-[10px] font-black uppercase text-muted tracking-widest mb-2 px-2">Components</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="card p-4 bg-surface-2 border-none flex flex-col items-center gap-2 cursor-grab hover:bg-surface-3 transition-all group">
                                    <Type size={20} className="text-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">TEXT</span>
                                </div>
                                <div className="card p-4 bg-surface-2 border-none flex flex-col items-center gap-2 cursor-grab hover:bg-surface-3 transition-all group">
                                    <Image size={20} className="text-secondary group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">IMAGE</span>
                                </div>
                                <div className="card p-4 bg-surface-2 border-none flex flex-col items-center gap-2 cursor-grab hover:bg-surface-3 transition-all group">
                                    <Palette size={20} className="text-warning group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">BUTTON</span>
                                </div>
                                <div className="card p-4 bg-surface-2 border-none flex flex-col items-center gap-2 cursor-grab hover:bg-surface-3 transition-all group">
                                    <Layout size={20} className="text-danger group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">LAYOUT</span>
                                </div>
                            </div>
                            <div className="mt-8 flex flex-col gap-2">
                                <button className="btn btn-primary w-full py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2">
                                    <Save size={18} /> ЗАГВАР ХАДГАЛАХ
                                </button>
                                <button className="btn btn-outline border-border-color/20 w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2">
                                    <Send size={18} /> ТУРШИЛТ ИЛГЭЭХ
                                </button>
                            </div>
                        </div>

                        {/* Editor Canvas Simulation */}
                        <div className="col-span-9 card p-0 overflow-hidden bg-surface-2 h-[600px] shadow-lg relative border-none flex flex-col group">
                            <div className="p-4 bg-surface-1 border-b flex justify-between items-center px-8">
                                <div className="flex gap-4">
                                    <button className="btn btn-ghost p-1 rounded-lg text-primary"><Monitor size={20} /></button>
                                    <button className="btn btn-ghost p-1 rounded-lg text-muted"><Smartphone size={20} /></button>
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted">Editor Canvas</h3>
                                <div className="flex gap-2">
                                    <button className="btn btn-ghost p-2 rounded-xl bg-surface-2"><MoreVertical size={20} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-surface-3 p-8 flex justify-center">
                                <div className="w-full max-w-[600px] bg-white shadow-2xl rounded-2xl min-h-full p-12 text-center flex flex-col gap-8 animate-fade-in relative border-t-[8px] border-primary">
                                    <div className="h-16 w-32 bg-surface-2 mx-auto rounded-xl flex items-center justify-center">
                                        <Database size={48} className="text-muted/20" />
                                    </div>
                                    <div className="space-y-4">
                                        <h1 className="text-4xl font-black text-slate-800 leading-tight">Your Awesome Message</h1>
                                        <p className="text-lg text-slate-500 font-medium">Create beautiful emails with our drag & drop builder.</p>
                                    </div>
                                    <div className="h-48 bg-surface-2 rounded-3xl border-dashed border-2 flex items-center justify-center relative group/inner">
                                        <div className="text-muted font-black text-xs uppercase tracking-widest group-hover/inner:text-primary transition-colors cursor-pointer">БЛОК ОРУУЛАХ БАЙРШИЛ</div>
                                    </div>
                                    <button className="btn btn-primary h-14 px-10 rounded-2xl font-black text-lg shadow-xl self-center">Үйлдэл хийх</button>

                                    {/* Floating overlay for editor feel */}
                                    <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                                        <Palette size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Marketing Automation Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Zap size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Marketing Workflow Sync</h3>
                                <p className="text-sm text-muted">Зах зээлийн кампанит ажил болон хэрэглэгчийн сегменттэй холбож автоматаар илгээх.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">КАМПАНИТ АЖИЛ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
