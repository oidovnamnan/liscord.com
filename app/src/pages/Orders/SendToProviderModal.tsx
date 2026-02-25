import { useState, useEffect } from 'react';
import { X, Network, Loader2, ArrowRight } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { b2bService } from '../../services/b2bService';
import { toast } from 'react-hot-toast';
import type { BusinessLink, Order, ServiceRequest } from '../../types';

interface SendToProviderModalProps {
    orders: Order[];
    onClose: () => void;
    onSuccess: () => void;
}

export function SendToProviderModal({ orders, onClose, onSuccess }: SendToProviderModalProps) {
    const { business } = useBusinessStore();
    const [links, setLinks] = useState<BusinessLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLinkId, setSelectedLinkId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Additional delivery details that might apply to all selected orders
    const [pickupAddress, setPickupAddress] = useState(business?.address || '');
    const [pickupPhone, setPickupPhone] = useState(business?.phone || '');

    useEffect(() => {
        if (!business) return;
        b2bService.getBusinessLinks(business.id, 'consumer')
            .then(data => {
                // Only active links
                const active = data.filter(d => d.status === 'active');
                setLinks(active);
                if (active.length > 0) setSelectedLinkId(active[0].id);
            })
            .catch(() => toast.error('Холбогдсон байгууллагууд татахад алдаа гарлаа'))
            .finally(() => setLoading(false));
    }, [business?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!business || !selectedLinkId) return;

        const selectedLink = links.find(l => l.id === selectedLinkId);
        if (!selectedLink) return;

        setSubmitting(true);
        try {
            // Forward each order as a separate ServiceRequest
            for (const order of orders) {
                const requestData: Omit<ServiceRequest, 'id' | 'statusHistory' | 'createdAt' | 'updatedAt'> = {
                    linkId: selectedLink.id,
                    serviceType: selectedLink.provider.serviceType,
                    consumer: selectedLink.consumer,
                    provider: selectedLink.provider,
                    sourceOrder: {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        customerName: order.customer.name,
                        customerPhone: order.customer.phone
                    },
                    details: {
                        pickupAddress,
                        pickupContact: { name: business.name, phone: pickupPhone },
                        deliveryAddress: order.deliveryAddress || '',
                        deliveryContact: { name: order.customer.name, phone: order.customer.phone },
                        deliveryDistrict: '', // Parse later if needed
                        items: order.items.map(i => `${i.name} x${i.quantity}`).join(', '),
                        revenueAmount: order.financials.totalAmount
                    },
                    pricing: {
                        estimatedFee: 0, // In reality, calculate from provider pricing
                        finalFee: 0,
                        paidByConsumer: false, // E.g., cash on delivery by default
                        paymentMethod: selectedLink.terms.paymentTerms as any
                    },
                    status: 'pending'
                };

                await b2bService.createServiceRequest(requestData);
            }

            toast.success(`Амжилттай ${orders.length} захиалга илгээлээ`);
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Алдаа гарлаа');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-content b2b-forward-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Network size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', margin: '0 0 4px 0' }}>Нийлүүлэгч рүү илгээх</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Бөөний төв эсвэл Хүргэлтийн компани руу {orders.length} захиалга илгээх
                            </p>
                        </div>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} /></div>
                ) : links.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        Одоогоор холбогдсон нийлүүлэгч байхгүй байна.
                        <br /><br />
                        <span style={{ fontSize: '0.85rem' }}>Тохиргоо - B2B Платформ руу орж холбогдоно уу.</span>
                    </div>
                ) : (
                    <form className="modal-form" onSubmit={handleSubmit} style={{ padding: 24 }}>
                        <div className="input-group">
                            <label className="input-label">Нийлүүлэгч сонгох</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {links.map(link => (
                                    <label key={link.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                                        border: `1px solid ${selectedLinkId === link.id ? 'var(--primary)' : 'var(--border)'}`,
                                        borderRadius: 8, cursor: 'pointer',
                                        background: selectedLinkId === link.id ? 'var(--primary-light)' : 'transparent'
                                    }}>
                                        <input
                                            type="radio"
                                            name="provider"
                                            checked={selectedLinkId === link.id}
                                            onChange={() => setSelectedLinkId(link.id)}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{link.provider.businessName}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{link.provider.serviceType}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="input-group" style={{ marginTop: 20 }}>
                            <label className="input-label">Очиж авах хаяг (Агуулах / Дэлгүүр)</label>
                            <input
                                className="input"
                                value={pickupAddress}
                                onChange={e => setPickupAddress(e.target.value)}
                                placeholder="Танай хаяг"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Холбогдох утас</label>
                            <input
                                className="input"
                                value={pickupPhone}
                                onChange={e => setPickupPhone(e.target.value)}
                                placeholder="Утасны дугаар"
                                required
                            />
                        </div>

                        <div className="modal-actions" style={{ marginTop: 32 }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Цуцлах</button>
                            <button type="submit" className="btn btn-primary gradient-btn" disabled={submitting || !selectedLinkId}>
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} style={{ marginRight: 8 }} /> Илгээх</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
