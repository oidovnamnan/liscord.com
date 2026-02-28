import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Globe,
    Lock,
    Eye,
    Copy,
    Link as LinkIcon,
    Settings,
    Shield,
    FileText,
    ShoppingCart,
    Bell,
    Activity,
    Monitor,
    Smartphone,
    Database,
    ChevronRight,
    Search
} from 'lucide-react';

export function CustomerPortalPage() {
    const [enabled, setEnabled] = useState(true);
    const [portalUrl] = useState('https://portal.liscord.com/my-business');

    // Mock access log
    const accessLogs = [
        { id: 1, customer: 'Б.Золбоо', activity: 'Нэхэмжлэх #2024-001 харав', time: '2 минутын өмнө' },
        { id: 2, customer: 'С.Уянга', activity: 'Захиалгын төлөв шалгав', time: '15 минутын өмнө' },
        { id: 3, customer: 'Т.Бат', activity: 'Гэрээ баталгаажуулав', time: '1 цагийн өмнө' },
    ];

    return (
        <HubLayout hubId="crm-hub">
            <Header
                title="Харилцагчийн Портал"
                subtitle="Харилцагчдад зориулсан өөртөө үйлчлэх (self-service) орчин тохируулах"
            />

            <div className="page-content mt-6 flex flex-col gap-8 stagger-children animate-fade-in translate-y-0 opacity-100">
                {/* Activation & Link Banner */}
                <div className="card p-0 overflow-hidden border shadow-xl bg-gradient-to-r from-primary to-primary-focus text-white relative group">
                    <Globe className="absolute -right-12 -bottom-12 text-white/10 group-hover:scale-125 transition-transform duration-700" size={300} strokeWidth={1} />
                    <div className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <Shield size={24} className="text-white" />
                                </div>
                                <h3 className="m-0 text-3xl font-black tracking-tight">{enabled ? 'Портал Идэвхтэй' : 'Портал Идэвхгүй'}</h3>
                            </div>
                            <p className="m-0 text-white/80 max-w-md font-medium leading-relaxed">Таны харилцагчид доорх холбоосоор нэвтэрч өөрийн захиалга, нэхэмжлэх, гэрээний түүхээ бие даан харах боломжтой.</p>
                            <div className="flex items-center gap-2 mt-4 bg-black/20 p-4 rounded-2xl border border-white/20 backdrop-blur-sm shadow-inner group-hover:bg-black/30 transition-all cursor-pointer overflow-hidden">
                                <LinkIcon size={18} className="text-white/60 flex-shrink-0" />
                                <code className="text-sm font-black tracking-wider flex-1 truncate">{portalUrl}</code>
                                <button className="btn btn-ghost btn-sm text-white hover:bg-white/20 px-4 flex items-center gap-2"><Copy size={16} /> Хуулах</button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 min-w-[200px] items-center">
                            <div className="toggle-container scale-125 p-4 bg-white/10 rounded-2xl border border-white/20">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={enabled} onChange={() => setEnabled(!enabled)} className="sr-only peer" />
                                    <div className="w-14 h-8 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-success shadow-inner"></div>
                                </label>
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/60">Төлөв өөрчлөх</span>
                        </div>
                    </div>
                </div>

                <div className="grid-2 gap-8">
                    {/* Access & Visibility Controls */}
                    <div className="flex flex-col gap-8 animate-slide-left">
                        <div className="card border shadow-lg overflow-hidden group">
                            <div className="p-6 border-b bg-surface-2 group-hover:bg-white/80 transition-all flex justify-between items-center">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <Database size={14} className="text-primary" /> Харагдах цэсүүд
                                </h4>
                                <Settings size={18} className="text-muted hover:text-primary cursor-pointer rotate-0 hover:rotate-90 transition-all duration-500" />
                            </div>
                            <div className="p-4 space-y-2">
                                {[
                                    { label: 'Борлуулалтын захиалга', icon: ShoppingCart, default: true },
                                    { label: 'Нэхэмжлэх & Төлбөр', icon: FileText, default: true },
                                    { label: 'Гэрээний мэдээлэл', icon: Lock, default: false },
                                    { label: 'Хүргэлтийн явц', icon: Globe, default: true },
                                    { label: 'Мэдэгдэл хүлээн авах', icon: Bell, default: false },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 hover:bg-surface-2 rounded-2xl cursor-pointer border border-transparent hover:border-black/5 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-surface-1 rounded-xl shadow-sm text-muted group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110 group-hover:rotate-3">
                                                <item.icon size={18} />
                                            </div>
                                            <span className="font-extrabold text-sm text-gray-700 tracking-tight">{item.label}</span>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full relative transition-colors ${item.default ? 'bg-primary' : 'bg-gray-200'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${item.default ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card p-8 border shadow-lg bg-gradient-to-tr from-surface-2 to-white relative overflow-hidden group">
                            <Monitor className="absolute -right-8 -bottom-8 text-black/5 group-hover:rotate-12 transition-transform duration-700" size={160} />
                            <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-6 flex items-center gap-2">
                                <Smartphone size={14} className="text-info" /> Портал зураг төсөл (Web & Mobile)
                            </h4>
                            <div className="flex gap-4 mb-4 relative z-10">
                                <div className="flex-1 aspect-video bg-white rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-primary transition-colors cursor-pointer shadow-sm group">
                                    <div className="flex flex-col items-center gap-2">
                                        <Eye size={24} className="text-muted group-hover:text-primary transition-colors" />
                                        <span className="text-[10px] font-black uppercase text-muted tracking-widest">Preview UI</span>
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-outline w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs relative z-10 transition-all active:scale-95 group">
                                <Settings size={16} className="group-hover:rotate-180 transition-transform duration-500" /> Дизайн тохируулах
                            </button>
                        </div>
                    </div>

                    {/* Access History */}
                    <div className="card border shadow-lg flex flex-col p-0 overflow-hidden animate-slide-right">
                        <div className="p-6 border-b bg-surface-2 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                            <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-success" /> Сүүлийн хандалтууд
                            </h4>
                            <button className="btn btn-ghost btn-xs text-[10px] font-black tracking-widest uppercase text-primary">Бүгдийг үзэх</button>
                        </div>
                        <div className="flex-1 space-y-0.5 overflow-y-auto max-h-[700px] bg-white">
                            <div className="p-4 bg-surface-3/50 group">
                                <div className="relative flex items-center group">
                                    <Search className="absolute left-3 text-muted group-focus-within:text-primary transition-colors" size={16} />
                                    <input type="text" className="input input-sm pl-10 h-11 rounded-xl bg-white/80 border-none ring-1 ring-black/5 focus:ring-primary/40 w-full" placeholder="Харилцагчаар хайх..." />
                                </div>
                            </div>
                            {accessLogs.map((log, i) => (
                                <div key={log.id} className="p-5 flex items-center justify-between border-b hover:bg-surface-2 transition-all group animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-surface-1 border border-black/5 flex items-center justify-center font-black text-gray-400 text-lg shadow-sm group-hover:bg-primary group-hover:text-white group-hover:rotate-6 transition-all duration-300">
                                            {log.customer.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-gray-800 tracking-tight">{log.customer}</div>
                                            <div className="text-xs text-muted font-bold tracking-tight">{log.activity}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-extrabold text-muted uppercase tracking-widest">{log.time}</div>
                                        <div className="flex items-center gap-1 justify-end mt-1 text-success group-hover:translate-x-1 transition-transform">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Харах</span>
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {[4, 5, 6, 7].map(id => (
                                <div key={id} className="p-5 flex items-center justify-between border-b hover:bg-surface-2 transition-all group opacity-60">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-surface-1 border border-black/5 flex items-center justify-center font-black text-gray-300 text-lg">H</div>
                                        <div>
                                            <div className="text-sm font-bold text-muted">Харилцагч {id}</div>
                                            <div className="text-xs text-muted/60">Захиалгын түүх харав</div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">Өчигдөр</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
