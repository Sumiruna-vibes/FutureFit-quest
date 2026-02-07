/**
 * LessonPlayer.jsx
 * 
 * Interactive lesson component - displays questions and handles user submissions.
 * 
 * FEATURES (v0.1 Standard):
 * - Supports 3 question types: multiple choice, numeric, text
 * - Timer tracking (time spent on question)
 * - Hint counter
 * - Feedback display with 2-second auto-navigation
 * - Loading states
 * 
 * DESIGN:
 * - Matches Dashboard's Island Vista aesthetic
 * - Ocean gradients, warm feedback colors
 * - Mobile-first, 44px tap targets
 * 
 * NAVIGATION:
 * - Receives lesson via props
 * - Calls onComplete(result) when done
 * - Parent handles navigation back to Dashboard
 */

import { useState, useEffect, useRef } from 'react';
import { useEngines } from '../contexts/EngineContext';
import { getNode, getQuestion } from '../engine/SkillTree';

export default function LessonPlayer({ nodeId, userId, onComplete }) {
  const { sessionManager } = useEngines();
  const [node, setNode] = useState(null);
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Timer update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Load lesson data
  useEffect(() => {
    const lessonNode = getNode(nodeId);
    if (!lessonNode) {
      console.error(`Node ${nodeId} not found`);
      return;
    }

    setNode(lessonNode);

    if (lessonNode.hasQuestion) {
      const questionData = getQuestion(nodeId);
      setQuestion(questionData);
    }
  }, [nodeId]);

  // Auto-navigate after success (2 second delay)
  useEffect(() => {
    if (result?.success && result?.feedback?.isCorrect) {
      const timer = setTimeout(() => {
        onComplete(result);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [result, onComplete]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const attemptData = {
        submissionUuid: crypto.randomUUID(),
        userAnswer: userAnswer,
        timeSpentMs: Date.now() - startTime,
        hintsUsed: hintsUsed
      };

      const completionResult = await sessionManager.handleLessonCompletion(
        userId,
        nodeId,
        attemptData
      );

      setResult(completionResult);
    } catch (error) {
      console.error('Submission failed:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHint = () => {
    setHintsUsed(prev => prev + 1);
    // v0.1: Just increment counter
    // v0.2: Show actual hint text
    alert('Hint feature coming in v0.2!\nFor now, this just tracks that you used a hint (affects your score).');
  };

  // Loading state
  if (!node) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-sky-200 text-xl font-light animate-pulse">
          Loading lesson...
        </div>
      </div>
    );
  }

  // No question (video lesson - skipped in v0.1)
  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-8 border border-slate-700/30 max-w-md text-center">
          <p className="text-sky-300 text-lg mb-4">
            📹 Video lessons coming in v0.2!
          </p>
          <p className="text-sky-400/70 text-sm mb-6">
            For now, video lessons are skipped. Starting with interactive quizzes.
          </p>
          <button
            onClick={() => onComplete({ success: true })}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
            style={{ minHeight: '44px' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show result screen after submission
  if (result) {
    return (
      <ResultScreen 
        result={result}
        timeElapsed={timeElapsed}
        onContinue={() => onComplete(result)}
      />
    );
  }

  // Main lesson view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-sky-800/30 backdrop-blur-sm bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onComplete(null)}
              className="text-sky-300 hover:text-sky-100 transition-colors text-sm"
              style={{ minHeight: '44px' }}
            >
              ← Back to Dashboard
            </button>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-sky-300/70">
              <div className="flex items-center gap-2">
                <span>⏱️</span>
                <span>{formatTime(timeElapsed)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💡</span>
                <span>{hintsUsed} hints</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <div className="bg-gradient-to-br from-slate-800/60 to-blue-900/40 backdrop-blur-md rounded-2xl p-8 border border-sky-700/30 shadow-2xl">
          {/* Lesson Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-sky-100 mb-2">
              {node.title}
            </h1>
            <p className="text-sky-300/60 text-sm capitalize">
              {node.type}
            </p>
          </div>

          {/* Question */}
          <div className="mb-8">
            <p className="text-xl text-sky-100 leading-relaxed">
              {question.prompt}
            </p>
          </div>

          {/* Answer Input (type-specific) */}
          <form onSubmit={handleSubmit}>
            <QuestionInput
              question={question}
              userAnswer={userAnswer}
              onChange={setUserAnswer}
              disabled={submitting}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                type="button"
                onClick={handleHint}
                disabled={submitting}
                className="px-6 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px' }}
              >
                💡 Get Hint
              </button>

              <button
                type="submit"
                disabled={submitting || !userAnswer}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px' }}
              >
                {submitting ? 'Checking...' : 'Submit Answer'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Question Input Component
 * Renders appropriate input based on question type
 */
function QuestionInput({ question, userAnswer, onChange, disabled }) {
  switch (question.questionType) {
    case 'multiple_choice':
      return (
        <div className="space-y-3">
          {question.options.map((option) => (
            <label
              key={option.id}
              className={`
                block p-4 rounded-lg border cursor-pointer transition-all
                ${userAnswer === option.id
                  ? 'bg-sky-600/30 border-sky-400'
                  : 'bg-slate-700/20 border-slate-600/30 hover:border-sky-500/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              style={{ minHeight: '44px' }}
            >
              <input
                type="radio"
                name="answer"
                value={option.id}
                checked={userAnswer === option.id}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="sr-only"
              />
              <div className="flex items-center gap-3">
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${userAnswer === option.id ? 'border-sky-400' : 'border-slate-500'}
                `}>
                  {userAnswer === option.id && (
                    <div className="w-3 h-3 rounded-full bg-sky-400" />
                  )}
                </div>
                <span className="text-sky-100">{option.text}</span>
              </div>
            </label>
          ))}
        </div>
      );

    case 'numeric':
      return (
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter your answer..."
          className="w-full px-6 py-4 bg-slate-700/30 border border-slate-600/30 rounded-lg text-sky-100 text-lg placeholder-sky-300/30 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all disabled:opacity-50"
          style={{ minHeight: '44px' }}
        />
      );

    case 'text':
      return (
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer..."
          className="w-full px-6 py-4 bg-slate-700/30 border border-slate-600/30 rounded-lg text-sky-100 text-lg placeholder-sky-300/30 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all disabled:opacity-50"
          style={{ minHeight: '44px' }}
        />
      );

    default:
      return <div className="text-red-300">Unknown question type: {question.questionType}</div>;
  }
}

/**
 * Result Screen Component
 * Shows feedback after submission with auto-navigation countdown
 */
function ResultScreen({ result, timeElapsed, onContinue }) {
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    if (!result.feedback.isCorrect) return; // Only countdown for correct answers

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [result.feedback.isCorrect]);

  const isCorrect = result.feedback.isCorrect;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className={`
        bg-gradient-to-br backdrop-blur-md rounded-2xl p-8 border shadow-2xl max-w-md w-full text-center
        ${isCorrect 
          ? 'from-green-900/40 to-emerald-900/40 border-green-700/30' 
          : 'from-red-900/40 to-orange-900/40 border-red-700/30'
        }
      `}>
        {/* Icon */}
        <div className="text-7xl mb-6">
          {isCorrect ? '🎉' : '💭'}
        </div>

        {/* Feedback Message */}
        <h2 className={`text-3xl font-bold mb-4 ${isCorrect ? 'text-green-100' : 'text-orange-100'}`}>
          {isCorrect ? 'Correct!' : 'Not Quite'}
        </h2>

        <p className="text-lg text-sky-200 mb-8">
          {result.feedback.message}
        </p>

        {/* Stats */}
        <div className="bg-slate-900/30 rounded-lg p-4 mb-8">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-sky-300/70">Time Taken</p>
              <p className="text-sky-100 font-semibold text-lg">{formatTime(timeElapsed)}</p>
            </div>
            <div>
              <p className="text-sky-300/70">XP Earned</p>
              <p className="text-amber-300 font-semibold text-lg">
                +{result.feedback.isCorrect ? result.progressUpdate.xp : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button / Countdown */}
        {isCorrect ? (
          <div className="text-sky-300/70 text-sm">
            Continuing in {countdown}s...
          </div>
        ) : (
          <button
            onClick={onContinue}
            className="w-full px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all shadow-lg"
            style={{ minHeight: '44px' }}
          >
            Try Again or Continue
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
