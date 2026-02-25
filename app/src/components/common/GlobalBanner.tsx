import { useState, useEffect } from 'react';
import { globalSettingsService } from '../../services/db';
import type { GlobalSettings } from '../../services/db';
import { AlertTriangle, Info, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export function GlobalBanner() {
    const [settings, setSettings] = useState<GlobalSettings | null>(null);

    useEffect(() => {
        const unsubscribe = globalSettingsService.subscribeToSettings((data) => {
            setSettings(data);
        });
        return () => unsubscribe();
    }, []);

    if (!settings || !settings.banner.isActive || !settings.banner.message) return null;

    const { type, message, link } = settings.banner;

    const getBannerStyles = () => {
        switch (type) {
            case 'danger': return { bg: 'var(--danger)', text: '#fff' };
            case 'warning': return { bg: 'var(--warning)', text: '#000' };
            case 'success': return { bg: 'var(--success)', text: '#fff' };
            default: return { bg: 'var(--primary)', text: '#fff' };
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger': return <ShieldAlert size={18} />;
            case 'warning': return <AlertTriangle size={18} />;
            case 'success': return <CheckCircle2 size={18} />;
            default: return <Info size={18} />;
        }
    };

    const styles = getBannerStyles();

    return (
        <div style={{
            background: styles.bg,
            color: styles.text,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '0.9rem',
            position: 'relative',
            zIndex: 100,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
                {getIcon()}
            </span>
            <span style={{ fontWeight: 500 }}>{message}</span>
            {link && (
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: 'inherit',
                        textDecoration: 'underline',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginLeft: '8px',
                        fontWeight: 600
                    }}
                >
                    Дэлгэрэнгүй <ArrowRight size={14} />
                </a>
            )}
        </div>
    );
}
