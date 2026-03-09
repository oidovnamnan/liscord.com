import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBusinessStore } from '../../store';
import { isModuleAccessible } from '../../utils/moduleUtils';
import { systemSettingsService } from '../../services/db';

interface ModuleGuardProps {
    children: React.ReactNode;
    moduleId: string;
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({ children, moduleId }) => {
    const { business } = useBusinessStore();
    const location = useLocation();
    const [moduleDefaults, setModuleDefaults] = useState<Record<string, Record<string, string>>>({});

    useEffect(() => {
        systemSettingsService.getModuleDefaults().then(setModuleDefaults).catch(console.error);
    }, []);

    if (!business) return null;

    const { accessible, reason } = isModuleAccessible(moduleId, business, moduleDefaults);

    if (!accessible) {
        if (reason === 'expired') {
            console.warn(`Module expired: ${moduleId}. Redirecting to App Store.`);
            return <Navigate to="/app/app-store" state={{ expired: moduleId, from: location }} replace />;
        }
        console.warn(`Access denied to module: ${moduleId} (${reason}). Redirecting to dashboard.`);
        return <Navigate to="/app" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
