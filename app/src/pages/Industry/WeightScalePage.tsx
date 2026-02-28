import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Scale,
    Zap,
    RefreshCw,
    Printer,
    CheckCircle2,
    AlertCircle,
    History,
    Settings,
    MoreVertical,
    Plus,
    Tag,
    BarChart3
} from 'lucide-react';

export function WeightScalePage() {
    const devices = [
        { id: 'WS-001', name: 'Махны жинлүүр', type: 'Industrial', status: 'online', weight: '4.250 кг', lastCalib: '2024-03-01' },
        { id: 'WS-002', name: 'Жимс/Хүнсний ногоо', type: 'Retail', status: 'online', weight: '0.000 кг', lastCalib: '2024-03-10' },
        { id: 'WS-003', name: 'Савлагаа', type: 'Logistic', status: 'offline', weight: '-', lastCalib: '2024-02-15' },
    ];

    const logs = [
        { id: 'LOG-01', item: 'Үхрийн цул мах', weight: '2.500 кг', price: '₮45,000', time: '10:15' },
        { id: 'LOG-02', item: 'Алим (Улаан)', weight: '1.240 кг', price: '₮8,500', time: '10:22' },
        { id: 'LOG-03', item: 'Төмс (Шинэ)', weight: '5.000 кг', price: '₮10,000', time: '10:45' },
    ];

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Жинлүүр Холболт & Хэмжилт"
                subtitle="Борлуулалтын жинлүүр, үйлдвэрлэлийн порцын хяналт болон IoT төхөөрөмжийн удирдлага"
            />

            <div className="page-content mt-6 h-full flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border shadow-sm">
                            <h3 className="m-0 text-xl font-black text-gray-900 tracking-tighter">Төхөөрөмжийн жагсаалт</h3>
                            <button className="btn btn-primary h-12 px-6 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Plus size={16} /> Төхөөрөмж нэмэх</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {devices.map((device, i) => (
                                <div key={device.id} className="card p-8 border shadow-lg bg-white rounded-[2.5rem] group hover-lift animate-slide-up relative overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 rounded-2xl ${device.status === 'online' ? 'bg-success-light text-success' : 'bg-surface-2 text-muted shadow-inner'}`}>
                                            <Scale size={32} strokeWidth={2.5} className="group-hover:rotate-6 transition-transform" />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`badge ${device.status === 'online' ? 'badge-success' : 'badge-ghost'} font-black uppercase text-[10px] px-3 py-1 rounded-lg`}>{device.status}</span>
                                            <button className="text-muted hover:text-primary transition-colors"><Settings size={16} /></button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <h4 className="m-0 text-xl font-black text-gray-900 tracking-tight">{device.name}</h4>
                                        <span className="text-[10px] font-black uppercase text-muted tracking-widest">{device.type} • {device.id}</span>
                                    </div>

                                    <div className="mt-8 flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Одоогийн жин</span>
                                            <span className={`text-4xl font-black tracking-tighter group-hover:scale-105 transition-transform ${device.status === 'online' ? 'text-gray-900' : 'text-gray-300'}`}>{device.weight}</span>
                                        </div>
                                        <button className={`btn btn-ghost btn-icon h-12 w-12 rounded-2xl bg-surface-2 ${device.status === 'online' ? 'text-primary animate-pulse' : 'text-muted'}`}><RefreshCw size={20} /></button>
                                    </div>

                                    <div className="absolute top-4 right-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                                        <Zap size={140} strokeWidth={1} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="card p-8 bg-black text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <BarChart3 className="absolute -right-8 -top-8 text-white/5 group-hover:scale-110 transition-transform duration-1000" size={180} />
                            <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest mb-6">Статистик</h4>
                            <div className="flex flex-col gap-6 relative z-10">
                                <div className="flex flex-col gap-1">
                                    <div className="text-3xl font-black tracking-tighter">8,420</div>
                                    <div className="text-[10px] font-black uppercase text-primary tracking-widest">Нийт жинлэсэн (Энэ сар)</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    <div>
                                        <div className="text-lg font-black tracking-tight">98.5%</div>
                                        <div className="text-[10px] font-black uppercase text-white/40 tracking-widest mt-1">Нарийвчлал</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-black tracking-tight">120кг</div>
                                        <div className="text-[10px] font-black uppercase text-white/40 tracking-widest mt-1">Өнөөдөр</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card p-8 border shadow-xl bg-white rounded-[2.5rem] flex flex-col gap-6 relative group">
                            <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                <AlertCircle size={16} className="text-warning" /> Баталгаажуулалт (Calibration)
                            </h4>
                            <div className="flex flex-col gap-4">
                                {devices.slice(0, 2).map((d) => (
                                    <div key={d.id} className="p-4 bg-surface-2 border border-black/5 rounded-2xl flex items-center justify-between group/item">
                                        <div>
                                            <div className="text-xs font-black text-gray-800 tracking-tight">{d.name}</div>
                                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">Сүүлд: {d.lastCalib}</div>
                                        </div>
                                        <button className="btn btn-ghost btn-sm h-8 px-4 rounded-lg bg-white border border-black/5 text-[9px] font-black uppercase tracking-widest hover:border-primary/20 hover:text-primary transition-all">Reset</button>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-outline w-full h-12 rounded-2xl border-black/5 font-black uppercase tracking-widest text-[9px] mt-2 flex items-center justify-center gap-2">Бүгдийг шалгах &rarr;</button>
                        </div>
                    </div>
                </div>

                <div className="card border shadow-xl bg-white rounded-[3rem] overflow-hidden group">
                    <div className="px-10 py-8 border-b flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-light text-primary rounded-2xl"><History size={24} /></div>
                            <div>
                                <h3 className="m-0 text-xl font-black text-gray-900 tracking-tighter">Сүүлийн жинлэлтүүд</h3>
                                <p className="m-0 text-[10px] font-bold uppercase text-muted tracking-widest mt-1">Төхөөрөмжөөс шууд ирсэн өгөгдөл</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="btn btn-ghost h-12 w-12 rounded-2xl bg-surface-2"><Printer size={18} /></button>
                            <button className="btn btn-outline h-12 px-6 rounded-2xl border-black/5 font-black uppercase tracking-widest text-[10px]">Экспортлох</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-surface-2">
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Барааны нэр</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Хэмжилт (Жин)</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Үнэ/Өртөг</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Хэзээ</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-surface-1 transition-colors group/row">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-primary group-hover/row:rotate-12 transition-transform"><Tag size={18} /></div>
                                                <span className="font-black text-gray-800 tracking-tight">{log.item}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 font-black text-lg text-gray-900 tracking-tighter">{log.weight}</td>
                                        <td className="px-10 py-6 font-black text-primary tracking-tighter text-md">{log.price}</td>
                                        <td className="px-10 py-6 text-xs font-bold text-muted uppercase tracking-widest">{log.time}</td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-primary"><CheckCircle2 size={16} /></button>
                                                <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-muted"><MoreVertical size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
