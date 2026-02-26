import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SecurityModalProps {
    onSuccess: () => void;
    onClose: () => void;
    title?: string;
    description?: string;
}

export function SecurityModal({
    onSuccess,
    onClose,
    title = 'Аюулгүй байдлын нууц үг',
    description = 'Системийн өөрчлөлтийг баталгаажуулахын тулд нууц үгээ оруулна уу.'
}: SecurityModalProps) {
    const [password, setPassword] = useState('');

    const handleSubmit = () => {
        if (password === '102311') {
            onSuccess();
        } else {
            toast.error('Аюулгүй байдлын нууц үг буруу байна!');
            setPassword('');
        }
    };

    return createPortal(
        <div className="security-overlay" onClick={onClose} style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease'
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .security-modal {
                    background: var(--surface-1);
                    width: 100%;
                    max-width: 400px;
                    border-radius: 24px;
                    padding: 32px;
                    border: 1px solid var(--border-primary);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
            <div className="security-modal" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-2xl">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                        <p className="text-sm text-tertiary mt-1">{description}</p>
                    </div>

                    <div className="w-full mt-4 text-left">
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" />
                            <input
                                type="password"
                                className="w-full bg-tertiary border border-primary-light/40 rounded-xl h-12 pl-12 pr-4 font-bold text-lg text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="••••••"
                                autoFocus
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 w-full mt-6">
                        <button className="btn btn-outline flex-1 h-12" onClick={onClose}>
                            Цуцлах
                        </button>
                        <button className="btn btn-primary gradient-btn flex-1 h-12" onClick={handleSubmit}>
                            Баталгаажуулах
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
