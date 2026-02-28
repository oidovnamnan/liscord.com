import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Send,
    Paperclip,
    Smile,
    Search,
    MoreVertical,
    Phone,
    Video,
    Circle,
    Plus,
    Hash,
    Volume2,
    SearchCheck,
    Mic
} from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'busy';
    lastMessage: string;
    time: string;
    unread: number;
    type: 'direct' | 'channel';
}

const MOCK_CONTACTS: Contact[] = [
    {
        id: 'CH-1',
        name: '# Ерөнхий',
        status: 'online',
        lastMessage: 'Сайн байна уу? Үйлдвэрлэлийн төлөвлөгөө гарсан.',
        time: '10:45',
        unread: 12,
        type: 'channel'
    },
    {
        id: 'CH-2',
        name: '# Хаус-20 Төсөл',
        status: 'online',
        lastMessage: 'Д.Тэмүүлэн: Материал татсан байгаа.',
        time: '09:20',
        unread: 0,
        type: 'channel'
    },
    {
        id: 'U-1',
        name: 'Э.Батболд',
        status: 'online',
        lastMessage: 'Тэр зургийг явуулчих уу?',
        time: 'Yesterday',
        unread: 0,
        type: 'direct'
    },
    {
        id: 'U-2',
        name: 'Г.Тулга',
        status: 'busy',
        lastMessage: 'За ойлголоо.',
        time: 'Mon',
        unread: 2,
        type: 'direct'
    }
];

export function InternalChatPage() {
    const [contacts] = useState<Contact[]>(MOCK_CONTACTS);

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                <Header
                    title="Дотоод Чат (Chat)"
                    subtitle="Байгууллагын ажилчид хоорондоо бодит цаг хугацаанд холбогдох, сувгаар харилцах"
                    action={{
                        label: "Шинэ чат",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6 flex-1 overflow-hidden">
                    {/* Contacts & Channels Sidebar */}
                    <div className="col-4 card p-0 overflow-hidden flex flex-col shadow-lg border-none bg-surface-1">
                        <div className="p-4 border-b border-border-color/10">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <input className="input pl-10 h-10 w-full text-sm font-bold" placeholder="Хайх..." />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <div className="flex flex-col">
                                <div className="px-4 py-3 flex justify-between items-center bg-surface-2 border-b border-border-color/5">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">СУВГУУД</h3>
                                    <button className="btn btn-ghost p-1"><Plus size={14} /></button>
                                </div>
                                {contacts.filter(c => c.type === 'channel').map(c => (
                                    <div key={c.id} className="p-4 border-b border-border-color/5 hover:bg-surface-3 transition-all cursor-pointer group flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-surface-3 h-10 w-10 flex items-center justify-center rounded-2xl text-muted font-black group-hover:text-primary transition-colors">
                                                <Hash size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm tracking-tight">{c.name.substring(2)}</h4>
                                                <p className="text-[10px] text-muted truncate max-w-[150px]">{c.lastMessage}</p>
                                            </div>
                                        </div>
                                        {c.unread > 0 && <span className="bg-primary text-white text-[10px] font-black h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full">{c.unread}</span>}
                                    </div>
                                ))}

                                <div className="px-4 py-3 flex justify-between items-center bg-surface-2 border-b border-border-color/5 mt-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">ШУУД ХАРИЛЦАХ</h3>
                                    <button className="btn btn-ghost p-1"><Volume2 size={14} /></button>
                                </div>
                                {contacts.filter(c => c.type === 'direct').map(c => (
                                    <div key={c.id} className="p-4 border-b border-border-color/5 hover:bg-surface-3 transition-all cursor-pointer group flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="bg-surface-3 h-10 w-10 flex items-center justify-center rounded-full text-primary font-black shadow-sm group-hover:scale-105 transition-transform">
                                                    {c.name.substring(0, 1)}
                                                </div>
                                                <Circle size={10} className={`absolute bottom-0 right-0 fill-current ${c.status === 'online' ? 'text-success' : 'text-danger'} border-2 border-white`} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm tracking-tight">{c.name}</h4>
                                                <p className="text-[10px] text-muted truncate max-w-[150px]">{c.lastMessage}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted font-bold uppercase">{c.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="col-8 card p-0 overflow-hidden flex flex-col shadow-2xl border-none bg-surface-1">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-border-color/10 bg-surface-2 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="bg-surface-3 h-12 w-12 flex items-center justify-center rounded-2xl text-primary font-black shadow-inner">
                                    <Hash size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black">Ерөнхий суваг</h3>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                                        <Circle size={8} className="fill-success text-success" /> 24 Хүн Онлайн • Бүх ажилчид
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-ghost p-3 bg-surface-3 border border-border-color/10 rounded-xl"><Search size={18} /></button>
                                <button className="btn btn-ghost p-3 bg-surface-3 border border-border-color/10 rounded-xl"><Phone size={18} /></button>
                                <button className="btn btn-ghost p-3 bg-primary-light text-primary border border-primary/10 rounded-xl shadow-sm"><Video size={18} /></button>
                                <button className="btn btn-ghost p-3 bg-surface-3 border border-border-color/10 rounded-xl"><MoreVertical size={18} /></button>
                            </div>
                        </div>

                        {/* Messages Content */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-gradient-to-b from-surface-2 to-surface-1">
                            <div className="flex gap-4">
                                <div className="h-10 w-10 flex-shrink-0 bg-surface-3 rounded-xl flex items-center justify-center font-black text-primary border border-border-color/5">Б</div>
                                <div className="flex flex-col gap-1 max-w-[70%]">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black">Э.Батболд</span>
                                        <span className="text-[10px] font-bold text-muted uppercase">10:42</span>
                                    </div>
                                    <div className="bg-surface-1 p-4 rounded-2xl rounded-tl-none shadow-sm border border-border-color/5 text-sm leading-relaxed">
                                        Сайн байна уу? Хаус-20 төслийн тавилга татсан уу? Инженерүүд хүлээж байна.
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 flex-row-reverse self-end">
                                <div className="h-10 w-10 flex-shrink-0 bg-primary text-white rounded-xl flex items-center justify-center font-black shadow-lg">С</div>
                                <div className="flex flex-col gap-1 max-w-[70%] items-end">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-muted uppercase">10:45</span>
                                        <span className="text-sm font-black">Сүхбат (Admin)</span>
                                    </div>
                                    <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-xl text-sm leading-relaxed">
                                        Тиймээ, бүх материал талбай дээр очоод буучихсан байгаа. Г.Тулга хянаж байгаа.
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1"><SearchCheck size={12} /> УНШСАН</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-center py-4">
                                <span className="bg-surface-3 px-4 py-1 rounded-full text-[10px] font-black text-muted uppercase tracking-widest border border-border-color/10">ӨНӨӨДӨР</span>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-surface-2 border-t border-border-color/10 relative overflow-visible">
                            <div className="flex items-center gap-3 bg-surface-1 p-2 rounded-2xl border-2 border-border-color/5 shadow-inner group focus-within:border-primary transition-all">
                                <button className="btn btn-ghost p-3 rounded-xl text-muted hover:text-primary transition-colors"><Paperclip size={20} /></button>
                                <textarea className="flex-1 bg-transparent border-none outline-none resize-none pt-2 text-sm font-medium h-10 overflow-hidden" placeholder="Мессеж бичих..."></textarea>
                                <div className="flex gap-1 pr-1">
                                    <button className="btn btn-ghost p-3 rounded-xl text-muted hover:text-warning transition-colors"><Smile size={20} /></button>
                                    <button className="btn btn-ghost p-3 rounded-xl text-muted hover:text-primary transition-colors"><Mic size={20} /></button>
                                    <button className="btn btn-primary p-3 rounded-xl shadow-lg hover:scale-105 transition-transform"><Send size={20} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
