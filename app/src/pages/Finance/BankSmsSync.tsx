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
                <div className="status-header-premium">
                    <div className="status-info-side">
                        <div className={`status-icon-box ${isConnected ? 'active' : ''}`}>
                            <Zap size={28} className={isConnected ? 'animate-pulse' : ''} />
                            {isConnected && <span className="ping-dot" />}
                        </div>
                        <div>
                            <h3 className="status-title">Системийн төлөв</h3>
                            <div className="status-indicator">
                                <span className={`status-dot ${isConnected ? 'active' : ''}`} />
                                <span className={`status-text ${isConnected ? 'active' : ''}`}>
                                    {isConnected ? `Идэвхтэй (Сүүлийн синк: ${lastSync || 'Дөнгөж сая'})` : 'Төхөөрөмж холбогдоогүй байна'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="tab-switcher">
                        <button
                            className={`tab-btn ${activeTab === 'setup' ? 'active' : ''}`}
                            onClick={() => setActiveTab('setup')}
                        >
                            <QrCode size={18} /> <span>Тохиргоо</span>
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('feed')}
                        >
                            <History size={18} /> <span>Түүх</span>
                        </button>
                    </div>
                </div>

                {activeTab === 'setup' ? (
                    <div className="setup-grid-layout">
                        {/* Step by Step Guide */}
                        <div className="card-premium glass-card">
                            <h3 className="card-title">Автоматжуулалт идэвхжүүлэх</h3>

                            <div className="setup-steps">
                                <div className="step-item">
                                    <div className="step-badge">1</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="step-header-row">
                                            <h4 className="step-heading">Bridge суулгах</h4>
                                            <span className="version-badge">v1.0 Stable</span>
                                        </div>
                                        <p className="step-description">
                                            <b>Liscord Bridge</b> туслах апп-ыг Android утсан дээрээ суулгана. Энэ нь банкны орлогыг систем рүү аюулгүй дамжуулах үүрэгтэй.
                                        </p>
                                        <div className="download-action">
                                            <a
                                                href="https://github.com/oidovnamnan/liscord.com/releases/download/bridge-v1/app-release.apk"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-primary gradient-glow mobile-full-btn"
                                            >
                                                <Smartphone size={18} /> .APK Татах
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="step-item">
                                    <div className="step-badge outline">2</div>
                                    <div>
                                        <h4 className="step-heading">QR код уншуулах</h4>
                                        <p className="step-description">
                                            Bridge апп-аараа хажуу талын (эсвэл доорх) холболтын кодыг уншуулна уу. Систем таныг автоматаар таньж холбогдох болно.
                                        </p>
                                    </div>
                                </div>

                                <div className="step-item">
                                    <div className="step-badge outline">3</div>
                                    <div>
                                        <h4 className="step-heading">Зөвшөөрөл өгөх</h4>
                                        <p className="step-description">
                                            Апп-д "SMS унших" зөвшөөрлийг өгснөөр таныг утсаа ашиглаагүй үед ч орлого автоматаар бүртгэгдэнэ.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="info-box">
                                <AlertCircle className="text-secondary" size={24} />
                                <div>
                                    <h5 className="info-title">Санамж</h5>
                                    <p className="info-text">
                                        Хаан, Голомт, Төрийн банк зэрэг бүх банкны SMS-ийг дэмждэг. Дата эсвэл Wi-Fi асаалттай байх шаардлагатай.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* QR Connection Card */}
                        <div className="setup-side-panel">
                            <div className="card-premium glass-card qr-card-mobile">
                                <div className="qr-container">
                                    <div className="qr-scan-line" />
                                    <QRCodeSVG value={setupUrl} size={180} level="H" includeMargin={true} />
                                </div>
                                <h3 className="qr-title">Холболтын QR</h3>
                                <p className="qr-subtitle">
                                    Bridge апп-аараа энэхүү кодыг уншуулж холболтыг идэвхжүүлнэ.
                                </p>

                                <div className="security-key-section">
                                    <div className="key-header">
                                        <label className="label-caps">Аюулгүй байдлын түлхүүр</label>
                                        <button className="text-btn" onClick={handleGenerateKey}>
                                            <RefreshCcw size={12} /> Шинэчлэх
                                        </button>
                                    </div>
                                    <div className="key-box">
                                        <code>{apiKey}</code>
                                    </div>
                                </div>

                                <button className="btn btn-outline w-full check-link-btn">
                                    <Smartphone size={18} /> Холболт шалгах
                                </button>
                            </div>

                            <div className="card-premium glass-card benefits-card">
                                <div className="benefits-header">
                                    <Zap size={20} />
                                    <h4 className="benefits-title">Давуу талууд</h4>
                                </div>
                                <ul className="feature-list">
                                    <li>
                                        <CircleCheck size={18} className="text-success" />
                                        <span>Гүйлгээг шуурхай таних</span>
                                    </li>
                                    <li>
                                        <CircleCheck size={18} className="text-success" />
                                        <span>Автомат төлөлт</span>
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
                    <div className="card-premium glass-card history-container">
                        <div className="history-header">
                            <div className="search-wrapper">
                                <Search size={18} />
                                <input
                                    placeholder="Гүйлгээ хайх..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="btn btn-ghost btn-refresh">
                                <RefreshCcw size={16} /> <span>Шинэчлэх</span>
                            </button>
                        </div>

                        {/* Desktop Table View */}
                        <div className="desktop-only">
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
                                                    <div className="log-time">{log.time}</div>
                                                    <div className="log-sender">{log.sender}</div>
                                                </td>
                                                <td><div className="bank-badge">{log.bank}</div></td>
                                                <td><div className="log-amount">+{log.amount.toLocaleString()}₮</div></td>
                                                <td>
                                                    <div className="log-info">
                                                        <div className="log-note">{log.note}</div>
                                                        <div className="log-body">"{log.body}"</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={`status-pill ${log.status === 'matched' ? 'success' : 'warning'}`}>
                                                        {log.status === 'matched' ? <CircleCheck size={14} /> : <AlertCircle size={14} />}
                                                        <span>{log.status === 'matched' ? `Холбогдсон (${log.orderId})` : 'Танигдаагүй'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                                    <div className="action-row">
                                                        {log.status === 'pending' && <button className="btn btn-primary btn-xs gradient-btn">Холбох</button>}
                                                        <button className="btn btn-ghost btn-xs"><ExternalLink size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="mobile-only">
                            <div className="mobile-log-list">
                                {logs.map(log => (
                                    <div key={log.id} className="mobile-log-card">
                                        <div className="mlc-header">
                                            <div className="mlc-time-group">
                                                <div className="mlc-time">{log.time}</div>
                                                <div className="mlc-bank">{log.bank}</div>
                                            </div>
                                            <div className="mlc-amount">+{log.amount.toLocaleString()}₮</div>
                                        </div>
                                        <div className="mlc-content">
                                            <div className="mlc-note">{log.note}</div>
                                            <div className="mlc-body">{log.body}</div>
                                        </div>
                                        <div className="mlc-footer">
                                            <div className={`status-pill ${log.status === 'matched' ? 'success' : 'warning'}`}>
                                                {log.status === 'matched' ? <CircleCheck size={12} /> : <AlertCircle size={12} />}
                                                <span>{log.status === 'matched' ? log.orderId : 'Танигдаагүй'}</span>
                                            </div>
                                            <div className="mlc-actions">
                                                {log.status === 'pending' && <button className="btn btn-primary btn-xs">Холбох</button>}
                                                <button className="btn btn-ghost btn-xs"><ExternalLink size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                /* Shared Styles */
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                }
                .card-premium {
                    border-radius: 32px;
                    padding: 32px;
                }
                
                /* Status Header */
                .status-header-premium {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 28px;
                    background: linear-gradient(135deg, var(--surface-2), var(--surface-3));
                    padding: 20px 28px;
                    border-radius: 24px;
                    border: 1px solid var(--border-glass);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.05);
                    backdrop-filter: blur(10px);
                }
                .status-info-side { display: flex; alignItems: center; gap: 20px; }
                .status-icon-box {
                    width: 56px; height: 56px; border-radius: 18px;
                    background: rgba(100, 116, 139, 0.15);
                    display: flex; alignItems: center; justifyContent: center;
                    color: var(--text-tertiary); position: relative;
                }
                .status-icon-box.active { background: rgba(34, 197, 94, 0.15); color: var(--success); }
                .status-title { margin: 0; fontSize: 1.2rem; fontWeight: 900; color: 'var(--text-primary)'; }
                .status-indicator { display: flex; alignItems: center; gap: 8px; margin-top: 6px; }
                .status-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--text-tertiary); }
                .status-dot.active { background: var(--success); box-shadow: 0 0 10px var(--success); }
                .status-text { fontSize: 0.95rem; color: var(--text-secondary); fontWeight: 500; }
                .status-text.active { color: var(--text-primary); }

                /* Tabs */
                .tab-switcher { display: flex; gap: 8px; background: var(--surface-4); padding: 6px; borderRadius: 16px; }
                .tab-btn {
                    display: flex; align-items: center; gap: 8px; border: none; background: none;
                    padding: 10px 16px; borderRadius: 12px; cursor: pointer; color: var(--text-secondary);
                    font-weight: 700; transition: all 0.2s;
                }
                .tab-btn.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }

                /* Grid Layout */
                .setup-grid-layout { display: grid; gridTemplateColumns: 1fr 380px; gap: 28px; }
                .setup-steps { display: flex; flexDirection: column; gap: 36px; marginTop: 28px; }
                .step-item { display: flex; gap: 24px; position: relative; }
                .step-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
                .step-heading { margin: 0 0 6px 0; font-size: 1.1rem; font-weight: 800; }
                .step-description { color: var(--text-secondary); font-size: 0.92rem; line-height: 1.6; }
                .step-badge {
                    width: 38px; height: 38px; border-radius: 12px;
                    background: var(--primary); color: white;
                    display: flex; alignItems: center; justifyContent: center;
                    font-weight: 900; flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                .step-badge.outline { background: transparent; border: 2px solid var(--border-glass); color: var(--text-tertiary); box-shadow: none; }
                .version-badge { font-size: 0.7rem; font-weight: 800; background: rgba(34, 197, 94, 0.1); color: var(--success); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(34, 197, 94, 0.2); }
                .gradient-glow { background: linear-gradient(135deg, var(--primary), #4f46e5); box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4); text-decoration: none; border-radius: 14px; display: flex; align-items: center; gap: 10px; padding: 12px 20px; color: white; font-weight: 700; }
                
                /* QR Panel */
                .setup-side-panel { display: flex; flex-direction: column; gap: 24px; }
                .qr-container { background: white; padding: 20px; border-radius: 28px; display: inline-block; position: relative; box-shadow: 0 30px 60px rgba(0,0,0,0.12); overflow: hidden; margin: 0 auto; }
                .qr-scan-line { position: absolute; left: 0; right: 0; height: 2px; background: var(--primary); opacity: 0.5; box-shadow: 0 0 15px var(--primary); animation: qrScan 3s linear infinite; z-index: 10; }
                @keyframes qrScan { 0% { top: 0; } 100% { top: 100%; } }
                .qr-title { margin: 24px 0 8px 0; font-size: 1.3rem; font-weight: 950; }
                .qr-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 28px; line-height: 1.5; }
                .security-key-section { text-align: left; margin-bottom: 28px; }
                .key-header { display: flex; justify-content: space-between; align-items: center; marginBottom: 8px; }
                .label-caps { font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1.2px; font-weight: 800; }
                .key-box { background: var(--surface-3); padding: 14px 18px; border-radius: 14px; border: 1px solid var(--border-glass); color: var(--text-primary); font-family: monospace; }
                
                /* Benefits */
                .benefits-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
                .benefits-header > svg { color: var(--primary); background: rgba(59, 130, 246, 0.1); padding: 8px; border-radius: 10px; width: 36px; height: 36px; }
                .benefits-title { margin: 0; font-weight: 800; }
                .feature-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 14px; }
                .feature-list li { font-size: 0.9rem; display: flex; align-items: center; gap: 12px; color: var(--text-secondary); font-weight: 500; }

                /* History Feed */
                .history-header { padding: 24px 32px; border-bottom: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center; background: var(--surface-3); border-top-left-radius: 32px; border-top-right-radius: 32px; }
                .search-wrapper { position: relative; width: 380px; display: flex; align-items: center; }
                .search-wrapper svg { position: absolute; left: 16px; color: var(--text-tertiary); }
                .search-wrapper input { width: 100%; background: var(--surface-2); border: 1px solid var(--border-glass); padding: 12px 16px 12px 48px; border-radius: 16px; font-size: 0.95rem; transition: all 0.2s; color: var(--text-primary); }
                .btn-refresh { display: flex; align-items: center; gap: 8px; }

                /* Table Styles */
                .custom-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .custom-table th { text-align: left; padding: 18px 24px; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; }
                .table-row { border-bottom: 1px solid var(--border-glass); transition: background 0.2s; }
                .table-row:hover { background: rgba(255, 255, 255, 0.02); }
                .table-row td { padding: 24px; }
                .log-time { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
                .log-sender { font-size: 0.75rem; color: var(--text-tertiary); margin-top: 2px; }
                .log-amount { font-weight: 900; color: var(--success); fontSize: 1.05rem; }
                .log-note { font-weight: 700; font-size: 0.9rem; color: var(--text-primary); }
                .log-body { font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px; font-style: italic; }
                .bank-badge { display: inline-block; padding: 6px 14px; border-radius: 12px; background: var(--surface-4); border: 1px solid var(--border-glass); font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); }
                .status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; }
                .status-pill.success { background: rgba(34, 197, 94, 0.1); color: var(--success); }
                .status-pill.warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }

                /* Mobile Optimizations */
                .mobile-only { display: none; }
                .desktop-only { display: block; }
                
                @media (max-width: 992px) {
                    .setup-grid-layout { grid-template-columns: 1fr; }
                    .setup-side-panel { order: -1; }
                    .qr-card-mobile { text-align: center; }
                }

                @media (max-width: 768px) {
                    .mobile-only { display: block; }
                    .desktop-only { display: none; }
                    
                    .page-content { padding: 16px 0; }
                    .card-premium { padding: 20px; border-radius: 20px; }
                    
                    .status-header-premium {
                        flex-direction: column;
                        gap: 20px;
                        padding: 20px;
                        align-items: flex-start;
                        border-radius: 20px;
                    }
                    .tab-switcher { width: 100%; }
                    .tab-btn { flex: 1; justify-content: center; }
                    
                    .step-item { gap: 16px; }
                    .step-badge { width: 32px; height: 32px; font-size: 0.9rem; }
                    .setup-steps { gap: 28px; }
                    
                    .history-header {
                        flex-direction: column;
                        padding: 16px;
                        gap: 12px;
                        align-items: stretch;
                    }
                    .search-wrapper { width: 100%; }
                    .btn-refresh span { display: none; }
                    .btn-refresh { justify-content: center; }
                    
                    .mobile-log-list { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
                    .mobile-log-card {
                        background: rgba(255,255,255,0.02);
                        border: 1px solid var(--border-glass);
                        border-radius: 16px;
                        padding: 16px;
                    }
                    .mlc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
                    .mlc-time { font-size: 0.8rem; font-weight: 800; color: var(--text-primary); }
                    .mlc-bank { font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
                    .mlc-amount { font-weight: 900; color: var(--success); font-size: 1rem; }
                    .mlc-content { margin-bottom: 12px; }
                    .mlc-note { font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; }
                    .mlc-body { font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; opacity: 0.8; }
                    .mlc-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-glass); padding-top: 12px; }
                    .mlc-actions { display: flex; gap: 8px; }
                    
                    .mobile-full-btn { width: 100%; justify-content: center; }
                }

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
