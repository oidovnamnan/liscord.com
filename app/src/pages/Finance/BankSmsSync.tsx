import { useState } from 'react';
import { useBusinessStore } from '../../store';
import { Header } from '../../components/layout/Header';
import {
    Smartphone,
    QrCode,
    CheckCircle2,
    RefreshCcw,
    Link as LinkIcon,
    ExternalLink,
    AlertCircle,
    Search,
    History,
    Zap,
    CircleCheck,
    HelpCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';

interface SmsLog {
    id: string;
    body: string;
    sender: string;
    amount: number;
    bank: string;
    note: string;
    time: string;
    status: 'matched' | 'pending' | 'ignored';
    orderId?: string;
}

export function BankSmsSyncPage() {
    const { business } = useBusinessStore();
    const [apiKey, setApiKey] = useState('ls_sk_' + Math.random().toString(36).substring(2, 12));
    const [isConnected] = useState(false);
    const [lastSync] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'feed' | 'setup'>('setup');

    // Mock logs
    const [logs] = useState<SmsLog[]>([
        {
            id: '1',
            body: 'Orlogo: 50,000.00 MNT, Dans: 5000123456, Utga: ORD-8891',
            sender: '19001917',
            amount: 50000,
            bank: 'Khan Bank',
            note: 'ORD-8891',
            time: 'Өнөөдөр 12:30',
            status: 'matched',
            orderId: 'ORD-8891'
        },
        {
            id: '2',
            body: 'Golomt Bank: 125,000.00 MNT orlogo orloo. Note: Tsauna set',
            sender: 'Golomt',
            amount: 125000,
            bank: 'Golomt Bank',
            note: 'Tsauna set',
            time: 'Өнөөдөр 10:15',
            status: 'pending'
        }
    ]);

    const setupUrl = `https://api.liscord.com/sms/sync?bid=${business?.id}&key=${apiKey}`;

    const handleGenerateKey = () => {
        setApiKey('ls_sk_' + Math.random().toString(36).substring(2, 12));
        toast.success('Шинэ түлхүүр үүсгэлээ');
    };

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="SMS Банк Холболт"
                subtitle="Гар утсан дээр ирж буй банкны мессежийг автоматаар уншиж, орлого бүртгэх модуль"
            />

            <div className="page-content">
                {/* Module Status Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    background: 'var(--surface-2)',
                    padding: '16px 24px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-glass)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isConnected ? 'var(--success)' : 'var(--text-tertiary)'
                        }}>
                            <Zap size={24} className={isConnected ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Холболтын төлөв</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: isConnected ? 'var(--success)' : 'var(--text-tertiary)'
                                }} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {isConnected ? `Холбогдсон (Сүүлийн синк: ${lastSync || 'Дөнгөж сая'})` : 'Төхөөрөмж холбогдоогүй'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            className={`btn btn-sm ${activeTab === 'setup' ? 'btn-primary gradient-btn' : 'btn-ghost'}`}
                            onClick={() => setActiveTab('setup')}
                        >
                            <QrCode size={16} /> Тохиргоо
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === 'feed' ? 'btn-primary gradient-btn' : 'btn-ghost'}`}
                            onClick={() => setActiveTab('feed')}
                        >
                            <History size={16} /> Гүйлгээний түүх
                        </button>
                    </div>
                </div>

                {activeTab === 'setup' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                        {/* Step by Step Guide */}
                        <div className="card-premium">
                            <h3 className="card-title">Холбох заавар</h3>

                            <div className="setup-steps" style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '24px' }}>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div className="step-number" style={{
                                        width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, flexShrink: 0
                                    }}>1</div>
                                    <div>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>SMS Forwarder апп татах</h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                            Android утсан дээрээ Play Store-оос <b>"SMS to HTTP"</b> эсвэл <b>"SMS Forwarder"</b> нэртэй дурын апп татаж суулгана. <i>(iOS дээр боломжгүйг анхаарна уу)</i>
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                            <button className="btn btn-xs btn-outline" style={{ borderRadius: '8px' }}>
                                                <Smartphone size={14} /> Play Store нээх
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div className="step-number" style={{
                                        width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--primary)',
                                        color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, flexShrink: 0
                                    }}>2</div>
                                    <div>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Webhook тохиргоо хийх</h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                            Апп дотроо <b>POST</b> төрлийн хүсэлт илгээхээр тохируулж, хажуу талын QR кодыг уншуулж холболтын URL-ыг оруулна.
                                        </p>
                                        <div style={{
                                            background: 'var(--surface-3)', padding: '12px', borderRadius: '12px',
                                            marginTop: '12px', fontSize: '0.85rem', fontFamily: 'monospace',
                                            border: '1px dashed var(--border-primary)', color: 'var(--text-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                        }}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{setupUrl}</span>
                                            <button className="btn btn-ghost btn-xs" onClick={() => {
                                                navigator.clipboard.writeText(setupUrl);
                                                toast.success('Хуулагдлаа');
                                            }}><LinkIcon size={14} /></button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div className="step-number" style={{
                                        width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--primary)',
                                        color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, flexShrink: 0
                                    }}>3</div>
                                    <div>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Шүүлтүүр тохируулах</h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                            Зөвхөн банкны дугааруудаас (жишээ нь: 19001917, 131313) ирэх мессежийг дамжуулахаар шүүлтүүр тохируулна. Ингэснээр таны хувийн мессеж дамжихгүй.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '40px', padding: '20px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.05)',
                                border: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', gap: '16px'
                            }}>
                                <HelpCircle className="text-primary" size={24} />
                                <div>
                                    <h5 style={{ margin: '0 0 4px 0' }}>Тусламж хэрэгтэй юу?</h5>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Манай "SMS Bridge" апп-ыг ашиглан 1 минутанд холбогдох боломжтой. Заавар видеог эндээс үзнэ үү.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* QR Connection Card */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="card-premium" style={{ textAlign: 'center', padding: '32px 24px' }}>
                                <div style={{
                                    background: 'white', padding: '16px', borderRadius: '24px',
                                    display: 'inline-block', marginBottom: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                                }}>
                                    <QRCodeSVG value={setupUrl} size={150} level="M" />
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800 }}>Холболтын QR</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                                    Forwarder апп-ын тохиргоо руу утсаараа уншуулж холболтыг идэвхжүүлнэ.
                                </p>

                                <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Аюулгүй байдлын түлхүүр</label>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        <input
                                            readOnly
                                            value={apiKey}
                                            className="input input-sm"
                                            style={{ background: 'var(--surface-3)', border: 'none', flex: 1, fontFamily: 'monospace' }}
                                        />
                                        <button className="btn btn-ghost btn-sm" onClick={handleGenerateKey}>
                                            <RefreshCcw size={14} />
                                        </button>
                                    </div>
                                </div>

                                <button className="btn btn-outline w-full" style={{ gap: '8px' }}>
                                    <Smartphone size={16} /> Төхөөрөмж шалгах
                                </button>
                            </div>

                            <div className="card-premium" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <Zap size={20} style={{ color: 'var(--warning)' }} />
                                    <h4 style={{ margin: 0 }}>Боломжууд</h4>
                                </div>
                                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <li style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
                                        <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                                        <span>Гүйлгээний утга дээрх захиалгын кодыг автоматаар таних</span>
                                    </li>
                                    <li style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
                                        <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                                        <span>Захиалгын төлөвийг автоматаар "Төлөгдсөн" болгож өөрчлөх</span>
                                    </li>
                                    <li style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
                                        <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                                        <span>Танигдаагүй гүйлгээг гараар холбох боломж</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card-premium" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="search-input-wrapper" style={{ position: 'relative', width: '300px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    className="input input-sm"
                                    placeholder="Гүйлгээ хайх..."
                                    style={{ paddingLeft: '36px', width: '100%', borderRadius: '10px' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-ghost btn-sm" style={{ gap: '6px' }}><RefreshCcw size={14} /> Шинэчлэх</button>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="table">
                                <thead style={{ background: 'var(--surface-3)' }}>
                                    <tr>
                                        <th style={{ paddingLeft: '24px' }}>Хугацаа</th>
                                        <th>Банк</th>
                                        <th>Дүн</th>
                                        <th>Утга / Орлого</th>
                                        <th>Төлөв</th>
                                        <th style={{ textAlign: 'right', paddingRight: '24px' }}>Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} style={{ transition: 'all 0.2s ease' }} className="hover-row">
                                            <td style={{ paddingLeft: '24px' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.time}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{log.sender}</div>
                                            </td>
                                            <td>
                                                <div className={`badge ${log.bank === 'Khan Bank' ? 'badge-primary' : 'badge-outline'}`} style={{ fontSize: '0.7rem' }}>
                                                    {log.bank}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 800, color: 'var(--success)' }}>+{log.amount.toLocaleString()}₮</div>
                                            </td>
                                            <td>
                                                <div style={{ maxWidth: '300px', fontSize: '0.85rem' }}>
                                                    <div style={{ fontWeight: 700 }}>{log.note}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {log.body}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {log.status === 'matched' ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.85rem' }}>
                                                        <CircleCheck size={16} />
                                                        <span>Холбогдсон ({log.orderId})</span>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)', fontSize: '0.85rem' }}>
                                                        <AlertCircle size={16} />
                                                        <span>Танигдаагүй</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {log.status === 'pending' && (
                                                        <button className="btn btn-primary btn-xs gradient-btn">Холбох</button>
                                                    )}
                                                    <button className="btn btn-ghost btn-xs"><ExternalLink size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .card-premium {
                    background: var(--surface-2);
                    border-radius: 24px;
                    border: 1px solid var(--border-glass);
                    padding: 24px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                }
                .card-title {
                    margin: 0 0 20px 0;
                    font-size: 1.25rem;
                    font-weight: 900;
                    letter-spacing: -0.5px;
                }
                .hover-row:hover {
                    background: var(--surface-3);
                }
                .badge-primary {
                    background: var(--primary);
                    color: white;
                }
                .badge-outline {
                    border: 1px solid var(--border-primary);
                    color: var(--text-secondary);
                }
                .table th {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--text-tertiary);
                    padding: 12px 16px;
                }
                .table td {
                    padding: 16px;
                    border-bottom: 1px solid var(--border-glass);
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
