import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Loader2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { toast } from 'react-hot-toast';

interface PINModalProps {
    onSuccess: () => void;
    onClose: () => void;
    title?: string;
    description?: string;
}

export function PINModal({ onSuccess, onClose, title = 'Баталгаажуулалт', description = 'Энэ үйлдлийг хийхийн тулд бизнесийн PIN кодыг оруулна уу.' }: PINModalProps) {
    const { business } = useBusinessStore();
    const [pin, setPin] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);

    const handleChange = (val: string, index: number) => {
        if (!/^\d*$/.test(val)) return;

        const newPin = [...pin];
        newPin[index] = val.slice(-1);
        setPin(newPin);

        // Auto focus next
        if (val && index < 3) {
            const nextIdx = index + 1;
            const nextEl = document.getElementById(`pin-${nextIdx}`);
            nextEl?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            const prevIdx = index - 1;
            const prevEl = document.getElementById(`pin-${prevIdx}`);
            prevEl?.focus();
        }
    };

    const handleSubmit = async () => {
        const enteredPin = pin.join('');
        if (enteredPin.length < 4) {
            toast.error('PIN код дутуу байна');
            return;
        }

        setLoading(true);
        // Simulate a small delay for better UX
        await new Promise(r => setTimeout(r, 400));

        if (enteredPin === (business?.settings?.pin || '1234')) {
            onSuccess();
        } else {
            toast.error('PIN код буруу байна');
            setPin(['', '', '', '']);
            document.getElementById('pin-0')?.focus();
        }
        setLoading(false);
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 2000 }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360, textAlign: 'center' }}>
                <div className="modal-header" style={{ justifyContent: 'center' }}>
                    <div style={{ background: 'var(--gradient-accent)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Shield size={24} color="white" />
                    </div>
                </div>
                <div className="modal-body">
                    <h2>{title}</h2>
                    <p className="text-secondary" style={{ marginBottom: 24 }}>{description}</p>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
                        {pin.map((digit, i) => (
                            <input
                                key={i}
                                id={`pin-${i}`}
                                type="password"
                                className="input"
                                style={{ width: 50, height: 60, fontSize: '1.5rem', textAlign: 'center', padding: 0 }}
                                value={digit}
                                onChange={e => handleChange(e.target.value, i)}
                                onKeyDown={e => handleKeyDown(e, i)}
                                maxLength={1}
                                inputMode="numeric"
                                autoComplete="off"
                            />
                        ))}
                    </div>
                </div>
                <div className="modal-footer" style={{ flexDirection: 'column', gap: 8 }}>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%' }}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'БАТАЛГААЖУУЛАХ'}
                    </button>
                    <button className="btn btn-ghost" onClick={onClose} disabled={loading} style={{ width: '100%' }}>БОЛИХ</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
