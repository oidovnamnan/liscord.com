import { useEffect, useState } from 'react';
import { useParams, Outlet, Navigate } from 'react-router-dom';
import { businessService } from '../../services/db';
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
                setBusiness(biz);
            } catch (err) {
                console.error("Error loading storefront:", err);
            } finally {
                setLoading(false);
            }
        };

        loadBusiness();
    }, [slug]);

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                Loading...
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

    // Pass business context to all storefront routes via Outlet context or we can use a store/React Context.
    // Since it's public, maybe a dedicated StoreContext is better, but Outlet context is easiest.
    return (
        <div className="storefront-layout">
            <Outlet context={{ business }} />
            <StorefrontFooter business={business} />
            <CartDrawer />
        </div>
    );
}
