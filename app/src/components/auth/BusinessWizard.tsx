import { useState } from 'react';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import { BUSINESS_CATEGORIES } from '../../types';
import type { BusinessCategory } from '../../types';
import { businessService } from '../../services/db';
import { useAuthStore } from '../../store';
import { toast } from 'react-hot-toast';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import './BusinessWizard.css';

export function BusinessWizard() {
    const { user } = useAuthStore();
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [category, setCategory] = useState<BusinessCategory | null>(null);

    const handleCreateBusiness = async () => {
        if (!name || !category || !user) return;

        setLoading(true);
        console.log('Starting business creation...', { name, category, userId: user.uid });
        try {
            console.log('Calling businessService.createBusiness...');
            const bizId = await businessService.createBusiness({
                name,
                category,
                country: 'MN',
                currency: 'MNT',
                phone: user.phone || '',
                email: user.email || '',
                address: '',
                logo: null,
                settings: {
                    orderPrefix: 'ORD',
                    orderCounter: 1,
                    pin: '1234',
                    timezone: 'Asia/Ulaanbaatar',
                    workDays: [1, 2, 3, 4, 5],
                    workHours: { start: '09:00', end: '18:00' },
                },
                features: {
                    tax: true, profitTracking: true, delivery: true, inventory: true,
                },
                stats: {
                    totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalProducts: 0, totalEmployees: 1,
                },
                subscription: { plan: 'free', expiresAt: null },
            }, user.uid);

            console.log('Business created, ID:', bizId);
            console.log('Updating user record in Firestore...');

            // Update user in Firestore - Using setDoc with merge for robustness
            await setDoc(doc(db, 'users', user.uid), {
                activeBusiness: bizId,
                businessIds: arrayUnion(bizId)
            }, { merge: true });

            console.log('User record updated successfully');
            toast.success('Бизнес амжилттай үүслээ!');
            window.location.reload();
        } catch (error: any) {
            console.error('Error in handleCreateBusiness:', error);
            toast.error('Алдаа гарлаа: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="wizard-page">
            <div className="wizard-card animate-scale-in">
                {step === 1 ? (
                    <>
                        <div className="wizard-header">
                            <h1 className="wizard-title">Бизнесийн нэр</h1>
                            <p className="wizard-subtitle">Танай бизнесийг юу гэж нэрлэдэг вэ?</p>
                        </div>
                        <div className="wizard-body">
                            <input
                                className="input wizard-input"
                                placeholder="Жишээ: Эрээн Карго"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                            <button
                                className="btn btn-primary btn-full btn-lg"
                                disabled={!name.trim()}
                                onClick={() => setStep(2)}
                            >
                                Үргэлжлүүлэх <ArrowRight size={18} />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="wizard-header">
                            <h1 className="wizard-title">Бизнесийн ангилал</h1>
                            <p className="wizard-subtitle">Бизнесийнхээ төрлийг сонгоно уу</p>
                        </div>
                        <div className="wizard-grid">
                            {(Object.entries(BUSINESS_CATEGORIES) as [BusinessCategory, any][]).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    className={`wizard-category-card ${category === key ? 'active' : ''}`}
                                    onClick={() => setCategory(key)}
                                >
                                    <div className="wizard-category-icon">{cfg.icon}</div>
                                    <div className="wizard-category-name">{cfg.label}</div>
                                    {category === key && <div className="checked-badge"><Check size={12} /></div>}
                                </button>
                            ))}
                        </div>
                        <div className="wizard-footer">
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>Буцах</button>
                            <button
                                className="btn btn-primary"
                                disabled={!category || loading}
                                onClick={handleCreateBusiness}
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Бизнес үүсгэх'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
