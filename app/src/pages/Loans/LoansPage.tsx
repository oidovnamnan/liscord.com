import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore } from '../../store';
import { loanService, pawnItemService } from '../../services/db';
import type { Loan, PawnItem } from '../../types';
import { TrendingUp, Loader2, Plus } from 'lucide-react';
import { HubLayout } from '../../components/common/HubLayout';
import { toast } from 'react-hot-toast';
import './LoansPage.css';

export function LoansPage() {
    const { business } = useBusinessStore();
    const [loans, setLoans] = useState<Loan[]>([]);
    const [pawnItems, setPawnItems] = useState<PawnItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);

        const unsubLoans = loanService.subscribeLoans(business.id, (data) => {
            setLoans(data);
            setLoading(false);
        });

        const unsubPawn = pawnItemService.subscribePawnItems(business.id, (data) => {
            setPawnItems(data);
        });

        return () => {
            unsubLoans();
            unsubPawn();
        };
    }, [business?.id]);

    const stats = {
        totalActivePrincipal: loans.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.principalAmount || 0), 0),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        totalItemsInVault: pawnItems.filter(p => (p as any).status === 'vault').length,
        avgInterestRate: loans.length > 0 ? loans.reduce((sum, l) => sum + (l.interestRatePercent || 0), 0) / loans.length : 0
    };

    if (loading) return (
        <HubLayout hubId="finance-hub">
            <div className="page-container flex-center" style={{ height: '60vh' }}>
                <Loader2 className="spin" size={32} />
                <p style={{ marginLeft: 12 }}>Зээлийн мэдээлэл уншиж байна...</p>
            </div>
        </HubLayout>
    );

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container loans-page animate-fade-in">
                <Header
                    title="Зээл & Барьцаа"
                    subtitle="Хоршоо, Ломбард, Микро зээлийн удирдлага"
                    action={{
                        label: "Зээл олгох",
                        onClick: () => setShowCreate(true)
                    }}
                />

                <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="stat-card">
                        <div className="stat-card-label">Нийт идэвхтэй зээл</div>
                        <div className="stat-card-value">{stats.totalActivePrincipal.toLocaleString()} ₮</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Барьцаанд буй бараа</div>
                        <div className="stat-card-value">{stats.totalItemsInVault} ш</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Дундаж хүү</div>
                        <div className="stat-card-value">{stats.avgInterestRate.toFixed(1)}%</div>
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Зээлдэгч</th>
                                <th>Барьцаа</th>
                                <th>Үндсэн дүн</th>
                                <th>Хүү</th>
                                <th>Хугацаа</th>
                                <th>Үлдэгдэл</th>
                                <th>Төлөв</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map(loan => (
                                <tr key={loan.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{loan.customerName}</div>
                                        <div style={{ fontSize: '12px', opacity: 0.7 }}>{loan.customerPhone}</div>
                                    </td>
                                    <td>
                                        {loan.pawnItemDescription ? (
                                            <span className="badge badge-info">{loan.pawnItemDescription}</span>
                                        ) : (
                                            <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Барьцаагүй</span>
                                        )}
                                    </td>
                                    <td>{loan.principalAmount.toLocaleString()} ₮</td>
                                    <td>
                                        <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <TrendingUp size={12} /> {loan.interestRatePercent}%
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px' }}>
                                            {loan.startDate instanceof Date ? loan.startDate.toLocaleDateString() : '-'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--danger)' }}>
                                            {loan.dueDate instanceof Date ? loan.dueDate.toLocaleDateString() : '-'} хүртэл
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                        {loan.currentBalance.toLocaleString()} ₮
                                    </td>
                                    <td>
                                        <span className={`badge badge-${loan.status === 'active' ? 'confirmed' : loan.status === 'overdue' ? 'cancelled' : 'new'}`}>
                                            {loan.status === 'active' ? 'Идэвхтэй' :
                                                loan.status === 'overdue' ? 'Хугацаа хэтэрсэн' :
                                                    loan.status === 'closed' ? 'Хаагдсан' : loan.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {loans.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                        Бүртгэлтэй зээл алга байна.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreate && <CreateLoanModal onClose={() => setShowCreate(false)} />}
        </HubLayout>
    );
}

function CreateLoanModal({ onClose }: { onClose: () => void }) {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [pawnItem, setPawnItem] = useState({ description: '', estimatedValue: '' });
    const [loan, setLoan] = useState({
        customerName: '',
        customerPhone: '',
        principal: '',
        interest: '5',
        type: 'monthly' as 'daily' | 'monthly',
        days: '30'
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!business) return;

        setLoading(true);
        try {
            let pawnItemId = null;
            if (pawnItem.description) {
                pawnItemId = await pawnItemService.createPawnItem(business.id, {
                    description: pawnItem.description,
                    estimatedValue: Number(pawnItem.estimatedValue) || 0,
                    status: 'vault',
                    isDeleted: false
                });
            }

            const startDate = new Date();
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + Number(loan.days));

            await loanService.createLoan(business.id, {
                customerId: '',
                customerName: loan.customerName,
                customerPhone: loan.customerPhone,
                pawnItemId,
                pawnItemDescription: pawnItem.description || null,
                principalAmount: Number(loan.principal),
                interestRatePercent: Number(loan.interest),
                interestType: loan.type,
                startDate,
                dueDate,
                totalPaid: 0,
                currentBalance: Number(loan.principal),
                status: 'active',
                isDeleted: false
            });

            toast.success('Зээл амжилттай бүртгэгдлээ');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h2>{step === 1 ? '1/2 Зээлийн мэдээлэл' : '2/2 Барьцаа хөрөнгө'}</h2>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                    </div>

                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {step === 1 ? (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Зээлдэгчийн нэр</label>
                                    <input className="input" placeholder="Нэр оруулна уу" value={loan.customerName} onChange={e => setLoan({ ...loan, customerName: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Утасны дугаар</label>
                                    <input className="input" placeholder="Утас оруулна уу" value={loan.customerPhone} onChange={e => setLoan({ ...loan, customerPhone: e.target.value })} required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Үндсэн зээлийн дүн (₮)</label>
                                    <input className="input" type="number" placeholder="500,000" value={loan.principal} onChange={e => setLoan({ ...loan, principal: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="input-group">
                                        <label className="input-label">Хүү (%)</label>
                                        <input className="input" type="number" step="0.1" value={loan.interest} onChange={e => setLoan({ ...loan, interest: e.target.value })} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Хугацаа (өдрөөр)</label>
                                        <input className="input" type="number" value={loan.days} onChange={e => setLoan({ ...loan, days: e.target.value })} required />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Барьцаа барааны тайлбар</label>
                                    <textarea className="input" rows={3} placeholder="iPhone 14 Pro Max..." value={pawnItem.description} onChange={e => setPawnItem({ ...pawnItem, description: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Бодит үнэлгээ (₮)</label>
                                    <input className="input" type="number" placeholder="1,200,000" value={pawnItem.estimatedValue} onChange={e => setPawnItem({ ...pawnItem, estimatedValue: e.target.value })} />
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>* Барьцаагүй бичил зээл бол хоосон орхиж болно.</p>
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        {step === 1 ? (
                            <>
                                <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                                <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>Үргэлжлүүлэх</button>
                            </>
                        ) : (
                            <>
                                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Буцах</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? <Loader2 className="spin" size={16} /> : <Plus size={16} />} Бүртгэх
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
