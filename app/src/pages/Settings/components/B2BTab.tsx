import { useState, useEffect } from 'react';
import { useBusinessStore } from '../../../store';
import { b2bService } from '../../../services/b2bService';
import { Network, Save, Loader2, Globe, Truck, Printer, Store } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { B2BServiceType, ServiceProfile } from '../../../types';

export function B2BTab() {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(false);

    // Form state
    const [isProvider, setIsProvider] = useState(business?.serviceProfile?.isProvider || false);
    const [isPublicListed, setIsPublicListed] = useState(business?.serviceProfile?.isPublicListed || false);

    const [activeTypes, setActiveTypes] = useState<Record<B2BServiceType, boolean>>({
        cargo: false,
        delivery: false,
        wholesale: false,
        printing: false,
        generic: false,
    });

    const [prices, setPrices] = useState<Record<B2BServiceType, number>>({
        cargo: 5000,
        delivery: 5000,
        wholesale: 0,
        printing: 0,
        generic: 0,
    });

    useEffect(() => {
        if (business?.serviceProfile) {
            setIsProvider(business.serviceProfile.isProvider);
            setIsPublicListed(business.serviceProfile.isPublicListed);

            const newTypes = { ...activeTypes };
            const newPrices = { ...prices };

            business.serviceProfile.services.forEach((svc: any) => {
                newTypes[svc.type as B2BServiceType] = svc.isActive;
                newPrices[svc.type as B2BServiceType] = svc.pricing.basePrice;
            });

            setActiveTypes(newTypes);
            setPrices(newPrices);
        }
    }, [business?.serviceProfile]);

    const handleSave = async () => {
        if (!business) return;
        setLoading(true);
        try {
            const services: ServiceProfile['services'] = [];

            Object.entries(activeTypes).forEach(([type, isActive]) => {
                if (isActive) {
                    services.push({
                        id: `svc_${type}_${Date.now()}`,
                        type: type as B2BServiceType,
                        name: getServiceName(type as B2BServiceType),
                        description: `Liscord B2B ${getServiceName(type as B2BServiceType)}`,
                        isActive: true,
                        terms: {
                            coverageAreas: ['Улаанбаатар'],
                        },
                        pricing: {
                            type: type === 'cargo' ? 'weight_based' : 'flat',
                            basePrice: prices[type as B2BServiceType] || 0,
                        }
                    });
                }
            });

            const newProfile: ServiceProfile = {
                isProvider,
                isPublicListed,
                services,
                rating: business.serviceProfile?.rating || { average: 5.0, count: 0 }
            };

            await b2bService.updateServiceProfile(business.id, newProfile);
            toast.success('B2B Профайл хадгалагдлаа');
        } catch (error) {
            console.error(error);
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const getServiceName = (type: B2BServiceType) => {
        switch (type) {
            case 'cargo': return 'Карго тээвэр';
            case 'delivery': return 'Хүргэлт';
            case 'wholesale': return 'Бөөний төв';
            case 'printing': return 'Хэвлэл';
            default: return 'Бусад үйлчилгээ';
        }
    };

    const SERVICE_OPTIONS: { type: B2BServiceType; label: string; icon: any; placeholder: string }[] = [
        { type: 'cargo', label: 'Карго (Олон улсын тээвэр)', icon: Globe, placeholder: '1 кг-ийн үнэ (₮)' },
        { type: 'delivery', label: 'Хүргэлт (Орон нутаг, хот дотор)', icon: Truck, placeholder: 'Хүргэлтийн суурь үнэ (₮)' },
        { type: 'wholesale', label: 'Бөөний нийлүүлэлт', icon: Store, placeholder: 'Хамгийн бага үнийн дүн (₮)' },
        { type: 'printing', label: 'Хэвлэх үйлдвэр', icon: Printer, placeholder: 'Суурь үнэ (₮)' },
    ];

    return (
        <div className="settings-section animate-fade-in">
            <h2>B2B Платформ (Экосистем)</h2>
            <p className="text-muted" style={{ marginBottom: 20 }}>
                Liscord-ийн бусад бизнесүүдэд (онлайн дэлгүүр, ресторан) өөрийн үйлчилгээгээ санал болгох.
            </p>

            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon"><Network size={20} /></div>
                    <h3>Үйлчилгээ үзүүлэгч (B2B Provider)</h3>
                </div>

                <div className="settings-form">
                    <div className="setting-toggle-row" style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '16px' }}>
                        <div>
                            <h4>B2B Үйлчилгээ үзүүлэгч болох</h4>
                            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Энэ тохиргоог асааснаар та бусад дэлгүүрүүдээс шууд захиалга, ачаа хүлээж авах боломжтой болно.</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={isProvider} onChange={(e) => setIsProvider(e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {isProvider && (
                        <div className="setting-toggle-row" style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '24px' }}>
                            <div>
                                <h4>Нийтэд нээлттэй харуулах</h4>
                                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Liscord-ийн бүх хэрэглэгчид танай үйлчилгээг хайж олох боломжтой болно (Service Marketplace).</p>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={isPublicListed} onChange={(e) => setIsPublicListed(e.target.checked)} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    )}

                    {isProvider && (
                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ marginBottom: '16px' }}>Санал болгох үйлчилгээнүүд:</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {SERVICE_OPTIONS.map((opt) => {
                                    const Icon = opt.icon;
                                    const isActive = activeTypes[opt.type];

                                    return (
                                        <div key={opt.type} style={{
                                            padding: '16px',
                                            border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            transition: 'all 0.2s',
                                            background: isActive ? 'var(--primary-light)' : 'transparent'
                                        }}>
                                            <input
                                                type="checkbox"
                                                id={`svc-${opt.type}`}
                                                checked={isActive}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                onChange={(e) => setActiveTypes(prev => ({ ...prev, [opt.type]: e.target.checked }))}
                                            />
                                            <label htmlFor={`svc-${opt.type}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer', margin: 0, fontWeight: 500 }}>
                                                <div style={{
                                                    width: '40px', height: '40px',
                                                    borderRadius: '8px',
                                                    background: isActive ? 'var(--primary)' : 'var(--bg-secondary)',
                                                    color: isActive ? 'white' : 'var(--text-muted)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Icon size={20} />
                                                </div>
                                                {opt.label}
                                            </label>

                                            {isActive && (
                                                <div style={{ width: '200px' }}>
                                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                                        <input
                                                            type="number"
                                                            className="input"
                                                            placeholder={opt.placeholder}
                                                            value={prices[opt.type] || ''}
                                                            onChange={(e) => setPrices(prev => ({ ...prev, [opt.type]: Number(e.target.value) }))}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                        <button className="btn btn-primary gradient-btn" onClick={handleSave} disabled={loading} style={{ minWidth: 140 }}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={18} style={{ marginRight: 8 }} /> Хадгалах</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
