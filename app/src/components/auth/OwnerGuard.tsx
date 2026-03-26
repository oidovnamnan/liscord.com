import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBusinessStore, useAuthStore } from '../../store';

/**
 * OwnerGuard — redirects non-owner employees to Dashboard.
 * Used for App Store and other owner-only pages.
 */
export const OwnerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { business, employee, isImpersonating } = useBusinessStore();
    const { user } = useAuthStore();
    const location = useLocation();

    if (!business || !user) return null;

    const isOwner = !isImpersonating && (user.uid === business.ownerId || employee?.role === 'owner');

    if (!isOwner) {
        return <Navigate to="/app" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
