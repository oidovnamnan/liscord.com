import React from 'react';
import { X, Zap, Crown, CheckSquare, ArrowRight } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
// Assuming we have toast
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function V2UpgradeModal({ isOpen, onClose, onSuccess }: Props) {
    const { business } = useBusinessStore();
    const [loading, setLoading] = React.useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        if (!business) return;
        setLoading(true);
        try {
            // Direct db update for Phase 48 V2 Access
            const bizRef = doc(db, 'businesses', business.id);
            await updateDoc(bizRef, {
                'subscription.hasV2Access': true
            });
            toast.success('Амжилттай! Та Liscord V2 Pro Max хувилбар луу шилжлээ.');
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Алдаа гарлаа. Дахин оролдоно уу.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 500, overflow: 'hidden', padding: 0 }}>
                {/* Header Banner */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 100%)',
                    padding: '32px 24px',
                    color: 'white',
                    position: 'relative'
                }}>
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                        <X size={18} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Crown size={24} color="#fcd34d" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(90deg, #fcd34d 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Version 2 Pro Max</h2>
                            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>Системийн хамгийн төгс хувилбар</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: 24 }}>
                    <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Та Liscord системийн дараагийн үеийн супер хурдан, гайхалтай дизайнтай <strong>V2 Pro Max</strong> хувилбар руу шилжих гэж байна.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <CheckSquare size={18} color="#10b981" style={{ marginTop: 2 }} />
                            <div>
                                <div style={{ fontWeight: 600 }}>10x Хурдан ажиллагаа</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Шинэчлэгдсэн архитектурын ачаар урьд өмнө байгаагүй хурд.</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <CheckSquare size={18} color="#10b981" style={{ marginTop: 2 }} />
                            <div>
                                <div style={{ fontWeight: 600 }}>Дээд зэрэглэлийн UI/UX</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Гоёмсог шилэн анимейшнтэй сансрын удирдлагын төв.</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <CheckSquare size={18} color="#10b981" style={{ marginTop: 2 }} />
                            <div>
                                <div style={{ fontWeight: 600 }}>Онцгой боломжууд</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Зөвхөн V2 дээр ашиглах боломжтой цоо шинэ модулиуд.</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-soft)', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Нэг удаагийн төлбөр</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>₮99,000</div>
                        </div>
                        <Zap size={24} color="#f59e0b" />
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', height: 48, fontSize: '1rem', background: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 100%)', border: 'none', display: 'flex', justifyContent: 'center', gap: 8 }}
                        onClick={handleUpgrade}
                        disabled={loading}
                    >
                        {loading ? 'Уншиж байна...' : 'Төлбөр төлөх (Тест)'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                    <p style={{ textAlign: 'center', margin: '12px 0 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        *QPay болон Дансны шилжүүлгээр төлөх боломжтой.
                    </p>
                </div>
            </div>
        </div>
    );
}
