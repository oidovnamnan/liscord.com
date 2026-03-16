import { useState } from 'react';
import { useBusinessStore } from '../../../store';
import { businessService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { QrCode, FileText, Loader2, Landmark, Plus, Trash2 } from 'lucide-react';

interface BankAccountEntry {
    id: string;
    bankName: string;
    accountNumber: string;
    iban: string;
    accountName: string;
    enabled: boolean;
}

export function PaymentTab() {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [bankAccounts, setBankAccounts] = useState<BankAccountEntry[]>(
        business?.settings?.bankTransferAccounts || []
    );

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business) return;

        const fd = new FormData(e.currentTarget);
        setLoading(true);

        try {
            await businessService.updateBusiness(business.id, {
                settings: {
                    ...business.settings,
                    ebarimt: {
                        enabled: fd.get('ebarimtEnabled') === 'on',
                        companyRegNo: (fd.get('companyRegNo') as string)?.trim() || '',
                        posId: (fd.get('posId') as string)?.trim() || '',
                        vatPercent: parseFloat(fd.get('vatPercent') as string) || 10,
                        cityTaxPercent: parseFloat(fd.get('cityTaxPercent') as string) || 1,
                    },
                    qpay: {
                        enabled: fd.get('qpayEnabled') === 'on',
                        merchantId: (fd.get('qpayMerchantId') as string)?.trim() || '',
                        username: (fd.get('qpayUsername') as string)?.trim() || '',
                        password: (fd.get('qpayPassword') as string)?.trim() || '',
                        invoiceCode: (fd.get('qpayInvoiceCode') as string)?.trim() || '',
                    },
                    bankTransferAccounts: bankAccounts,
                }
            });
            setIsDirty(false);
            toast.success('Төлбөр болон НӨАТ-ын тохиргоо хадгалагдлаа');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const addBankAccount = () => {
        setBankAccounts(prev => [...prev, {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            bankName: '',
            accountNumber: '',
            iban: '',
            accountName: '',
            enabled: true,
        }]);
        setIsDirty(true);
    };

    const removeBankAccount = (id: string) => {
        setBankAccounts(prev => prev.filter(a => a.id !== id));
        setIsDirty(true);
    };

    const updateBankAccount = (id: string, field: keyof BankAccountEntry, value: string | boolean) => {
        setBankAccounts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
        setIsDirty(true);
    };

    const ebarimt = business?.settings?.ebarimt;
    const qpay = business?.settings?.qpay;

    return (
        <div className="settings-section animate-fade-in">
            <h2>Төлбөр & НӨАТБ (E-Barimt)</h2>

            <form onSubmit={handleSave} onChange={() => setIsDirty(true)}>

                {/* E-BARIMT CONFIG */}
                <div className="settings-card mb-lg">
                    <div className="settings-card-header">
                        <div className="settings-card-icon"><FileText size={20} /></div>
                        <h3>E-Barimt (НӨАТБ) Интеграци</h3>
                    </div>
                    <div style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                        <div className="notification-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>НӨАТ-ын баримт хэвлэх (API)</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PosAPI ашиглан ГЕТаТГ-руу баримт хуулж, сугалаа олгох</div>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" name="ebarimtEnabled" defaultChecked={ebarimt?.enabled} />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        <div className="grid-2-gap">
                            <div className="input-group">
                                <label className="input-label">Байгууллагын РД (Merchant ID)</label>
                                <input className="input" name="companyRegNo" defaultValue={ebarimt?.companyRegNo} placeholder="1234567" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Кассын дугаар (POS ID)</label>
                                <input className="input" name="posId" defaultValue={ebarimt?.posId} placeholder="0001" />
                            </div>
                        </div>
                        <div className="grid-2-gap" style={{ marginTop: 12 }}>
                            <div className="input-group">
                                <label className="input-label">НӨАТ хувь (%)</label>
                                <input type="number" step="0.1" className="input" name="vatPercent" defaultValue={ebarimt?.vatPercent ?? 10} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">НХАТ хувь (%) - Нийслэлийн албан татвар</label>
                                <input type="number" step="0.1" className="input" name="cityTaxPercent" defaultValue={ebarimt?.cityTaxPercent ?? 1} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* QPAY CONFIG */}
                <div className="settings-card mb-lg">
                    <div className="settings-card-header">
                        <div className="settings-card-icon"><QrCode size={20} /></div>
                        <h3>QPay v2 Интеграци</h3>
                    </div>
                    <div style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                        <div className="notification-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>QPay төлбөр тооцоо авах</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ПОС дээр QR код үүсгэж төлбөр шалгах</div>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" name="qpayEnabled" defaultChecked={qpay?.enabled} />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        <div className="grid-2-gap">
                            <div className="input-group">
                                <label className="input-label">Нэвтрэх нэр (Username)</label>
                                <input className="input" name="qpayUsername" defaultValue={qpay?.username} placeholder="QPay username" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Нууц үг (Password)</label>
                                <input className="input" name="qpayPassword" type="password" defaultValue={qpay?.password} placeholder="QPay password" />
                            </div>
                        </div>
                        <div className="grid-2-gap" style={{ marginTop: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Invoice Code</label>
                                <input className="input" name="qpayInvoiceCode" defaultValue={qpay?.invoiceCode} placeholder="MERCHANT_INVOICE" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Мерчант ID</label>
                                <input className="input" name="qpayMerchantId" defaultValue={qpay?.merchantId} placeholder="Байгууллагын дугаар (заавал биш)" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* BANK TRANSFER ACCOUNTS */}
                <div className="settings-card mb-lg">
                    <div className="settings-card-header">
                        <div className="settings-card-icon"><Landmark size={20} /></div>
                        <h3>Банкны шилжүүлгийн данснууд</h3>
                    </div>
                    <div style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                            Онлайн дэлгүүрийн checkout хуудсанд харагдах банкны данснуудыг удирдана. Захиалагч шилжүүлэг хийхэд эдгээр дансны мэдээлэл харагдана.
                        </p>

                        {bankAccounts.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                                {bankAccounts.map((account) => (
                                    <div key={account.id} style={{
                                        padding: 20, borderRadius: 16,
                                        border: `1.5px solid ${account.enabled ? 'var(--primary)' : 'var(--border-color)'}`,
                                        background: account.enabled ? 'rgba(var(--primary-rgb), 0.03)' : 'var(--bg-soft)',
                                        transition: 'all 0.2s ease',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Landmark size={18} style={{ color: account.enabled ? 'var(--primary)' : 'var(--text-muted)' }} />
                                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: account.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                    {account.bankName || 'Шинэ данс'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <label className="toggle" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" checked={account.enabled} onChange={e => updateBankAccount(account.id, 'enabled', e.target.checked)} />
                                                    <span className="toggle-slider" />
                                                </label>
                                                <button type="button" onClick={() => removeBankAccount(account.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center' }} title="Устгах">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid-2-gap" style={{ gap: 12 }}>
                                            <div className="input-group">
                                                <label className="input-label">Банкны нэр</label>
                                                <input className="input" value={account.bankName} onChange={e => updateBankAccount(account.id, 'bankName', e.target.value)} placeholder="Жнь: Хаан банк" style={{ height: 42 }} />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">IBAN дугаар</label>
                                                <input className="input" value={account.iban} onChange={e => updateBankAccount(account.id, 'iban', e.target.value)} placeholder="Жнь: MN12KHAN..." style={{ height: 42 }} />
                                            </div>
                                        </div>
                                        <div className="grid-2-gap" style={{ gap: 12, marginTop: 12 }}>
                                            <div className="input-group">
                                                <label className="input-label">Дансны дугаар</label>
                                                <input className="input" value={account.accountNumber} onChange={e => updateBankAccount(account.id, 'accountNumber', e.target.value)} placeholder="Жнь: 5000123456" style={{ height: 42 }} />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Хүлээн авагчийн нэр</label>
                                                <input className="input" value={account.accountName} onChange={e => updateBankAccount(account.id, 'accountName', e.target.value)} placeholder="Жнь: Ганзориг" style={{ height: 42 }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button type="button" onClick={addBankAccount} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, fontWeight: 700 }}>
                            <Plus size={16} /> Данс нэмэх
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button className="btn btn-primary gradient-btn" type="submit" disabled={loading || !isDirty} style={{ minWidth: 120 }}>
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Хадгалах'}
                    </button>
                </div>
            </form>
        </div>
    );
}
