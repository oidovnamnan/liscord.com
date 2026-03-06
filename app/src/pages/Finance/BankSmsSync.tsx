import { useState } from 'react';
import { useBusinessStore } from '../../store';
import { Header } from '../../components/layout/Header';
import {
    Smartphone,
    QrCode,
    RefreshCcw,
    ExternalLink,
    AlertCircle,
    Search,
    History,
    Zap,
    CircleCheck
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
                subtitle="Гар утсан дээр ирж буй банкны гүйлгээг автоматаар уншиж, захиалгатай холбох ухаалаг систем"
            />

            <div className="page-content">
                {/* Module Status Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '28px',
                    background: 'linear-gradient(135deg, var(--surface-2), var(--surface-3))',
                    padding: '20px 28px',
                    borderRadius: '24px',
                    border: '1px solid var(--border-glass)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '18px',
                            background: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isConnected ? 'var(--success)' : 'var(--text-tertiary)',
                            position: 'relative'
                        }}>
                            <Zap size={28} className={isConnected ? 'animate-pulse' : ''} />
                            {isConnected && (
                                <span className="ping-dot" />
                            )}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>Системийн төлөв</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                <span style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: isConnected ? 'var(--success)' : 'var(--text-tertiary)',
                                    boxShadow: isConnected ? '0 0 10px var(--success)' : 'none'
                                }} />
                                <span style={{ fontSize: '0.95rem', color: isConnected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 500 }}>
                                    {isConnected ? `Идэвхтэй (Сүүлийн синк: ${lastSync || 'Дөнгөж сая'})` : 'Төхөөрөмж холбогдоогүй байна'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', background: 'var(--surface-4)', padding: '6px', borderRadius: '16px' }}>
                        <button
                            className={`btn btn-sm ${activeTab === 'setup' ? 'btn-primary shadow-lg' : 'btn-ghost'}`}
                            style={{ borderRadius: '12px', padding: '10px 16px' }}
                            onClick={() => setActiveTab('setup')}
                        >
                            <QrCode size={18} /> Тохиргоо
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === 'feed' ? 'btn-primary shadow-lg' : 'btn-ghost'}`}
                            style={{ borderRadius: '12px', padding: '10px 16px' }}
                            onClick={() => setActiveTab('feed')}
                        >
                            <History size={18} /> Түүх
                        </button>
                    </div>
                </div>

                {activeTab === 'setup' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '28px' }}>
                        {/* Step by Step Guide */}
                        <div className="card-premium glass-card">
                            <h3 className="card-title">Автоматжуулалт идэвхжүүлэх</h3>

                            <div className="setup-steps" style={{ display: 'flex', flexDirection: 'column', gap: '36px', marginTop: '28px' }}>
                                <div style={{ display: 'flex', gap: '24px', position: 'relative' }}>
                                    <div className="step-badge">1</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h4 className="step-heading">Liscord Bridge суулгах</h4>
                                            <span className="version-badge">v1.0 Stable</span>
                                        </div>
                                        <p className="step-description">
                                            Манай албан ёсны <b>Liscord Bridge</b> туслах апп-ыг Android утсан дээрээ суулгана. Энэ нь маш хөнгөн бөгөөд зөвхөн банкны орлогыг таны систем рүү аюулгүй дамжуулах үүрэгтэй.
                                        </p>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                            <a
                                                href="https://github.com/oidovnamnan/liscord.com/releases/download/bridge-v1/app-release.apk"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-primary gradient-glow"
                                                style={{ borderRadius: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px' }}
                                            >
                                                <Smartphone size={18} /> Bridge .APK Татах
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '24px' }}>
                                    <div className="step-badge outline">2</div>
                                    <div>
                                        <h4 className="step-heading">QR код уншуулах</h4>
                                        <p className="step-description">
                                            Bridge апп-аа нээгээд "Scan QR" товчийг дарж хажуу талын холболтын кодыг уншуулна уу. Систем таныг автоматаар таньж холбогдох болно.
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '24px' }}>
                                    <div className="step-badge outline">3</div>
                                    <div>
                                        <h4 className="step-heading">Сэрэмжлүүлэг & Зөвшөөрөл</h4>
                                        <p className="step-description">
                                            Апп-д "SMS унших" болон "Background-д ажиллах" зөвшөөрлийг өгснөөр таныг утсаа ашиглаагүй үед ч орлого автоматаар бүртгэгдэх болно.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="info-box">
                                <AlertCircle className="text-secondary" size={24} />
                                <div>
                                    <h5 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700 }}>Санамж</h5>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        Хаан банк, Голомт, Төрийн банк зэрэг бүх банкны SMS-ийг дэмждэг. Утасны дата эсвэл Wi-Fi асаалттай байх шаардлагатайг анхаарна уу.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* QR Connection Card */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="card-premium glass-card" style={{ textAlign: 'center', padding: '40px 32px' }}>
                                <div className="qr-container">
                                    <div className="qr-scan-line" />
                                    <QRCodeSVG value={setupUrl} size={180} level="H" includeMargin={true} />
                                </div>
                                <h3 style={{ margin: '24px 0 8px 0', fontSize: '1.3rem', fontWeight: 900 }}>Холболтын QR</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '28px', lineHeight: 1.5 }}>
                                    Bridge апп-аараа энэхүү кодыг уншуулж холболтыг идэвхжүүлнэ.
                                </p>

                                <div style={{ textAlign: 'left', marginBottom: '28px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label className="label-caps">Аюулгүй байдлын түлхүүр</label>
                                        <button className="text-btn" onClick={handleGenerateKey}>
                                            <RefreshCcw size={12} /> Шинэчлэх
                                        </button>
                                    </div>
                                    <div className="key-box">
                                        <code style={{ fontSize: '0.95rem', fontWeight: 600 }}>{apiKey}</code>
                                    </div>
                                </div>

                                <button className="btn btn-outline w-full" style={{ gap: '10px', borderRadius: '16px', padding: '14px' }}>
                                    <Smartphone size={18} /> Холболт шалгах
                                </button>
                            </div>

                            <div className="card-premium glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '10px' }}>
                                        <Zap size={20} />
                                    </div>
                                    <h4 style={{ margin: 0, fontWeight: 800 }}>Давуу талууд</h4>
                                </div>
                                <ul className="feature-list">
                                    <li>
                                        <CircleCheck size={18} className="text-success" />
                                        <span>Гүйлгээг 1 секундэд таних</span>
                                    </li>
                                    <li>
                                        <CircleCheck size={18} className="text-success" />
                                        <span>Захиалгыг шууд "Төлөгдсөн" болгох</span>
                                    </li>
                                    <li>
                                        <CircleCheck size={18} className="text-success" />
                                        <span>24/7 найдвартай ажиллагаа</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card-premium glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-3)' }}>
                            <div className="search-wrapper">
                                <Search size={18} />
                                <input
                                    placeholder="Гүйлгээ, утга эсвэл дүнгээр хайх..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn btn-ghost btn-sm" style={{ gap: '8px' }}>
                                    <RefreshCcw size={16} /> Шинэчлэх
                                </button>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: '32px' }}>Хугацаа</th>
                                        <th>Банк</th>
                                        <th>Дүн</th>
                                        <th>Мэдээлэл</th>
                                        <th>Төлөв</th>
                                        <th style={{ textAlign: 'right', paddingRight: '32px' }}>Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} className="table-row">
                                            <td style={{ paddingLeft: '32px' }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{log.time}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{log.sender}</div>
                                            </td>
                                            <td>
                                                <div className="bank-badge">
                                                    {log.bank}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 900, color: 'var(--success)', fontSize: '1.05rem' }}>+{log.amount.toLocaleString()}₮</div>
                                            </td>
                                            <td>
                                                <div style={{ maxWidth: '350px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{log.note}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                                                        "{log.body}"
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {log.status === 'matched' ? (
                                                    <div className="status-pill success">
                                                        <CircleCheck size={14} />
                                                        <span>Холбогдсон ({log.orderId})</span>
                                                    </div>
                                                ) : (
                                                    <div className="status-pill warning">
                                                        <AlertCircle size={14} />
                                                        <span>Танигдаагүй</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {log.status === 'pending' && (
                                                        <button className="btn btn-primary btn-xs gradient-btn shadow-sm">Холбох</button>
                                                    )}
                                                    <button className="btn btn-ghost btn-xs rounded-lg"><ExternalLink size={16} /></button>
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
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                }
                .card-premium {
                    padding: 32px;
                    border-radius: 32px;
                }
                .card-title {
                    font-size: 1.5rem;
                    font-weight: 950;
                    margin-bottom: 24px;
                    letter-spacing: -0.8px;
                    background: linear-gradient(to right, var(--text-primary), var(--text-secondary));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .step-badge {
                    width: 38px; height: 38px; border-radius: 12px;
                    background: var(--primary); color: white;
                    display: flex; alignItems: center; justifyContent: center;
                    font-weight: 900; flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                .step-badge.outline {
                    background: transparent;
                    border: 2px solid var(--border-glass);
                    color: var(--text-tertiary);
                    box-shadow: none;
                }
                .step-heading {
                    margin: 0 0 6px 0; font-size: 1.1rem; fontWeight: 800;
                }
                .step-description {
                    color: var(--text-secondary); font-size: 0.92rem; line-height: 1.6;
                }
                .version-badge {
                    font-size: 0.7rem; font-weight: 800; background: rgba(34, 197, 94, 0.1);
                    color: var(--success); padding: 4px 10px; border-radius: 20px;
                    border: 1px solid rgba(34, 197, 94, 0.2);
                }
                .gradient-glow {
                    background: linear-gradient(135deg, var(--primary), #4f46e5);
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
                    transition: all 0.3s ease;
                }
                .gradient-glow:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(59, 130, 246, 0.5);
                }
                .info-box {
                    margin-top: 48px; padding: 24px; border-radius: 20px;
                    background: rgba(59, 130, 246, 0.03);
                    border: 1px solid rgba(59, 130, 246, 0.08);
                    display: flex; gap: 20px; align-items: flex-start;
                }
                .qr-container {
                    background: white; padding: 20px; border-radius: 28px;
                    display: inline-block; position: relative;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.12);
                    overflow: hidden;
                }
                .qr-scan-line {
                    position: absolute; left: 0; right: 0; height: 2px;
                    background: var(--primary); opacity: 0.5;
                    box-shadow: 0 0 15px var(--primary);
                    animation: qrScan 3s linear infinite;
                    z-index: 10;
                }
                @keyframes qrScan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .label-caps {
                    font-size: 0.75rem; color: var(--text-tertiary);
                    text-transform: uppercase; letter-spacing: 1.2px; font-weight: 800;
                }
                .text-btn {
                    background: none; border: none; color: var(--primary);
                    font-size: 0.8rem; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; gap: 4px;
                }
                .key-box {
                    background: var(--surface-3); padding: 14px 18px;
                    border-radius: 14px; border: 1px solid var(--border-glass);
                    color: var(--text-primary); font-family: 'JetBrains Mono', monospace;
                }
                .feature-list {
                    margin: 0; padding: 0; list-style: none;
                    display: flex; flexDirection: column; gap: 14px;
                }
                .feature-list li {
                    font-size: 0.9rem; display: flex; align-items: center;
                    gap: 12px; color: var(--text-secondary); font-weight: 500;
                }
                .search-wrapper {
                    position: relative; width: 380px;
                    display: flex; align-items: center;
                }
                .search-wrapper svg {
                    position: absolute; left: 16px; color: var(--text-tertiary);
                }
                .search-wrapper input {
                    width: 100%; background: var(--surface-2); border: 1px solid var(--border-glass);
                    padding: 12px 16px 12px 48px; border-radius: 16px;
                    font-size: 0.95rem; transition: all 0.2s;
                }
                .search-wrapper input:focus {
                    outline: none; border-color: var(--primary); background: var(--surface-1);
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
                .custom-table {
                    width: 100%; border-collapse: separate; border-spacing: 0;
                }
                .custom-table th {
                    text-align: left; padding: 18px 24px;
                    font-size: 0.8rem; font-weight: 800; color: var(--text-tertiary);
                    text-transform: uppercase; letter-spacing: 1px;
                }
                .table-row {
                    border-bottom: 1px solid var(--border-glass);
                    transition: background 0.2s;
                }
                .table-row:hover {
                    background: rgba(255, 255, 255, 0.02);
                }
                .table-row td {
                    padding: 24px;
                }
                .bank-badge {
                    display: inline-block; padding: 6px 14px; border-radius: 12px;
                    background: var(--surface-4); border: 1px solid var(--border-glass);
                    font-size: 0.8rem; font-weight: 800; color: var(--text-secondary);
                }
                .status-pill {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 8px 14px; border-radius: 12px; font-size: 0.85rem; font-weight: 700;
                }
                .status-pill.success { background: rgba(34, 197, 94, 0.1); color: var(--success); }
                .status-pill.warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
                .ping-dot {
                    position: absolute; top: -2px; right: -2px; width: 12px; height: 12px;
                    background: var(--success); border-radius: 50%; border: 2px solid var(--surface-2);
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                @keyframes ping {
                    75%, 100% { transform: scale(2.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
