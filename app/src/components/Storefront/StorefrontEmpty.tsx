import { SearchX } from 'lucide-react';

export function StorefrontEmpty({ message = 'Илэрц олдсонгүй' }: { message?: string }) {
    return (
        <div style={{
            gridColumn: '1 / -1',
            padding: '80px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            color: 'var(--text-muted)'
        }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
            }}>
                <SearchX size={32} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{message}</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '300px' }}>
                Та хайх үгээ шалгах эсвэл өөр ангилал сонгоод үзээрэй.
            </p>
        </div>
    );
}
