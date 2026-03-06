import { useState } from 'react';
// import { useBusinessStore } from '../../store'; // Removed unused
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
    // const { business } = useBusinessStore(); // Removed unused
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

    const qrCodeValue = apiKey;

    const handleGenerateKey = () => {
        setApiKey('ls_sk_' + Math.random().toString(36).substring(2, 12));
        toast.success('Шинэ түлхүүр үүсгэлээ');
    };

    return (
        <div className="super-pro-page page-container animate-fade-in">
            <div className="glass-ambient-glow" />

            <Header
                title="SMS Банк Холболт"
                subtitle="Гар утсан дээр ирж буй банкны гүйлгээг автоматаар уншиж, захиалгатай холбох ухаалаг систем"
            />

            <div className="page-content dashboard-grid">
                {/* Header Stats / Status Section */}
                <section className="dashboard-top-section">
                    <div className="glass-card status-card">
                        <div className="status-main-info">
                            <div className={`status-orb ${isConnected ? 'active' : ''}`}>
                                <Zap size={32} />
                                {isConnected && <div className="orb-pulse" />}
                            </div>
                            <div className="status-text-group">
                                <h3 className="section-label">Системийн төлөв</h3>
                                <div className="status-badge-row">
                                    <span className={`status-pill-pro ${isConnected ? 'active' : ''}`}>
                                        {isConnected ? 'LIVE' : 'IDLE'}
                                    </span>
                                    <p className="status-detail-text">
                                        {isConnected ? `Идэвхтэй (Синхрончлол: ${lastSync || 'Дөнгөж сая'})` : 'Төхөөрөмж холбогдоогүй байна'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-tabs">
                            <button
                                className={`tab-item-pro ${activeTab === 'setup' ? 'active' : ''}`}
                                onClick={() => setActiveTab('setup')}
                            >
                                <QrCode size={20} /> <span>Тохиргоо</span>
                            </button>
                            <button
                                className={`tab-item-pro ${activeTab === 'feed' ? 'active' : ''}`}
                                onClick={() => setActiveTab('feed')}
                            >
                                <History size={20} /> <span>Гүйлгээний түүх</span>
                            </button>
                        </div>
                    </div>
                </section>

                <div className="dashboard-main-area">
                    {activeTab === 'setup' ? (
                        <div className="pro-setup-flow">
                            {/* Main Setup Content */}
                            <div className="pro-content-stack">
                                <div className="glass-card instruction-card">
                                    <div className="card-inner-header">
                                        <h2 className="pro-card-title">Автоматжуулалт идэвхжүүлэх</h2>
                                        <div className="pro-version-pill">v1.0 Stable</div>
                                    </div>

                                    <div className="pro-steps-container">
                                        <div className="pro-step">
                                            <div className="pro-step-numb">01</div>
                                            <div className="pro-step-body">
                                                <h4>Bridge суулгах</h4>
                                                <p><b>Liscord Bridge</b> туслах апп-ыг Android утсан дээрээ суулгаснаар гүйлгээг систем рүү аюулгүй дамжуулах боломжтой болно.</p>
                                                <a
                                                    href="https://github.com/oidovnamnan/liscord.com/releases/download/bridge-v1/app-release.apk"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="pro-download-btn"
                                                >
                                                    <Smartphone size={18} /> .APK Татах
                                                </a>
                                            </div>
                                        </div>

                                        <div className="pro-step">
                                            <div className="pro-step-numb">02</div>
                                            <div className="pro-step-body">
                                                <h4>QR код уншуулах</h4>
                                                <p><b>Liscord Bridge</b> апп-аа нээж "Системтэй холбох (QR Scan)" товчийг дарж доорх кодыг уншуулна уу. (Гар утасныхаа камер биш, заавал <b>апп доторх</b> камераар уншуулахыг анхаарна уу)</p>
                                            </div>
                                        </div>

                                        <div className="pro-step">
                                            <div className="pro-step-numb">03</div>
                                            <div className="pro-step-body">
                                                <h4>Зөвшөөрөл өгөх</h4>
                                                <p>Апп-д "SMS унших" зөвшөөрлийг өгснөөр таныг утсаа ашиглаагүй үед ч орлого автоматаар бүртгэгдэнэ.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pro-alert-box">
                                        <AlertCircle size={24} />
                                        <div className="alert-content">
                                            <strong>Санамж:</strong> Хаан, Голомт, Төрийн банк зэрэг бүх банкны SMS-ийг дэмждэг. Интернэт холболт тогтвортой байх шаардлагатай.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Side Panel / QR Section */}
                            <aside className="pro-side-pane">
                                <div className="glass-card qr-card-pro">
                                    <div className="qr-wrapper-outer">
                                        <div className="qr-scanner-overlay" />
                                        <div className="qr-white-bg">
                                            <QRCodeSVG value={qrCodeValue} size={180} level="H" />
                                        </div>
                                    </div>
                                    <h3 className="qr-card-heading">Холболтын QR</h3>
                                    <p className="qr-card-sub">Liscord Bridge апп-ын сканнераар уншуулна уу</p>

                                    <div className="key-section-pro">
                                        <div className="key-top">
                                            <label>SECURITY KEY</label>
                                            <button onClick={handleGenerateKey}><RefreshCcw size={14} /></button>
                                        </div>
                                        <div className="key-display-box">
                                            <code>{apiKey}</code>
                                        </div>
                                    </div>

                                    <button className="pro-action-btn">
                                        <Smartphone size={18} /> Холболт шалгах
                                    </button>
                                </div>

                                <div className="glass-card benefits-grid">
                                    <div className="benefit-item">
                                        <div className="benefit-icon"><Zap size={18} /></div>
                                        <span>Шуурхай</span>
                                    </div>
                                    <div className="benefit-item">
                                        <div className="benefit-icon"><CircleCheck size={18} /></div>
                                        <span>Автомат</span>
                                    </div>
                                    <div className="benefit-item">
                                        <div className="benefit-icon"><RefreshCcw size={18} /></div>
                                        <span>24/7 Найдвартай</span>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <div className="pro-history-view">
                            <div className="glass-card history-header-pro">
                                <div className="search-bar-pro">
                                    <Search size={20} />
                                    <input
                                        type="text"
                                        placeholder="Гүйлгээний түүхээс хайх..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button className="refresh-btn-pro">
                                    <RefreshCcw size={18} /> <span>Шинэчлэх</span>
                                </button>
                            </div>

                            <div className="history-entries-container">
                                {/* Desktop Table */}
                                <div className="desktop-table-container">
                                    <table className="pro-table">
                                        <thead>
                                            <tr>
                                                <th>Хугацаа</th>
                                                <th>Банк</th>
                                                <th>Дүн</th>
                                                <th>Мэдээлэл</th>
                                                <th>Төлөв</th>
                                                <th className="text-right">Үйлдэл</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.map(log => (
                                                <tr key={log.id}>
                                                    <td>
                                                        <div className="pro-cell-time">{log.time}</div>
                                                        <div className="pro-cell-sender">{log.sender}</div>
                                                    </td>
                                                    <td><span className="pro-bank-badge">{log.bank}</span></td>
                                                    <td><div className="pro-cell-amount">+{log.amount.toLocaleString()}₮</div></td>
                                                    <td>
                                                        <div className="pro-cell-info">
                                                            <strong>{log.note}</strong>
                                                            <p>"{log.body}"</p>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`pro-status-tag ${log.status}`}>
                                                            {log.status === 'matched' ? <CircleCheck size={14} /> : <AlertCircle size={14} />}
                                                            {log.status === 'matched' ? `Холбогдсон` : 'Танигдаагүй'}
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <div className="pro-action-row">
                                                            {log.status === 'pending' && <button className="pro-small-btn primary">Холбох</button>}
                                                            <button className="pro-small-btn ghost"><ExternalLink size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="mobile-cards-container">
                                    {logs.map(log => (
                                        <div key={log.id} className="glass-card mobile-entry-card">
                                            <div className="mec-header">
                                                <div className="mec-meta">
                                                    <span className="mec-time">{log.time}</span>
                                                    <span className="mec-bank">{log.bank}</span>
                                                </div>
                                                <div className="mec-amount">+{log.amount.toLocaleString()}₮</div>
                                            </div>
                                            <div className="mec-content">
                                                <strong>{log.note}</strong>
                                                <p>"{log.body}"</p>
                                            </div>
                                            <div className="mec-footer">
                                                <span className={`pro-status-tag ${log.status}`}>
                                                    {log.status === 'matched' ? log.orderId : 'Танигдаагүй'}
                                                </span>
                                                <div className="mec-actions">
                                                    {log.status === 'pending' && <button className="pro-small-btn primary">Холбох</button>}
                                                    <button className="pro-small-btn ghost"><ExternalLink size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                :root {
                    --pro-primary: #6366f1;
                    --pro-primary-dark: #4f46e5;
                    --pro-accent: #a855f7;
                    --pro-glass: rgba(255, 255, 255, 0.04);
                    --pro-glass-border: rgba(255, 255, 255, 0.08);
                    --pro-glass-shade: rgba(0, 0, 0, 0.2);
                    --pro-text: #ffffff;
                    --pro-text-dim: #94a3b8;
                    --pro-success: #22c55e;
                    --pro-warning: #f59e0b;
                }

                .super-pro-page {
                    position: relative;
                    min-height: 100vh;
                    background: #0f172a;
                    color: var(--pro-text);
                    overflow-x: hidden;
                    padding-bottom: 50px;
                }

                .glass-ambient-glow {
                    position: fixed;
                    top: -10%;
                    right: -10%;
                    width: 60%;
                    height: 60%;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
                    filter: blur(80px);
                    pointer-events: none;
                    z-index: 0;
                }

                .glass-card {
                    background: var(--pro-glass);
                    backdrop-filter: blur(24px);
                    border: 1px solid var(--pro-glass-border);
                    border-radius: 28px;
                    box-shadow: 0 20px 50px var(--pro-glass-shade);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }

                /* Dashboard Layout */
                .dashboard-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                    position: relative;
                    z-index: 1;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                /* Status Card */
                .status-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 40px;
                    margin-top: 10px;
                }

                .status-main-info { display: flex; align-items: center; gap: 24px; }
                
                .status-orb {
                    width: 64px; height: 64px; border-radius: 20px;
                    background: rgba(255,255,255,0.05);
                    display: flex; align-items: center; justify-content: center;
                    color: var(--pro-text-dim); position: relative;
                }
                .status-orb.active { background: rgba(34, 197, 94, 0.12); color: var(--pro-success); }
                
                .orb-pulse {
                    position: absolute; width: 100%; height: 100%;
                    border: 2px solid var(--pro-success); border-radius: 20px;
                    animation: orbRipple 2s infinite ease-out;
                }
                @keyframes orbRipple {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(1.8); opacity: 0; }
                }

                .section-label { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 2px; color: var(--pro-text-dim); font-weight: 800; margin-bottom: 8px; }
                .status-badge-row { display: flex; align-items: center; gap: 12px; }
                .status-pill-pro { font-size: 0.7rem; font-weight: 950; background: #334155; padding: 4px 10px; border-radius: 8px; letter-spacing: 1px; }
                .status-pill-pro.active { background: var(--pro-success); color: #000; }
                .status-detail-text { margin: 0; font-size: 1rem; font-weight: 600; }

                /* Dashboard Tabs */
                .dashboard-tabs { display: flex; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 18px; border: 1px solid var(--pro-glass-border); }
                .tab-item-pro {
                    display: flex; align-items: center; gap: 10px; padding: 12px 24px;
                    border-radius: 14px; border: none; background: none; color: var(--pro-text-dim);
                    font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .tab-item-pro:hover { color: #fff; }
                .tab-item-pro.active { background: #fff; color: #000; box-shadow: 0 10px 20px rgba(255,255,255,0.1); }

                /* Setup Flow */
                .pro-setup-flow { display: grid; grid-template-columns: 1fr 400px; gap: 32px; align-items: start; }
                
                .instruction-card { padding: 48px; }
                .card-inner-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .pro-card-title { font-size: 2.2rem; font-weight: 950; letter-spacing: -1.5px; margin: 0; }
                .pro-version-pill { background: rgba(99, 102, 241, 0.1); color: var(--pro-primary); padding: 6px 14px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; border: 1px solid rgba(99,102,241,0.2); }

                .pro-steps-container { display: flex; flex-direction: column; gap: 40px; }
                .pro-step { display: flex; gap: 32px; }
                .pro-step-numb { font-size: 2.5rem; font-weight: 950; opacity: 0.1; line-height: 1; letter-spacing: -2px; }
                .pro-step-body h4 { font-size: 1.3rem; font-weight: 800; margin: 0 0 10px 0; }
                .pro-step-body p { color: var(--pro-text-dim); line-height: 1.7; font-size: 1.05rem; margin-bottom: 20px; }
                
                .pro-download-btn {
                    display: inline-flex; align-items: center; gap: 12px;
                    background: linear-gradient(135deg, var(--pro-primary), var(--pro-accent));
                    color: white; padding: 14px 28px; border-radius: 16px; font-weight: 900;
                    text-decoration: none; box-shadow: 0 10px 25px rgba(99,102,241,0.4);
                    transition: transform 0.2s;
                }
                .pro-download-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(99,102,241,0.5); }

                .pro-alert-box {
                    margin-top: 60px; padding: 24px; border-radius: 20px;
                    background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.1);
                    display: flex; gap: 20px; align-items: center;
                }
                .alert-content { font-size: 0.95rem; color: #d97706; }

                /* Pro Side Panel */
                .pro-side-pane { display: flex; flex-direction: column; gap: 32px; }
                .qr-card-pro { padding: 48px 40px; text-align: center; }
                
                .qr-wrapper-outer {
                    position: relative; padding: 24px; display: inline-block;
                    margin-bottom: 32px; border-radius: 36px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
                    border: 1px solid var(--pro-glass-border);
                }
                .qr-white-bg { background: white; padding: 20px; border-radius: 24px; }
                .qr-scanner-overlay {
                    position: absolute; top: 0; left: 0; right: 0; height: 3px;
                    background: var(--pro-primary); box-shadow: 0 0 20px var(--pro-primary);
                    animation: scanLine 4s infinite linear; pointer-events: none; z-index: 10;
                }
                @keyframes scanLine { 0% { top: 0; } 100% { top: 100%; } }

                .qr-card-heading { font-size: 1.6rem; font-weight: 950; margin: 0 0 8px 0; }
                .qr-card-sub { color: var(--pro-text-dim); font-size: 0.95rem; margin-bottom: 32px; }

                .key-section-pro { text-align: left; margin-bottom: 32px; }
                .key-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .key-top label { font-size: 0.7rem; font-weight: 900; opacity: 0.5; letter-spacing: 1.5px; }
                .key-top button { background: none; border: none; color: var(--pro-primary); cursor: pointer; }
                .key-display-box {
                    background: #1e293b; padding: 18px; border-radius: 16px;
                    border: 1px solid var(--pro-glass-border); font-family: monospace;
                    font-size: 1.1rem; font-weight: 700; color: var(--pro-primary); text-align: center;
                }

                .pro-action-btn {
                    width: 100%; padding: 18px; border-radius: 18px; border: 1px solid #fff;
                    background: transparent; color: #fff; font-weight: 900; font-size: 1rem;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px;
                    transition: all 0.2s;
                }
                .pro-action-btn:hover { background: #fff; color: #000; }

                .benefits-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 20px; }
                .benefit-item { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
                .benefit-icon { width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: var(--pro-primary); }
                .benefit-item span { font-size: 0.75rem; font-weight: 800; opacity: 0.6; }

                /* History Feed - Pro */
                .pro-history-view { display: flex; flex-direction: column; gap: 24px; }
                .history-header-pro { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; border-radius: 20px; }
                .search-bar-pro { display: flex; align-items: center; gap: 16px; flex: 1; max-width: 500px; }
                .search-bar-pro input { background: none; border: none; font-size: 1.1rem; color: #fff; width: 100%; outline: none; font-weight: 600; }
                .search-bar-pro input::placeholder { color: var(--pro-text-dim); }
                .search-bar-pro svg { color: var(--pro-text-dim); }

                .refresh-btn-pro {
                    display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05);
                    border: 1px solid var(--pro-glass-border); padding: 12px 24px; border-radius: 14px;
                    color: #fff; font-weight: 800; cursor: pointer; transition: all 0.2s;
                }
                .refresh-btn-pro:hover { background: rgba(255,255,255,0.1); }

                /* Premium Table */
                .desktop-table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                .pro-table { width: 100%; border-collapse: separate; border-spacing: 0 12px; }
                .pro-table th { padding: 16px 24px; text-align: left; font-size: 0.75rem; font-weight: 900; color: var(--pro-text-dim); text-transform: uppercase; letter-spacing: 1.5px; }
                .pro-table tr td { background: var(--pro-glass); padding: 24px; vertical-align: middle; transition: all 0.2s; border: 1px solid transparent; }
                .pro-table tr:hover td { background: rgba(255,255,255,0.07); transform: scale(1.005); border-color: var(--pro-glass-border); }
                .pro-table tr td:first-child { border-top-left-radius: 20px; border-bottom-left-radius: 20px; border-left: 1px solid var(--pro-glass-border); }
                .pro-table tr td:last-child { border-top-right-radius: 20px; border-bottom-right-radius: 20px; border-right: 1px solid var(--pro-glass-border); }
                
                .pro-cell-time { font-size: 1rem; font-weight: 800; }
                .pro-cell-sender { font-size: 0.8rem; opacity: 0.5; margin-top: 2px; font-weight: 600; }
                .pro-bank-badge { font-size: 0.75rem; font-weight: 900; background: #1e293b; padding: 6px 14px; border-radius: 10px; border: 1px solid var(--pro-glass-border); }
                .pro-cell-amount { font-size: 1.2rem; font-weight: 950; color: var(--pro-success); }
                .pro-cell-info strong { display: block; font-size: 1rem; margin-bottom: 4px; }
                .pro-cell-info p { margin: 0; font-size: 0.85rem; opacity: 0.6; font-style: italic; }

                .pro-status-tag {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 8px 16px; border-radius: 12px; font-size: 0.8rem; font-weight: 800;
                    background: rgba(255,255,255,0.05);
                }
                .pro-status-tag.matched { color: var(--pro-success); background: rgba(34, 197, 94, 0.1); }
                .pro-status-tag.pending { color: var(--pro-warning); background: rgba(245, 158, 11, 0.1); }

                .pro-action-row { display: flex; gap: 8px; justify-content: flex-end; }
                .pro-small-btn { padding: 8px 16px; border-radius: 10px; font-weight: 800; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
                .pro-small-btn.primary { background: #fff; color: #000; }
                .pro-small-btn.ghost { background: transparent; border-color: var(--pro-glass-border); color: #fff; }
                .pro-small-btn.ghost:hover { background: rgba(255,255,255,0.1); }

                .mobile-cards-container { display: none; }

                /* Responsive - Mobile Mastery */
                @media (max-width: 1024px) {
                    .pro-setup-flow { grid-template-columns: 1fr; }
                    .pro-side-pane { order: -1; }
                }

                @media (max-width: 768px) {
                    .dashboard-grid { gap: 20px; }
                    .status-card { flex-direction: column; gap: 24px; padding: 24px; border-radius: 20px; }
                    .dashboard-tabs { width: 100%; padding: 4px; }
                    .tab-item-pro { flex: 1; justify-content: center; font-size: 0.9rem; padding: 10px; }
                    .tab-item-pro span { display: none; } /* Hide text for small icons if overlapping */
                    
                    .pro-setup-flow { gap: 20px; }
                    .instruction-card { padding: 32px 24px; border-radius: 24px; }
                    .pro-card-title { font-size: 1.6rem; }
                    .pro-step { gap: 20px; }
                    .pro-step-numb { font-size: 1.8rem; }
                    .pro-step-body h4 { font-size: 1.1rem; }
                    .pro-step-body p { font-size: 0.95rem; }
                    .pro-download-btn { width: 100%; justify-content: center; }

                    .qr-card-pro { padding: 32px 20px; border-radius: 24px; }
                    .qr-wrapper-outer { padding: 16px; border-radius: 28px; }
                    .qr-white-bg { padding: 12px; }
                    
                    /* History Mobile View */
                    .history-header-pro { padding: 16px; border-radius: 16px; gap: 12px; }
                    .refresh-btn-pro span { display: none; }

                    .desktop-table-container { display: none; }
                    .mobile-cards-container { display: flex; flex-direction: column; gap: 16px; }
                    
                    .mobile-entry-card { padding: 20px; border-radius: 20px; }
                    .mec-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
                    .mec-meta { display: flex; flex-direction: column; gap: 4px; }
                    .mec-time { font-size: 0.9rem; font-weight: 800; }
                    .mec-bank { font-size: 0.75rem; text-transform: uppercase; font-weight: 900; color: var(--pro-primary); }
                    .mec-amount { font-size: 1.1rem; font-weight: 950; color: var(--pro-success); }
                    .mec-content { margin-bottom: 20px; }
                    .mec-content strong { display: block; margin-bottom: 6px; }
                    .mec-content p { margin: 0; font-size: 0.8rem; opacity: 0.6; font-style: italic; }
                    .mec-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--pro-glass-border); padding-top: 16px; }
                    .mec-actions { display: flex; gap: 8px; }
                }

                /* iPhone 14 / Narrow Viewports */
                @media (max-width: 440px) {
                    .tab-item-pro span { display: none; }
                    .tab-item-pro { padding: 12px 18px; }
                    .pro-card-title { font-size: 1.4rem; letter-spacing: -1px; }
                    .status-main-info { gap: 16px; }
                    .status-orb { width: 48px; height: 48px; border-radius: 14px; }
                    .status-orb svg { width: 24px; height: 24px; }
                }
            `}</style>
        </div>
    );
}
