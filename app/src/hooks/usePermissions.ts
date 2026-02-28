import { useBusinessStore, useAuthStore } from '../store';
import { ALL_PERMISSIONS } from '../types';

export function usePermissions() {
    const { business, employee } = useBusinessStore();
    const { user } = useAuthStore();

    // Owner has all permissions
    const isOwner = user?.uid === business?.ownerId || employee?.role === 'owner';

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        if (isOwner) return true;

        if (!employee || employee.status !== 'active') return false;

        // Check if permissions exists on employee or its position
        // In a real system, you might fetch permissions via positionId
        // For now, we assume permissions are flattened into the employee profile or checked via roles
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userPermissions = (employee as any).permissions || [];

        return userPermissions.includes(permission);
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
        return permissions.every(p => hasPermission(p));
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        return permissions.some(p => hasPermission(p));
    }

    return { hasPermission, hasAllPermissions, hasAnyPermission, isOwner, ALL_PERMISSIONS };
}
