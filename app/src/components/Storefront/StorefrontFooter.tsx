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

    return (
        <footer className="sf-footer">
            <div className="sf-footer-content">
                {/* ═══ About Us Section ═══ */}
                <div className="sf-footer-about">
                    <h3 className="sf-footer-about-title">Бидний тухай</h3>
                    <p className="sf-footer-about-desc">
                        {storefrontName} — чанартай, баталгаатай бараа бүтээгдэхүүнийг хамгийн таатай үнээр санал болгодог итгэлтэй онлайн дэлгүүр.
                    </p>

                    <div className="sf-footer-contact-grid">
                        {business.phone && (
                            <a href={`tel:${business.phone}`} className="sf-footer-contact-item">
                                <Phone size={15} />
                                <span>{business.phone}</span>
                            </a>
                        )}
                        {business.address && (
                            <div className="sf-footer-contact-item">
                                <MapPin size={15} />
                                <span>{business.address}</span>
                            </div>
                        )}
                    </div>

                    {/* Social Links */}
                    <div className="sf-footer-socials">
                        {(() => {
                            // Read social links from storefront settings if available
                            const sfSettings = business.settings?.storefront as any;
                            const socialLinks: { name: string; url: string }[] = sfSettings?.socialLinks || [];

                            // Fallback: use business Facebook page info if no socialLinks configured
                            if (socialLinks.length === 0) {
                                const fbPageName = (business as any).facebookPageName;
                                if (fbPageName) {
                                    socialLinks.push({ name: fbPageName, url: `https://facebook.com/${fbPageName}` });
                                }
                            }

                            // Ensure URLs have protocol prefix
                            const normalizeUrl = (url: string) => {
                                if (!url) return '#';
                                if (/^https?:\/\//i.test(url)) return url;
                                return `https://${url}`;
                            };

                            return socialLinks.map((link, i) => (
                                <a
                                    key={i}
                                    href={normalizeUrl(link.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="sf-footer-social-link"
                                >
                                    <Facebook size={14} />
                                    <span>{link.name}</span>
                                    <ExternalLink size={11} />
                                </a>
                            ));
                        })()}
                    </div>
                </div>

                {/* ═══ Payment Section ═══ */}
                <div className="sf-footer-trust-section">
                    {/* Payment Methods */}
                    <div className="sf-footer-payments">
                        <span className="sf-footer-payments-label">Төлбөрийн хэрэгслүүд</span>
                        <div className="sf-footer-payment-logos">
                            <div className="sf-payment-badge">
                                <img src="https://qpay.mn/q/logo.png" alt="QPay" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                <span>QPay</span>
                            </div>
                            <div className="sf-payment-badge">
                                <span>🏦</span>
                                <span>Банк шилжүүлэг</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ Liscord Verified Badge — centered below ═══ */}
                <div className="sf-footer-verified">
                    <div className="sf-verified-badge">
                        <Shield size={16} />
                        <div className="sf-verified-text">
                            <span className="sf-verified-label">Liscord Verified</span>
                            <span className="sf-verified-since">{verifiedYear} оноос бүртгэлтэй</span>
                        </div>
                    </div>
                </div>

                {/* ═══ Bottom Bar ═══ */}
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
