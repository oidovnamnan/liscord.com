import { Building2, MessageSquare, HeadphonesIcon, Factory, PieChart } from 'lucide-react';

interface Props {
    title: string;
    description: string;
    type: 'finance' | 'support' | 'b2b' | 'chat' | 'manufacturing';
}

export function ComingSoonPage({ title, description, type }: Props) {
    const getIcon = () => {
        switch (type) {
            case 'finance': return <PieChart size={64} color="var(--primary)" />;
            case 'support': return <HeadphonesIcon size={64} color="var(--primary)" />;
            case 'b2b': return <Building2 size={64} color="var(--primary)" />;
            case 'chat': return <MessageSquare size={64} color="var(--primary)" />;
            case 'manufacturing': return <Factory size={64} color="var(--primary)" />;
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '40px',
            textAlign: 'center',
            background: 'var(--surface-1)',
            borderRadius: 'var(--radius-lg)'
        }} className="animate-fade-in">
            <div style={{
                background: 'rgba(108, 92, 231, 0.1)',
                padding: '24px',
                borderRadius: '50%',
                marginBottom: '24px'
            }}>
                {getIcon()}
            </div>
            <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                {title}
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.6 }}>
                {description}
            </p>
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                <span style={{
                    padding: '8px 16px',
                    background: 'var(--surface-2)',
                    borderRadius: '20px',
                    fontSize: '14px',
                    color: 'var(--text-muted)'
                }}>
                    Тун удахгүй нээгдэнэ
                </span>
                <span style={{
                    padding: '8px 16px',
                    background: 'var(--surface-2)',
                    borderRadius: '20px',
                    fontSize: '14px',
                    color: 'var(--text-muted)'
                }}>
                    Enterprise Module
                </span>
            </div>
        </div>
    );
}
