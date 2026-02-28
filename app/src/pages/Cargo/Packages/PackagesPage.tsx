import { useState, useEffect } from 'react';
import { Header } from '../../../components/layout/Header';
import { ScanLine, Package as PackageIcon, Clock, ChevronRight, User } from 'lucide-react';
import { NewPackageBatch } from './NewPackageBatch';
import { HubLayout } from '../../../components/common/HubLayout';
import { useBusinessStore } from '../../../store';
import { packageService } from '../../../services/db';
import type { PackageBatch } from '../../../types';
import './Packages.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmt = (d: any) => {
    if (!d) return '-';
    // If it's firestore timestamp, toDate() is already called by service
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function PackagesPage() {
    const { business } = useBusinessStore();
    const [view, setView] = useState<'list' | 'new'>('list');
    const [batches, setBatches] = useState<PackageBatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);
        const unsubscribe = packageService.subscribeBatches(business.id, (data) => {
            setBatches(data as PackageBatch[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    return (
        <HubLayout hubId="logistics-hub">
            <Header
                title="Ачаа бүртгэл (AI)"
                subtitle="Хятадаас ирсэн ачааг шошгоор нь таньж статус шинэчлэх"
                action={
                    view === 'list'
                        ? { label: 'Шинэ багц бүртгэх', onClick: () => setView('new') }
                        : { label: 'Жагсаалт руу буцах', onClick: () => setView('list') }
                }
            />

            <div className="page packages-page">
                {view === 'list' ? (
                    <div className="packages-container stagger-children">
                        {loading ? (
                            <div className="text-center p-8">Ачааны түүх уншиж байна...</div>
                        ) : batches.length === 0 ? (
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
                            <div className="batch-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                                {batches.map(batch => (
                                    <div key={batch.id} className="batch-card card hover-lift" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface-1)' }}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3 items-center">
                                                <div style={{ width: '40px', height: '40px', background: 'var(--surface-2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <PackageIcon size={20} className="text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="m-0 text-lg font-bold">{batch.batchName}</h4>
                                                    <span className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {fmt(batch.createdAt)}</span>
                                                </div>
                                            </div>
                                            <div className="badge badge-success">{batch.status === 'completed' ? 'Бүртгэгдсэн' : 'Боловсруулж буй'}</div>
                                        </div>

                                        <div className="batch-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--surface-2)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div className="text-sm text-muted">Нийт илгээмж</div>
                                                <div className="text-xl font-bold">{batch.scannedItems?.length || 0}</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div className="text-sm text-muted">Таарсан</div>
                                                <div className="text-xl font-bold text-success">
                                                    {batch.scannedItems?.filter(i => i.matchedOrderNumber).length || 0}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex items-center gap-2 text-sm text-muted">
                                                <User size={14} /> {batch.createdBy || 'Систем'}
                                            </div>
                                            <button className="btn btn-outline btn-sm">
                                                Дэлгэрэнгүй <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <NewPackageBatch onCancel={() => setView('list')} />
                )}
            </div>
        </HubLayout>
    );
}
