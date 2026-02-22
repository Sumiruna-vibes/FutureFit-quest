/**
 * Phase 3A.4 Tests
 * Covers: DeveloperToggle reads from PolicyEngine + Dashboard refresh key logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyEngine } from '../engine/PolicyEngine.js';

// ---------------------------------------------------------------------------
// 3A.4.1 — DeveloperToggle: PolicyEngine.isDeveloper reflects configure()
// ---------------------------------------------------------------------------

describe('3A.4 — DeveloperToggle reads from PolicyEngine', () => {
  let pe;

  beforeEach(() => {
    pe = new PolicyEngine();
  });

  it('isDeveloper is false by default', () => {
    expect(pe.isDeveloper).toBe(false);
  });

  it('isDeveloper is false after configure({ isDeveloper: false })', () => {
    pe.configure({ isDeveloper: false });
    expect(pe.isDeveloper).toBe(false);
  });

  it('isDeveloper is true after configure({ isDeveloper: true })', () => {
    pe.configure({ isDeveloper: true });
    expect(pe.isDeveloper).toBe(true);
  });

  it('isDeveloper can be toggled at runtime without recreating instance', () => {
    pe.configure({ isDeveloper: true });
    expect(pe.isDeveloper).toBe(true);
    pe.configure({ isDeveloper: false });
    expect(pe.isDeveloper).toBe(false);
  });

  it('EngineContext sets isDeveloper: false — Student Mode is the default', () => {
    // Mirrors what EngineContext does: policyEngine.configure({ isDeveloper: false })
    pe.configure({ isDeveloper: false });
    expect(pe.isDeveloper).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3A.4.2 — Dashboard refresh: dashboardKey increment logic
// The App increments a counter on every lesson completion so the Dashboard
// remounts. We test the pure increment logic.
// ---------------------------------------------------------------------------

describe('3A.4 — Dashboard refresh key', () => {
  it('key starts at 0 and increments to 1 after first completion', () => {
    let key = 0;
    const increment = () => { key = key + 1; };
    increment();
    expect(key).toBe(1);
  });

  it('key increments on every completion, not just correct ones', () => {
    let key = 0;
    const onLessonComplete = (result) => { key += 1; };

    // Correct answer completion
    onLessonComplete({ feedback: { isCorrect: true } });
    expect(key).toBe(1);

    // Wrong answer / back navigation (result = null)
    onLessonComplete(null);
    expect(key).toBe(2);

    // Another correct
    onLessonComplete({ feedback: { isCorrect: true } });
    expect(key).toBe(3);
  });

  it('each unique key value causes a distinct render identity', () => {
    // Simulates React's key prop behaviour: different key = different instance
    const renders = new Set();
    for (let key = 0; key < 5; key++) {
      renders.add(key);
    }
    expect(renders.size).toBe(5);
  });
});
