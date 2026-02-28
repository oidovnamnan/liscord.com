import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Search,
    Plus,
    MoreVertical,
    Folder,
    Star,
    Clock,
    FileText,
    Share2,
    Trash2,
    Layout
} from 'lucide-react';

interface Note {
    id: string;
    title: string;
    preview: string;
    category: string;
    updatedAt: string;
    starred: boolean;
}

const MOCK_NOTES: Note[] = [
    {
        id: 'N-101',
        title: 'Маркетингийн төлөвлөгөө - 2026',
        preview: 'Энэ жилийн маркетингийн төлөвлөгөөнд сошиал медиа сувгуудыг түлхүү ашиглахаар...',
        category: 'Маркетинг',
        updatedAt: '2026-02-27',
        starred: true
    },
    {
        id: 'N-102',
        title: 'Үйлдвэрийн аюулгүй байдал',
        preview: 'Аюулгүй ажиллагааны зааварчилгааг өдөр бүр ажил эхлэхээс өмнө...',
        category: 'Үйлдвэрлэл',
        updatedAt: '2026-02-25',
        starred: false
    },
    {
        id: 'N-103',
        title: 'Шинэ төслийн санаанууд',
        preview: '1. Хүүхдийн тоглоомын тавилга, 2. Модон хэрэгсэл...',
        category: 'R&D',
        updatedAt: '2026-02-20',
        starred: false
    }
];

export function NotesPage() {
    const [notes] = useState<Note[]>(MOCK_NOTES);

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Тэмдэглэл (Notes)"
                    subtitle="Хувийн болон дундын тэмдэглэл хөтлөх, мэдлэгийн сан үүсгэх"
                    action={{
                        label: "Тэмдэглэл бичих",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Notes Sidebar/Navigation */}
                    <div className="col-3 flex flex-col gap-4">
                        <div className="card p-4 bg-surface-2 border-none shadow-sm flex flex-col gap-2">
                            <button className="flex items-center gap-3 p-3 rounded-xl bg-primary text-white font-black shadow-lg">
                                <Plus size={20} /> Шинэ тэмдэглэл
                            </button>
                            <div className="h-px bg-border-color/10 my-2" />
                            <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-3 transition-all text-sm font-bold text-muted">
                                <Clock size={20} /> Сүүлд үзсэн
                            </button>
                            <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-3 transition-all text-sm font-bold text-muted">
                                <Star size={20} /> Одонтой
                            </button>
                            <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-3 transition-all text-sm font-bold text-muted">
                                <Folder size={20} /> Хавтаснууд
                            </button>
                            <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-3 transition-all text-sm font-bold text-muted">
                                <Trash2 size={20} /> Хогийн сав
                            </button>
                        </div>
                    </div>

                    {/* Notes Content */}
                    <div className="col-9">
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <input className="input pl-10 h-10 w-full" placeholder="Тэмдэглэл хайх..." />
                            </div>
                            <button className="btn btn-outline h-10 px-4"><Layout size={16} className="mr-2" /> Сүлжээ</button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {notes.map(note => (
                                <div key={note.id} className="card p-6 hover-lift shadow-sm bg-surface-1 border-none group relative cursor-pointer">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-primary-light p-3 rounded-2xl text-primary font-black">
                                            <FileText size={24} />
                                        </div>
                                        <div className="flex gap-1">
                                            <button className={`btn btn-ghost p-2 rounded-xl transition-all ${note.starred ? 'text-warning' : 'text-muted'}`}>
                                                <Star size={18} fill={note.starred ? 'currentColor' : 'none'} />
                                            </button>
                                            <button className="btn btn-ghost p-2 rounded-xl text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black mb-2 group-hover:text-primary transition-colors">{note.title}</h3>
                                    <p className="text-sm text-muted mb-6 line-clamp-3 leading-relaxed">
                                        {note.preview}
                                    </p>
                                    <div className="flex justify-between items-center pt-4 border-t border-border-color/10">
                                        <span className="badge badge-outline text-[10px] font-black uppercase tracking-widest">{note.category}</span>
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-1">
                                            <Clock size={12} /> {note.updatedAt}
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                                </div>
                            ))}

                            <div className="card p-6 border-dashed border-2 bg-surface-2 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary transition-all">
                                <div className="bg-surface-3 p-4 rounded-3xl text-muted group-hover:text-primary transition-colors mb-4">
                                    <Share2 size={32} />
                                </div>
                                <h4 className="font-bold">Дундын тэмдэглэл</h4>
                                <p className="text-xs text-muted max-w-[150px] mt-1">Бусадтайгаа хамтран тэмдэглэл хөтлөх</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </HubLayout>
    );
}
