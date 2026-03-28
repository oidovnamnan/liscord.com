import type { Business } from '../../types';
import './StorefrontFooter.css';
import { Phone, MapPin, Shield, Facebook, ExternalLink } from 'lucide-react';

export function StorefrontFooter({ business }: { business: Business }) {
    const showFooter = business.settings?.storefront?.showFooter ?? true;

    if (!showFooter) return null;

    const currentYear = new Date().getFullYear();
    const storefrontName = business.settings?.storefront?.name || business.name;

    // Business creation date for "Verified since"
    const createdAt = (business as any).createdAt;
    const verifiedYear = createdAt?.toDate
        ? createdAt.toDate().getFullYear()
        : createdAt instanceof Date
            ? createdAt.getFullYear()
            : currentYear;

    // Social links
    const sfSettings = business.settings?.storefront as any;
    const socialLinks: { name: string; url: string }[] = sfSettings?.socialLinks || [];
    if (socialLinks.length === 0) {
        const fbPageName = (business as any).facebookPageName;
        if (fbPageName) {
            socialLinks.push({ name: fbPageName, url: `https://facebook.com/${fbPageName}` });
        }
    }
    const normalizeUrl = (url: string) => {
        if (!url) return '#';
        if (/^https?:\/\//i.test(url)) return url;
        return `https://${url}`;
    };

    return (
        <footer className="sf-footer">
            <div className="sf-footer-content">
                {/* ═══ Logo + About ═══ */}
                <div className="sf-footer-brand">
                    {business.logo && <img src={business.logo} alt={storefrontName} className="sf-footer-logo" />}
                    <span className="sf-footer-brand-name">{storefrontName}</span>
                </div>

                <p className="sf-footer-desc">
                    Чанартай, баталгаатай бараа бүтээгдэхүүнийг хамгийн таатай үнээр.
                </p>

                {/* ═══ Contact + Social — single row ═══ */}
                <div className="sf-footer-links">
                    {business.phone && (
                        <a href={`tel:${business.phone}`} className="sf-footer-link">
                            <Phone size={13} />
                            <span>{business.phone}</span>
                        </a>
                    )}
                    {business.address && (
                        <div className="sf-footer-link">
                            <MapPin size={13} />
                            <span>{business.address}</span>
                        </div>
                    )}
                    {socialLinks.map((link, i) => (
                        <a
                            key={i}
                            href={normalizeUrl(link.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sf-footer-link"
                        >
                            <Facebook size={13} />
                            <span>{link.name}</span>
                            <ExternalLink size={10} />
                        </a>
                    ))}
                </div>

                {/* ═══ Trust row: Payment + Verified ═══ */}
                <div className="sf-footer-trust-row">
                    <div className="sf-footer-trust-item">
                        <img src="https://qpay.mn/q/logo.png" alt="QPay" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} style={{ height: 14 }} />
                        <span>QPay</span>
                    </div>
                    <span className="sf-footer-trust-sep">·</span>
                    <div className="sf-footer-trust-item">
                        <span>🏦</span>
                        <span>Банк шилжүүлэг</span>
                    </div>
                    <span className="sf-footer-trust-sep">·</span>
                    <div className="sf-footer-trust-item sf-verified-inline">
                        <Shield size={13} />
                        <span>Verified {verifiedYear}</span>
                    </div>
                </div>

                {/* ═══ Bottom ═══ */}
                <div className="sf-footer-bottom">
                    <span>© {currentYear} {storefrontName}</span>
                    <span className="sf-footer-dot">·</span>
                    <span>Powered by <strong>Liscord</strong></span>
                </div>
            </div>
        </footer>
    );
}
