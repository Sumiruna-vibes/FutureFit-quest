// src/tests/test_logic.js
const ProgressService = require('../data/ProgressService');

console.log("🧪 STARTING CHUNK 3 TEST: THE BRAIN");

const service = new ProgressService();

// 1. Create a Fake History (Simulation)
// Imagine a user who played 3 times.
const mockHistory = [
    { 
        type: 'VIDEO_COMPLETE', 
        timestamp: '2025-01-01T10:00:00Z',
        payload: { nodeId: 'intro_video' } 
    },
    { 
        type: 'QUIZ_ATTEMPT', 
        timestamp: '2025-01-01T10:05:00Z',
        payload: { nodeId: 'quiz_1', isCorrect: true, xpEarned: 10 } 
    },
    { 
        type: 'QUIZ_ATTEMPT', 
        timestamp: '2025-01-01T10:10:00Z',
        payload: { nodeId: 'quiz_2', isCorrect: false } 
    }
];

// 2. Run the Calculation
console.log("🧠 Replaying history to calculate state...");
const state = service.calculateUserState(mockHistory);

console.log("Final State:", state);

// 3. Verify Rules
// Expected: 
// - Video (5xp) + Quiz 1 (10xp) = 15 XP Total
// - Streak should be 0 (because they failed the last quiz)
// - Completed Nodes: ['intro_video', 'quiz_1']

let passed = true;

if (state.xp !== 15) {
    console.error(`❌ XP ERROR: Expected 15, got ${state.xp}`);
    passed = false;
}

if (state.streak !== 0) {
    console.error(`❌ STREAK ERROR: Expected 0 (reset), got ${state.streak}`);
    passed = false;
}

if (state.completedNodes.length !== 2) {
    console.error(`❌ COMPLETION ERROR: Expected 2 nodes, got ${state.completedNodes.length}`);
    passed = false;
}

if (passed) {
    console.log("✅ SUCCESS: The Brain is thinking correctly.");
}
