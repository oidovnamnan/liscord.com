import type { Business } from '../../types';
import './StorefrontFooter.css';

export function StorefrontFooter({ business }: { business: Business }) {
    const showFooter = business.settings?.storefront?.showFooter ?? true;

    if (!showFooter) return null;

    const currentYear = new Date().getFullYear();
    const storefrontName = business.settings?.storefront?.name || business.name;

    return (
        <footer className="sf-footer">
            <div className="sf-footer-content">
                <div className="sf-footer-info">
                    <h3 className="sf-footer-biz-name">{storefrontName}</h3>
                    <div className="sf-footer-details">
                        {business.phone && <div className="sf-footer-item">Утас: {business.phone}</div>}
                        {business.email && <div className="sf-footer-item">Имэйл: {business.email}</div>}
                        {business.address && <div className="sf-footer-item">{business.address}</div>}
                    </div>
                </div>

                <div className="sf-footer-bottom">
                    <div className="sf-footer-copy">
                        © {currentYear} {storefrontName}. Бүх эрх хуулиар хамгаалагдсан.
                    </div>
                    <div className="sf-footer-powered">
                        Powered by <span className="sf-liscord-logo">Liscord</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
