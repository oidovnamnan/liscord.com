import { useState } from 'react';
import { useBusinessStore } from '../../../store';
import { businessService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { Layers, Package, Users, Truck, ShoppingCart, Landmark, Clock, DollarSign, ScanLine, Sofa, PieChart, HeadphonesIcon, Building, MessageSquare, Factory, Calendar } from 'lucide-react';

export const ALL_MODULES = [
    { id: 'orders', label: 'Борлуулалт / POS', desc: 'Дэлгүүр, кассын борлуулалт', icon: ShoppingCart },
    { id: 'products', label: 'Бараа бүртгэл', desc: 'Агуулах болон барааны үлдэгдэл', icon: Package },
    { id: 'customers', label: 'Харилцагч', desc: 'Үйлчлүүлэгчдийн түүх, өр', icon: Users },
    { id: 'delivery', label: 'Хүргэлт', desc: 'Хүргэлтийн жолооч, статус', icon: Truck },
    { id: 'packages', label: 'Карго (AI)', desc: 'Хил дамнасан ачаа тээвэр', icon: ScanLine },
    { id: 'inventory', label: 'Олон агуулах', desc: 'Агуулах хооронд шилжүүлэх', icon: Package }, // Reusing Package since Warehouse might conflict inside map
    { id: 'loans', label: 'Зээл / Ломбард', desc: 'Хүүний бодолт, барьцаа', icon: Landmark },
    { id: 'queue', label: 'Дараалал', icon: Layers, desc: 'Угаалга, салон, үйлчилгээний самбар' },
    { id: 'attendance', label: 'Цаг бүртгэл', icon: Clock, desc: 'Ажилчдын ирсэн/гарсан цаг' },
    { id: 'payroll', label: 'Цалин', icon: DollarSign, desc: 'Цэвэр цалин, суутгал тооцох' },
    { id: 'rooms', label: 'Өрөө / Буудал', icon: Sofa, desc: 'Амралтын газар, зочид буудал' }, // Used Sofa
    { id: 'vehicles', label: 'Түрээс', icon: Truck, desc: 'Машин болон тоног төхөөрөмж' },
    { id: 'tickets', label: 'Тасалбар', icon: ScanLine, desc: 'Эвэнт зохион байгуулах' },

    // Phase 40: Expansion Modules
    { id: 'finance', label: 'Санхүү & Татвар', icon: PieChart, desc: 'Орлого, зарлага, авлага өглөг' },
    { id: 'support', label: 'Гомдол / Буцаалт', icon: HeadphonesIcon, desc: 'Баталгаат засвар, хэрэглэгчийн санал' },
    { id: 'b2b', label: 'B2B Портал', icon: Building, desc: 'Бөөний харилцагчийн систем' },
    { id: 'chat', label: 'Дотоод Чат', icon: MessageSquare, desc: 'Багийн гишүүд болон салбар хооронд' },
    { id: 'manufacturing', label: 'Үйлдвэрлэл', icon: Factory, desc: 'Үе шаттай үйлдвэрлэлийн удирдлага' },
    { id: 'appointments', label: 'Цаг захиалга', icon: Calendar, desc: 'Урьдчилан цаг авах, уулзалт' },
];

export function ModulesTab() {
    const { business, setBusiness } = useBusinessStore();
    const [loading, setLoading] = useState(false);

    // If business doesn't have activeModules array initialized yet, fallback to an empty array
    // Our Sidebar backwards compatibility shows core features until we explicitly enable them here.
    const activeMods = business?.activeModules || [];

    const handleToggleModule = async (moduleId: string) => {
        if (!business) return;
        setLoading(true);
        try {
            const isEnabled = activeMods.includes(moduleId);
            const newModules = isEnabled
                ? activeMods.filter(m => m !== moduleId)
                : [...activeMods, moduleId];

            await businessService.updateBusiness(business.id, { activeModules: newModules });

            // Local store update for immediate UI react
            setBusiness({ ...business, activeModules: newModules });
            toast.success(isEnabled ? 'Модулийг унтраалаа' : 'Модулийг амжилттай идэвхжүүллээ');
        } catch (error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-section animate-fade-in">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={24} color="var(--primary)" />
                Модуль / App Store
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Та өөрийн бизнесийн онцлогт тохирсон хэрэгслүүдээ (Modules) эндээс сонгон идэвхжүүлж удирдах боломжтой. Идэвхжүүлсэн модулиуд зүүн талын үндсэн цэсэнд харагдах болно.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {ALL_MODULES.map(mod => {
                    const Icon = mod.icon;
                    const isEnabled = activeMods.includes(mod.id);
                    return (
                        <div
                            key={mod.id}
                            style={{
                                border: `1px solid ${isEnabled ? 'var(--primary)' : 'var(--border-primary)'}`,
                                borderRadius: 'var(--radius-lg)',
                                padding: '16px',
                                background: isEnabled ? 'rgba(74, 107, 255, 0.05)' : 'var(--surface-1)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{
                                    background: isEnabled ? 'var(--primary)' : 'var(--surface-2)',
                                    color: isEnabled ? 'white' : 'var(--text-secondary)',
                                    padding: '10px',
                                    borderRadius: '12px'
                                }}>
                                    <Icon size={20} />
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={() => handleToggleModule(mod.id)}
                                        disabled={loading}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{mod.label}</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{mod.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
