import { Header } from '../../components/layout/Header';
import { Settings, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { LISCORD_MODULES } from '../../config/modules';

interface ShellPageProps {
    title: string;
    moduleId?: string;
}

export function ShellPage({ title, moduleId }: ShellPageProps) {
    const module = moduleId ? LISCORD_MODULES.find(m => m.id === moduleId) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ModuleIcon = module?.icon ? (Icons as any)[module.icon] || Settings : Settings;

    return (
        <>
            <Header title={title} />
            <div className="page animate-fade-in">
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '55vh', textAlign: 'center', padding: '40px 20px'
                }}>
                    {/* Icon */}
                    <div style={{
                        width: 80, height: 80, borderRadius: 20,
                        background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.15), rgba(var(--primary-rgb), 0.05))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 24, border: '1px solid rgba(var(--primary-rgb), 0.2)'
                    }}>
                        <ModuleIcon size={36} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                    </div>

                    {/* Title */}
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                        {title}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 420, marginBottom: 32, lineHeight: 1.6 }}>
                        {module?.description || 'Энэ модулийг тохиргооноос идэвхжүүлж, холболтын мэдээллээ оруулснаар ашиглах боломжтой.'}
                    </p>

                    {/* Feature list */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 380,
                        background: 'var(--bg-hover)', borderRadius: 16, padding: '20px 24px',
                        border: '1px solid var(--border-color)', marginBottom: 24, textAlign: 'left'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
                            <CheckCircle2 size={16} color="var(--primary)" />
                            <span>AppStore-оос идэвхжүүлсэн</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
                            <Zap size={16} color="#f7b731" />
                            <span>Тохиргоо шаардлагатай</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <Settings size={16} />
                            <span>Тохиргоо хэсгээс удирдана</span>
                        </div>
                    </div>

                    {/* Action */}
                    <a href="/app/settings" className="btn btn-primary" style={{ gap: 8 }}>
                        <Settings size={16} /> Тохиргоо руу очих <ArrowRight size={14} />
                    </a>
                </div>
            </div>
        </>
    );
}
