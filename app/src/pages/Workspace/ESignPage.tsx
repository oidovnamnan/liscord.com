import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Signature,
    Clock,
    Search,
    Filter,
    Plus,
    ArrowRight,
    ShieldCheck,
    UserPlus,
    FileText,
    History,
    Key
} from 'lucide-react';

interface SignRequest {
    id: string;
    title: string;
    status: 'signed' | 'pending' | 'rejected' | 'draft';
    requestedFrom: string;
    requestedDate: string;
    dueDate: string;
    type: 'contract' | 'agreement' | 'policy';
}

const MOCK_REQUESTS: SignRequest[] = [
    {
        id: 'SIG-101',
        title: 'Хөдөлмөрийн гэрээ - Э.Батболд',
        status: 'pending',
        requestedFrom: 'Э.Батболд',
        requestedDate: '2026-02-27',
        dueDate: '2026-03-02',
        type: 'contract'
    },
    {
        id: 'SIG-102',
        title: 'Нууц хадгалах гэрээ (NDA)',
        status: 'signed',
        requestedFrom: 'Г.Тулга',
        requestedDate: '2026-02-25',
        dueDate: '2026-02-26',
        type: 'agreement'
    },
    {
        id: 'SIG-103',
        title: 'Дотоод журмын танилцуулга',
        status: 'rejected',
        requestedFrom: 'С.Баяр',
        requestedDate: '2026-02-20',
        dueDate: '2026-02-22',
        type: 'policy'
    }
];

export function ESignPage() {
    const [requests] = useState<SignRequest[]>(MOCK_REQUESTS);

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Цахим Гарын Үсэг (E-Sign)"
                    subtitle="Хууль ёсны хүчин төгөлдөр цахим гарын үсэг зурах, баримт бичиг баталгаажуулах"
                    action={{
                        label: "Гэрээ зуруулах",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Stats */}
                    <div className="col-12 card p-6 bg-surface-2 grid grid-cols-4 gap-8 border-none">
                        <div className="flex flex-col gap-1 border-r border-border-color/10">
                            <span className="text-[10px] text-muted font-black tracking-widest uppercase">Хүлээгдэж буй</span>
                            <div className="text-3xl font-black text-warning">12</div>
                        </div>
                        <div className="flex flex-col gap-1 border-r border-border-color/10">
                            <span className="text-[10px] text-muted font-black tracking-widest uppercase">Амжилттай зурсан</span>
                            <div className="text-3xl font-black text-success">1,245</div>
                        </div>
                        <div className="flex flex-col gap-1 border-r border-border-color/10">
                            <span className="text-[10px] text-muted font-black tracking-widest uppercase">Цуцлагдсан</span>
                            <div className="text-3xl font-black text-danger">4</div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted font-black tracking-widest uppercase">Нийт баримт</span>
                            <div className="text-3xl font-black text-primary">1,261</div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Гэрээний нэр, баримтын дугаараар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Сүүлийн 30 хоног</button>
                        <button className="btn btn-primary h-10 px-6 font-bold flex items-center gap-2">
                            <UserPlus size={18} /> Шинэ хүсэлт
                        </button>
                    </div>

                    {/* Request Cards */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="card p-0 overflow-hidden hover-lift shadow-sm bg-surface-1 border-none">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`w-2 md:w-3 flex-shrink-0 ${req.status === 'signed' ? 'bg-success' :
                                        req.status === 'pending' ? 'bg-warning' :
                                            req.status === 'rejected' ? 'bg-danger' : 'bg-surface-3'
                                        }`} />

                                    <div className="flex-1 p-5 flex flex-col md:flex-row items-center gap-6">
                                        <div className="bg-surface-2 p-4 rounded-2xl text-muted font-black border border-border-color/10">
                                            <FileText size={32} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-black">{req.title}</h3>
                                                <span className="badge badge-outline text-[10px] font-black uppercase tracking-widest opacity-50">{req.id}</span>
                                            </div>
                                            <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest">
                                                <span className="flex items-center gap-1"><History size={12} /> {req.requestedDate}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} className="text-danger" /> {req.dueDate} ДУУСНА</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <div className="text-xs font-black text-muted uppercase mb-1">Төлөв</div>
                                                <span className={`badge badge-${req.status === 'signed' ? 'success' :
                                                    req.status === 'pending' ? 'warning' : 'danger'
                                                    } font-black px-4`}>
                                                    {req.status === 'signed' ? 'Зурсан' :
                                                        req.status === 'pending' ? 'Зурж байна' : 'Цуцалсан'}
                                                </span>
                                            </div>
                                            <button className="btn btn-primary h-12 w-12 rounded-full p-0 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Features Hub */}
                    <div className="col-12 mt-6 grid grid-cols-3 gap-6">
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl hover:scale-[1.02] transition-transform cursor-pointer overflow-hidden relative">
                            <Key size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <h3 className="text-lg font-black mb-2 flex items-center gap-2"><Signature size={20} /> Миний гарын үсэг</h3>
                            <p className="text-sm opacity-80 mb-4">Өөрийн гарын үсгийн загварыг үүсгэх, хадгалах.</p>
                            <button className="btn bg-white text-primary font-black py-2 rounded-xl text-sm">Засварлах</button>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex flex-col gap-4">
                            <h3 className="text-lg font-black flex items-center gap-2"><ShieldCheck size={20} className="text-success" /> ГФҮ-ийн баталгаа</h3>
                            <p className="text-sm text-muted">Таны зурсан бүх баримт бичиг blockchain технологиор хамгаалагдсан.</p>
                            <button className="btn btn-outline border-primary text-primary font-black py-2 rounded-xl text-sm">Дэлгэрэнгүй</button>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex flex-col gap-4 text-center items-center justify-center">
                            <Plus size={32} className="text-muted mb-2" />
                            <h3 className="text-lg font-black">Шинэ хавтас</h3>
                            <p className="text-sm text-muted">Гэрээний загвар бүртгэх</p>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
