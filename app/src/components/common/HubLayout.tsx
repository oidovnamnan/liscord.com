import { NavLink, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { LISCORD_MODULES } from '../../config/modules';
import './HubLayout.css';

interface HubLayoutProps {
    hubId: string;
    children: React.ReactNode;
}

export function HubLayout({ hubId, children }: HubLayoutProps) {
    const location = useLocation();

    // Find all modules belonging to this hub
    const hubModules = LISCORD_MODULES.filter(m => m.hubId === hubId);

    if (hubModules.length <= 1) {
        return <>{children}</>;
    }

    return (
        <div className="hub-container">
            <div className="hub-tabs-wrapper">
                <nav className="hub-tabs">
                    {hubModules.map(mod => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const Icon = (Icons as any)[mod.icon] || Icons.Circle;
                        const isActive = location.pathname === mod.route;

                        return (
                            <NavLink
                                key={mod.id}
                                to={mod.route}
                                className={({ isActive }) => `hub-tab ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={16} />
                                <span>{mod.name}</span>
                                {isActive && <div className="hub-tab-indicator" />}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
            <div className="hub-content">
                {children}
            </div>
        </div>
    );
}
