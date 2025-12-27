// src/tests/test_storage.js

// 1. SIMULATE BROWSER ENVIRONMENT (The Trick)
// Node.js doesn't have "localStorage", so we mock it.
if (typeof localStorage === "undefined") {
    class MockStorage {
        constructor() { this.store = {}; }
        getItem(key) { return this.store[key] || null; }
        setItem(key, value) { this.store[key] = value.toString(); }
        removeItem(key) { delete this.store[key]; }
        clear() { this.store = {}; }
    }
    global.localStorage = new MockStorage();
}

const SafeLocalStorage = require('../data/SafeLocalStorage');

// --- THE TEST SCRIPT ---

console.log("🧪 STARTING CHUNK 1 TEST: THE VAULT");

// A. Initialize
const db = new SafeLocalStorage('test_db');

// B. Save Events
console.log("\n📝 Step 1: Saving Events...");
db.saveEvent({ type: 'LOGIN', user: 'student_1' });
db.saveEvent({ type: 'ANSWER', node: 'node_1', correct: true });
db.saveEvent({ type: 'ANSWER', node: 'node_2', correct: false });

// C. Verify Retrieval
console.log("\n🔍 Step 2: verifying Read...");
const events = db.getAllEvents();
if (events.length === 3) {
    console.log("✅ SUCCESS: 3 events found.");
} else {
    console.error(`❌ FAILURE: Expected 3 events, found ${events.length}`);
}

// D. Simulate Corruption (The "Chaos Monkey")
console.log("\n😈 Step 3: Simulating Corruption...");
// We manually hack the storage to break the checksum
const rawData = JSON.parse(localStorage.getItem('test_db_events'));
rawData[0].type = 'HACKED'; // Changing data without updating checksum
localStorage.setItem('test_db_events', JSON.stringify(rawData));

// E. Verify Detection
console.log("🔍 Reading corrupted data...");
const corruptedEvents = db.getAllEvents(); // Should trigger error logs

console.log("\n🎉 TEST COMPLETE");
