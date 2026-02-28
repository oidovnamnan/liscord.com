import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Bell,
    Search,
    Plus,
    MoreVertical,
    CheckCircle2,
    User,
    ArrowRight,
    Zap,
    Layout,
    Heart,
    MessageSquare,
    Share2,
    History,
    Flag,
    Megaphone
} from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    author: string;
    date: string;
    priority: 'low' | 'medium' | 'high';
    category: 'news' | 'policy' | 'event' | 'urgent';
    views: number;
    likes: number;
    replies: number;
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: 'ANN-101',
        title: 'Цагаан сарын амралтын хуваарь',
        content: 'Бүх ажилчид 2-р сарын 15-аас 20-ны хооронд амарна. Ээлжийн ажилчид дотоод журмын дагуу...',
        author: 'Захиргаа',
        date: '2026-02-27',
        priority: 'high',
        category: 'policy',
        views: 124,
        likes: 45,
        replies: 12
    },
    {
        id: 'ANN-102',
        title: 'Шинэ инженер томилогдлоо',
        content: 'Д.Тэмүүлэн инженер Барилгын хэлтэст төслийн менежерээр ажиллахаар боллоо. Түүнд амжилт хүсье!',
        author: 'Хүний нөөц',
        date: '2026-02-20',
        priority: 'medium',
        category: 'news',
        views: 89,
        likes: 32,
        replies: 5
    },
    {
        id: 'ANN-103',
        title: 'Дотоод систем сайжруулалт',
        content: 'Liscord системд өнөөдөр 22:00 цагт шинэчлэлт хийгдэнэ. Энэ үеэр түр саатал гарч болзошгүй.',
        author: 'IT Хэлтэс',
        date: '2026-02-15',
        priority: 'low',
        category: 'urgent',
        views: 245,
        likes: 12,
        replies: 8
    }
];

export function AnnouncementsPage() {
    const [announcements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Зарлал (Announcements)"
                    subtitle="Байгууллагын албан ёсны мэдээлэл, мэдэгдэл болон дотоод үйл ажиллагаа зарлах"
                    action={{
                        label: "Зарлал нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Featured/Urgent News */}
                    <div className="col-12 card p-8 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-2xl flex flex-col md:flex-row items-center gap-12 overflow-hidden relative group hover:scale-[1.01] transition-transform cursor-pointer">
                        <Zap size={128} className="absolute -bottom-8 -right-8 opacity-10 group-hover:scale-125 transition-transform" />
                        <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md shadow-inner animate-pulse">
                            <Megaphone size={48} className="text-white" />
                        </div>
                        <div className="flex-1 relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-danger text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest border border-white/20 animate-bounce">ЯАРАЛТАЙ</span>
                                <span className="text-[10px] font-black opacity-70 flex items-center gap-1"><History size={12} /> ХОЁР ЦАГИЙН ӨМНӨ</span>
                            </div>
                            <h2 className="text-3xl font-black mb-2">Үйлдвэрлэлийн шинэ журам хэрэгжиж эхэллээ</h2>
                            <p className="text-sm opacity-80 max-w-2xl leading-relaxed">
                                Өнөөдрөөс эхлэн бүх төрлийн материал таталтыг зөвхөн Дижитал системээр дамжуулан баталгаажуулна. Цаасан хүсэлт авахгүй болохыг анхаарна уу.
                            </p>
                        </div>
                        <button className="relative z-10 btn bg-white text-primary font-black h-16 px-12 rounded-3xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                            УНШИХ <ArrowRight size={20} />
                        </button>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Зарлал, мэдээ хайх..." />
                        </div>
                        <div className="flex bg-surface-2 p-1 rounded-2xl border border-border-color/10 shadow-inner">
                            <button className="p-2 rounded-xl bg-surface-1 text-primary shadow-sm"><Layout size={20} /></button>
                            <button className="p-2 rounded-xl text-muted"><History size={20} /></button>
                        </div>
                        <button className="btn btn-outline h-11 px-6 font-black rounded-xl">Категори</button>
                    </div>

                    {/* Announcements List */}
                    <div className="col-12 grid grid-cols-1 gap-6">
                        {announcements.map(ann => (
                            <div key={ann.id} className="card p-0 overflow-hidden hover-shadow transition-shadow bg-surface-1 border-none group relative">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`p-8 flex flex-col justify-center items-center divide-y divide-border-color/10 min-w-[140px] bg-surface-2 ${ann.category === 'policy' ? 'text-primary' :
                                        ann.category === 'news' ? 'text-secondary' :
                                            ann.category === 'urgent' ? 'text-danger' : 'text-success'
                                        }`}>
                                        <div className="pb-4 font-black text-center">
                                            <div className="text-3xl">{ann.date.split('-')[1]}</div>
                                            <div className="text-[10px] uppercase opacity-70 font-bold tracking-widest">{ann.date.split('-')[0]}</div>
                                        </div>
                                        <div className="pt-4 flex flex-col items-center gap-1">
                                            <Flag size={20} className="mb-1" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{ann.category}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-8 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-2xl font-black group-hover:text-primary transition-colors cursor-pointer leading-tight">{ann.title}</h3>
                                                    <span className={`badge badge-outline text-[10px] font-black uppercase tracking-widest opacity-50`}>{ann.id}</span>
                                                </div>
                                                <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><User size={12} className="text-primary" /> {ann.author}</span>
                                                    <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-success" /> Албан ёсны</span>
                                                </div>
                                            </div>
                                            <button className="btn btn-ghost p-2 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={20} /></button>
                                        </div>

                                        <p className="text-muted text-sm leading-relaxed max-w-4xl line-clamp-2">
                                            {ann.content}
                                        </p>

                                        <div className="flex justify-between items-center pt-4 border-t border-border-color/10">
                                            <div className="flex gap-6">
                                                <div className="flex items-center gap-2 group/stat cursor-pointer">
                                                    <Heart size={16} className="text-muted group-hover/stat:text-danger transition-colors" />
                                                    <span className="text-xs font-black text-muted">{ann.likes}</span>
                                                </div>
                                                <div className="flex items-center gap-2 group/stat cursor-pointer">
                                                    <MessageSquare size={16} className="text-muted group-hover/stat:text-primary transition-colors" />
                                                    <span className="text-xs font-black text-muted">{ann.replies}</span>
                                                </div>
                                                <div className="flex items-center gap-2 group/stat cursor-pointer">
                                                    <Bell size={16} className="text-muted group-hover/stat:text-warning transition-colors" />
                                                    <span className="text-xs font-black text-muted">{ann.views} Үзсэн</span>
                                                </div>
                                            </div>
                                            <button className="btn btn-link btn-sm flex items-center gap-2 p-0 h-auto font-black text-primary hover:gap-4 transition-all">
                                                ҮРГЭЛЖЛҮҮЛЭХ <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-100 transition-opacity">
                                    <Share2 size={24} className="text-muted cursor-pointer hover:text-primary transition-colors" />
                                </div>
                            </div>
                        ))}

                        <div className="card p-8 border-dashed border-2 bg-surface-2 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary transition-all rounded-3xl mt-4">
                            <Plus size={32} className="text-muted group-hover:text-primary transition-colors mb-2" />
                            <h4 className="font-bold">Шинэ Мэдээ Оруулах</h4>
                            <p className="text-xs text-muted max-w-[200px] mt-1">Нийт ажилчдад албан ёсны зарлал мэдээлэл хүргэх</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </HubLayout>
    );
}
