import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBusinessStore } from '../../store';
import { LISCORD_MODULES } from '../../config/modules';

interface ModuleGuardProps {
    children: React.ReactNode;
    moduleId: string;
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({ children, moduleId }) => {
    const { business } = useBusinessStore();
    const location = useLocation();

    if (!business) return null;

    const isModuleActive = business.activeModules?.includes(moduleId);
    const isCore = LISCORD_MODULES.find(m => m.id === moduleId)?.isCore;

    if (!isModuleActive && !isCore) {
        console.warn(`Access denied to module: ${moduleId}. Redirecting to dashboard.`);
        return <Navigate to="/app" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
