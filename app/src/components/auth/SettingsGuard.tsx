import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBusinessStore, useAuthStore } from '../../store';

/**
 * SettingsGuard — allows owner OR employees with settings.* permission.
 * Others are redirected to Dashboard.
 */
export const SettingsGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { business, employee, isImpersonating } = useBusinessStore();
    const { user } = useAuthStore();
    const location = useLocation();

    if (!business || !user) return null;

    const isOwner = !isImpersonating && (user.uid === business.ownerId || employee?.role === 'owner');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const empPerms: string[] = (employee as any)?.permissions || [];
    const hasSettingsAccess = isOwner || empPerms.some(p => p.startsWith('settings.'));

    if (!hasSettingsAccess) {
        return <Navigate to="/app" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
