/**
 * EngineContext.jsx
 * 
 * The single entry point where Phase 1 engines become available to React.
 * 
 * WHAT THIS FILE DOES:
 *   1. Creates the React Context object (the "container")
 *   2. Exports EngineProvider — the component that instantiates singletons
 *   3. Exports useEngines — the hook every component uses to access engines
 * 
 * WHAT THIS FILE DOES NOT DO:
 *   - Cache derived state (XP, streak, etc.) — components derive on demand
 *   - Subscribe to events or trigger re-renders — that's a future concern
 *   - Import or instantiate engines anywhere else in the app
 * 
 * WHY SINGLETON HERE:
 *   Decision 3 (Architecture_Decisions_Log): One instance per engine.
 *   useMemo guarantees they're created once, in the browser (not at import time),
 *   which keeps Node.js test environments safe.
 * 
 * INSTANTIATION ORDER (dependency chain):
 *   1. SafeLocalStorage  ← no deps (foundation)
 *   2. EventManager      ← needs storage injected
 *   3. ProgressService   ← no constructor deps (receives event history via method call later)
 *   4. PolicyEngine      ← no constructor deps (configured via .configure() after creation)
 * 
 * FUTURE MIGRATION NOTE (Phase 4):
 *   When we move to multi-user, replace the useMemo block with a factory
 *   that creates per-user instances. Components using useEngines() won't
 *   need to change at all — that's the point of this abstraction layer.
 */

import { createContext, useContext, useMemo } from 'react';

// Engine classes — imported by name so tests can also import them independently
import { SafeLocalStorage } from '../engine/SafeLocalStorage.js';
import { EventManager }      from '../engine/EventManager.js';
import { ProgressService }   from '../engine/ProgressService.js';
import { PolicyEngine }      from '../engine/PolicyEngine.js';
import SessionManager        from '../engine/SessionManager.js';

// ---------------------------------------------------------------------------
// PART 1: The Context
// ---------------------------------------------------------------------------
// Default value is null. If useEngines() is called outside a Provider,
// the safety check in the hook will catch it and throw a clear error.
// ---------------------------------------------------------------------------

const EngineContext = createContext(null);

// ---------------------------------------------------------------------------
// PART 2: The Provider
// ---------------------------------------------------------------------------
// Wrap <App /> with this in main.jsx:
//
//   <EngineProvider>
//     <App />
//   </EngineProvider>
//
// useMemo ensures engines are instantiated exactly once for the lifetime
// of the provider. The empty dependency array [] means "create once, never
// recreate." This is intentional — these are singletons.
// ---------------------------------------------------------------------------

export function EngineProvider({ children }) {
  const engines = useMemo(() => {
    // 1. Storage — the foundation everything else writes to
    const storage = new SafeLocalStorage('ffq_v1');

    // 2. EventManager — records user actions as immutable events
    //    Receives storage via dependency injection (Decision 3)
    const eventManager = new EventManager(storage);

    // 3. ProgressService — derives XP, streak, etc. from event history
    //    No constructor deps. Called later: progressService.calculateUserState(events)
    const progressService = new ProgressService();

    // 4. PolicyEngine — enforces progression rules via the Skill Tree DAG
    //    No constructor deps. Configured separately so the singleton
    //    instance can have its settings changed at runtime without
    //    being destroyed and recreated.
    const policyEngine = new PolicyEngine();
    policyEngine.configure({ isDeveloper: true });

    // 5. SessionManager — orchestrates workflows between UI and engines
    //    Receives all engines via dependency injection
    const sessionManager = new SessionManager({
      storage,
      eventManager,
      progressService,
      policyEngine
    });

    return { storage, eventManager, progressService, policyEngine, sessionManager };
  }, []);

  return (
    <EngineContext.Provider value={engines}>
      {children}
    </EngineContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// PART 3: The Consumer Hook
// ---------------------------------------------------------------------------
// Every component that needs engine access calls this:
//
//   const { sessionManager } = useEngines();
//   
//   // Primary workflow (most components only need this):
//   await sessionManager.handleLessonCompletion(userId, nodeId, attemptData);
//
//   // Direct engine access (if needed for specific cases):
//   const { eventManager, progressService, policyEngine } = useEngines();
//
// The safety check at the top prevents silent failures if someone
// forgets to wrap the tree in <EngineProvider>.
// ---------------------------------------------------------------------------

export function useEngines() {
  const engines = useContext(EngineContext);

  if (engines === null) {
    throw new Error(
      'useEngines() was called outside of an <EngineProvider>. ' +
      'Wrap your component tree in <EngineProvider> in main.jsx.'
    );
  }

  return engines;
}
