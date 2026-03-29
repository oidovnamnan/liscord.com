import { useState, useEffect } from 'react';
import { Loader2, Ticket } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { toast } from 'react-hot-toast';
import type { Business } from '../../../types';

export function PromoCodeSettings({ bizId }: { bizId: string; business: Business }) {
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        if (!bizId) return;
        (async () => {
            try {
                const cfgDoc = await getDoc(doc(db, 'businesses', bizId, 'module_settings', 'promo-codes'));
                if (cfgDoc.exists()) {
                    setEnabled(cfgDoc.data().enabled ?? true);
                }
            } catch (e) { console.error('Load promo settings:', e); }
            setLoading(false);
        })();
    }, [bizId]);

    const handleToggle = async (val: boolean) => {
        setEnabled(val);
        try {
            await setDoc(doc(db, 'businesses', bizId, 'module_settings', 'promo-codes'), {
                enabled: val,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            toast.success(val ? 'Промо код идэвхжлээ' : 'Промо код унтарлаа');
        } catch (e) {
            console.error(e);
            toast.error('Алдаа гарлаа');
            setEnabled(!val);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Loader2 className="animate-spin" size={24} />
        </div>
    );

    return (
        <div className="settings-section animate-fade-in">
            <h2>Промо Код</h2>
            <div className="settings-card">
                <div className="modern-toggle-item">
                    <div className="toggle-info">
                        <h4>Промо код модулийг идэвхжүүлэх</h4>
                        <p>Дэлгүүрт промо код оруулж хямдрал авах боломжийг нээнэ. Унтраавал checkout дээр промо код оруулах хэсэг харагдахгүй.</p>
                    </div>
                    <label className="toggle">
                        <input type="checkbox" checked={enabled} onChange={e => handleToggle(e.target.checked)} />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>
        </div>
    );
}
