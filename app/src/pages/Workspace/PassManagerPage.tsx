import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Lock,
    Key,
    ShieldCheck,
    Eye,
    EyeOff,
    Search,
    MoreVertical,
    ExternalLink,
    Copy,
    Star,
    Link,
    Grid,
    List,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';

interface Password {
    id: string;
    site: string;
    username: string;
    url: string;
    security: 'low' | 'medium' | 'high';
    category: 'work' | 'personal' | 'financial';
    updatedAt: string;
}

const MOCK_PASSWORDS: Password[] = [
    {
        id: 'P-001',
        site: 'AWS Console',
        username: 'admin@liscord.com',
        url: 'https://aws.amazon.com',
        security: 'high',
        category: 'work',
        updatedAt: '2026-02-27'
    },
    {
        id: 'P-002',
        site: 'Figma Team',
        username: 'designer@liscord.com',
        url: 'https://figma.com',
        security: 'medium',
        category: 'work',
        updatedAt: '2026-02-20'
    },
    {
        id: 'P-003',
        site: 'Bank Account - Khaan',
        username: 'liscord_finance',
        url: 'https://khanbank.com',
        security: 'low',
        category: 'financial',
        updatedAt: '2026-02-15'
    }
];

export function PassManagerPage() {
    const [passwords] = useState<Password[]>(MOCK_PASSWORDS);
    const [showPass, setShowPass] = useState<Record<string, boolean>>({});

    const togglePass = (id: string) => {
        setShowPass(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Нууц Үгийн Менежер (Vault)"
                    subtitle="Байгууллагын дундын нууц үг, хандалтын эрхийг шифрлэгдсэн хэлбэрээр хадгалах"
                    action={{
                        label: "Нууц үг нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Security Hub Dashboard */}
                    <div className="col-12 card p-6 bg-surface-2 border-none shadow-sm flex items-center gap-12">
                        <div className="flex flex-col gap-1 flex-1 border-r border-border-color/10">
                            <span className="text-[10px] text-muted font-black tracking-widest uppercase">Аюулгүй байдлын оноо</span>
                            <div className="flex items-center gap-3">
                                <div className="text-4xl font-black text-warning">72%</div>
                                <ShieldCheck size={24} className="text-success" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 flex-1 border-r border-border-color/10">
                            <span className="text-[10px] text-muted font-black tracking-widest uppercase">Шинэчлэх шаардлагатай</span>
                            <div className="text-4xl font-black text-danger">4</div>
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[10px] text-muted font-black tracking-widest uppercase">Нийт хадгалсан</span>
                            <div className="text-4xl font-black text-primary">124</div>
                        </div>
                        <div className="flex-1 text-right">
                            <button className="btn btn-primary px-8 font-black rounded-2xl py-3 shadow-lg hover:scale-105 transition-transform"> Vault-ийг Түгжих</button>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Сайтын нэр, хэрэглэгчийн нэрээр хайх..." />
                        </div>
                        <div className="flex bg-surface-2 p-1 rounded-xl border border-border-color/10">
                            <button className="p-2 rounded-lg bg-surface-1 text-primary shadow-sm"><Grid size={18} /></button>
                            <button className="p-2 rounded-lg text-muted"><List size={18} /></button>
                        </div>
                        <button className="btn btn-outline h-10 px-4">Бүх категори</button>
                    </div>

                    {/* Passwords Grid */}
                    <div className="col-12 grid grid-cols-3 gap-6">
                        {passwords.map(pw => (
                            <div key={pw.id} className="card p-0 overflow-hidden hover-shadow transition-shadow bg-surface-1 border-none relative group">
                                <div className="p-5 border-b border-border-color/10 flex justify-between items-center bg-surface-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-surface-3 p-3 rounded-2xl text-primary font-black shadow-inner">
                                            {pw.site.substring(0, 1)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black group-hover:text-primary transition-colors">{pw.site}</h3>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                                                <Link size={10} /> {pw.url.replace('https://', '')}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn btn-ghost p-2 opacity-10 group-hover:opacity-100 transition-opacity"><Star size={18} /></button>
                                </div>

                                <div className="p-5 flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Хэрэглэгчийн нэр</span>
                                        <div className="flex justify-between items-center font-bold text-sm bg-surface-3 p-3 rounded-xl border border-border-color/5">
                                            <span>{pw.username}</span>
                                            <button className="btn btn-ghost p-1 text-muted hover:text-primary transition-colors"><Copy size={14} /></button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Нууц үг</span>
                                        <div className="flex justify-between items-center bg-surface-3 p-3 rounded-xl border border-border-color/5">
                                            <span className="font-bold text-primary font-mono text-sm tracking-widest">
                                                {showPass[pw.id] ? 'Liscord$Vault#2026' : '••••••••••••••••'}
                                            </span>
                                            <div className="flex gap-2">
                                                <button onClick={() => togglePass(pw.id)} className="btn btn-ghost p-1 text-muted hover:text-primary transition-colors">
                                                    {showPass[pw.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button className="btn btn-ghost p-1 text-muted hover:text-primary transition-colors"><Copy size={14} /></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${pw.security === 'high' ? 'text-success' : pw.security === 'medium' ? 'text-warning' : 'text-danger'
                                            }`}>
                                            {pw.security === 'high' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                                            {pw.security === 'high' ? 'МӨН-ИЙН ХАМГААЛАЛТТАЙ' : pw.security === 'medium' ? 'ДУНДАЖ ХАМГААЛАЛТ' : 'СУЛ ХАМГААЛАЛТ'}
                                        </div>
                                        <button className="btn btn-ghost p-2 rounded-xl bg-surface-3 hover:bg-primary-light hover:text-primary transition-all">
                                            <ExternalLink size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical size={18} className="text-muted" />
                                </div>

                                {pw.security === 'low' && (
                                    <div className="absolute top-0 left-0 p-2">
                                        <div className="bg-danger text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase">АНХААР</div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="card p-6 border-dashed border-2 bg-surface-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-all">
                            <div className="bg-surface-3 p-4 rounded-3xl text-muted group-hover:text-primary transition-colors mb-4">
                                <Key size={32} />
                            </div>
                            <h4 className="font-bold">Шинэ Нууц үг</h4>
                            <p className="text-xs text-muted max-w-[150px] mt-1">Аюулгүйгээр нууц үг хадгалах</p>
                        </div>
                    </div>

                    {/* Security Recommendations */}
                    <div className="col-12 mt-6 card p-6 bg-gradient-to-r from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between overflow-hidden relative">
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md"><Lock size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black mb-1">2-Factor Authentication (2FA) Идэвхжүүлэх</h3>
                                <p className="text-sm opacity-80">Таны Vault илүү аюулгүй байхын тулд 2FA тохируулахыг зөвлөж байна.</p>
                            </div>
                        </div>
                        <button className="relative z-10 btn bg-white text-primary font-black px-12 py-3 rounded-2xl shadow-lg hover:scale-105 transition-transform">ТОХИРУУЛАХ</button>
                        <CheckCircle2 size={128} className="absolute -right-8 -bottom-8 opacity-10" />
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
