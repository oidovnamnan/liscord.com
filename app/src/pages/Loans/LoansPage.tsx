import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore } from '../../store';
import { loanService, pawnItemService } from '../../services/db';
import type { Loan } from '../../types';
import { Search, FileText, AlertCircle, TrendingUp, Filter } from 'lucide-react';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import './LoansPage.css';

export function LoansPage() {
    const { business } = useBusinessStore();
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;
        setLoading(true);
        let unsnapLoans: any;
        let unsnapPawns: any;

        const load = async () => {
            unsnapLoans = loanService.subscribeLoans(business.id, (data) => {
                setLoans(data as Loan[]);
            });

            unsnapPawns = pawnItemService.subscribePawnItems(business.id, () => {
                // Pre-warm cache for pawn items if needed, or just stop loading
                setLoading(false);
            });
        };

        load();

        return () => {
            if (unsnapLoans) unsnapLoans();
            if (unsnapPawns) unsnapPawns();
        };
    }, [business?.id]);

    // Derived Logic for Compound Interest (Visual only for now)
    const calculateLiveBalance = (loan: Loan) => {
        if (loan.status === 'closed' || loan.status === 'foreclosed') return loan.currentBalance;

        const daysSinceStart = differenceInDays(startOfDay(new Date()), startOfDay(loan.startDate));
        if (daysSinceStart <= 0) return loan.principalAmount - loan.totalPaid;

        if (loan.interestType === 'daily') {
            const dailyRate = loan.interestRatePercent / 100;
            // Simple interest for demonstration: Principal + (Principal * Rate * Days)
            // Advanced would be compound: Principal * Math.pow((1 + dailyRate), days)
            const projectedInterest = loan.principalAmount * dailyRate * daysSinceStart;
            return (loan.principalAmount + projectedInterest) - loan.totalPaid;
        }

        return loan.currentBalance; // Fallback to snapshot
    };

    if (loading) return <div className="page-container flex-center">Зээлийн мэдээлэл уншиж байна...</div>;

    const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
    const totalPrincipalOut = activeLoans.reduce((sum, l) => sum + l.principalAmount, 0);
    const expectedReturn = activeLoans.reduce((sum, l) => sum + calculateLiveBalance(l), 0);

    return (
        <div className="page-container loans-page animate-fade-in">
            <Header
                title="Зээл & Ломбард"
                subtitle="Бялчилсан болон барьцаат зээлийн удирдлага"
                action={{
                    label: "Зээл олгох",
                    onClick: () => toast('Шинэ зээл үүсгэх (Удахгүй)')
                }}
            />

            <div className="loans-stats-grid">
                <div className="loan-stat-card">
                    <span className="loan-stat-label">Идэвхтэй Зээл</span>
                    <span className="loan-stat-value">{activeLoans.length}</span>
                </div>
                <div className="loan-stat-card">
                    <span className="loan-stat-label">Гаргасан Үндсэн Зээл</span>
                    <span className="loan-stat-value">₮{totalPrincipalOut.toLocaleString()}</span>
                </div>
                <div className="loan-stat-card">
                    <span className="loan-stat-label">Хүлээгдэж буй Авлага (Хүү)</span>
                    <span className="loan-stat-value success">₮{expectedReturn.toLocaleString()}</span>
                </div>
                <div className="loan-stat-card">
                    <span className="loan-stat-label">Хугацаа хэтэрсэн / Зөрчилтэй</span>
                    <span className="loan-stat-value danger">{loans.filter(l => l.status === 'overdue').length}</span>
                </div>
            </div>

            <div className="loans-toolbar">
                <div className="search-bar">
                    <Search className="search-icon" size={20} />
                    <input type="text" placeholder="Харилцагч эсвэл утасны дугаар..." className="search-input" />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline" title="Шүүлтүүр">
                        <Filter size={16} />
                    </button>
                    <button className="btn btn-outline" onClick={() => toast('Агуулахын бүртгэл')}>
                        <FileText size={16} className="mr-sm" /> Барьцаа хөрөнгө
                    </button>
                </div>
            </div>

            <div className="loans-table-container">
                <table className="loans-table">
                    <thead>
                        <tr>
                            <th>Зээлдэгч</th>
                            <th>Гэрээний хугацаа</th>
                            <th>Барьцаа</th>
                            <th>Үндсэн зээл</th>
                            <th>Хүүний нөхцөл</th>
                            <th>Одоогийн үлдэгдэл</th>
                            <th>Төлөв</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    Бүртгэлтэй зээл байхгүй байна.
                                </td>
                            </tr>
                        )}
                        {loans.map(loan => {
                            const isOverdue = new Date() > new Date(loan.dueDate) && loan.status !== 'closed' && loan.status !== 'foreclosed';
                            const liveBal = calculateLiveBalance(loan);

                            return (
                                <tr key={loan.id} style={{ cursor: 'pointer' }} onClick={() => toast(`Зээлдэгч: ${loan.customerName}`)}>
                                    <td>
                                        <div className="loan-customer-block">
                                            <span className="loan-customer-name">{loan.customerName}</span>
                                            <span className="loan-customer-phone">{loan.customerPhone}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px' }}>
                                            <div>Олгосон: {format(loan.startDate, 'yyyy.MM.dd')}</div>
                                            <div style={{ color: isOverdue ? 'var(--danger)' : 'inherit' }}>
                                                Дуусах: {format(loan.dueDate, 'yyyy.MM.dd')}
                                                {isOverdue && <AlertCircle size={12} style={{ display: 'inline', marginLeft: '4px', marginBottom: '-2px' }} />}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {loan.pawnItemDescription ? (
                                            <div className="pawn-item-tag">
                                                {loan.pawnItemDescription}
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>- Итгэлцэл -</span>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>₮{loan.principalAmount.toLocaleString()}</td>
                                    <td>
                                        <span style={{ color: 'var(--warning)' }}>
                                            <TrendingUp size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            {loan.interestRatePercent}% / {loan.interestType === 'daily' ? 'өдөр' : 'сар'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 700, color: liveBal > loan.principalAmount ? 'var(--danger)' : 'inherit' }}>
                                        ₮{Math.round(liveBal).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className={`loan-badge ${isOverdue ? 'overdue' : loan.status}`}>
                                            {isOverdue ? 'Хэтэрсэн' : loan.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
