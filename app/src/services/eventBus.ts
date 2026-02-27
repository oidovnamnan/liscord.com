type EventCallback = (data: any) => void;

class EventBus {
    private events: Map<string, EventCallback[]> = new Map();

    on(event: string, callback: EventCallback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)?.push(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    off(event: string, callback: EventCallback) {
        const callbacks = this.events.get(event);
        if (callbacks) {
            this.events.set(event, callbacks.filter(cb => cb !== callback));
        }
    }

    emit(event: string, data?: any) {
        const callbacks = this.events.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

export const eventBus = new EventBus();

// ====== GLOBAL EVENT TYPES ======
export const EVENTS = {
    // ORDER EVENTS
    ORDER_CREATED: 'order:created',
    ORDER_UPDATED: 'order:updated',
    ORDER_STATUS_CHANGED: 'order:status_changed',

    // PRODUCT EVENTS
    PRODUCT_CREATED: 'product:created',
    PRODUCT_UPDATED: 'product:updated',
    LOW_STOCK: 'inventory:low_stock',

    // BUSINESS EVENTS
    BUSINESS_UPDATED: 'business:updated',
    MODULE_INSTALLED: 'module:installed',
    MODULE_UNINSTALLED: 'module:uninstalled',

    // UI EVENTS
    SIDEBAR_TOGGLE: 'ui:sidebar_toggle',
    THEME_CHANGED: 'ui:theme_changed',
    OPEN_GLOBAL_SEARCH: 'ui:open_search'
};
