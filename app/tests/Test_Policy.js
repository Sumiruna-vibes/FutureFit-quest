// app/src/tests/test_policy.js
import { PolicyEngine } from '../src/engine/PolicyEngine.js';

console.log("🧪 STARTING Cnode app/tests/test_events.jsHUNK 4 TEST: THE BOUNCER");

// Scenario A: The New Student (Normal User)
const studentState = { completedNodes: [] }; // Has done nothing
const studentPolicy = new PolicyEngine();
studentPolicy.configure({ isDeveloper: false }); // ✅ Use configure() method

console.log("\n👤 Testing Normal Student...");

// 1. Try to access Module 1 (No prereqs)
const check1 = studentPolicy.canAccessNode('module_1_intro', studentState);
if (check1.allowed) {
    console.log("✅ Success: Can access Intro (No prereqs).");
} else {
    console.error("❌ Fail: Blocked from Intro.");
}

// 2. Try to skip to Python (Requires Excel -> Quiz -> Intro)
const check2 = studentPolicy.canAccessNode('module_3_python', studentState);
if (!check2.allowed && check2.reason === 'LOCKED_PREREQ_MISSING') {
    console.log("✅ Success: Blocked from Python (Prereqs missing).");
} else {
    console.error("❌ Fail: Student managed to skip ahead!");
}

// Scenario B: The Architect (Developer Mode)
console.log("\n👷 Testing Architect Mode...");
const devPolicy = new PolicyEngine();
devPolicy.configure({ isDeveloper: true }); // ✅ Use configure() method

// 1. Try to skip to Python
const checkDev = devPolicy.canAccessNode('module_3_python', studentState);
if (checkDev.allowed && checkDev.reason === 'DEV_OVERRIDE') {
    console.log("✅ Success: Developer bypassed the locks.");
} else {
    console.error("❌ Fail: Developer was blocked.");
}