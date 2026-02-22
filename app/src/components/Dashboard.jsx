/**
 * Dashboard.jsx
 * 
 * The main progress view - shows user's learning state and available paths.
 * 
 * DESIGN CONCEPT: "Island Vista"
 * - Ocean blue gradients (learning journey as navigation)
 * - Card elevation = emerging from fog
 * - Warm accent colors for achievements (sunrise/sunset palette)
 * - Clean, confident typography (no generic fonts)
 * 
 * FEATURES:
 * - XP progress bar with level display
 * - Streak counter (gamification)
 * - Available lessons list (clickable)
 * - Developer mode toggle
 * 
 * RESPONSIVE:
 * - Mobile: Vertical stack, full-width cards
 * - Desktop: Two-column grid, horizontal XP bar
 */

import { useState, useEffect } from 'react';
import { useEngines } from '../contexts/EngineContext';
import RESKILLING_TREE from '../engine/SkillTree';

export default function Dashboard({ onStartLesson }) {
  const { sessionManager, policyEngine } = useEngines();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hardcoded userId for v0.1 (single user)
  const userId = 'user_001';

  useEffect(() => {
    async function loadDashboard() {
      try {
        const progressData = await sessionManager.getCurrentProgress(userId);
        setProgress(progressData);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [sessionManager]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-sky-200 text-xl font-light animate-pulse">
          Loading your journey...
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-red-300">Failed to load progress. Check console.</div>
      </div>
    );
  }

  // Calculate XP progress to next level
  const xpToNextLevel = progress.xpToNextLevel || 100;
  const xpProgress = 100 - xpToNextLevel;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-sky-800/30 backdrop-blur-sm bg-slate-900/20">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-sky-100">
                FutureFit Quest
              </h1>
              <p className="text-sky-300/70 text-sm mt-1">
                Navigate the archipelago of knowledge
              </p>
            </div>
            
            {/* Developer Mode Toggle */}
            <DeveloperToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Progress Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* XP Card */}
          <XPCard 
            level={progress.level || 1} 
            xp={progress.xp || 0}
            xpProgress={xpProgress}
            xpToNextLevel={xpToNextLevel}
          />
          
          {/* Streak Card */}
          <StreakCard streak={progress.streak || 0} />
        </div>

        {/* Skill Map — all nodes, fog-clearing */}
        <SkillMap
          nodes={RESKILLING_TREE}
          userState={{
            completedNodes: progress.completedNodes || [],
            attemptedNodes: progress.attemptedNodes || [],
          }}
          policyEngine={policyEngine}
          onStartLesson={onStartLesson}
        />
      </main>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * XP Progress Card
 * Shows level, current XP, and progress bar to next level
 */
function XPCard({ level, xp, xpProgress, xpToNextLevel }) {
  return (
    <div className="bg-gradient-to-br from-sky-900/40 to-blue-900/40 backdrop-blur-md rounded-2xl p-6 border border-sky-700/30 shadow-xl hover:shadow-sky-500/20 transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sky-300/70 text-sm uppercase tracking-wider font-medium">
            Navigator Level
          </p>
          <p className="text-5xl font-bold text-sky-100 mt-1">
            {level}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sky-300/70 text-sm">Total XP</p>
          <p className="text-2xl font-semibold text-amber-300">
            {xp}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-sky-300/70 mb-2">
          <span>Progress to Level {level + 1}</span>
          <span>{Math.round(xpProgress)}%</span>
        </div>
        <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-full transition-all duration-500 ease-out shadow-lg shadow-amber-500/50"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <p className="text-sky-300/50 text-xs mt-2">
          {xpToNextLevel} XP to next level
        </p>
      </div>
    </div>
  );
}

/**
 * Streak Counter Card
 * Shows consecutive days learning
 */
function StreakCard({ streak }) {
  return (
    <div className="bg-gradient-to-br from-orange-900/40 to-amber-900/40 backdrop-blur-md rounded-2xl p-6 border border-orange-700/30 shadow-xl hover:shadow-amber-500/20 transition-shadow duration-300">
      <p className="text-amber-300/70 text-sm uppercase tracking-wider font-medium mb-2">
        Learning Streak
      </p>
      
      <div className="flex items-baseline gap-3">
        <p className="text-6xl font-bold text-amber-100">
          {streak}
        </p>
        <p className="text-2xl text-amber-300/70">
          {streak === 1 ? 'day' : 'days'}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-800/50 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full animate-pulse" />
        </div>
        <span className="text-xs text-amber-300/70">🔥</span>
      </div>
      
      <p className="text-amber-300/50 text-xs mt-3">
        {streak === 0 
          ? 'Complete a lesson to start your streak!' 
          : `Keep it going! Come back tomorrow.`
        }
      </p>
    </div>
  );
}

/**
 * Skill Map
 * Shows ALL nodes in the tree, styled by visual state.
 * Fog-clearing metaphor: locked nodes are visible but obscured.
 */
function SkillMap({ nodes, userState, policyEngine, onStartLesson }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-sky-100 mb-2">
        Skill Map
      </h2>
      <p className="text-sky-300/60 text-sm mb-6">
        Complete lessons to clear the fog and unlock new paths.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nodes.map((node) => {
          const visualState = policyEngine.getVisualState(node.id, userState);
          return (
            <LessonCard
              key={node.id}
              lesson={node}
              visualState={visualState}
              onStart={onStartLesson}
            />
          );
        })}
      </div>
    </div>
  );
}

// Per-state visual config
const STATE_CONFIG = {
  COMPLETED: {
    cardClass: 'from-slate-800/40 to-slate-900/40 border-slate-600/30 opacity-70',
    badge: <span className="text-green-400 text-xs font-medium">✓ Done</span>,
    overlay: null,
    clickable: true,
  },
  IN_PROGRESS: {
    cardClass: 'from-sky-900/50 to-blue-900/50 border-sky-500/50',
    badge: <span className="text-sky-300 text-xs font-medium animate-pulse">● In Progress</span>,
    overlay: null,
    clickable: true,
  },
  UNLOCKED_NEW: {
    cardClass: 'from-indigo-900/50 to-blue-900/50 border-indigo-400/60 shadow-indigo-500/30 animate-[glow-pulse_2s_ease-in-out_infinite]',
    badge: <span className="text-indigo-300 text-xs font-medium">✦ New</span>,
    overlay: null,
    clickable: true,
  },
  LOCKED_NEAR: {
    cardClass: 'from-slate-800/30 to-slate-900/30 border-slate-600/20 cursor-not-allowed',
    badge: <span className="text-slate-400 text-xs">🔒 Almost unlocked</span>,
    overlay: (
      <div className="absolute inset-0 rounded-xl bg-slate-900/40 backdrop-blur-[1px] flex items-end justify-center pb-3">
        <span className="text-slate-400 text-xs">1 prerequisite remaining</span>
      </div>
    ),
    clickable: false,
  },
  LOCKED_FAR: {
    cardClass: 'from-slate-900/60 to-slate-900/80 border-slate-700/20 cursor-not-allowed',
    badge: null,
    overlay: (
      <div className="absolute inset-0 rounded-xl bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
        <span className="text-slate-600 text-2xl">▓</span>
      </div>
    ),
    clickable: false,
  },
};

const TYPE_EMOJI = {
  video: '🎥',
  quiz: '❓',
  simulation: '🎮',
  challenge: '⚡',
};

/**
 * Individual Lesson Card — rendered for all 5 visual states
 */
function LessonCard({ lesson, visualState, onStart }) {
  const cfg = STATE_CONFIG[visualState] || STATE_CONFIG.LOCKED_FAR;
  const emoji = TYPE_EMOJI[lesson.type] || '📖';

  return (
    <div className="relative">
      <button
        onClick={cfg.clickable ? () => onStart(lesson.id) : undefined}
        disabled={!cfg.clickable}
        aria-disabled={!cfg.clickable}
        className={`
          w-full text-left p-6 rounded-xl border
          bg-gradient-to-br ${cfg.cardClass}
          backdrop-blur-md shadow-lg
          transition-all duration-200
          ${cfg.clickable ? 'hover:scale-[1.02] active:scale-[0.98] hover:shadow-sky-500/20' : ''}
        `}
        style={{ minHeight: '44px' }}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-3xl" aria-hidden="true">
            {visualState === 'LOCKED_FAR' ? '🌫️' : emoji}
          </span>
          {cfg.badge}
        </div>

        <h3 className={`text-lg font-semibold mb-1 ${visualState === 'LOCKED_FAR' ? 'text-slate-600' : 'text-sky-100'}`}>
          {visualState === 'LOCKED_FAR' ? '???' : lesson.title}
        </h3>

        <p className={`text-sm capitalize ${visualState === 'LOCKED_FAR' ? 'text-slate-700' : 'text-sky-300/60'}`}>
          {visualState === 'LOCKED_FAR' ? 'Complete earlier lessons to reveal' : lesson.type}
        </p>
      </button>

      {/* State overlay (fog/lock) */}
      {cfg.overlay}

      {/* Glow ring for UNLOCKED_NEW */}
      {visualState === 'UNLOCKED_NEW' && (
        <div className="absolute inset-0 rounded-xl border-2 border-indigo-400/40 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}

/**
 * Developer Mode Toggle
 * Reads isDeveloper from PolicyEngine singleton (no hardcoding).
 */
function DeveloperToggle() {
  const { policyEngine } = useEngines();
  const isDeveloper = policyEngine.isDeveloper;

  return (
    <div className="flex items-center gap-3 bg-slate-800/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700/30">
      <div className={`w-2 h-2 rounded-full ${isDeveloper ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
      <span className="text-sm text-sky-300/70">
        {isDeveloper ? 'Developer Mode' : 'Student Mode'}
      </span>
    </div>
  );
}
