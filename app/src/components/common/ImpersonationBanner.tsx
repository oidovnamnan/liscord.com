import { ShieldAlert, X } from 'lucide-react';
import { useAuthStore, useBusinessStore } from '../../store';
import { businessService } from '../../services/db';
import { useNavigate } from 'react-router-dom';

export function ImpersonationBanner() {
    const { user, impersonatedBusinessId, setImpersonatedBusinessId } = useAuthStore();
    const { business, setBusiness, setEmployee } = useBusinessStore();
    const navigate = useNavigate();

    if (!user?.isSuperAdmin || !impersonatedBusinessId) return null;

    const handleExit = async () => {
        setImpersonatedBusinessId(null);
        // Switch back to admin's own active business or just go to super admin
        if (user.activeBusiness) {
            const [biz, emp] = await Promise.all([
                businessService.getBusiness(user.activeBusiness),
                businessService.getEmployeeProfile(user.activeBusiness, user.uid)
            ]);
            setBusiness(biz);
            setEmployee(emp);
        }
        navigate('/super');
    };

    return (
        <div className="impersonation-banner">
            <div className="banner-content">
                <ShieldAlert size={16} />
                <span>Та 🟢 <strong>{business?.name}</strong> бизнесийг эзэмшигчийн эрхээр хянаж байна</span>
            </div>
            <button className="exit-button" onClick={handleExit}>
                <X size={16} /> Гарах
            </button>

            <style>{`
                .impersonation-banner {
                    background: #dc2626;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 24px;
                    font-size: 0.85rem;
                    z-index: 9999;
                    position: sticky;
                    top: 0;
                }
                .banner-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .exit-button {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.15);
                    border: none;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                }
                .exit-button:hover {
                    background: rgba(255, 255, 255, 0.25);
                }
            `}</style>
        </div>
    );
}
