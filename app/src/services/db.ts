/**
 * db.ts — Re-export barrel file
 * 
 * All services have been split into individual modules for better maintainability.
 * This file re-exports everything so existing imports remain unchanged.
 * 
 * Module breakdown:
 *   helpers.ts        — convertTimestamps utility
 *   userService.ts    — userService
 *   businessService.ts — systemSettingsService, businessService, moduleSettingsService, businessRequestService
 *   orderService.ts   — orderService, orderStatusService, DEFAULT_STATUSES
 *   productService.ts — customerService, productService, stockMovementService, procurementService, categoryService, cargoService
 *   crmService.ts     — leadService, campaignService, loyaltyService, quoteService
 *   financeService.ts — invoiceService, expenseService, bankService, pettyCashService, dashboardService
 *   teamService.ts    — chatService, teamService, sourceService
 *   venueService.ts   — shelfService, packageService, serviceCatalogService, appointmentService, projectService, taskService, roomService, bookingService
 *   logisticsService.ts — vehicleService, tripService, deliveryService, fleetService, maintenanceService, importCostService, eventService, ticketService
 *   adminService.ts   — pawnItemService, loanService, serviceQueueService, attendanceService, payrollService, businessCategoryService, platformFinanceService, globalSettingsService, warehouseService
 */

// Helpers
export { convertTimestamps } from './helpers';

// User
export { userService } from './userService';

// Business & System
export { systemSettingsService, businessService, moduleSettingsService, businessRequestService } from './businessService';

// Orders
export { orderService, orderStatusService, DEFAULT_STATUSES } from './orderService';

// Products & Inventory
export { customerService, productService, stockMovementService, procurementService, categoryService, cargoService } from './productService';

// CRM & Marketing
export { leadService, campaignService, loyaltyService, quoteService } from './crmService';

// Finance & Dashboard
export { invoiceService, expenseService, bankService, pettyCashService, dashboardService } from './financeService';

// Team & Communication
export { chatService, teamService, sourceService } from './teamService';

// Venues & Operations
export { shelfService, packageService, serviceCatalogService, appointmentService, projectService, taskService, roomService, bookingService } from './venueService';

// Logistics & Fleet
export { vehicleService, tripService, deliveryService, fleetService, maintenanceService, importCostService, eventService, ticketService } from './logisticsService';

// Admin, HR & Platform
export { pawnItemService, loanService, serviceQueueService, attendanceService, payrollService, businessCategoryService, platformFinanceService, globalSettingsService, warehouseService } from './adminService';
export type { GlobalSettings } from './adminService';
