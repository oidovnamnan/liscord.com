import { Zap } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { FlashDealSettings } from '../Settings/components/FlashDealSettings';

export function FlashDealPage() {
    const { business } = useBusinessStore();
    if (!business?.id) return null;

    return (
        <div className="animate-fade-in">
            <div className="page-hero" style={{ marginBottom: 8 }}>
                <div className="page-hero-left">
                    <div className="page-hero-icon" style={{ background: 'linear-gradient(135deg, #ff006e, #8338ec)', color: '#fff' }}>
                        <Zap size={24} />
                    </div>
                    <div>
                        <h2 className="page-hero-title">Flash Deal</h2>
                        <p className="page-hero-subtitle">Цагтай хязгаартай хямдрал тохируулах</p>
                    </div>
                </div>
            </div>
            <FlashDealSettings bizId={business.id} />
        </div>
    );
}
