import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    FileText,
    Folder,
    Search,
    Filter,
    Plus,
    MoreVertical,
    Download,
    Share2,
    Trash2,
    Clock,
    Shield,
    Star,
    LayoutGrid,
    List
} from 'lucide-react';

interface Document {
    id: string;
    name: string;
    type: 'pdf' | 'docx' | 'xlsx' | 'folder';
    size: string;
    modified: string;
    owner: string;
    starred: boolean;
}

const MOCK_DOCS: Document[] = [
    {
        id: 'DOC-001',
        name: 'Үйлдвэрлэлийн журам.pdf',
        type: 'pdf',
        size: '2.4 MB',
        modified: '2026-02-27',
        owner: 'Э.Батболд',
        starred: true
    },
    {
        id: 'DOC-002',
        name: 'Төслийн санхүүжилт (Зайсан)',
        type: 'folder',
        size: '--',
        modified: '2026-02-25',
        owner: 'Г.Тулга',
        starred: false
    },
    {
        id: 'DOC-003',
        name: 'Ажилчдын цагийн хүснэгт.xlsx',
        type: 'xlsx',
        size: '1.2 MB',
        modified: '2026-02-20',
        owner: 'С.Баяр',
        starred: false
    }
];

export function DocumentsPage() {
    const [docs] = useState<Document[]>(MOCK_DOCS);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Бичиг Баримт (Documents)"
                    subtitle="Байгууллагын дундын файл, бичиг баримтын сан болон хавтаст бүтэц"
                    action={{
                        label: "Файл хуулах",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Toolbar */}
                    <div className="col-12 flex gap-4 items-center">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Файл, хавтсын нэрээр хайх..." />
                        </div>
                        <div className="flex bg-surface-2 p-1 rounded-xl border border-border-color/10">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-surface-1 text-primary shadow-sm' : 'text-muted'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-surface-1 text-primary shadow-sm' : 'text-muted'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Сүүлийнх</button>
                        <button className="btn btn-primary h-10 px-6 font-bold flex items-center gap-2">
                            <Plus size={18} /> Шинэ хавтас
                        </button>
                    </div>

                    {/* Quick Access */}
                    <div className="col-12 grid grid-cols-4 gap-6 mb-2">
                        <div className="card p-5 bg-surface-2 hover:bg-surface-3 transition-all cursor-pointer border-none flex items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-2xl text-primary"><Star size={24} /></div>
                            <div>
                                <h4 className="font-black text-sm">Одонтой</h4>
                                <p className="text-[10px] text-muted font-bold tracking-widest uppercase">12 Файл</p>
                            </div>
                        </div>
                        <div className="card p-5 bg-surface-2 hover:bg-surface-3 transition-all cursor-pointer border-none flex items-center gap-4">
                            <div className="bg-secondary/10 p-3 rounded-2xl text-secondary"><Clock size={24} /></div>
                            <div>
                                <h4 className="font-black text-sm">Сүүлд үзсэн</h4>
                                <p className="text-[10px] text-muted font-bold tracking-widest uppercase">48 Файл</p>
                            </div>
                        </div>
                        <div className="card p-5 bg-surface-2 hover:bg-surface-3 transition-all cursor-pointer border-none flex items-center gap-4">
                            <div className="bg-success/10 p-3 rounded-2xl text-success"><Shield size={24} /></div>
                            <div>
                                <h4 className="font-black text-sm">Хамгаалагдсан</h4>
                                <p className="text-[10px] text-muted font-bold tracking-widest uppercase">5 Файл</p>
                            </div>
                        </div>
                        <div className="card p-5 bg-surface-2 hover:bg-surface-3 transition-all cursor-pointer border-none flex items-center gap-4">
                            <div className="bg-warning/10 p-3 rounded-2xl text-warning"><Trash2 size={24} /></div>
                            <div>
                                <h4 className="font-black text-sm">Хогийн сав</h4>
                                <p className="text-[10px] text-muted font-bold tracking-widest uppercase">20 Файл</p>
                            </div>
                        </div>
                    </div>

                    {/* Files Display */}
                    <div className="col-12">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-4 gap-6">
                                {docs.map(doc => (
                                    <div key={doc.id} className="card p-0 overflow-hidden hover-lift shadow-sm group bg-surface-1">
                                        <div className="aspect-[4/3] bg-surface-2 flex items-center justify-center border-b border-border-color/10 bg-gradient-to-br from-surface-2 to-surface-3">
                                            {doc.type === 'folder' ? (
                                                <Folder size={64} className="text-warning fill-warning/20" />
                                            ) : (
                                                <div className="relative">
                                                    <FileText size={64} className="text-primary" />
                                                    <span className="absolute bottom-1 right-1 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                        {doc.type}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-sm font-bold truncate pr-4">{doc.name}</h3>
                                                <button className="btn btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={14} /></button>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-widest">
                                                <span>{doc.size}</span>
                                                <span>{doc.modified}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card p-0 overflow-hidden">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Нэр</th>
                                            <th>Төрөл</th>
                                            <th>Хэмжээ</th>
                                            <th>Огноо</th>
                                            <th>Эзэмшигч</th>
                                            <th className="text-right">Үйлдэл</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {docs.map(doc => (
                                            <tr key={doc.id} className="hover:bg-surface-2 transition-colors">
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        {doc.type === 'folder' ? <Folder size={18} className="text-warning" /> : <FileText size={18} className="text-primary" />}
                                                        <span className="font-bold text-sm">{doc.name}</span>
                                                    </div>
                                                </td>
                                                <td><span className="badge badge-outline text-[10px] font-black uppercase">{doc.type}</span></td>
                                                <td className="text-xs text-muted">{doc.size}</td>
                                                <td className="text-xs text-muted">{doc.modified}</td>
                                                <td className="text-xs font-bold">{doc.owner}</td>
                                                <td className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button className="btn btn-ghost p-2"><Download size={14} /></button>
                                                        <button className="btn btn-ghost p-2"><Share2 size={14} /></button>
                                                        <button className="btn btn-ghost p-2"><MoreVertical size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
