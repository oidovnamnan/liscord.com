import { useState, useEffect } from 'react';
import { Loader2, Wallet, ShieldAlert, Award, Tags, Coins, Percent } from 'lucide-react';
import { useBusinessStore } from '../../../store';
import { businessService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import type { WalletConfig } from '../../../types';

export function WalletSettingsPanel() {
    const { business, setBusiness } = useBusinessStore();
    const [loading, setLoading] = useState(false);
    
    // Default wallet config if none exists
    const [config, setConfig] = useState<WalletConfig>({
        enabled: false,
        currencyName: 'Оноо',
        exchangeRate: 1,
        globalMaxLimitPct: 50,
        defaultCategoryLimitPct: 50,
        categoryLimits: [],
        usageLimitMode: 'fixed',
        fixedLimitPct: 30,
        randomLimitRange: { minPct: 10, maxPct: 50 },
        tierLimits: [],
        rewardEvents: {
            signupBonus: 0,
            referralBonus: 0,
            firstOrderBonus: 0,
            orderCashbackPct: 0,
            socialShareBonus: 0,
            communityPostBonus: 0
        }
    });

    useEffect(() => {
        if (business?.settings?.wallet) {
            setConfig({
                ...config,
                ...business.settings.wallet,
                rewardEvents: {
                    ...config.rewardEvents,
                    ...business.settings.wallet.rewardEvents
                }
            });
        }
    }, [business?.settings?.wallet]);

    const handleSave = async () => {
        if (!business) return;
        setLoading(true);
        try {
            const newSettings = {
                ...business.settings,
                wallet: config
            };
            await businessService.updateBusiness(business.id, { settings: newSettings });
            setBusiness({ ...business, settings: newSettings });
            toast.success('Хэтэвчийн тохиргоо хадгалагдлаа');
        } catch (error) {
            console.error('Error saving wallet settings:', error);
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const updateReward = (key: keyof NonNullable<WalletConfig['rewardEvents']>, val: number) => {
        setConfig(prev => ({
            ...prev,
            rewardEvents: {
                ...prev.rewardEvents!,
                [key]: val
            }
        }));
    };

    return (
        <div className="settings-section animate-fade-in">
            <h2>Харилцагчийн Хэтэвч & Урамшуулал</h2>
            
            <div className="settings-card mb-6">
                <div className="modern-toggle-item">
                    <div className="toggle-info">
                        <h4>Хэтэвчийн системийг идэвхжүүлэх</h4>
                        <p>Хэрэглэгчид оноо цуглуулах, хэтэвчээсээ төлбөр төлөх боломжийг нээнэ.</p>
                    </div>
                    <label className="toggle">
                        <input 
                            type="checkbox" 
                            checked={config.enabled} 
                            onChange={e => setConfig({...config, enabled: e.target.checked})} 
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>

            {config.enabled && (
                <>
                    <div className="settings-card mb-6">
                        <div className="card-header border-b pb-4 mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-gray-500" />
                            <h3 className="text-lg font-medium">Ерөнхий тохиргоо</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="form-group">
                                <label>Зоосны нэршил (Жнь: Оноо, Кредит)</label>
                                <input 
                                    type="text" 
                                    className="modern-input"
                                    value={config.currencyName}
                                    onChange={e => setConfig({...config, currencyName: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>
                                    <ShieldAlert className="w-4 h-4 inline mr-1 text-red-500" />
                                    Давхар хамгаалалт (Дээд хязгаар %)
                                </label>
                                <input 
                                    type="number" 
                                    min="0" max="100"
                                    className="modern-input"
                                    value={config.globalMaxLimitPct}
                                    onChange={e => setConfig({...config, globalMaxLimitPct: Number(e.target.value)})}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Нэг удаагийн худалдан авалтын дээд тал нь хэдэн хувийг хэтэвчнээс төлөхийг зөвшөөрөх вэ?
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="settings-card mb-6">
                        <div className="card-header border-b pb-4 mb-4 flex items-center gap-2">
                            <Percent className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-medium">Хөнгөлөлт бодох аргачлал</h3>
                        </div>
                        
                        <div className="form-group mb-6">
                            <label>Тооцооллын төрөл</label>
                            <select 
                                className="modern-select"
                                value={config.usageLimitMode}
                                onChange={e => setConfig({...config, usageLimitMode: e.target.value as WalletConfig['usageLimitMode']})}
                            >
                                <option value="fixed">Тогтмол хувиар хөнгөлөх</option>
                                <option value="random">Санамсаргүй (Азтан) хувилбар</option>
                                <option value="tier_based">Хэрэглэгчийн зэрэглэлээр</option>
                            </select>
                        </div>

                        {config.usageLimitMode === 'fixed' && (
                            <div className="form-group">
                                <label>Тогтмол хөнгөлөх хувь (%)</label>
                                <input 
                                    type="number" 
                                    className="modern-input"
                                    value={config.fixedLimitPct}
                                    onChange={e => setConfig({...config, fixedLimitPct: Number(e.target.value)})}
                                />
                            </div>
                        )}

                        {config.usageLimitMode === 'random' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label>Хамгийн бага сугалах хувь (%)</label>
                                    <input 
                                        type="number" 
                                        className="modern-input"
                                        value={config.randomLimitRange?.minPct}
                                        onChange={e => setConfig({...config, randomLimitRange: { ...config.randomLimitRange!, minPct: Number(e.target.value) }})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Хамгийн их сугалах хувь (%)</label>
                                    <input 
                                        type="number" 
                                        className="modern-input"
                                        value={config.randomLimitRange?.maxPct}
                                        onChange={e => setConfig({...config, randomLimitRange: { ...config.randomLimitRange!, maxPct: Number(e.target.value) }})}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-4 pt-4 border-t">
                            <div className="form-group">
                                <label>
                                    <Tags className="w-4 h-4 inline mr-1" />
                                    Ангиллын үндсэн хязгаар (%)
                                </label>
                                <input 
                                    type="number" 
                                    className="modern-input"
                                    value={config.defaultCategoryLimitPct}
                                    onChange={e => setConfig({...config, defaultCategoryLimitPct: Number(e.target.value)})}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Тусгайлж хувь заагаагүй бараанууд нийт дүнгийнн хамгийн ихдээ хэдэн хувиар хэтэвчнээс суутгагдахыг заана.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="settings-card mb-6">
                        <div className="card-header border-b pb-4 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" />
                            <h3 className="text-lg font-medium">Урамшуулал өгөх (Action Rewards)</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="form-group">
                                <label>Шинэ бүртгэлийн урамшуулал (Тоо)</label>
                                <input 
                                    type="number" 
                                    className="modern-input"
                                    value={config.rewardEvents?.signupBonus ?? 0}
                                    onChange={e => updateReward('signupBonus', Number(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Найзаа урих урамшуулал</label>
                                <input 
                                    type="number" 
                                    className="modern-input"
                                    value={config.rewardEvents?.referralBonus ?? 0}
                                    onChange={e => updateReward('referralBonus', Number(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Худалдан авалтын буцаан олголт (Кэшбэк %)</label>
                                <input 
                                    type="number" 
                                    className="modern-input"
                                    value={config.rewardEvents?.orderCashbackPct ?? 0}
                                    onChange={e => updateReward('orderCashbackPct', Number(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Community-д Пост оруулахад</label>
                                <input 
                                    type="number" 
                                    className="modern-input"
                                    value={config.rewardEvents?.communityPostBonus ?? 0}
                                    onChange={e => updateReward('communityPostBonus', Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <button 
                            className="btn-primary" 
                            onClick={handleSave} 
                            disabled={loading}
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Хадгалах
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
