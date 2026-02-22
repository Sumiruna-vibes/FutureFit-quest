# Phase 3: Engagement & Polish — FutureFit Quest

**Date:** February 21, 2026
**Authored by:** Claude Opus 4.6 (replanning from Sonnet draft)
**Pace:** 3 hrs/week

---

## Context

Phase 1 (engine) and Phase 2 (Dashboard + LessonPlayer) are complete. The app runs, records events, derives state from the event log, and enforces progression. But the experience is skeletal — three placeholder lessons, static feedback text, no visual distinction between locked/unlocked nodes, and no gamification beyond a number going up.

Phase 3 closes the gap between "it works" and "I want to use it every day."

**Sources:**
- `docs/architecture/FutureFit-Quest-Architecture-v1.1.md` — authoritative design spec
- `docs/architecture/concept.pdf` — product vision (6 trees, 30+ lessons, gamification)
- `DEVLOG.md` Chapter 7 — V1.0 migration checklist, architectural decisions
- Codebase audit (this session) — current state of all engine + UI files

---

## What Sonnet's Plan Missed

1. **The content gap is massive.** concept.pdf describes 6 trees x 2 branches x 2-3 leaves = ~30 nodes with 12+ interaction types (swipe quiz, drag-drop, roleplay, detective mode, boss battles, flashcards, etc.). The current app has 3 placeholder nodes and supports only 3 types (multiple_choice, numeric, text). "Replace placeholder content" is not a 2-hour task — it requires building new UI components for each interaction type.

2. **AssessmentEngine is misplaced.** It only becomes useful when you have content that needs grading beyond simple equality checks. Building it before new interaction types exist means building a grader with nothing to grade.

3. **The gamification layer goes far beyond badges.** concept.pdf describes: Momentum Meter (streak), Cognitive Credits (XP), Insight Gems (premium currency), Sector Visas (badges as passport stamps), Cohort Leagues (leaderboards), Daily Sprint (spaced repetition), Boss Battles, Community Commons. Only XP and streak exist today.

4. **Stronghold is better defined than claimed.** concept.pdf specifies which tree unlocks which building block (Audit Block, Tool Armory, Moat of Uniqueness), the three-part output structure (Tech Stack, Human Stack, Pivot Strategy), and the LinkedIn certification. Enough to start engineering from.

---

## The Honest Scope Question

Building everything in concept.pdf is ~60-80 hours of work. At 3 hrs/week, that's 5-6 months. Phase 3 needs to be scoped to what makes the app **usable and enjoyable** without trying to ship the entire product vision.

**Phase 3 goal:** A learner can open the app daily, complete real lessons across multiple trees, receive satisfying feedback, earn badges, and see meaningful progression through a fog-clearing skill tree. The Stronghold and advanced gamification (gems, leaderboards, daily sprint) are Phase 3.5 or later.

---

## Phase 3A — Make It Feel Right (weeks 1-3, ~6 hrs)

### 3A.1 — LessonPlayer Bug Fixes (30 min)
**Files:** `app/src/components/LessonPlayer.jsx`

Two anti-patterns from the audit:
1. **Hints use `alert()`** (line ~102-107) — replace with an inline hint panel that slides open below the question. Architecture explicitly prohibits `alert()` for mobile UX.
2. **Video lessons are a dead end** (lines ~121-141) — currently just a "Back to Dashboard" button. Add a minimum time-on-screen before marking complete (placeholder until real videos exist).

**Teaching moment:** Why `alert()` is banned — it blocks the JavaScript thread, prevents animations, and on mobile Safari it looks like a system error, not app feedback.

---

### 3A.2 — FeedbackOrchestrator UI Component (3 hrs)
**Files:** New `app/src/components/FeedbackOrchestrator.jsx`, modify `LessonPlayer.jsx`
**Spec:** Architecture v1.1 Section 3.3, DEVLOG Ch7 lines 756-777

This is the single biggest UX improvement possible. Currently, getting a question right shows a green screen with "Correct!" in plain text. The architecture spec calls for intensity-based celebration:

| Intensity | Trigger | Visual |
|---|---|---|
| `MAJOR` | First correct after 3+ failures, or streak milestone (every 10th) | Confetti burst, 2000ms, glow effect |
| `STANDARD` | Regular correct answer | Checkmark pop, 800ms |
| `RECOVERY` | Correct after 1 failure | Encouraging pulse, 1200ms |

**Critical architectural rule (DEVLOG Ch7):** FeedbackOrchestrator is a **UI-layer React component**, not an engine class. SessionManager returns raw business data (`{ isCorrect, celebration, streak }`). The component decides what that means visually. Four reasons: testability, maintainability, future flexibility, accessibility.

**What to build:**
- A React component that receives `result.feedback` + streak context
- Determines intensity from the data
- Renders CSS animations (confetti can be pure CSS or a tiny library)
- Respects `prefers-reduced-motion` media query
- Replaces the static `ResultScreen` in LessonPlayer

**Teaching moment:** Separation of concerns in practice — the engine doesn't know about confetti, the UI doesn't know about scoring rules.

---

### 3A.3 — NodeVisualStates: 5-State Rendering (2 hrs)
**Files:** `app/src/engine/PolicyEngine.js`, `app/src/components/Dashboard.jsx`
**Spec:** Architecture v1.1 Section 3.2

The architecture defines 5 visual states. The current code has 3 (`LOCKED`, `UNLOCKED`, `COMPLETED`). The Dashboard currently hides locked nodes entirely. The vision is a fog-clearing map where you can see what's coming.

| State | Logic | Visual Treatment |
|---|---|---|
| `LOCKED_FAR` | >1 prerequisite away | Dim silhouette, shrouded in fog |
| `LOCKED_NEAR` | All prereqs met except one | Visible but greyed, "Coming Soon" label |
| `UNLOCKED_NEW` | Just became available | Glowing border, pulse animation |
| `IN_PROGRESS` | User started but hasn't completed | Active color, progress indicator |
| `COMPLETED` | Done | Checkmark, slightly dimmed |

**What to build:**
- Upgrade `PolicyEngine.getVisualState()` to distinguish all 5 states
- Show ALL nodes on Dashboard (not just unlocked ones) — the fog-clearing metaphor requires seeing the full map
- Style each `LessonCard` variant distinctly

**Teaching moment:** State machines — every node is always in exactly one of 5 states, transitions are deterministic from the event log.

---

### 3A.4 — Dashboard Polish (30 min)
**Files:** `app/src/components/Dashboard.jsx`

Two small fixes:
1. `DeveloperToggle` has a hardcoded `const isDeveloper = true` on line 304 — should read from the actual PolicyEngine state (or be removed since isDeveloper is now `false`)
2. Dashboard doesn't refresh after lesson completion — when `onComplete` fires in App.jsx, the Dashboard remounts but `useEffect` depends on `[sessionManager]` which hasn't changed. Add a refresh trigger.

---

## Phase 3B — Make It Real (weeks 4-7, ~9 hrs)

### 3B.1 — Skill Tree Content: Structure First (2 hrs)
**Files:** `app/src/engine/SkillTree.js`

Build the full DAG from concept.pdf — all 6 trees, 12 branches, ~30 leaves — but **using only the 3 existing question types** (multiple_choice, numeric, text). Write real questions based on the course content. Interaction types that don't exist yet (drag-drop, roleplay, etc.) get placeholder questions of supported types.

The 6 trees from concept.pdf:

| # | Tree | Theme | Branches |
|---|---|---|---|
| 1 | Automation Outpost | AI automation literacy | The Shift, The Machine's Mind |
| 2 | Prompting Port | Prompt engineering | Syntax of Power, Advanced Whispering |
| 3 | Ethics Watchtower | AI ethics & values | Bias Radar, Values Framework |
| 4 | Strategy Citadel | AI strategy for non-tech | Workflow Architecture, Trust Protocol |
| 5 | Human Sanctuary | Irreplaceable human skills | Emotional Intelligence, Cognitive Flexibility |
| 6 | Resilience Horizon | Career future-proofing | Pivot Mindset, Future Proofing |

**Why structure first:** Having 30 real nodes makes NodeVisualStates meaningful, lets us test the full progression flow, and gives us real content to play with for FeedbackOrchestrator tuning. The fancy interaction types come later.

---

### 3B.2 — New Interaction Types: Drag-Drop + Swipe (4 hrs)
**Files:** New `app/src/components/interactions/DragDrop.jsx`, `SwipeQuiz.jsx`; modify `LessonPlayer.jsx`, `SessionManager.js`

concept.pdf calls for 12+ interaction types. We build the two most impactful ones first:
1. **Drag & Drop** — used in ~5 lessons (timelines, ordering, matching). React DnD or native drag events for mobile.
2. **Swipe Quiz** — the signature interaction ("swipe left for AI, right for human"). Touch-friendly, Tinder-style cards.

**What this requires:**
- New React components for each interaction type
- `QuestionInput` in LessonPlayer needs to dispatch to the right component based on `questionType`
- SessionManager's `_validateAnswer()` needs new cases (or this motivates AssessmentEngine)

---

### 3B.3 — Achievement / Badge System (3 hrs)
**Files:** `app/src/engine/SessionManager.js`, new `app/src/components/BadgeDisplay.jsx`
**Spec:** DEVLOG Ch7 migration item #4

concept.pdf calls badges "Sector Visas" — digital stamps in a passport. Each completed tree earns one.

**What to build:**
- Badge definitions (6 tree-completion badges + streak milestones at 7, 30, 100)
- `_detectAchievements()` in SessionManager — check after each lesson completion
- Replace `achievements: []` stub with real data
- `BadgeDisplay` component — shown in FeedbackOrchestrator on earn, and in a new Dashboard section

---

## Phase 3C — The Big Pieces (weeks 8-12, ~10 hrs)

### 3C.1 — Stronghold: Spec + Initial Build (4 hrs)
**Files:** New `app/src/components/Stronghold.jsx`, new `app/src/engine/StrongholdService.js`

concept.pdf actually defines this well enough to start:

| Completed Tree | Unlocked Block | User Action |
|---|---|---|
| 1: Automation Outpost | "Audit Block" | Input 3 tasks you will automate |
| 2: Prompting Port | "Tool Armory" | Input 3 AI tools you will master |
| 5: Human Sanctuary | "Moat of Uniqueness" | Select top 3 soft skills |
| 3, 4, 6 | (to be defined) | (extend the pattern) |

Final output: PDF with three parts (Tech Stack, Human Stack, Pivot Strategy) + "FutureFit Architect" certification.

**v0.2 scope:** Build the Stronghold tab, the building-block unlock trigger (listen for TREE_COMPLETE events), and the user input forms. PDF export is Phase 4.

---

### 3C.2 — AssessmentEngine (6 hrs, split across 2 sessions)
**Files:** New `app/src/engine/AssessmentEngine.js`, modify `SessionManager.js`
**Spec:** Architecture v1.1 Section 3.4, DEVLOG Ch7 items #1-2

Now that we have real content and new interaction types, build the proper grader:
- Strategy pattern: one validator per question type
- `validate()` returns `{ verdict, score, misconceptionCode, confidence }`
- Replace inline `_validateAnswer()` in SessionManager
- Add `meta.assessmentEngineVersion` to events

**Why last:** The inline validation works fine for multiple_choice/numeric/text. AssessmentEngine adds value when we have drag-drop, swipe, and eventually semantic text grading — which only exist after 3B.2.

---

## Deferred (Phase 3.5 or Phase 4)

| Feature | Why deferred |
|---|---|
| Premium currency (Insight Gems) | Needs backend for persistence + payment |
| Leaderboards (Cohort Leagues) | Needs multi-user backend |
| Daily Sprint (spaced repetition) | Needs spaced repetition algorithm + notification system |
| Boss Battles | Needs timed quiz UI + special content authoring |
| Community Commons | Needs backend + moderation |
| Friday Simulation Sprint | Needs branching narrative engine |
| Feedback Templates (misconception DB) | Needs AssessmentEngine + content DB |
| Error handling (transactional rollback) | Only matters with real DB |
| PDF export for Stronghold | Needs PDF generation library |
| LinkedIn certification | Needs backend verification system |

---

## Phase 3 Summary

| Chunk | Feature | Effort | Week |
|---|---|---|---|
| 3A.1 | LessonPlayer bug fixes | 30 min | 1 |
| 3A.2 | FeedbackOrchestrator UI | 3 hrs | 1-2 |
| 3A.3 | NodeVisualStates (5-state) | 2 hrs | 2 |
| 3A.4 | Dashboard polish | 30 min | 2 |
| 3B.1 | Skill Tree content (30 nodes, existing types) | 2 hrs | 3 |
| 3B.2 | New interactions (drag-drop + swipe) | 4 hrs | 4-5 |
| 3B.3 | Achievement / Badge system | 3 hrs | 5-6 |
| 3C.1 | Stronghold (spec + initial UI) | 4 hrs | 7-8 |
| 3C.2 | AssessmentEngine | 6 hrs | 9-10 |
| **Total** | | **~25 hrs** | **~10 weeks** |

---

## Key Differences from Sonnet's Plan

| Sonnet said | Opus says |
|---|---|
| Skill Tree content = 2 hrs (just swap data) | 2 hrs for structure + 4 hrs for new interaction types = 6 hrs minimum. You can't have real content without new UI components. |
| AssessmentEngine = 10 hrs, do last | 6 hrs (inline validation already covers the basics), but agreed it goes last — build the content it needs to grade first. |
| Stronghold = "authoring only, no code" | concept.pdf has enough spec to start building. 4 hrs for initial UI + unlock triggers. PDF export deferred. |
| FeedbackOrchestrator at chunk 3.3 | Moved to 3A.2 — it's the single biggest UX win and should ship in week 1-2. |
| Badges depend on FeedbackOrchestrator | Partially true, but the dependency is soft. Badge detection is engine logic; badge display can use FeedbackOrchestrator OR be standalone. |

---

*Generated by Claude Opus 4.6 — Phase 3 Planning Session, February 21, 2026*
