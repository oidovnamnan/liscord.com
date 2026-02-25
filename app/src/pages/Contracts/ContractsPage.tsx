import { Header } from '../../components/layout/Header';

export function ContractsPage() {
    return (
        <div className="page-container">
            <Header title="Гэрээ / Бацаалан" subtitle="Түрээс, зээлийн бүртгэл" />
            <div className="page-content">
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                    <h2>Гэрээний модуль удахгүй орно</h2>
                    <p>Үл хөдлөх, Ломбард, Машин түрээсийн актив удирдлага энд явагдана.</p>
                </div>
            </div>
        </div>
    );
}
