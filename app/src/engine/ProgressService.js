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
        let state = {
            xp: 0,
            completedNodes: [],
            streak: 0,
            level: 1
        };
        // Replay ALL events from beginning (event sourcing fundamentals)
        const sortedEvents = [...eventHistory].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        for (const event of sortedEvents) {
            this._applyEventToState(state, event);
        }

        // Calculate level from XP
        state.level = Math.floor(state.xp / 100) + 1;
        state.xpToNextLevel = 100 - (state.xp % 100);

        return state;
    }

    // --- INTERNAL HELPERS ---

    _isCacheFresh(eventHistory) {
    }

    _applyEventToState(state, event) {
        switch (event.type) {
            case 'QUIZ_ATTEMPT':
                if (event.payload.isCorrect) {
                    state.xp += (event.payload.scoreAwarded || 10);
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