import { useEffect, useState } from 'react';
import { useParams, Outlet, Navigate } from 'react-router-dom';
import { businessService } from '../../services/db';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Business } from '../../types';
import { CartDrawer } from '../../components/Storefront/CartDrawer';
import { StorefrontFooter } from '../../components/Storefront/StorefrontFooter';

export function StorefrontWrapper() {
    const { slug } = useParams<{ slug: string }>();
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            return;
        }

        const loadBusiness = async () => {
            try {
                const biz = await businessService.getBusinessBySlug(slug.toLowerCase());
                if (biz) {
                    // Load module-specific settings (V5)
                    const storefrontRef = doc(db, 'businesses', biz.id, 'module_settings', 'storefront');
                    const storefrontSnap = await getDoc(storefrontRef);
                    if (storefrontSnap.exists()) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const sfSettings = storefrontSnap.data() as any;
                        biz.settings = { ...biz.settings, storefront: sfSettings };
                    }
                }
                setBusiness(biz);
            } catch (err) {
                console.error("Error loading storefront:", err);
            } finally {
                setLoading(false);
            }
        };

        loadBusiness();
    }, [slug]);

    useEffect(() => {
        if (!business) return;

        const storeName = business.settings?.storefront?.name || business.name;
        document.title = `${storeName} | Liscord`;

        // SEO Meta
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', `${storeName} - Онлайн дэлгүүр. ${business.address || ''}`);

        // Favicon
        if (business.logo) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = business.logo;
        }

        return () => {
            document.title = 'Liscord';
        };
    }, [business]);

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-pulse" style={{ color: 'var(--primary)' }}>Ачаалж байна...</div>
            </div>
        );
    }

    if (!business) {
        return <Navigate to="/" replace />;
    }

    if (!business.settings?.storefront?.enabled) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
                <h1 style={{ marginBottom: '10px' }}>Энэ дэлгүүр түр хаагдсан байна</h1>
                <p style={{ color: 'var(--text-muted)' }}>Та дараа дахин зочилно уу.</p>
            </div>
        );
    }

    const brandColor = business.brandColor || '#4a6bff';

    return (
        <div
            className="storefront-layout"
            style={{
                // @ts-expect-error - CSS variable injection
                '--sf-brand-color': brandColor,
                '--sf-brand-color-soft': `${brandColor}15`
            }}
        >
            <Outlet context={{ business }} />
            <StorefrontFooter business={business} />
            <CartDrawer />
        </div>
    );
}
