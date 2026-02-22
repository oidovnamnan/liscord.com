import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGateProps {
    permission: string | string[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    permission,
    requireAll = false,
    fallback = null,
    children
}) => {
    const { hasPermission } = usePermissions();

    const permissions = Array.isArray(permission) ? permission : [permission];

    let hasAccess = false;
    if (requireAll) {
        hasAccess = permissions.every(p => hasPermission(p));
    } else {
        hasAccess = permissions.some(p => hasPermission(p));
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
