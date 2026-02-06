# FutureFit Quest System Architecture v1.1
**Internal Blueprint & Implementation Guide**

**To:** Project Team (Developer/Student)  
**From:** Gemini 3 (System Architect)  
**Date:** December 26, 2025  
**Status:** Approved for Implementation (Synthesized from DeepSeek & Claude Reviews)

---

## 1. Executive Summary & Goal

This document defines the definitive architecture for **FutureFit Quest v0.1**. It integrates the **Immutable Event Log** strategy to prevent data loss (DeepSeek) and adds **Engagement & Monetization** layers (Claude) to ensure the prototype is commercially viable.

**Immediate Goal:** Build the **Data & State Layer** (The "Brain") before any UI.

**Success Criteria:** A system that can record user actions, prevent data corruption even during crashes, and deterministically decide the next learning step.

---

## 2. Core Architecture: The "Deterministic Loop"

We use a unidirectional flow. User input never changes the screen directly; it must pass through the logic chain.

```
[UI Interaction] 
      ↓
[Session Manager] (The Orchestrator)
      ↓
[Assessment Engine] → [Feedback Orchestrator] (Celebration Logic)
      ↓
[SafeLocalStorage] (The Vault - Immutable Log)
      ↓
[Progress Service] (State Derivation)
      ↓
[Policy Engine] (Next Step Decision)
      ↓
[UI Render]
```

---

## 3. Component Specifications (The "What to Build")

### 3.1 Data Layer: `SafeLocalStorage` (Priority #1)

**Addresses DeepSeek Risk #1 (Data Corruption)**

A wrapper around the browser's `localStorage` to make it behave like a secure database.

**Key Features:**
- **Checksums:** Calculates a hash of the data before saving. If the read hash doesn't match, it detects corruption.
- **Transactions:** Uses a `temp` key while writing. If the browser crashes mid-write, the main data is safe.
- **Monotonic IDs:** Every event gets a unique ID based on timestamp + counter (e.g., `1703456789000_001`) to ensure order.
- **Backups:** Automatically keeps a snapshot of the last known good state.

**Class Interface (Pseudo-code):**

```javascript
class SafeLocalStorage {
  constructor() {
    this.VERSION = 'ffq_v1';
    this.checksums = new Map();
  }

  appendEvent(event) {
    // Generate monotonic event ID
    const eventId = this.generateMonotonicId();
    event.id = eventId;
    
    // Get current batch
    const batch = this.getCurrentBatch();
    batch.push(event);
    
    // Calculate checksum
    const checksum = this.calculateChecksum(batch);
    
    // Transactional write pattern
    localStorage.setItem(`${this.VERSION}_attempts_temp`, JSON.stringify(batch));
    localStorage.setItem(`${this.VERSION}_attempts_checksum`, checksum);
    localStorage.setItem(`${this.VERSION}_attempts`, JSON.stringify(batch));
    
    return eventId;
  }

  getEvents() {
    const data = localStorage.getItem(`${this.VERSION}_attempts`);
    const checksum = localStorage.getItem(`${this.VERSION}_attempts_checksum`);
    
    if (!data) return [];
    
    // Verify integrity
    const parsed = JSON.parse(data);
    const calculatedChecksum = this.calculateChecksum(parsed);
    
    if (calculatedChecksum !== checksum) {
      console.error('Data corruption detected. Attempting recovery.');
      return this.recoverFromBackup();
    }
    
    return parsed;
  }

  getCurrentBatch() {
    const data = localStorage.getItem(`${this.VERSION}_attempts`);
    return data ? JSON.parse(data) : [];
  }

  calculateChecksum(data) {
    // Simple checksum (in production: use crypto.subtle.digest)
    return JSON.stringify(data).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a; // Convert to 32-bit integer
    }, 0).toString();
  }

  generateMonotonicId() {
    const timestamp = Date.now();
    const counter = Math.random().toString(36).substr(2, 9);
    return `${timestamp}_${counter}`;
  }

  recoverFromBackup() {
    const backup = localStorage.getItem(`${this.VERSION}_attempts_backup`);
    return backup ? JSON.parse(backup) : [];
  }

  createBackup() {
    const data = localStorage.getItem(`${this.VERSION}_attempts`);
    if (data) {
      localStorage.setItem(`${this.VERSION}_attempts_backup`, data);
    }
  }
}
```

---

### 3.2 Logic Layer: `PolicyEngine` with Developer Mode

**Addresses DeepSeek Risk #4 (Testing Rigidity)**

The strict rule-keeper that decides what opens next.

**Logic:**
- **Standard Mode:** Enforces Tree 1 → 2 → 3 progression.
- **Developer Mode:** If `user.isDeveloper = true`, allows jumping to any node (crucial for testing without replaying).

**Visual States (Claude Addition):**
Instead of just `locked/unlocked`, returns:
- `LOCKED_FAR` (Invisible/Dim - prerequisites not met)
- `LOCKED_NEAR` (Visible, "Coming Soon" - one step away)
- `UNLOCKED_NEW` (Glowing, Ready - newly accessible)
- `IN_PROGRESS` (Currently working on)
- `COMPLETED` (Finished, can replay)

**Class Interface (Pseudo-code):**

```javascript
class PolicyEngine {
  constructor(skillTrees, isDeveloper = false) {
    this.skillTrees = skillTrees;
    this.isDeveloper = isDeveloper;
  }

  getNextNode(userState) {
    if (this.isDeveloper) {
      // Allow jumping to any node for testing
      return this.getAllNodes();
    }
    
    // Standard progression logic
    const currentNode = this.skillTrees.findNode(userState.current_node_id);
    const nextNode = this.findNextNode(currentNode, userState);
    
    return nextNode;
  }

  getNodeVisualState(nodeId, userState) {
    if (userState.completed_nodes.includes(nodeId)) {
      return 'COMPLETED';
    }
    
    if (userState.current_node_id === nodeId) {
      return 'IN_PROGRESS';
    }
    
    if (userState.unlocked_nodes.includes(nodeId)) {
      return 'UNLOCKED_NEW';
    }
    
    // Check if prerequisites are almost met
    const prerequisites = this.getNodePrerequisites(nodeId);
    const meetsPrereqs = prerequisites.every(prereq => 
      userState.completed_nodes.includes(prereq)
    );
    
    if (meetsPrereqs) {
      return 'LOCKED_NEAR'; // Can see it, not yet playable
    }
    
    return 'LOCKED_FAR'; // Hidden
  }

  getNodeVisualStates(userState) {
    const states = {};
    
    for (const node of this.skillTrees.getAllNodes()) {
      states[node.id] = this.getNodeVisualState(node.id, userState);
    }
    
    return states;
  }

  findNextNode(currentNode, userState) {
    // Logic to determine the next appropriate node
    // Based on skill tree structure and prerequisite rules
    // (Implementation varies based on tree layout)
  }

  getAllNodes() {
    return this.skillTrees.getAllNodes();
  }

  getNodePrerequisites(nodeId) {
    // Returns array of node IDs that must be completed first
    const node = this.skillTrees.findNode(nodeId);
    return node.prerequisites || [];
  }

  setDeveloperMode(isDeveloper) {
    this.isDeveloper = isDeveloper;
  }
}
```

---

### 3.3 User Experience Layer: `FeedbackOrchestrator`

**Addresses Claude Risk #1 (Boring App)**

Decides *how* to reward the user, separating logic from "delight."

**Input:** Assessment Result (Correct/Incorrect, context about user streak).

**Logic:**
- Is this a streak milestone? → **High Intensity Celebration**
- Is this a simple correct answer? → **Standard Sound**
- Did they fail 3 times then get it right? → **Encouragement Message**

**Output:** Config object for UI (`{ sound: 'fanfare.mp3', animation: 'confetti', message: 'Awesome!' }`).

**Class Interface (Pseudo-code):**

```javascript
class FeedbackOrchestrator {
  constructor() {
    this.INTENSITY_LEVELS = {
      MAJOR: 'major',      // First correct after failures, milestone
      STANDARD: 'standard', // Regular correct answer
      RECOVERY: 'recovery'  // Correct after 1 failure
    };
  }

  celebrate(assessmentResult, context) {
    const intensity = this.calculateIntensity(assessmentResult, context);
    
    return {
      intensity: intensity,
      visual: this.getVisualFeedback(intensity),
      audio: this.getAudioFeedback(intensity),
      message: this.getEncouragingMessage(intensity, context),
      xp_animation: 'float_up_effect',
      delay_next_question_ms: this.getDelay(intensity)
    };
  }

  calculateIntensity(result, context) {
    // MAJOR: First correct after multiple failures
    if (result.verdict === 'correct' && context.previous_failures >= 3) {
      return this.INTENSITY_LEVELS.MAJOR;
    }
    
    // MAJOR: Streak milestone (10, 25, 50 correct)
    if (result.verdict === 'correct' && context.streak_count % 10 === 0) {
      return this.INTENSITY_LEVELS.MAJOR;
    }
    
    // STANDARD: Regular correct answer
    if (result.verdict === 'correct') {
      return this.INTENSITY_LEVELS.STANDARD;
    }
    
    // RECOVERY: Incorrect after previous correct
    if (result.verdict === 'incorrect' && context.was_correct_before) {
      return this.INTENSITY_LEVELS.RECOVERY;
    }
    
    // Default
    return this.INTENSITY_LEVELS.STANDARD;
  }

  getVisualFeedback(intensity) {
    const visuals = {
      major: {
        animation_type: 'confetti_burst',
        duration_ms: 2000,
        glow_effect: true
      },
      standard: {
        animation_type: 'checkmark_pop',
        duration_ms: 800,
        glow_effect: false
      },
      recovery: {
        animation_type: 'encouraging_pulse',
        duration_ms: 1200,
        glow_effect: false
      }
    };
    
    return visuals[intensity] || visuals.standard;
  }

  getAudioFeedback(intensity) {
    const sounds = {
      major: 'sounds/fanfare.mp3',
      standard: 'sounds/ding.mp3',
      recovery: 'sounds/encouraging_chime.mp3'
    };
    
    return sounds[intensity] || sounds.standard;
  }

  getEncouragingMessage(intensity, context) {
    const messages = {
      major: [
        'You crushed it! 🎉',
        'Breakthrough moment! 🌟',
        'Now you\'re cooking! 🔥'
      ],
      standard: [
        'Great job! ✨',
        'Keep it up! 💪',
        'Nice one! 👏'
      ],
      recovery: [
        'You got it! 🎯',
        'Persistence pays off! 💡',
        'Nice recovery! 🚀'
      ]
    };
    
    const msgArray = messages[intensity] || messages.standard;
    return msgArray[Math.floor(Math.random() * msgArray.length)];
  }

  getDelay(intensity) {
    const delays = {
      major: 2500,
      standard: 1000,
      recovery: 1500
    };
    
    return delays[intensity] || 1000;
  }
}
```

---

### 3.4 Assessment Engine

**Determines verdict (Correct/Incorrect) for different question types.**

**Class Interface (Pseudo-code):**

```javascript
class AssessmentEngine {
  assessAnswer(answer, question) {
    const questionType = question.type;
    
    switch(questionType) {
      case 'multiple_choice':
        return this.assessMultipleChoice(answer, question);
      
      case 'text_response':
        return this.assessTextResponse(answer, question);
      
      case 'drag_drop':
        return this.assessDragDrop(answer, question);
      
      case 'video':
        // Video completion is just checking time_watched > 80% duration
        return {
          verdict: 'complete',
          score: 1.0,
          feedback: 'Video watched'
        };
      
      default:
        return { verdict: 'ungradable', score: 0 };
    }
  }

  assessMultipleChoice(answer, question) {
    const isCorrect = answer === question.correct_answer;
    
    return {
      verdict: isCorrect ? 'correct' : 'incorrect',
      score: isCorrect ? 1.0 : 0.0,
      feedback: isCorrect ? question.positive_feedback : question.negative_feedback
    };
  }

  assessTextResponse(answer, question) {
    // Basic validation (v0.1)
    // Later: integrate LLM for semantic matching
    
    const validation = {
      length_ok: answer.length > 10,
      has_keywords: this.containsKeywords(answer, question.required_keywords || [])
    };
    
    return {
      verdict: validation.length_ok ? 'complete' : 'incomplete',
      score: validation.length_ok ? 1.0 : 0.0,
      feedback: validation.length_ok ? 'Good response' : 'Please provide more detail',
      validation: validation
    };
  }

  assessDragDrop(answer, question) {
    const isCorrect = this.sequenceIsCorrect(answer, question.correct_sequence);
    
    return {
      verdict: isCorrect ? 'correct' : 'incorrect',
      score: isCorrect ? 1.0 : 0.0,
      feedback: isCorrect ? 'Perfect order!' : 'Try again'
    };
  }

  containsKeywords(text, keywords) {
    return keywords.every(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  sequenceIsCorrect(userSequence, correctSequence) {
    if (userSequence.length !== correctSequence.length) return false;
    return userSequence.every((item, index) => item === correctSequence[index]);
  }
}
```

---

### 3.5 Progress Service

**Derives current user state from the immutable event log.**

**Key Feature:** Incremental caching to avoid replaying 10,000 events every load.

**Class Interface (Pseudo-code):**

```javascript
class ProgressService {
  constructor(safeLocalStorage) {
    this.storage = safeLocalStorage;
  }

  getUserState() {
    const events = this.storage.getEvents();
    const cachedState = this.getCachedState();
    
    // If cache is fresh, use it
    if (cachedState && 
        cachedState.last_processed_event_id === events[events.length - 1]?.id) {
      return cachedState;
    }
    
    // Otherwise, replay incrementally
    if (cachedState && cachedState.last_processed_event_id) {
      const newEvents = events.filter(e => 
        this.isEventAfter(e.id, cachedState.last_processed_event_id)
      );
      return this.applyIncrementalUpdate(cachedState, newEvents);
    }
    
    // First load: replay from scratch
    return this.deriveStateFromEvents(events);
  }

  deriveStateFromEvents(events) {
    const state = {
      current_node_id: 'tree1_branchA_leaf1',
      unlocked_nodes: ['tree1_branchA_leaf1'],
      completed_nodes: [],
      xp: 0,
      streak: 0,
      last_processed_event_id: null
    };
    
    for (const event of events) {
      state = this.applyEvent(state, event);
    }
    
    state.last_processed_event_id = events[events.length - 1]?.id || null;
    this.cacheState(state);
    
    return state;
  }

  applyIncrementalUpdate(cachedState, newEvents) {
    let state = cachedState;
    
    for (const event of newEvents) {
      state = this.applyEvent(state, event);
    }
    
    state.last_processed_event_id = newEvents[newEvents.length - 1]?.id;
    this.cacheState(state);
    
    return state;
  }

  applyEvent(state, event) {
    // Each event updates state based on verdict
    
    if (event.verdict === 'correct' || event.verdict === 'complete') {
      state.xp += event.score * 10; // 10 XP per correct
      state.streak += 1;
      
      if (!state.completed_nodes.includes(event.node_id)) {
        state.completed_nodes.push(event.node_id);
      }
    } else if (event.verdict === 'incorrect') {
      state.streak = 0;
    }
    
    return state;
  }

  getCachedState() {
    const cached = localStorage.getItem('ffq_v1_user_state_cache');
    return cached ? JSON.parse(cached) : null;
  }

  cacheState(state) {
    localStorage.setItem('ffq_v1_user_state_cache', JSON.stringify(state));
  }

  isEventAfter(eventId, referenceId) {
    // Extract timestamp from eventId (format: timestamp_counter)
    const [eventTime] = eventId.split('_');
    const [refTime] = referenceId.split('_');
    return parseInt(eventTime) > parseInt(refTime);
  }
}
```

---

### 3.6 Session Manager

**The orchestrator that ties everything together.**

**Responsibilities:**
- Accept user interaction (answer submission)
- Call Assessment Engine to grade
- Record event to SafeLocalStorage
- Call Feedback Orchestrator for delight
- Update state via Progress Service
- Return next action to UI

**Class Interface (Pseudo-code):**

```javascript
class SessionManager {
  constructor(assessmentEngine, feedbackOrchestrator, policyEngine, 
              progressService, safeLocalStorage) {
    this.assessment = assessmentEngine;
    this.feedback = feedbackOrchestrator;
    this.policy = policyEngine;
    this.progress = progressService;
    this.storage = safeLocalStorage;
  }

  submitAnswer(userId, nodeId, answer) {
    // Step 1: Get the question
    const question = this.getQuestion(nodeId);
    
    // Step 2: Assess the answer
    const assessmentResult = this.assessment.assessAnswer(answer, question);
    
    // Step 3: Get current user state
    const userState = this.progress.getUserState();
    
    // Step 4: Create and record event
    const event = {
      user_id: userId,
      node_id: nodeId,
      type: question.type,
      payload: answer,
      verdict: assessmentResult.verdict,
      score: assessmentResult.score,
      timestamp: new Date().toISOString()
    };
    
    const eventId = this.storage.appendEvent(event);
    
    // Step 5: Update user state
    const updatedState = this.progress.getUserState(); // Re-derive from events
    
    // Step 6: Get feedback config
    const feedbackConfig = this.feedback.celebrate(assessmentResult, {
      previous_failures: userState.failed_attempts_on_node || 0,
      streak_count: updatedState.streak,
      was_correct_before: userState.last_verdict === 'correct'
    });
    
    // Step 7: Determine next node
    const nextNode = this.policy.getNextNode(updatedState);
    const nodeVisualStates = this.policy.getNodeVisualStates(updatedState);
    
    // Step 8: Return action for UI
    return {
      event_id: eventId,
      assessment: assessmentResult,
      feedback: feedbackConfig,
      next_node: nextNode,
      updated_state: updatedState,
      node_visual_states: nodeVisualStates
    };
  }

  getQuestion(nodeId) {
    // Load from skill tree content
    // (Implementation depends on how content is stored)
  }

  getCurrentState(userId) {
    return this.progress.getUserState();
  }

  getVisualStates(userId) {
    const state = this.progress.getUserState();
    return this.policy.getNodeVisualStates(state);
  }
}
```

---

## 4. Data Model (The Schema)

### 4.1 Event Log Structure

**Stored in `SafeLocalStorage` as JSON array:**

```json
{
  "id": "1703456789000_abc123def",
  "user_id": "user_uuid_here",
  "node_id": "tree1_branchA_leaf1",
  "type": "multiple_choice",
  "payload": {
    "selected_option": "B",
    "time_spent_ms": 45000,
    "hint_used": false
  },
  "verdict": "correct",
  "score": 1.0,
  "timestamp": "2025-12-26T10:41:00Z",
  "checksum": "hash_of_entire_batch"
}
```

### 4.2 User State Structure

**Derived from event log (cached):**

```json
{
  "id": "user_uuid_here",
  "current_node_id": "tree1_branchA_leaf2",
  "unlocked_nodes": ["tree1_branchA_leaf1", "tree1_branchA_leaf2"],
  "completed_nodes": ["tree1_branchA_leaf1"],
  "xp": 450,
  "streak": 5,
  "last_processed_event_id": "1703456789000_abc123def",
  "tier": "free",
  "accessible_trees": ["tree1", "tree2"],
  "stats": {
    "total_attempts": 42,
    "total_correct": 35,
    "accuracy_percent": 83.3
  },
  "version": "2025-12-26_derived_v1"
}
```

### 4.3 User Profile Structure (Commercial Viability)

**Claude Addition - Freemium Support:**

```json
{
  "id": "user_uuid_here",
  "email": "student@example.com",
  "tier": "free",
  "subscription_status": "active",
  "accessible_trees": ["tree1", "tree2"],
  "daily_lesson_limit": 3,
  "lessons_completed_today": 1,
  "hints_remaining_today": 2,
  "organization_id": null,
  "role": "learner",
  "isDeveloper": true,
  "created_at": "2025-01-15T00:00:00Z"
}
```

### 4.4 Skill Tree Structure

**Static content - Define once per subject:**

```json
{
  "id": "tree1",
  "title": "Foundations of Biology",
  "branches": [
    {
      "id": "branchA",
      "title": "Cell Structure",
      "prerequisites": [],
      "leaves": [
        {
          "id": "leaf1",
          "title": "What is a Cell?",
          "type": "video",
          "prerequisites": [],
          "content": {
            "video_url": "https://...",
            "duration_ms": 300000,
            "transcript": "..."
          }
        },
        {
          "id": "leaf2",
          "title": "Cell Parts Quiz",
          "type": "multiple_choice",
          "prerequisites": ["tree1_branchA_leaf1"],
          "content": {
            "question": "What is the nucleus?",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "A"
          }
        }
      ]
    }
  ]
}
```

---

## 5. Implementation Roadmap (Phase 1)

### Phase 1.1: Data & State Layer (Weeks 1-2)

**Chunk 1: The Vault (`SafeLocalStorage`)**
- Write the `SafeLocalStorage` class
- Implement checksums
- Implement transaction pattern
- Test: Save 10,000 events, crash browser, verify recovery

**Chunk 2: Event Stream**
- Define `AttemptEvent` TypeScript interface
- Write `recordAttempt()` function
- Test: Record 100 events in sequence, verify order

**Chunk 3: Progress Service & Incremental Caching**
- Write `ProgressService` to derive state from events
- Implement incremental cache (don't replay all 10k events)
- Test: Verify state is same whether from cache or full replay

**Chunk 4: Policy Engine & Developer Mode**
- Write `PolicyEngine` class with prerequisite logic
- Add `isDeveloper` mode to bypass progression
- Write `getNodeVisualState()` for UI feedback
- Test: Verify progression is strict in normal mode, free in dev mode

**Deliverable:** A CLI (command-line) tool that:
- Starts a dummy user
- Simulates answering 5 questions (auto-graded)
- Shows user state evolution over time
- Includes recovery test (simulated crash)

---

### Phase 1.2: Engagement & Monetization Logic (Week 3)

**Chunk 5: Feedback Orchestrator**
- Write `FeedbackOrchestrator` class
- Implement intensity calculation logic
- Create feedback config generator
- Test: Verify correct intensity for streaks, recoveries, etc.

**Chunk 6: Assessment Engine**
- Write `AssessmentEngine` class
- Implement grading for multiple question types
- Add validation (not just "is it empty?")
- Test: Verify correct/incorrect verdicts

**Chunk 7: Session Manager**
- Tie all components together
- Write end-to-end submission flow
- Test: Full cycle from submission to feedback to next node

**Deliverable:** An API-like test suite showing:
- Complete answer submission flow
- State transitions
- Feedback generation
- Developer mode override

---

### Phase 2: Backend & Persistence (Week 4)

**Pre-Phase 2 Work:**
- Design PostgreSQL schema (mirrors localStorage structure)
- Write migration utilities (JSON → Database)
- Plan data sync strategy

---

## 6. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Immutable Event Log** | V1 failed because state was mutated and corrupted. Events are append-only = unbreakable. |
| **SafeLocalStorage Wrapper** | localStorage is fragile. Wrapper adds checksums and transactions. |
| **Derived State (Not Direct)** | User state is always calculated from events, never stored directly. Single source of truth. |
| **Incremental Caching** | Performance: Cache last state + replay only new events. Scales to 100k events. |
| **Developer Mode** | You need to test the app without playing it 1000 times. Built into Policy Engine. |
| **Feedback Orchestrator** | Separates grading (cold logic) from celebration (engagement). Both needed for retention. |
| **Freemium Fields Now** | Adding `tier` and `accessible_trees` to schema early = no database break when monetizing. |

---

## 7. TypeScript Interfaces (For Future Implementation)

```typescript
// Event Log
interface AttemptEvent {
  id: string;                    // Monotonic timestamp_counter
  user_id: string;
  node_id: string;
  type: 'quiz' | 'video' | 'simulation' | 'text_response';
  payload: any;                  // User's answer
  verdict: 'correct' | 'incorrect' | 'complete' | 'incomplete';
  score: number;                 // 0.0 to 1.0
  timestamp: string;             // ISO string
  metadata?: {
    time_spent_ms?: number;
    hints_used?: number;
    device_id?: string;
  };
}

// User State
interface UserState {
  id: string;
  current_node_id: string;
  unlocked_nodes: string[];
  completed_nodes: string[];
  xp: number;
  streak: number;
  last_processed_event_id: string;
  version: string;               // Cache version
  node_visual_states?: Record<string, NodeVisualState>;
}

// User Profile
interface UserProfile {
  id: string;
  email: string;
  tier: 'free' | 'premium' | 'developer';
  subscription_status: 'active' | 'expired' | 'trial';
  accessible_trees: string[];
  daily_lesson_limit: number;
  isDeveloper: boolean;
}

// Assessment Result
interface AssessmentResult {
  verdict: 'correct' | 'incorrect' | 'complete' | 'incomplete' | 'ungradable';
  score: number;
  feedback: string;
  validation?: Record<string, boolean>;
}

// Feedback Config
interface FeedbackConfig {
  intensity: 'major' | 'standard' | 'recovery';
  visual: {
    animation_type: string;
    duration_ms: number;
    glow_effect: boolean;
  };
  audio: string;                 // filename
  message: string;
  delay_next_question_ms: number;
}

// Node Visual State
type NodeVisualState = 'LOCKED_FAR' | 'LOCKED_NEAR' | 'UNLOCKED_NEW' | 'IN_PROGRESS' | 'COMPLETED';

// Session Response
interface SessionResponse {
  event_id: string;
  assessment: AssessmentResult;
  feedback: FeedbackConfig;
  next_node: any;                // Node object
  updated_state: UserState;
  node_visual_states: Record<string, NodeVisualState>;
}
```

---

## 8. Success Metrics (End of Phase 1)

By the end of Phase 1, this system should:

1. **Data Safety:** 
   - ✅ Store 10,000+ events without data loss
   - ✅ Detect corruption and recover from backup
   - ✅ Survive simulated browser crash

2. **State Consistency:**
   - ✅ Derived state is identical whether from full replay or incremental cache
   - ✅ XP, streak, and node status always correct

3. **Progression Logic:**
   - ✅ Normal mode enforces strict Tree 1 → 2 → 3
   - ✅ Developer mode allows jumping to any node
   - ✅ Visual states correctly reflect user progress

4. **Engagement:**
   - ✅ Celebration feedback is contextual (streak > regular correct > recovery)
   - ✅ Messages are varied and encouraging

5. **Code Quality:**
   - ✅ All components have clear interfaces
   - ✅ No circular dependencies
   - ✅ Testable (functions are pure where possible)

---

## 9. Summary: Your Next Step

**You now have the complete blueprint.**

The architecture is solid (validated by DeepSeek + Claude). Your next action:

**Start Chunk 1: Implement `SafeLocalStorage`**

I will provide starter code and tests in the next session when you're ready.

---

**Document Version:** 1.1  
**Last Updated:** December 26, 2025  
**Approval Status:** Ready for Implementation  
**Author:** Gemini 3 (System Architect)
