import { useEffect, useState } from 'react';
import { useParams, Outlet, Navigate, useLocation } from 'react-router-dom';
import { businessService } from '../../services/db';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, increment } from 'firebase/firestore';
import type { Business } from '../../types';
import { CartDrawer } from '../../components/Storefront/CartDrawer';
import { StorefrontFooter } from '../../components/Storefront/StorefrontFooter';
import './Storefront.css';

export function StorefrontWrapper() {
    const { slug } = useParams<{ slug: string }>();
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<'not-found' | 'network' | null>(null);

    // Detect in-app browsers (Facebook, WeChat, Line, Instagram, etc.)
    const ua = navigator.userAgent || '';
    const isFBBrowser = /FBAN|FBAV/i.test(ua);
    const isWeChatBrowser = /MicroMessenger/i.test(ua);
    const isLineBrowser = /\bLine\b/i.test(ua);
    const isIGBrowser = /Instagram/i.test(ua);
    const isInAppBrowser = isFBBrowser || isWeChatBrowser || isLineBrowser || isIGBrowser;

    const loadBusiness = async () => {
        if (!slug) {
            setLoading(false);
            setError('not-found');
            return;
        }
        setLoading(true);
        setError(null);
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
                setBusiness(biz);
            } else {
                setError('not-found');
            }
        } catch (err) {
            console.error("Error loading storefront:", err);
            setError('network');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    // Force light theme on storefront pages (restore admin theme on unmount)
    useEffect(() => {
        const root = document.documentElement;
        const prevTheme = root.getAttribute('data-theme') || 'dark';
        const prevColorScheme = root.style.colorScheme || '';
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';  // Force browser to use light UA styles
        document.body.style.background = '#ffffff';
        document.body.style.color = '#111111';

        // FB browser: enforce viewport to prevent zoom/scaling issues
        const isFB = /FBAN|FBAV/i.test(navigator.userAgent);
        let prevViewport = '';
        if (isFB) {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                prevViewport = viewport.getAttribute('content') || '';
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
            }
            // Add FB-specific body class for global CSS hooks
            document.body.classList.add('fb-browser');
        }

        return () => {
            root.setAttribute('data-theme', prevTheme);
            root.style.colorScheme = prevColorScheme;
            document.body.style.background = '';
            document.body.style.color = '';
            if (isFB) {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport && prevViewport) {
                    viewport.setAttribute('content', prevViewport);
                }
                document.body.classList.remove('fb-browser');
            }
        };
    }, []);

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

    // ═══ Visitor Heartbeat — track anonymous storefront visitors ═══
    useEffect(() => {
        if (!business?.id) return;

        let visitorId = sessionStorage.getItem('liscord_visitor_id');
        const isNewSession = !visitorId;
        if (!visitorId) {
            visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            sessionStorage.setItem('liscord_visitor_id', visitorId);
        }

        // Increment daily visitor counter for new sessions
        if (isNewSession) {
            const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            const dailyRef = doc(db, 'businesses', business.id, 'daily_stats', today);
            setDoc(dailyRef, { visitorCount: increment(1) }, { merge: true }).catch(() => {});
        }

        const visitorRef = doc(db, 'businesses', business.id, 'visitors', visitorId);

        const writeHeartbeat = () => {
            setDoc(visitorRef, {
                lastActiveAt: serverTimestamp(),
                userAgent: navigator.userAgent.slice(0, 100),
                page: window.location.pathname,
            }, { merge: true }).catch(() => {});
        };

        writeHeartbeat();
        const interval = setInterval(writeHeartbeat, 30000);

        return () => {
            clearInterval(interval);
            deleteDoc(visitorRef).catch(() => {});
        };
    }, [business?.id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-pulse" style={{ color: 'var(--primary)' }}>Ачаалж байна...</div>
            </div>
        );
    }


    // Network error — show retry
    if (error === 'network') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', background: '#fff' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: '#333' }}>Холболт амжилтгүй</h2>
                <p style={{ color: '#888', fontSize: '0.9rem', maxWidth: 320, lineHeight: 1.5, marginBottom: 20 }}>
                    Интернэт холболтоо шалгаад дахин оролдоно уу.
                </p>
                <button
                    onClick={() => loadBusiness()}
                    style={{ padding: '12px 32px', background: '#4a6bff', color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
                >
                    Дахин оролдох
                </button>
            </div>
        );
    }

    // Slug not found — show 404 (NOT redirect to landing)
    if (error === 'not-found' || !business) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', background: '#fff' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: '#333' }}>Дэлгүүр олдсонгүй</h2>
                <p style={{ color: '#888', fontSize: '0.9rem', maxWidth: 320, lineHeight: 1.5, marginBottom: 20 }}>
                    <strong>"{slug}"</strong> нэртэй дэлгүүр бүртгэлгүй байна.
                </p>
                <a href="/" style={{ padding: '12px 32px', background: '#4a6bff', color: '#fff', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none' }}>
                    Нүүр хуудас
                </a>
            </div>
        );
    }

    if (!business.settings?.storefront?.enabled) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
                <h1 style={{ marginBottom: '10px' }}>Энэ дэлгүүр түр хаагдсан байна</h1>
                <p style={{ color: 'var(--text-muted)' }}>Та дараа дахин зочилно уу.</p>
            </div>
        );
    }

    // In-app browser redirect — only when blockInAppBrowsers is enabled in settings
    if (isInAppBrowser && business.settings?.storefront?.blockInAppBrowsers) {
        // Android: try intent:// to force Chrome
        const isAndroid = /Android/i.test(ua);
        if (isAndroid && (isFBBrowser || isIGBrowser)) {
            try {
                const url = window.location.href;
                window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
            } catch { /* fallback to manual prompt below */ }
        }

        const currentUrl = window.location.href;
        const browserName = isWeChatBrowser ? 'WeChat' : isFBBrowser ? 'Facebook' : isIGBrowser ? 'Instagram' : 'Line';
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '24px', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: 20 }}>🌐</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8, color: '#111' }}>
                    Хөтөч дээр нээнэ үү
                </h2>
                <p style={{ color: '#666', fontSize: '0.9rem', maxWidth: 340, lineHeight: 1.6, marginBottom: 20 }}>
                    {browserName} хөтөч дотор зөв ажиллахгүй байна.
                    {/iPhone|iPad/i.test(ua)
                        ? <><br/>Доод талын <strong>⋯</strong> товч дарж <strong>"Safari дээр нээх"</strong> гэснийг сонгоно уу.</>
                        : <><br/>Баруун дээд <strong>⋮</strong> товч дарж <strong>"Хөтөчөөр нээх"</strong> гэснийг сонгоно уу.</>
                    }
                </p>
                <div style={{
                    padding: '14px 24px', background: '#f8f9fa', borderRadius: 14,
                    fontSize: '0.8rem', color: '#555', wordBreak: 'break-all', maxWidth: 320,
                    border: '1px dashed #ddd', userSelect: 'all', marginBottom: 16
                }}>
                    {currentUrl}
                </div>
                <button
                    onClick={() => {
                        try { navigator.clipboard.writeText(currentUrl); } catch {
                            const el = document.createElement('textarea');
                            el.value = currentUrl; document.body.appendChild(el);
                            el.select(); document.execCommand('copy'); document.body.removeChild(el);
                        }
                        const btn = document.getElementById('copy-url-btn');
                        if (btn) btn.textContent = '✅ Хуулагдлаа';
                    }}
                    id="copy-url-btn"
                    style={{ padding: '12px 32px', background: '#4a6bff', color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
                >
                    📋 Линк хуулах
                </button>
            </div>
        );
    }

    const brandColor = business.brandColor || '#4a6bff';
    const location = useLocation();
    const isCheckoutPage = location.pathname.includes('/checkout');

    return (
        <div
            className={`storefront-layout${isFBBrowser ? ' is-fb-browser' : ''}`}
            style={{
                // @ts-expect-error - CSS variable injection
                '--sf-brand-color': brandColor,
                '--sf-brand-color-soft': `${brandColor}15`
            }}
        >
            <Outlet context={{ business }} />
            {!isCheckoutPage && <StorefrontFooter business={business} />}
            <CartDrawer />
        </div>
    );
}
