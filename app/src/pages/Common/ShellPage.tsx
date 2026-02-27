import { Header } from '../../components/layout/Header';
import { Construction } from 'lucide-react';

export function ShellPage({ title }: { title: string }) {
    return (
        <div className="page-container">
            <Header title={title} />
            <div className="content-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
                <Construction size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <h2>{title} модуль удахгүй...</h2>
                <p>Энэхүү модуль одоогоор хөгжүүлэгдэж байна.</p>
            </div>
        </div>
    );
}
