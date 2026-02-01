# Phase Status Quick Reference

**Last Updated:** Dec 27, 2025  
**Current Phase:** 2 (React UI Layer)

---

## Review Workflow (CURRENT)

```
Claude (Primary Coder)
    ↓ generates code
DeepSeek (Engineering Reviewer)
    ↓ checks for violations
Human (Final Decision)
    ↓ approves/rejects
```

**Previous Coder:** Windsurf (dropped - too many architectural violations)  
**Previous Reviewer Setup:** Windsurf → DeepSeek → Claude  
**Current Setup:** Claude → DeepSeek → Human

---

## Core Principles (Non-Negotiable)

1. **Event Sourcing:** All state derived from immutable attempt_events
2. **Unidirectional Flow:** UI → SessionManager → Engines → Event Log
3. **Mobile-First:** 44px tap targets, non-blocking feedback, responsive
4. **Dependency Injection:** Engines injected via React Context (never `new` in components)
5. **No Local State for Derived Data:** Derive from event log
6. **3 Hours/Week Pace:** Sustainable > perfect

---

## Anti-Patterns (PROHIBITED)

❌ `new SafeLocalStorage()` or `new EventManager()` in components  
❌ `useState` for completion/progress (derive from events)  
❌ `alert()` for feedback (use inline UI)  
❌ `require()` (use ES module `import`)  
❌ Desktop-first design  
❌ localStorage/sessionStorage in artifacts  

---

## Project Structure

```
futurefit-quest/
├── app/
│   └── src/
│       ├── engine/                    ✅ Phase 1 (Complete)
│       │   ├── SafeLocalStorage.js    ✅ Hardened (Chapter 5)
│       │   ├── EventManager.js        ✅ ES Modules + DI
│       │   ├── ProgressService.js     ✅ ES Modules + Singleton
│       │   ├── PolicyEngine.js        ✅ ES Modules + configure()
│       │   └── SkillTree.js           ✅ Static data
│       ├── contexts/                  🟡 Phase 2 (Next)
│       │   └── EngineContext.jsx      ⏸️ TO BE BUILT
│       └── components/               📅 After EngineProvider
├── app/tests/                         ✅ All tests passing
│   ├── test_storage.js
│   ├── test_events.js
│   ├── test_logic.js
│   └── test_policy.js
├── docs/
│   ├── Phase_Status_Quickref.md       📄 This file
│   ├── reviews/
│   │   └── Architecture_Decisions_Log.md
│   └── AI_Context_Handoff_Template.md
├── DEVLOG.md                          📖 Full history (Chapters 1-6)
└── package.json                       ✅ "type": "module" set
```

---

## Phase 1: The Invisible Engine ✅ COMPLETE

**Components Built:**
- SafeLocalStorage (Chapter 1, hardened in Chapter 5)
- EventManager (Chapter 2)
- ProgressService (Chapter 3)
- PolicyEngine (Chapter 4)

**Key Decisions:**
- Event sourcing pattern (immutable logs)
- Path B security (DJB2 hash + single backup)
- Singleton pattern for engines

**Tests:** All 4 passing ✅

---

## Phase 2: React UI Layer 🟡 IN PROGRESS

### Completed:
- [x] All engine files converted to ES Modules
- [x] All test files updated and passing
- [x] Singleton pattern implemented
- [x] Duplicate folders cleaned up
- [x] Node.js vs Browser environment issue resolved
- [x] Workflow changed: Claude (coder) → DeepSeek (reviewer) → Human

### Current Task: Build EngineProvider
- [ ] Create `app/src/contexts/EngineContext.jsx`
- [ ] Import engine classes
- [ ] Create singleton instances inside useMemo
- [ ] Configure PolicyEngine with userProfile
- [ ] Export useEngine hook
- [ ] DeepSeek review
- [ ] Human approval

### After EngineProvider:
- [ ] First UI Component (Dashboard or LessonPlayer)
- [ ] FeedbackOrchestrator component
- [ ] Mobile-first layout implementation

---

## Phase 3: Polish & Content 📅 FUTURE
**Not Started**

---

## Phase 4: Backend Migration 📅 FUTURE
**Not Started**  
- Node.js + Express
- PostgreSQL (replaces localStorage)
- Singleton → Factory pattern migration
- Deployment: Vercel + Railway

---

## Important: Node.js vs Browser

**Engine files export classes (not pre-created instances):**
- Tests: Create isolated instances with mock localStorage
- React: EngineProvider creates singletons in browser environment

**Why:** Node.js has no `localStorage`. Singletons created on import crash in Node.

---

## Starting a New Context Window

### Attach These Files:
1. `DEVLOG.md` (full project history)
2. `docs/Phase_Status_Quickref.md` (this file)
3. `docs/reviews/Architecture_Decisions_Log.md` (why decisions were made)

### Then Say:
```
Continuing FutureFit Quest development.
Current phase: [X]
Current task: [Y]
Your role: [Primary Coder / Reviewer]
```

### Claude Will:
1. Acknowledge architecture understanding
2. State which principles apply
3. Show plan before generating code
4. Wait for approval

---

## Key Lessons Learned

1. **Clean project structure first** - Duplicate folders waste everyone's time
2. **ES Modules everywhere** - CommonJS breaks React/Vite
3. **Environment awareness** - Code must work in both Node.js and browser
4. **AI coders need architecture briefs** - They forget between sessions
5. **Incremental validation** - Review each change before proceeding
6. **Sustainable pace** - 3hrs/week, no pressure, solid ground