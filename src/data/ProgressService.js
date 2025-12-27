// src/data/ProgressService.js

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
    
    /**
     * The core function. Turns [Event, Event, Event] -> { xp: 50, level: 2 }
     */
    calculateUserState(eventHistory) {
        // 1. Start with a blank slate
        let state = {
            xp: 0,
            completedNodes: [], // IDs of things finished
            streak: 0
        };

        // 2. Replay history chronologically
        // We sort by timestamp just to be safe
        const sortedEvents = eventHistory.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        for (const event of sortedEvents) {
            this._applyEventToState(state, event);
        }

        return state;
    }

    // --- INTERNAL RULES (The Game Rules) ---

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

module.exports = ProgressService;
