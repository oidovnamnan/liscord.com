import { useBusinessStore } from '../../store';
import { FlashDealSettings } from '../Settings/components/FlashDealSettings';

export function FlashDealPage() {
    const { business } = useBusinessStore();
    if (!business?.id) return null;

    return (
        <div className="animate-fade-in" style={{ padding: '0 0 32px' }}>
            <FlashDealSettings bizId={business.id} />
        </div>
    );
}
