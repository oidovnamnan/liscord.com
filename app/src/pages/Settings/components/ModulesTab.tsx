import { useState } from 'react';
import { useBusinessStore } from '../../../store';
import { businessService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { Layers, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import * as Icons from 'lucide-react';
import { LISCORD_MODULES } from '../../../config/modules';

export function ModulesTab() {
    const { business, setBusiness } = useBusinessStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Installation states
    const [installingId, setInstallingId] = useState<string | null>(null);
    const [installProgress, setInstallProgress] = useState(0);

    const activeMods = business?.activeModules || [];

    const handleInstallModule = async (moduleId: string) => {
        if (!business || loading || installingId) return;

        // Start simulated installation
        setInstallingId(moduleId);
        setInstallProgress(0);

        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 150));
            setInstallProgress(Math.min(i + Math.random() * 15, 95));
        }

        try {
            const newModules = [...activeMods, moduleId];
            await businessService.updateBusiness(business.id, { activeModules: newModules });
            setBusiness({ ...business, activeModules: newModules });

            setInstallProgress(100);
            await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause at 100%
            toast.success('Амжилттай суулгалаа');
        } catch (error) {
            toast.error('Суулгах үед алдаа гарлаа');
        } finally {
            setInstallingId(null);
            setInstallProgress(0);
        }
    };

    const handleUninstallModule = async (moduleId: string) => {
        if (!business || loading || installingId) return;

        if (!confirm('Энэ модулийг устгахдаа итгэлтэй байна уу?')) return;

        setLoading(true);
        try {
            const newModules = activeMods.filter(m => m !== moduleId);
            await businessService.updateBusiness(business.id, { activeModules: newModules });
            setBusiness({ ...business, activeModules: newModules });
            toast.success('Модулийг устгалаа');
        } catch (error) {
            toast.error('Устгах үед алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-section animate-fade-in">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={24} color="var(--primary)" />
                Liscord App Store
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Та өөрийн бизнестээ хэрэгцээт апп-уудыг эндээс суулгах тохируулах боломжтой. Суулгасан апп-ууд зүүн талын үндсэн цэсэнд харагдах болно.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {LISCORD_MODULES.filter(mod => !mod.isCore).map(mod => {
                    const Icon = (Icons as any)[mod.icon] || Icons.Box;
                    const isInstalled = activeMods.includes(mod.id);
                    const isInstalling = installingId === mod.id;

                    return (
                        <div
                            key={mod.id}
                            style={{
                                border: `1px solid ${isInstalled ? 'var(--primary)' : 'var(--border-primary)'}`,
                                borderRadius: '16px',
                                padding: '20px',
                                background: isInstalled ? 'rgba(74, 107, 255, 0.03)' : 'var(--surface-1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isInstalled ? '0 4px 20px rgba(74, 107, 255, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                                transform: isInstalling ? 'scale(0.98)' : 'scale(1)',
                            }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: isInstalled ? 'var(--gradient-primary)' : 'var(--surface-2)',
                                color: isInstalled ? 'white' : 'var(--text-secondary)',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: isInstalled ? '0 4px 12px rgba(74, 107, 255, 0.3)' : 'none'
                            }}>
                                <Icon size={28} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {mod.name}
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {mod.description}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
                                {isInstalling ? (
                                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ position: 'relative', width: '36px', height: '36px' }}>
                                            <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                                                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border-primary)" strokeWidth="3" />
                                                <circle
                                                    cx="18" cy="18" r="16"
                                                    fill="none"
                                                    stroke="var(--primary)"
                                                    strokeWidth="3"
                                                    strokeDasharray={`${2 * Math.PI * 16}`}
                                                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - installProgress / 100)}`}
                                                    style={{ transition: 'stroke-dashoffset 0.15s linear' }}
                                                />
                                            </svg>
                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--primary)' }}>{Math.round(installProgress)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : isInstalled ? (
                                    <>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            style={{ width: '100%', borderRadius: '20px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600 }}
                                            onClick={() => navigate(mod.route || `/dashboard/${mod.id}`)}
                                        >
                                            Нээх
                                        </button>
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }}
                                            onClick={() => handleUninstallModule(mod.id)}
                                        >
                                            <Trash2 size={12} /> Uninstall
                                        </div>
                                    </>
                                ) : (
                                    <button
                                        className="btn btn-outline btn-sm"
                                        style={{ width: '100%', borderRadius: '20px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', borderColor: 'var(--primary)', background: 'rgba(74, 107, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onClick={() => handleInstallModule(mod.id)}
                                    >
                                        <Download size={14} style={{ marginRight: 6 }} /> Суулгах
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
