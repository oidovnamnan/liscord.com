// import { useBusinessStore } from '../../store';
import { Header } from '../../components/layout/Header';
import { Building2, UserPlus, Filter, Link, ShieldCheck, Mail, Phone, Store } from 'lucide-react';

export function B2BPage() {

    // Mock
    const partners = [
        { id: '1', name: 'Altan Taria LLC', type: 'Distributor', status: 'active', email: 'sales@altantaria.mn', phone: '99112233' },
        { id: '2', name: 'Nomin Supermarket', type: 'Retailer', status: 'active', email: 'purchasing@nomin.mn', phone: '88776655' },
        { id: '3', name: 'Sky Trading', type: 'Wholesaler', status: 'pending', email: 'info@sky.mn', phone: '99001122' },
    ];

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="B2B Бөөний Портал"
                subtitle="Харилцагч байгууллагууд болон дистрибьютерийн тусгай эрхтэй сүлжээ"
            />

            <div className="page-content">
                <div style={{ display: 'grid', gridTemplateColumns: 'reapto-fit, minmax(300px, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary), #8e44ad)',
                        padding: '32px',
                        borderRadius: 'var(--radius-lg)',
                        color: 'white',
                        gridColumn: '1 / -1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 30px rgba(108, 92, 231, 0.2)'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>B2B Харилцагчийн Портал</h2>
                            <p style={{ opacity: 0.9, maxWidth: '600px', lineHeight: 1.5, marginBottom: '20px' }}>
                                Бөөний нөхцөлөөр бараа татдаг харилцагчиддаа зориулж тусдаа портал нээж өгөөрэй.
                                Тэд өөрсдөө нэвтэрч ороод үлдэгдэл шалгаж, бөөний үнээрээ шууд захиалга өгөх боломжтой.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn" style={{ background: 'white', color: 'var(--primary)' }}>
                                    <Link size={18} /> Порталын холбоос хуулах
                                </button>
                                <button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                                    <Store size={18} /> Дэлгэцийн харагдац хянах
                                </button>
                            </div>
                        </div>
                        <Building2 size={120} style={{ opacity: 0.2, transform: 'rotate(-10deg)', marginRight: '40px' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div className="search-bar" style={{ width: '300px' }}>
                        <input type="text" placeholder="Байгууллагын нэрээр хайх..." className="input" />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-outline">
                            <Filter size={18} /> Ангилал
                        </button>
                        <button className="btn btn-primary gradient-btn">
                            <UserPlus size={18} /> Харилцагч нэмэх
                        </button>
                    </div>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Байгууллагын нэр</th>
                                <th>Хамтын ажиллагаа</th>
                                <th>Холбоо барих</th>
                                <th>Төлөв</th>
                                <th style={{ textAlign: 'right' }}>Үйлдэл</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partners.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                            {p.name.charAt(0)}
                                        </div>
                                        {p.name}
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--text-secondary)' }}>{p.type}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} /> {p.email}</span>
                                            <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}><Phone size={12} /> {p.phone}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                            <ShieldCheck size={12} style={{ marginRight: 4 }} />
                                            {p.status === 'active' ? 'Нэвтрэх эрхтэй' : 'Хүлээгдэж буй'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-outline btn-sm">Дэлгэрэнгүй</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
