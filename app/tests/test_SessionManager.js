/**
 * SessionManager Integration Test (v0.1)
 * 
 * Run with: node app/tests/test_sessionmanager.js
 * 
 * This test verifies SessionManager orchestrates the full workflow correctly
 * without requiring React or browser environment.
 */

// Mock localStorage for Node.js environment
global.localStorage = {
  _data: {},
  getItem(key) {
    return this._data[key] || null;
  },
  setItem(key, value) {
    this._data[key] = value;
  },
  removeItem(key) {
    delete this._data[key];
  },
  clear() {
    this._data = {};
  }
};

// Import Phase 1 engines (using isolated instances for testing)
import { SafeLocalStorage } from '../src/engine/SafeLocalStorage.js';
import { EventManager } from '../src/engine/EventManager.js';
import { ProgressService } from '../src/engine/ProgressService.js';
import { PolicyEngine } from '../src/engine/PolicyEngine.js';

// Import SessionManager and SkillTree
import { SessionManager } from '../src/engine/SessionManager.js';
import RESKILLING_TREE from '../src/engine/SkillTree.js';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ ${testName}`);
    testsPassed++;
  } else {
    console.error(`❌ ${testName}`);
    testsFailed++;
  }
}

function assertEquals(actual, expected, testName) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  assert(passed, testName);
  if (!passed) {
    console.log('  Expected:', expected);
    console.log('  Got:', actual);
  }
}

// ============================================================================
// TEST SETUP
// ============================================================================

console.log('\n🧪 SessionManager Integration Test Suite\n');
console.log('Setting up test environment...\n');

// Create isolated engine instances
const storage = new SafeLocalStorage('test_sm');
const eventManager = new EventManager(storage);
const progressService = new ProgressService();
const policyEngine = new PolicyEngine();
policyEngine.configure({ isDeveloper: false }); // Test as student

// Create SessionManager instance
const sessionManager = new SessionManager({
  storage,
  eventManager,
  progressService,
  policyEngine
});

const testUserId = 'test_user_123';
const testNodeId = 'module_1_quiz'; // Actual node from SkillTree

// ============================================================================
// TEST 1: Basic Lesson Completion
// ============================================================================

console.log('📝 Test 1: Basic Lesson Completion\n');

async function testBasicCompletion() {
  const attemptData = {
    submissionUuid: crypto.randomUUID(),
    userAnswer: 'B', // Correct answer for module_1_quiz
    timeSpentMs: 30000,
    hintsUsed: 0
  };

  const result = await sessionManager.handleLessonCompletion(
    testUserId,
    testNodeId,
    attemptData
  );

  assert(result.success === true, 'Result has success flag');
  assert(result.nextNode !== null, 'Result has next node');
  assert(result.progressUpdate !== null, 'Result has progress update');
  assert(Array.isArray(result.achievements), 'Result has achievements array');
  assert(result.feedback !== null, 'Result has feedback');
  assert(result.feedback.isCorrect === true, 'Answer marked correct');
  
  console.log('Result structure:', JSON.stringify(result, null, 2));
  console.log('');
}

await testBasicCompletion();

// ============================================================================
// TEST 2: Idempotency Check
// ============================================================================

console.log('📝 Test 2: Idempotency - Duplicate Submission Prevention\n');

async function testIdempotency() {
  const submissionUuid = crypto.randomUUID();
  const attemptData = {
    submissionUuid: submissionUuid,
    userAnswer: 30, // Correct answer for module_2_excel (numeric)
    timeSpentMs: 30000,
    hintsUsed: 0
  };

  // First submission - should succeed
  const result1 = await sessionManager.handleLessonCompletion(
    testUserId,
    'module_2_excel',
    attemptData
  );
  assert(result1.success === true, 'First submission succeeds');

  // Second submission with SAME UUID - should fail
  try {
    await sessionManager.handleLessonCompletion(
      testUserId,
      'module_2_excel',
      attemptData
    );
    assert(false, 'Duplicate submission should throw error');
  } catch (error) {
    assert(error.message === 'DUPLICATE_SUBMISSION', 'Duplicate detected correctly');
  }
  
  console.log('');
}

await testIdempotency();

// ============================================================================
// TEST 3: Incorrect Answer Handling
// ============================================================================

console.log('📝 Test 3: Incorrect Answer Handling\n');

async function testIncorrectAnswer() {
  const attemptData = {
    submissionUuid: crypto.randomUUID(),
    userAnswer: 'function', // Wrong answer (correct is 'def')
    timeSpentMs: 45000,
    hintsUsed: 2
  };

  const result = await sessionManager.handleLessonCompletion(
    testUserId,
    'module_3_python',
    attemptData
  );

  assert(result.feedback.isCorrect === false, 'Answer marked incorrect');
  assert(result.progressUpdate.xp >= 0, 'XP is non-negative (no score awarded)');
  
  console.log('Incorrect answer result:', JSON.stringify(result.feedback, null, 2));
  console.log('');
}

await testIncorrectAnswer();

// ============================================================================
// TEST 4: Progress Accumulation
// ============================================================================

console.log('📝 Test 4: Progress Accumulation Across Multiple Attempts\n');

async function testProgressAccumulation() {
  const initialProgress = await sessionManager.getCurrentProgress(testUserId);
  const initialXP = initialProgress.xp || 0;

  // Submit 3 correct answers using actual SkillTree nodes
  const testNodes = [
    { id: 'module_1_quiz', answer: 'B' },  // Multiple choice
    { id: 'module_2_excel', answer: 30 },  // Numeric
    { id: 'module_3_python', answer: 'def' } // Text
  ];

  for (const node of testNodes) {
    const attemptData = {
      submissionUuid: crypto.randomUUID(),
      userAnswer: node.answer,
      timeSpentMs: 20000,
      hintsUsed: 0
    };

    await sessionManager.handleLessonCompletion(
      testUserId,
      node.id,
      attemptData
    );
  }

  const finalProgress = await sessionManager.getCurrentProgress(testUserId);
  const finalXP = finalProgress.xp || 0;

  assert(finalXP > initialXP, 'XP increased after correct answers');
  console.log(`XP: ${initialXP} → ${finalXP} (+${finalXP - initialXP})`);
  console.log('');
}

await testProgressAccumulation();

// ============================================================================
// TEST 5: Available Lessons Query
// ============================================================================

console.log('📝 Test 5: Get Available Lessons\n');

async function testAvailableLessons() {
  const available = await sessionManager.getAvailableLessons(testUserId);
  
  assert(Array.isArray(available), 'Returns array of lessons');
  console.log(`Available lessons: ${available.length}`);
  console.log('');
}

await testAvailableLessons();

// ============================================================================
// TEST 6: System State Debug (Developer Mode)
// ============================================================================

console.log('📝 Test 6: System State Debug Query\n');

async function testSystemState() {
  const state = await sessionManager.getSystemState(testUserId);
  
  assert(state.version === '0.1.0', 'Version matches');
  assert(state.userId === testUserId, 'User ID matches');
  assert(state.eventCount > 0, 'Events were recorded');
  assert(state.progress !== null, 'Progress calculated');
  
  console.log('System state snapshot:');
  console.log(JSON.stringify(state, null, 2));
  console.log('');
}

await testSystemState();

// ============================================================================
// TEST 7: Achievement Check (Stub Verification)
// ============================================================================

console.log('📝 Test 7: Achievement Check (v0.1 Stub)\n');

async function testAchievements() {
  const achievements = await sessionManager.checkAchievements(testUserId);
  
  assertEquals(achievements, [], 'Returns empty array (v0.1 stub)');
  console.log('');
}

await testAchievements();

// ============================================================================
// TEST SUMMARY
// ============================================================================

console.log('═'.repeat(60));
console.log('TEST SUMMARY');
console.log('═'.repeat(60));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total:  ${testsPassed + testsFailed}`);
console.log('');

if (testsFailed === 0) {
  console.log('🎉 All tests passed! SessionManager is ready for integration.');
} else {
  console.log('⚠️  Some tests failed. Review errors above before integrating.');
  process.exit(1);
}