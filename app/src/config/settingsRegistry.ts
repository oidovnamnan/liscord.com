import { lazy } from 'react';

export const SettingsRegistry: Record<string, React.LazyExoticComponent<any>> = {
    'statuses': lazy(() => import('../pages/Settings/components/StatusesTab').then(m => ({ default: m.StatusesTab }))),
    'cargo': lazy(() => import('../pages/Settings/components/CargoSettings').then(m => ({ default: m.CargoSettings }))),
    'sources': lazy(() => import('../pages/Settings/components/SourceSettings').then(m => ({ default: m.SourceSettings }))),
    'b2b': lazy(() => import('../pages/Settings/components/B2BTab').then(m => ({ default: m.B2BTab }))),
    'team': lazy(() => import('../pages/Settings/components/TeamSettings').then(m => ({ default: m.TeamSettings }))),
    'general': lazy(() => import('../pages/Common/ShellPage').then(m => ({ default: m.ShellPage }))),
    'notifications': lazy(() => import('../pages/Common/ShellPage').then(m => ({ default: m.ShellPage }))),
    'ai-agent': lazy(() => import('../pages/Common/ShellPage').then(m => ({ default: m.ShellPage }))),
};
