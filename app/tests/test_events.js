// app/tests/test_events.js

// Mock Browser Environment (standard boilerplate for CLI testing)
if (typeof localStorage === "undefined") {
    class MockStorage {
        constructor() { this.store = {}; }
        getItem(key) { return this.store[key] || null; }
        setItem(key, value) { this.store[key] = value.toString(); }
        removeItem(key) { delete this.store[key]; }
    }
    global.localStorage = new MockStorage();
}

// ✅ FIXED: Import named exports (classes, not singletons)
import { EventManager } from '../src/engine/EventManager.js';
import { SafeLocalStorage } from '../src/engine/SafeLocalStorage.js';

console.log("🧪 STARTING CHUNK 2 TEST: THE EVENT STREAM");

// ✅ FIXED: Create isolated test instances
const testStorage = new SafeLocalStorage('test_events_db');
const manager = new EventManager(testStorage);

const USER_ID = "student_007";

// 1. Record a Video View
console.log("\n🎬 User watching video...");
manager.recordEvent(USER_ID, 'VIDEO_COMPLETE', {
    nodeId: 'lesson_1_intro',
    durationWatched: 120
});

// 2. Record a Quiz Answer
console.log("📝 User answering quiz...");
manager.recordEvent(USER_ID, 'QUIZ_ATTEMPT', {
    nodeId: 'lesson_1_quiz',
    answer: 'B',
    isCorrect: true,
    xpEarned: 10
});

// 3. Verify History
console.log("\n🔍 Retrieving History...");
const history = manager.getUserHistory(USER_ID);

console.log(`Found ${history.length} events for user.`);

if (history.length === 2) {
    console.log("✅ SUCCESS: History length matches.");
    console.log("Last Event Type:", history[1].type); // Should be QUIZ_ATTEMPT
} else {
    console.error("❌ FAILURE: History mismatch.");
}

// 4. Verify Event Structure (The 'Schema' Check)
const firstEvent = history[0];
if (firstEvent.timestamp && firstEvent.meta) {
    console.log("✅ SUCCESS: Event has Timestamp and Metadata.");
} else {
    console.error("❌ FAILURE: Malformed event.");
}

console.log("\n✅ TEST COMPLETE: Event Stream Working!");