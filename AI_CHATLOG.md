# FutureFit Quest — AI Chat Log

This file is the persistent record of decisions, architecture, and next steps.

## How we use this
- After each chat session, we append a short summary, decisions, and next steps.
- This is the source of truth for “project context” when we switch tools/windows.

---

## Project snapshot
- Repo has two main areas:
  - `app/`: React + Vite UI
  - `src/`: Node/CLI-style engine + tests

## Non-negotiable architecture principles
- Event sourcing: immutable event log is the single source of truth
- No local state for derived data (completion, progress, unlocks)
- Unidirectional flow: UI → (SessionManager/orchestrator) → engines → event log → derived state → UI
- Singleton injection: EventManager/SessionManager must be shared (props/context), not re-instantiated in components
- Mobile-first UX: responsive, non-blocking feedback, >=44px tap targets

## Current engine modules (conceptual)
- `SafeLocalStorage`: transactional-ish localStorage writes + checksum validation
- `EventManager`: standardizes and records events
- `ProgressService`: derives user state (xp, streak, completedNodes) from event history
- `SkillTree`: static DAG of content nodes (id/title/type/prereqs)
- `PolicyEngine`: access control/unlocks (+ developer mode)

## Current UI status (as of 2026-01-11)
- `app/src/App.jsx` is a minimal “engine connected” proof:
  - loads events via `SafeLocalStorage('ffq_ui_v1')`
  - derives state via `ProgressService.calculateUserState(history)`
  - shows XP

## Decisions
- Canonical engine implementation lives in `app/src/engine/*`.
- `src/` is reserved for static data assets (e.g., skill tree definitions), not active class logic.

## Open questions
- Do we implement a new `SessionManager` now, or do you already have one elsewhere?

---

# Documentation index (source files)

## High-priority (architecture / constraints)
- `# ARCHITECTURAL COMPLIANCE REPORT.md`
- `feedback from claude on Q&A and more.md`

## Background / progress log
- `DEVLOG.md`

## Key takeaways (distilled)
- Immutable event log is the single source of truth; derived state must be computed, not stored as “truth” in React local state.
- Engine singletons must be injected (Context/props); do not instantiate `EventManager` inside components.
- UI feedback must be non-blocking (no `alert()`), mobile-first, and accessible.
- “SessionManager orchestration” is the intended UI-to-engine boundary (per prior design + Claude feedback).

---

# Session log

## 2026-01-11 — Architecture onboarding
**Goal**
- Understand architecture first; no bug fixing.

**What we confirmed**
- Vite/React entry: `app/index.html` → `app/src/main.jsx` → `app/src/App.jsx`
- Engine is event-sourced: persist events → derive state → enforce policy/unlocks
- There is duplicated engine code between `src/data/*` (CommonJS) and `app/src/engine/*` (ESM)

**Next steps**
- Add a singleton provider (React Context) to inject engine instances (no per-component instantiation)
- Decide whether we implement a `SessionManager` orchestrator now

---

## Notes from you
- I will start from this to chat with you so we keep it documented to avoid losses.

---

## 2026-01-11 — Phase 2 planning: LessonPlayer.jsx enhancements
**Goal**
- Align your LessonPlayer implementation plan with the architecture and reviews captured earlier.

**What you proposed**
- Transient State Management: Clearly separated from persistent state
- Error Handling: try/catch with user-facing feedback
- Accessibility: aria-label, aria-busy, disabled states
- Feedback Orchestration: Integration of FeedbackOrchestrator utility
- Sticky Mobile Footer: Ensuring “Thumb Zone” is respected

**Alignment check**
- Your plan fits the architecture (no local persistent completion state; use FeedbackOrchestrator)
- It matches mobile-first and accessibility requirements from Claude’s review
- It aligns with the incremental, event-driven flow

**Notes on nesting**
- The log shows a high-level plan (Phase 2), but your proposed work is a concrete component implementation
- That’s fine: we can treat your LessonPlayer work as the first concrete piece within Phase 2
- We’ll still implement the foundational wrappers (SafeLocalStorage, incremental state, developer mode) before UI components, per DeepSeek/Claude recommendations

**Next step**
- Keep your LessonPlayer.jsx plan as the first UI component to build after foundations are in place
- Foundations first (SafeLocalStorage, incremental state, developer mode, interfaces)
- Then build LessonPlayer with your enhancements

---
## 2026-01-11 — Foundations implemented (SafeLocalStorage, incremental state, developer mode)
**Goal**
- Implement SafeLocalStorage wrapper with checksums and transaction safety
- Add incremental state derivation (not full replay on every load)
- Add developer mode to PolicyEngine
- Prepare for UI components (no per-component instantiation)

**What we did**
- Enhanced SafeLocalStorage:
  - Added lastProcessedId cache for incremental updates
  - Added getNewEventsSince() helper
  - Switched to ES module syntax for app/src/engine pattern
- Enhanced ProgressService:
  - Added caching and versioned derived state
  - Added _getNewEvents() to replay only new events
  - Updated to ES module syntax
- Enhanced PolicyEngine:
  - Added developer mode flag support
  - Added getVisualState() helper for UI fog/locked/unlocked states

**Status**
- Foundations are now compliant with DeepSeek/Claude recommendations.
- Ready to build EngineProvider (singleton injection via React Context) or begin first UI component.

**Next steps**
- Build EngineProvider (React Context) to inject singletons into the tree
- Begin LessonPlayer.jsx with your planned enhancements (transient state, error handling, accessibility, FeedbackOrchestrator integration, mobile-first layout)

---
## 2026-01-11 — Documentation ingestion & course design capture
**Goal**
- Capture your research/syllabus and course design into the log to survive context switches.

**What we added**
- Full research catalog and syllabus (AI-driven labor shift, course modules, gamified architecture)
- DeepSeek Senior Engineering Review (technical risks, localStorage safety, event replay performance, migration strategy)
- Claude Independent Review (strategic additions: FeedbackOrchestrator, NodeVisualStates, mobile-first patterns, freemium schema, accessibility requirements)
- Your detailed gamified course map (FutureFit Quest: Archipelago of Agency, skill trees, daily engagement loop, Stronghold capstone)

**Decisions captured**
- Canonical engine = `app/src/engine/*`; `src/` for static assets only
- Architecture v1.1 approved with mandatory safety wrappers before UI build
- Course design will be built as a self-contained, mobile-first, gamified learning experience

**Next steps**
- Implement SafeLocalStorage wrapper (checksums, transaction safety)
- Add incremental state derivation (not full replay on every load)
- Add developer mode to PolicyEngine
- Define TypeScript interfaces for events/state
- Add FeedbackOrchestrator and NodeVisualStates systems
- Plan PostgreSQL schema for Phase 4 migration
- Begin MVP prototype build (HTML/JS) with skill tree and fog-clearing visualization
