import { lazy } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SettingsRegistry: Record<string, React.LazyExoticComponent<any>> = {
    'statuses': lazy(() => import('../pages/Settings/components/StatusesTab').then(m => ({ default: m.StatusesTab }))),
    'sources': lazy(() => import('../pages/Settings/components/SourceSettings').then(m => ({ default: m.SourceSettings }))),
    'b2b': lazy(() => import('../pages/Settings/components/B2BTab').then(m => ({ default: m.B2BTab }))),
    'inventory': lazy(() => import('../pages/Settings/components/InventorySettings').then(m => ({ default: m.InventorySettings }))),
    'loyalty': lazy(() => import('../pages/Settings/components/LoyaltySettings').then(m => ({ default: m.LoyaltySettings }))),
    'finance': lazy(() => import('../pages/Settings/components/FinanceSettings').then(m => ({ default: m.FinanceSettings }))),
    'leads': lazy(() => import('../pages/Settings/components/CRMSettings').then(m => ({ default: m.CRMSettings }))),
    'general': lazy(() => import('../pages/Common/ShellPage').then(m => ({ default: m.ShellPage }))),
    'notifications': lazy(() => import('../pages/Common/ShellPage').then(m => ({ default: m.ShellPage }))),
    'ai-agent': lazy(() => import('../pages/Common/ShellPage').then(m => ({ default: m.ShellPage }))),
    'sms-income-sync': lazy(() => import('../pages/Settings/components/SmsBridgeSettings').then(m => ({ default: m.SmsBridgeSettings }))),
    'sms-templates': lazy(() => import('../pages/Settings/components/SmsTemplateSettings').then(m => ({ default: m.SmsTemplateSettings }))),
    'cargo_fee': lazy(() => import('../pages/Settings/components/CargoSettings').then(m => ({ default: m.CargoSettings }))),
    'sourcing': lazy(() => import('../pages/Settings/components/SourcingSettings').then(m => ({ default: m.SourcingSettings }))),
    'returns': lazy(() => import('../pages/Settings/components/ReturnsSettings').then(m => ({ default: m.ReturnsSettings }))),
    'stock-inquiry': lazy(() => import('../pages/Settings/components/StockInquirySettings').then(m => ({ default: m.StockInquirySettings }))),

};
