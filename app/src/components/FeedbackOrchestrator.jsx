/**
 * FeedbackOrchestrator.jsx
 *
 * UI-layer component that decides how to celebrate (or console) the learner.
 * SessionManager provides raw business data; this component owns the visuals.
 *
 * INTENSITY LEVELS
 * ────────────────
 * MAJOR    – first correct after 3+ failures, OR every 10th-streak milestone
 *            → confetti burst, 2000 ms, gold glow
 * RECOVERY – correct after 1-2 failures
 *            → encouraging pulse, 1200 ms
 * STANDARD – any other correct answer
 *            → checkmark pop, 800 ms
 * INCORRECT – wrong answer
 *            → shake + soft red, manual dismiss
 *
 * ACCESSIBILITY
 * ─────────────
 * All motion is suppressed when `prefers-reduced-motion: reduce` is set.
 * Confetti particles are aria-hidden.
 *
 * PROPS
 * ─────
 * result            {Object}  – CompletionResult from SessionManager
 * consecutiveErrors {number}  – wrong answers before this submission (tracked by LessonPlayer)
 * onContinue        {fn}      – called when the user continues / auto-timer fires
 * timeElapsed       {number}  – seconds, for the stats bar
 */

import { useState, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Intensity resolution
// ---------------------------------------------------------------------------

function resolveIntensity(result, consecutiveErrors) {
  if (!result.feedback.isCorrect) return 'INCORRECT';

  const streak = result.progressUpdate?.streak ?? 0;
  const isStreakMilestone = streak > 0 && streak % 10 === 0;

  if (consecutiveErrors >= 3 || isStreakMilestone) return 'MAJOR';
  if (consecutiveErrors >= 1) return 'RECOVERY';
  return 'STANDARD';
}

// Duration (ms) before auto-navigating on correct answers
const AUTO_NAVIGATE_MS = { MAJOR: 2000, RECOVERY: 1200, STANDARD: 800 };

// ---------------------------------------------------------------------------
// Confetti (pure JS, aria-hidden)
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = [
  '#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6', '#fb923c'
];

function ConfettiParticle({ style }) {
  return (
    <span
      aria-hidden="true"
      className="confetti-particle"
      style={style}
    />
  );
}

function Confetti() {
  const particles = Array.from({ length: 60 }, (_, i) => {
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const left = `${Math.random() * 100}%`;
    const animDelay = `${Math.random() * 0.6}s`;
    const size = `${6 + Math.random() * 8}px`;
    const rotation = `${Math.random() * 360}deg`;
    return { color, left, animDelay, size, rotation };
  });

  return (
    <div className="confetti-container" aria-hidden="true">
      {particles.map((p, i) => (
        <ConfettiParticle
          key={i}
          style={{
            '--color': p.color,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.animDelay,
            transform: `rotate(${p.rotation})`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function FeedbackOrchestrator({ result, consecutiveErrors, onContinue, timeElapsed }) {
  const intensity = resolveIntensity(result, consecutiveErrors);
  const isCorrect = result.feedback.isCorrect;
  const autoDuration = isCorrect ? AUTO_NAVIGATE_MS[intensity] : null;

  const [countdown, setCountdown] = useState(
    autoDuration ? Math.round(autoDuration / 1000) : null
  );

  // Auto-navigate timer
  useEffect(() => {
    if (!autoDuration) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const config = INTENSITY_CONFIG[intensity];

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${config.bg}`}>
      {/* Confetti — MAJOR only, respects reduced-motion via CSS */}
      {intensity === 'MAJOR' && isCorrect && <Confetti />}

      <div className={`
        relative z-10 rounded-2xl p-8 border shadow-2xl max-w-md w-full text-center
        backdrop-blur-md
        ${config.card}
        ${config.animationClass}
      `}>
        {/* Icon */}
        <div className={`text-7xl mb-6 ${intensity === 'MAJOR' ? 'animate-bounce' : ''}`}>
          {config.icon}
        </div>

        {/* Heading */}
        <h2 className={`text-3xl font-bold mb-3 ${config.headingColor}`}>
          {config.heading}
        </h2>

        {/* Message from engine */}
        <p className="text-lg text-sky-200 mb-6">
          {result.feedback.message}
        </p>

        {/* Streak badge — MAJOR milestone */}
        {intensity === 'MAJOR' && isCorrect && (result.progressUpdate?.streak ?? 0) >= 10 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-200 text-sm mb-6">
            🔥 {result.progressUpdate.streak}-answer streak!
          </div>
        )}

        {/* Stats */}
        <div className="bg-slate-900/30 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-sky-300/70">Time</p>
              <p className="text-sky-100 font-semibold text-lg">{formatTime(timeElapsed)}</p>
            </div>
            <div>
              <p className="text-sky-300/70">XP Earned</p>
              <p className="text-amber-300 font-semibold text-lg">
                +{isCorrect ? (result.progressUpdate?.xp ?? 0) : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Continue button / countdown */}
        {isCorrect ? (
          <p className="text-sky-300/70 text-sm">
            Continuing in {countdown}s…
          </p>
        ) : (
          <button
            onClick={onContinue}
            className="w-full px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all shadow-lg"
            style={{ minHeight: '44px' }}
          >
            Try Again
          </button>
        )}
      </div>

      {/* Inline styles for animations and confetti */}
      <FeedbackStyles />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intensity config table
// ---------------------------------------------------------------------------

const INTENSITY_CONFIG = {
  MAJOR: {
    bg: 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900',
    card: 'from-yellow-900/30 to-amber-900/30 border-yellow-500/40 bg-gradient-to-br',
    icon: '🏆',
    heading: 'Outstanding!',
    headingColor: 'text-yellow-100',
    animationClass: 'feedback-glow-gold',
  },
  RECOVERY: {
    bg: 'bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900',
    card: 'from-teal-900/40 to-emerald-900/30 border-teal-600/40 bg-gradient-to-br',
    icon: '💪',
    heading: 'You Got It!',
    headingColor: 'text-teal-100',
    animationClass: 'feedback-pulse-teal',
  },
  STANDARD: {
    bg: 'bg-gradient-to-br from-slate-900 via-green-900 to-slate-900',
    card: 'from-green-900/40 to-emerald-900/40 border-green-700/30 bg-gradient-to-br',
    icon: '✅',
    heading: 'Correct!',
    headingColor: 'text-green-100',
    animationClass: 'feedback-pop-check',
  },
  INCORRECT: {
    bg: 'bg-gradient-to-br from-slate-900 via-red-950 to-slate-900',
    card: 'from-red-900/40 to-orange-900/40 border-red-700/30 bg-gradient-to-br',
    icon: '💭',
    heading: 'Not Quite',
    headingColor: 'text-orange-100',
    animationClass: 'feedback-shake',
  },
};

// ---------------------------------------------------------------------------
// CSS animations injected as a style tag
// ---------------------------------------------------------------------------

function FeedbackStyles() {
  return (
    <style>{`
      /* ── Card entrance animations ── */
      .feedback-pop-check {
        animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      .feedback-pulse-teal {
        animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both,
                   pulseTeal 1.2s ease-in-out 0.5s infinite;
      }
      .feedback-glow-gold {
        animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        box-shadow: 0 0 40px 8px rgba(251, 191, 36, 0.35);
      }
      .feedback-shake {
        animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both,
                   shake 0.5s ease-in-out 0.4s;
      }

      @keyframes popIn {
        from { opacity: 0; transform: scale(0.85); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes pulseTeal {
        0%, 100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
        50%       { box-shadow: 0 0 24px 6px rgba(20, 184, 166, 0.3); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%       { transform: translateX(-8px); }
        40%       { transform: translateX(8px); }
        60%       { transform: translateX(-5px); }
        80%       { transform: translateX(5px); }
      }

      /* ── Confetti ── */
      .confetti-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }
      .confetti-particle {
        position: absolute;
        top: -10px;
        display: block;
        border-radius: 2px;
        background: var(--color);
        animation: confettiFall 1.8s ease-in forwards;
      }
      @keyframes confettiFall {
        0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
        80%  { opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }

      /* ── Respect reduced motion ── */
      @media (prefers-reduced-motion: reduce) {
        .feedback-pop-check,
        .feedback-pulse-teal,
        .feedback-glow-gold,
        .feedback-shake,
        .confetti-particle,
        .animate-bounce {
          animation: none !important;
        }
      }
    `}</style>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
