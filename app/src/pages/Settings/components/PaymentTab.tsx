import { useState } from 'react';
import { useBusinessStore } from '../../../store';
import { businessService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { QrCode, FileText, Loader2 } from 'lucide-react';

export function PaymentTab() {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

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
                    }
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
                <div className="settings-card">
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
                                <label className="input-label">Мерчант ID (Merchant ID)</label>
                                <input className="input" name="qpayMerchantId" defaultValue={qpay?.merchantId} placeholder="Байгууллагын дугаар" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Нэвтрэх нэр (Username)</label>
                                <input className="input" name="qpayUsername" defaultValue={qpay?.username} placeholder="Qpay username" />
                            </div>
                        </div>
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
