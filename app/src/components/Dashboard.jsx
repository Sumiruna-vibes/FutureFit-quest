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

export default function Dashboard() {
  const { sessionManager } = useEngines();
  const [progress, setProgress] = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Hardcoded userId for v0.1 (single user)
  // v1.0: Get from auth context
  const userId = 'user_001';

  // Load progress on mount
  useEffect(() => {
    async function loadDashboard() {
      try {
        const [progressData, lessons] = await Promise.all([
          sessionManager.getCurrentProgress(userId),
          sessionManager.getAvailableLessons(userId)
        ]);
        
        setProgress(progressData);
        setAvailableLessons(lessons);
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
  const xpProgress = ((progress.xp % xpToNextLevel) / xpToNextLevel) * 100;

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

        {/* Available Lessons */}
        <LessonsList 
          lessons={availableLessons}
          completedNodes={progress.completedNodes || []}
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
          {xpToNextLevel - (xp % xpToNextLevel)} XP to next level
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
 * Available Lessons List
 * Shows unlocked lessons as clickable cards
 */
function LessonsList({ lessons, completedNodes }) {
  if (lessons.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-md rounded-2xl p-12 border border-slate-700/30 text-center">
        <p className="text-sky-300/70 text-lg">
          🎉 All lessons completed! More content coming soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-sky-100 mb-6">
        Available Lessons
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lessons.map((lesson) => (
          <LessonCard 
            key={lesson.id} 
            lesson={lesson}
            isCompleted={completedNodes.includes(lesson.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual Lesson Card
 * Clickable card for a single lesson
 */
function LessonCard({ lesson, isCompleted }) {
  const handleClick = () => {
    // v0.1: Just log - v0.2 will navigate to LessonPlayer
    console.log('Navigate to lesson:', lesson.id);
    alert(`v0.1: Navigation to ${lesson.title} not yet implemented.\nNext: Build LessonPlayer component!`);
  };

  // Type-specific styling
  const typeConfig = {
    video: { emoji: '🎥', color: 'from-purple-900/40 to-violet-900/40', border: 'border-purple-700/30' },
    quiz: { emoji: '❓', color: 'from-blue-900/40 to-cyan-900/40', border: 'border-blue-700/30' },
    simulation: { emoji: '🎮', color: 'from-green-900/40 to-emerald-900/40', border: 'border-green-700/30' },
    challenge: { emoji: '⚡', color: 'from-red-900/40 to-orange-900/40', border: 'border-red-700/30' }
  };

  const config = typeConfig[lesson.type] || typeConfig.quiz;

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left p-6 rounded-xl border ${config.border}
        bg-gradient-to-br ${config.color} backdrop-blur-md
        hover:scale-[1.02] active:scale-[0.98] 
        transition-all duration-200
        shadow-lg hover:shadow-sky-500/20
        ${isCompleted ? 'opacity-60' : ''}
      `}
      style={{ minHeight: '44px' }} // Mobile tap target
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-3xl" aria-hidden="true">{config.emoji}</span>
        {isCompleted && (
          <span className="text-green-400 text-sm">✓ Completed</span>
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-sky-100 mb-1">
        {lesson.title}
      </h3>
      
      <p className="text-sky-300/60 text-sm capitalize">
        {lesson.type}
      </p>
    </button>
  );
}

/**
 * Developer Mode Toggle
 * Shows current mode, allows toggling (v0.2: implement actual toggle)
 */
function DeveloperToggle() {
  // v0.1: Read-only display
  // v1.0: Implement actual toggle that reconfigures PolicyEngine
  const isDeveloper = true; // Hardcoded in EngineContext

  return (
    <div className="flex items-center gap-3 bg-slate-800/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700/30">
      <div className={`w-2 h-2 rounded-full ${isDeveloper ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
      <span className="text-sm text-sky-300/70">
        {isDeveloper ? 'Developer Mode' : 'Student Mode'}
      </span>
      
      {/* v0.2: Add actual toggle button here */}
      <span className="text-xs text-sky-400/50 ml-2">(v0.1: display only)</span>
    </div>
  );
}
