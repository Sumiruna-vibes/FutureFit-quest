// app/src/engine/EventManager.js
import storage from './SafeLocalStorage.js'; // ✅ Import singleton from same folder

/**
 * 🎓 LESSON: EVENT SOURCING
 * 
 * Instead of storing "Current Score: 10", we store:
 * 1. "User Answered Question (Correct)"
 * 2. "User Watched Video"
 * 
 * We can always calculate the score later by replaying these events.
 * This Manager ensures every event is formatted perfectly before saving.
 */

class EventManager {
    constructor(storage) {
        // ✅ Receive storage as dependency (Dependency Injection)
        this.storage = storage;
    }

    /**
     * The Main Action: Record something the user did.
     * @param {string} userId - Who did it?
     * @param {string} type - What did they do? (e.g., 'QUIZ_ATTEMPT')
     * @param {object} payload - Details (e.g., { nodeId: 'A', correct: true })
     */
    recordEvent(userId, type, payload) {
        // 1. Create the standardized Event Object
        const event = {
            userId: userId,
            type: type,
            payload: payload,
            timestamp: new Date().toISOString(),
            // We add metadata for analytics (Product B feature!)
            meta: {
                userAgent: (typeof navigator !== 'undefined') ? navigator.userAgent : 'node_cli',
                version: '1.0'
            }
        };

        // 2. Validate (Simple check for now)
        if (!userId || !type) {
            console.error("❌ Event rejected: Missing UserID or Type");
            return null;
        }

        // 3. Save to Vault
        const eventId = this.storage.saveEvent(event);
        
        console.log(`📝 [EventManager] Recorded ${type} for User ${userId.substring(0, 5)}...`);
        return eventId;
    }

    /**
     * Get the full history for a user.
     */
    getUserHistory(userId) {
        const allEvents = this.storage.getAllEvents();
        // Filter: only return events for this specific user
        return allEvents.filter(e => e.userId === userId);
    }
}

// 🎓 SINGLETON PATTERN: Create one instance using the storage singleton
const eventManager = new EventManager(storage);

// Export the instance as default (for React components)
export default eventManager;

// Export the class as a named export (for tests)
export { EventManager };