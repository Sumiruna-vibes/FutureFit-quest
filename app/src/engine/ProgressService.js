// app/src/engine/ProgressService.js

/**
 * 🎓 LESSON: STATE DERIVATION
 * 
 * This is the magic of Event Sourcing.
 * We don't load "User State" from a database.
 * We CALCULATE it by replaying every single thing the user has ever done.
 * 
 * Pros: verifiable, bug-fixable, audit-proof.
 * Cons: Can be slow if not optimized (we will optimize in Chapter 4).
 */

class ProgressService {
    constructor() {
        this.cachedState = null;
        this.cachedVersion = null;
    }

    /**
     * The core function. Turns [Event, Event, Event] -> { xp: 50, level: 2 }
     * Now with incremental support.
     */
    calculateUserState(eventHistory) {
        // 1. Check cache first
        if (this.cachedState && this._isCacheFresh(eventHistory)) {
            return this.cachedState;
        }

        // 2. Start with a blank slate
        let state = {
            xp: 0,
            completedNodes: [], // IDs of things finished
            streak: 0
        };

        // 3. Replay only new events incrementally
        const newEvents = this._getNewEvents(eventHistory);
        const sortedEvents = newEvents.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        for (const event of sortedEvents) {
            this._applyEventToState(state, event);
        }

        // 4. Cache the result
        this.cachedState = { ...state, version: '2025-01-11_derived_v1' };
        this.cachedVersion = eventHistory[eventHistory.length - 1]?.id || null;

        return state;
    }

    // --- INTERNAL HELPERS ---

    _isCacheFresh(eventHistory) {
        return this.cachedVersion === eventHistory[eventHistory.length - 1]?.id;
    }

    _getNewEvents(fullHistory) {
        if (!this.cachedVersion || fullHistory.length === 0) return fullHistory;
        const lastCachedIndex = fullHistory.findIndex(e => e.id === this.cachedVersion);
        return lastCachedIndex === -1 ? fullHistory : fullHistory.slice(lastCachedIndex + 1);
    }

    _applyEventToState(state, event) {
        switch (event.type) {
            case 'QUIZ_ATTEMPT':
                if (event.payload.isCorrect) {
                    state.xp += (event.payload.xpEarned || 10);
                    state.streak++;
                    
                    // Mark as complete if not already
                    if (!state.completedNodes.includes(event.payload.nodeId)) {
                        state.completedNodes.push(event.payload.nodeId);
                    }
                } else {
                    state.streak = 0; // Reset streak on failure!
                }
                break;

            case 'VIDEO_COMPLETE':
                state.xp += 5; // Fixed 5xp for watching videos
                if (!state.completedNodes.includes(event.payload.nodeId)) {
                    state.completedNodes.push(event.payload.nodeId);
                }
                break;
                
            // We can add new rules here later (e.g. 'BONUS_CLAIMED')
        }
    }
}

// 🎓 SINGLETON PATTERN: Create one instance for the entire app
const progressService = new ProgressService();

// Export the instance as default (for React components)
export default progressService;

// Export the class as a named export (for tests)
export { ProgressService };