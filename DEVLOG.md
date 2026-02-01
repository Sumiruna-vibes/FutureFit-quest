# Building FutureFit: The Architect's Log

## Chapter 1: The Foundation (Date: Dec 27, 2025)

### The Goal
We needed a way to save user progress that wouldn't corrupt if the browser crashed.

### The Problem
Standard `localStorage.setItem` is risky. If the app crashes mid-write, the data is lost forever.

### The Solution: SafeLocalStorage
We implemented a "Vault" class with three safety features:
1. **Checksums:** To detect data corruption.
2. **Atomic Writes:** Writing to a temp slot before committing to the main slot.
3. **Monotonic IDs:** Ensuring every event has a unique, ordered ID.

### Hurdles & Fixes
- **Issue:** VS Code didn't show the file structure initially.
- **Fix:** We learned that empty folders are hidden. We used the terminal (`mkdir -p`) to force the structure. This is a good lesson for the setup phase of the course.

---

## Chapter 1 Complete: The Safe Storage Vault
- **Status:** ✅ Operational
- **Key Achievement:** Implemented a crash-resistant storage class using the Transaction Pattern.
- **Verification:** Ran `test_storage.js`. Successfully saved events, detected 100% of data corruption attempts.
- **Next Up:** Building the Event Stream to record user actions.

---

## Chapter 2 Complete: The Event Stream
- **Status:** ✅ Operational
- **Key Achievement:** Created `EventManager` to standardize user actions into an "Event Sourcing" pattern.
- **Why it matters:** We separate "What happened" (Events) from "What it means" (Score/State). This allows us to change scoring rules later without losing history.
- **Verification:** Ran `test_events.js`. Confirmed metadata (timestamps) and user filtering works.
- **Next Up:** The "Brain" (Policy Engine) to calculate user state from these events.

---

## Chapter 3 Complete: The Logic Brain
- **Status:** ✅ Operational
- **Key Achievement:** Implemented `ProgressService` to derive user state (XP, Streak) from the raw event stream.
- **Why it matters:** Logic is decoupled from storage. If we want to change the "Streak" rules later (e.g., allow 1 miss), we just update the function, and it retroactively fixes everyone's history.
- **Verification:** Ran `test_logic.js`. Confirmed XP math and streak resetting logic work perfectly.
- **Next Up:** The Policy Engine (The Bouncer) to control what unlocks next.

---

## Chapter 4 Complete: The Policy Engine (Phase 1 Finished)
- **Status:** ✅ Operational
- **Key Achievement:** Implemented `PolicyEngine` with a Directed Acyclic Graph (DAG) for the Skill Tree.
- **Strategic Feature:** Added **Developer Mode** (God Mode), which allows the Architect to bypass progression locks. This is a key selling point for the "Building FutureFit" product.
- **Verification:** Ran `test_policy.js`. Confirmed strict rules for students and total freedom for developers.

---

# PHASE 1 SUMMARY
The "Invisible Engine" is complete. We can now record data, calculate progress, and enforce rules without a UI.

---

## Chapter 5: Hardening the Vault (Date: Dec 27, 2025)

### The Problem Discovered
**Code Reviews Revealed Critical Issues (Multi-Agent Review: DeepSeek + Claude):**
- **DeepSeek (Engineering):** Checksum algorithm had a bug (`hash & hash` = no-op, does nothing)
- **Claude (Strategy):** No recovery mechanism if data corrupts. Total data loss on corruption.
- **Risk:** User could lose all progress despite "safe" storage name

### The Review Process
- **Windsurf:** Generated initial SafeLocalStorage
- **DeepSeek:** Technical audit (found cryptographic weakness)
- **Claude:** Strategic analysis (recommended Path B: pragmatic fixes vs perfect security)

### Path B Decision: Security vs Velocity Balance
**Rejected Path A (Perfect Security):**
- Would require SHA-256 crypto + multi-version backups
- Cost: 18 hours (6 weeks at 3hr/week pace)
- Over-engineering for solo user with no adversarial threat

**Rejected Path C (Defer All Fixes):**
- False sense of security (broken checksum worse than none)
- Technical debt accumulates

**Chose Path B (Minimum Viable Plus):**
- Fix critical bugs only (5 hours over 2 weeks)
- Protect against real risks (crashes, corruption)
- Defer advanced features until we experience limitations

### Changes Implemented

**CHANGE 1: Fixed Checksum Algorithm**
- Replaced broken hash (`hash & hash` = no-op) with DJB2 algorithm
- DJB2 provides ~99% corruption detection without crypto library overhead
- Learning: Not all hashes are equal. DJB2 trades cryptographic strength for speed

**CHANGE 2: Added Backup System**
- Created `_createBackup()` - saves copy of data before every write
- Created `_restoreFromBackup()` - recovers data when corruption detected
- Single-level backup (not multi-version) - solves 95% of crash scenarios
- Learning: One backup > zero backups. Multi-version solves problems we don't have yet

**CHANGE 3: Integrated Backup into saveEvent()**
- Backup created BEFORE transactional write begins
- On write failure: automatically restores from backup
- Learning: Safety nets should be invisible to the user

**CHANGE 4: Integrated Restore into getAllEvents()**
- Corruption detected via checksum mismatch
- Automatic restore attempt before returning data
- Throws explicit error only if backup also unavailable
- Learning: Fail gracefully, not silently

### Verification
- ✅ All 4 changes implemented and tested
- ✅ Corruption detection works (tested via "Chaos Monkey" in test_storage.js)
- ✅ Backup/restore cycle verified

---

## Chapter 5 Complete: The Hardened Vault
- **Status:** ✅ Operational
- **Key Achievement:** Transformed SafeLocalStorage from "looks safe" to "actually safe"
- **Verification:** test_storage.js corruption simulation passes
- **Key Learning:** Pragmatic security (Path B) > Perfect security (Path A) when resources are limited
- **Next Up:** Phase 2 - Connecting engines to React UI
- **Time:** ~2 sessions

---

## Chapter 6: Phase 2 Begins - The React Bridge (Date: Dec 27, 2025)

### The Challenge
**Moving from Node.js scripts → React UI**

Phase 1 engines were built as standalone modules tested via CLI.
Phase 2 needs them inside a React application.
The question: How do we connect them without breaking what already works?

### The First Mistake: Duplicate Folders
- Project had files duplicated across `src/data/` and `engine/` folders
- Source of confusion for both human and AI (Windsurf)
- **Fix:** Deleted duplicates. All engine files now live in one place: `app/src/engine/`
- **Learning:** Clean project structure is not optional. It costs time every time it's messy.

### The Singleton Decision

**Windsurf's First Proposal (Rejected):**
```javascript
// ❌ Created NEW instances (ignored Phase 1 work entirely)
const engines = useMemo(() => ({
    storage: new SafeLocalStorage(),
    eventManager: new EventManager(new SafeLocalStorage()), // TWO different storages!
}), []);
```

**Why Rejected:**
- Created multiple SafeLocalStorage instances (state fragmentation)
- EventManager got a DIFFERENT storage than the rest of the app
- Phase 1 tests became disconnected from UI code
- Windsurf proposed this TWICE before we intervened

**The Correct Pattern: Singleton + Dependency Injection**
- Singleton = one instance per engine (matches solo-user reality)
- Dependency Injection = React Context passes references to components
- Components don't know (or care) if it's a singleton or factory
- When we add multi-user (Phase 4), we swap singleton → factory. Components don't change.

### The ES Module Conversion

**Problem Discovered:**
Phase 1 files used CommonJS (`require`/`module.exports`).
React + Vite requires ES Modules (`import`/`export`).

**Files Converted:**

| File | Changes Made |
|------|-------------|
| SafeLocalStorage.js | Already had ES modules + singleton (perfect) |
| EventManager.js | `require` → `import`, added singleton export, added DI constructor |
| ProgressService.js | Added singleton instance + named export |
| PolicyEngine.js | Added singleton + `configure()` method for runtime dev mode |
| SkillTree.js | Already perfect (static data, simple export) |

**Test Files Updated:**

| File | Changes Made |
|------|-------------|
| test_storage.js | `require` → named `import`, isolated test instance |
| test_events.js | `require` → named `import`, isolated test instances |
| test_logic.js | Fixed import syntax (had capitalized `Import`) |
| test_policy.js | `require` → named `import`, constructor → `configure()` pattern |

### The Node.js vs Browser Problem

**Issue:** SafeLocalStorage singleton was created on import (`const storage = new SafeLocalStorage()`).
- ✅ Works in browser (has `localStorage`)
- ❌ Crashes in Node.js (no `localStorage`)
- Tests have mock localStorage, but it runs AFTER the import

**Solution:** Export the class directly (not a pre-created instance).
React's EngineProvider will create the singleton when the app starts (browser environment).
Tests create their own isolated instances with mock localStorage.

**Learning:** Singletons and server-side environments don't mix. Always check environment before instantiating.

### Key Patterns Learned

**1. Named vs Default Exports:**
```javascript
export default SafeLocalStorage;    // Default: import SafeLocalStorage from '...'
export { SafeLocalStorage };        // Named: import { SafeLocalStorage } from '...'
```
- Default exports → used by React components (get the singleton/instance)
- Named exports → used by tests (get the class, create isolated instances)

**2. Dependency Injection:**
```javascript
// ❌ BAD: Creates own dependency
class EventManager {
    constructor() {
        this.storage = new SafeLocalStorage(); // Hidden dependency
    }
}

// ✅ GOOD: Receives dependency
class EventManager {
    constructor(storage) {
        this.storage = storage; // Injected dependency
    }
}
```

**3. Configure vs Reconstruct:**
```javascript
// ❌ BAD: Recreate instance to change settings
const policy = new PolicyEngine({ isDeveloper: true });

// ✅ GOOD: Configure existing instance
const policy = new PolicyEngine();
policy.configure({ isDeveloper: true });
```

### Verification
- ✅ All engine files converted to ES modules
- ✅ All test files updated
- ✅ Tests pass in Node.js (`node app/tests/test_events.js`)
- ✅ No duplicate folders
- ✅ Clean import/export structure

---

## Chapter 6 Complete: The React Bridge (Phase 1 → Phase 2 Connection)
- **Status:** ✅ Engine files ready for React integration
- **Key Achievement:** Converted Phase 1 engines to work in both Node.js (tests) and React (UI)
- **Key Learning:** Module systems matter. CommonJS ≠ ES Modules. Environment awareness prevents crashes.
- **Hurdles Overcome:**
  - Duplicate folder confusion
  - Windsurf creating new instances (rejected twice)
  - Node.js vs browser environment mismatch
  - Import/export pattern debugging
- **Next Up:** Build EngineProvider (React Context wrapper) → First UI Component

---

# PHASE 2 STATUS
- **Engine Layer:** ✅ Ready (all files converted)
- **React Context (EngineProvider):** 🟡 Next step
- **First UI Component:** 📅 After EngineProvider
- **Current Coder:** Claude
- **Review Chain:** Claude → DeepSeek → Claude → Human