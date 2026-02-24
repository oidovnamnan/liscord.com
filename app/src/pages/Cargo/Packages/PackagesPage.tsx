import { useState } from 'react';
import { Header } from '../../../components/layout/Header';
import { ScanLine } from 'lucide-react';
import { NewPackageBatch } from './NewPackageBatch';
import './Packages.css';

export function PackagesPage() {
    const [view, setView] = useState<'list' | 'new'>('list');

    return (
        <>
            <Header
                title="Ирсэн Ачаа (AI)"
                action={
                    view === 'list'
                        ? { label: 'Шинэ багц бүртгэх', onClick: () => setView('new') }
                        : { label: 'Жагсаалт руу буцах', onClick: () => setView('list') }
                }
            />

            <div className="page packages-page">
                {view === 'list' ? (
                    <div className="packages-dashboard empty-state">
                        <div className="empty-content">
                            <div className="empty-icon-wrap">
                                <ScanLine size={48} className="text-primary" />
                            </div>
                            <h3>AI Ачаа Бүртгэл</h3>
                            <p>Та хятадаас ирсэн ачааны шошгоны зургийг оруулахад AI автоматаар захиалгын код болон утасны дугаарыг таньж статус шинэчлэхэд туслана.</p>
                            <button className="btn btn-primary mt-4" onClick={() => setView('new')}>
                                Одоо эхлэх
                            </button>
                        </div>
                    </div>
                ) : (
                    <NewPackageBatch onCancel={() => setView('list')} />
                )}
            </div>
        </>
    );
}
