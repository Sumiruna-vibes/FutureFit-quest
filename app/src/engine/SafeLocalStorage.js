// src/data/SafeLocalStorage.js

/**
 * 🎓 LESSON: DATA INTEGRITY LAYER
 * 
 * In a standard app, developers often write directly to localStorage.
 * This is dangerous! If the browser crashes mid-write, the data is lost.
 * 
 * This class implements the "Vault Pattern":
 * 1. Checksums: To detect if data was corrupted by a cosmic ray or bug.
 * 2. Transactions: To ensure we never overwrite good data with bad data.
 * 3. Backups: An automatic safety net.
 */

class SafeLocalStorage {
    constructor(dbPrefix = 'ffq_v1') {
        this.PREFIX = dbPrefix;
        this.checksums = new Map();
        this.lastProcessedId = null; // Cache for incremental updates
        
        // 🎓 We run a health check immediately on startup
        this._validateIntegrity();
    }

    /**
     * Incremental append with safety.
     * @param {Object} event - The user action to save
     */
    saveEvent(event) {
        // 1. Generate a "Monotonic" ID (Time + Random) ensures order
        const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const stampedEvent = { ...event, id: eventId };

        // 2. Get current data (The Batch)
        const batch = this._loadRawData();
        batch.push(stampedEvent);

        // 3. Calculate Checksum (The Fingerprint)
        const newChecksum = this._calculateChecksum(batch);

        // 4. 🎓 NEW: Create backup BEFORE overwriting
        this._createBackup();

        // 5. TRANSACTIONAL WRITE (The Safety Dance)
        try {
            // A. Write to a temporary slot first
            localStorage.setItem(`${this.PREFIX}_temp`, JSON.stringify(batch));

            // B. Write the checksum (The validation key)
            localStorage.setItem(`${this.PREFIX}_checksum`, newChecksum);

            // C. COMMIT: Write to the permanent slot
            localStorage.setItem(`${this.PREFIX}_events`, JSON.stringify(batch));

            // D. Cleanup (Optional, but clean)
            localStorage.removeItem(`${this.PREFIX}_temp`);

            // Update cache
            this.lastProcessedId = eventId;
            
            console.log(`✅ [SafeStorage] Event saved: ${eventId}`);
            return eventId;
        } catch (error) {
            console.error("🔥 CRITICAL: Write failed. Restoring...", error);
            // 🎓 NEW: Restore on failure
            this._restoreFromBackup();
            return null;
        }
    }

    /**
     * Retrieve all events.
     * Includes automatic corruption detection.
     */
    getAllEvents() {
        const rawData = this._loadRawData();
        const storedChecksum = localStorage.getItem(`${this.PREFIX}_checksum`);
        const calculatedChecksum = this._calculateChecksum(rawData);

        if (storedChecksum && storedChecksum !== calculatedChecksum) {
            console.error("🚨 DATA CORRUPTION DETECTED! Checksums do not match.");
            
            // ❌ OLD: return []; // Total data loss
            
            // ✅ NEW: Attempt restore
            const restored = this._restoreFromBackup();
            
            if (restored) {
                return this._loadRawData(); // Return backup data
            } else {
                throw new Error("CORRUPTION_NO_BACKUP: Critical failure");
            }
        }

        // Cache last processed ID for incremental updates
        if (rawData.length > 0) {
            this.lastProcessedId = rawData[rawData.length - 1].id;
        }

        return rawData;
    }

    // --- INTERNAL HELPERS (Private) ---

    /**
     * Incremental load: only replay new events since last processed ID
     * @param {string} lastProcessedId - The ID we processed up to
     * @returns {Array} events - Only new events
     */
    getNewEventsSince(lastProcessedId) {
        const all = this._loadRawData();
        if (!lastProcessedId) return all;
        const idx = all.findIndex(e => e.id === lastProcessedId);
        return idx === -1 ? all : all.slice(idx + 1);
    }

    _loadRawData() {
        const json = localStorage.getItem(`${this.PREFIX}_events`);
        return json ? JSON.parse(json) : [];
    }

    _calculateChecksum(data) {
        // DJB2 hash (better collision resistance, no crypto library needed)
        const str = JSON.stringify(data);
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
        }
        return hash >>> 0; // Unsigned 32-bit
    }

    _validateIntegrity() {
        const events = this.getAllEvents();
        console.log(`🔍 [System Start] Storage Integrity Check: OK (${events.length} events found)`);
    }

    // --- BACKUP & RECOVERY ---

    _createBackup() {
        const currentData = localStorage.getItem(`${this.PREFIX}_events`);
        const currentChecksum = localStorage.getItem(`${this.PREFIX}_checksum`);
        
        if (currentData && currentChecksum) {
            localStorage.setItem(`${this.PREFIX}_backup`, currentData);
            localStorage.setItem(`${this.PREFIX}_backup_checksum`, currentChecksum);
        }
    }

    _restoreFromBackup() {
        const backup = localStorage.getItem(`${this.PREFIX}_backup`);
        const backupChecksum = localStorage.getItem(`${this.PREFIX}_backup_checksum`);
        
        if (backup && backupChecksum) {
            localStorage.setItem(`${this.PREFIX}_events`, backup);
            localStorage.setItem(`${this.PREFIX}_checksum`, backupChecksum);
            console.warn("⚠️ Restored from backup. Last action lost.");
            return true;
        }
        
        console.error("🚨 No backup available.");
        return false;
    }
}

// 🎓 Exporting this so other files can use it
// Using ES module syntax to match app/src/engine pattern
export default SafeLocalStorage;

