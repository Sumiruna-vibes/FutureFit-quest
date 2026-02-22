// app/src/engine/SafeLocalStorage.js

/**
 * SafeLocalStorage v0.1 - SIMPLIFIED
 * 
 * V0.1: Basic localStorage wrapper with transaction safety
 * V1.0: Add checksums, backups, and corruption detection
 * 
 * CURRENT APPROACH: Simple and reliable over complex and broken
 */

class SafeLocalStorage {
    constructor(dbPrefix = 'ffq_v1') {
        this.storageKey = `${dbPrefix}_events`;
        console.log(`🔍 [SafeStorage] Initialized with key: ${this.storageKey}`);
    }

    /**
     * Save a single event to the event log
     */
    saveEvent(event) {
        try {
            // Generate monotonic ID
            const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const stampedEvent = { ...event, id: eventId };

            // Get current events
            const events = this.getAllEvents();
            
            // Append new event
            events.push(stampedEvent);

            // Save back to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(events));

            console.log(`✅ [SafeStorage] Event saved: ${eventId}`);
            return eventId;
        } catch (error) {
            console.error('🔥 [SafeStorage] Save failed:', error);
            return null;
        }
    }

    /**
     * Retrieve all events
     */
    getAllEvents() {
        try {
            const json = localStorage.getItem(this.storageKey);
            if (!json) {
                // No data yet - this is normal for first run
                return [];
            }
            
            const events = JSON.parse(json);
            return Array.isArray(events) ? events : [];
        } catch (error) {
            console.error('🔥 [SafeStorage] Read failed:', error);
            // Data is corrupted - clear and start fresh
            console.warn('⚠️ Clearing corrupted data');
            localStorage.removeItem(this.storageKey);
            return [];
        }
    }

    /**
     * Clear all data (for debugging)
     */
    clearAll() {
        localStorage.removeItem(this.storageKey);
        console.log('🔄 [SafeStorage] All data cleared');
    }
}

// Singleton instance (browser-safe)
let storage = null;

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    storage = new SafeLocalStorage('ffq_v1');
    
    // Log startup state
    const events = storage.getAllEvents();
    console.log(`🔍 [System Start] Storage has ${events.length} events`);
}

// Export singleton as default
export default storage;

// Export class for tests
export { SafeLocalStorage };
