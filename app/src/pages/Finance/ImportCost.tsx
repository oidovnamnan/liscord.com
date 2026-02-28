import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { useBusinessStore } from '../../store';
import { importCostService, packageService } from '../../services/db';
import type { ImportCostCalculation, PackageBatch } from '../../types';
import { Calculator, Download, Plus, Save, ChevronRight } from 'lucide-react';
import './Finance.css'; // Reuse or create new

export function ImportCostPage() {
    const { business } = useBusinessStore();
    const [batches, setBatches] = useState<PackageBatch[]>([]);
    const [calculations, setCalculations] = useState<ImportCostCalculation[]>([]);
    const [view, setView] = useState<'list' | 'new'>('list');

    useEffect(() => {
        if (!business?.id) return;
        const unsubBatches = packageService.subscribeBatches(business.id, (data) => setBatches(data));
        const unsubCalcs = importCostService.subscribeCalculations(business.id, (data) => {
            setCalculations(data);
        });
        return () => { unsubBatches(); unsubCalcs(); };
    }, [business?.id]);

    const renderList = () => (
        <div className="import-cost-list flex flex-col gap-6 stagger-children">
            {calculations.length === 0 ? (
                <div className="card text-center p-12 border-dashed border-2 flex flex-col items-center gap-4">
                    <Calculator size={48} className="text-muted opacity-30" />
                    <div className="empty-text">
                        <h3>Өртөг тооцоолол хийгээгүй байна</h3>
                        <p className="text-muted">Ачааны багц бүр дээрх бараа тус бүрийн тээвэр, гааль, даатгалын зардлыг нэмж эцсийн өртөгийг тооцно.</p>
                        <button className="btn btn-primary mt-4" onClick={() => setView('new')}>Шинэ тооцоолол</button>
                    </div>
                </div>
            ) : (
                <div className="grid-3">
                    {calculations.map(calc => (
                        <div key={calc.id} className="card hover-lift p-5 flex flex-col gap-4 border-l-4 border-l-primary">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs text-muted uppercase font-bold">Огноо: {new Date(calc.createdAt).toLocaleDateString()}</div>
                                    <h4 className="m-0 text-lg">Batch: {calc.batchId || 'Гар тооцоо'}</h4>
                                </div>
                                <div className={`badge ${calc.status === 'finalized' ? 'badge-success' : 'badge-preparing'}`}>
                                    {calc.status === 'finalized' ? 'Баталсан' : 'Драфт'}
                                </div>
                            </div>

                            <div className="stats-box bg-surface-2 p-3 rounded-lg flex justify-between">
                                <div>
                                    <div className="text-xs text-muted">Нийт зардал</div>
                                    <div className="font-bold">₮{calc.totals?.grandTotal?.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted">Барааны тоо</div>
                                    <div className="font-bold">{calc.items?.length || 0}</div>
                                </div>
                            </div>

                            <div className="actions flex gap-2">
                                <button className="btn btn-outline btn-sm flex-1"><ChevronRight size={14} /> Харах</button>
                                <button className="btn btn-ghost btn-sm"><Download size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderNew = () => (
        <div className="new-import-calc card p-0">
            <div className="p-4 border-b bg-surface-2 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                    <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>&lt; Буцах</button>
                    <h3 className="m-0">Шинэ өртөг тооцоолол</h3>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm"><Save size={14} /> Түр хадгалах</button>
                    <button className="btn btn-primary btn-sm"><Calculator size={14} /> Батлах</button>
                </div>
            </div>

            <div className="p-6 flex flex-col gap-6">
                <div className="grid-3 gap-6">
                    <div className="form-group">
                        <label className="label">Ачааны багц сонгох</label>
                        <select className="input">
                            <option value="">-- Багц сонгох --</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.batchName}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label">Валютын ханш (CNY/MNT)</label>
                        <input type="number" className="input" defaultValue={520} />
                    </div>
                    <div className="form-group">
                        <label className="label">Валютын ханш (USD/MNT)</label>
                        <input type="number" className="input" defaultValue={3450} />
                    </div>
                </div>

                <div className="costs-table">
                    <h4 className="text-sm font-bold uppercase text-muted mb-4">Нэмэлт зардлууд (Багцаар)</h4>
                    <div className="grid-4 gap-4">
                        <div className="card p-4 bg-surface-1">
                            <label className="text-xs text-muted">Тээвэр (Freight)</label>
                            <input type="number" className="input mt-1" placeholder="0" />
                        </div>
                        <div className="card p-4 bg-surface-1">
                            <label className="text-xs text-muted">Гааль (Customs)</label>
                            <input type="number" className="input mt-1" placeholder="0" />
                        </div>
                        <div className="card p-4 bg-surface-1">
                            <label className="text-xs text-muted">Даатгал (Insurance)</label>
                            <input type="number" className="input mt-1" placeholder="0" />
                        </div>
                        <div className="card p-4 bg-surface-1">
                            <label className="text-xs text-muted">Бусад (Handling)</label>
                            <input type="number" className="input mt-1" placeholder="0" />
                        </div>
                    </div>
                </div>

                <div className="items-list">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold uppercase text-muted m-0">Бараанууд (Бүрдүүлэлт)</h4>
                        <button className="btn btn-outline btn-sm"><Plus size={14} /> Бараа нэмэх</button>
                    </div>
                    <div className="card overflow-hidden">
                        <table className="table w-full">
                            <thead className="bg-surface-2 text-xs uppercase text-muted">
                                <tr>
                                    <th className="p-3 text-left">Бараа</th>
                                    <th className="p-3 text-right">Тоо</th>
                                    <th className="p-3 text-right">Худалдан авсан</th>
                                    <th className="p-3 text-right">+ Зардал</th>
                                    <th className="p-3 text-right font-bold text-primary">Эцсийн өртөг</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-muted">Бараа сонгож өртөг тооцоолоорой.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <HubLayout hubId="logistics-hub">
            <Header
                title="Импортын өртөг тооцоолол"
                subtitle="Барааны эцсийн өртөгийг тээвэр, гааль, татвартай нь нэгтгэж тооцох"
                action={view === 'list' ? { label: "Шинэ тооцоолол", onClick: () => setView('new') } : undefined}
            />

            <div className="page-content mt-6">
                {view === 'list' ? renderList() : renderNew()}
            </div>
        </HubLayout>
    );
}
