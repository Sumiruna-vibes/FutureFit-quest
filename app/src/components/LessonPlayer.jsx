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
import FeedbackOrchestrator from './FeedbackOrchestrator';

export default function LessonPlayer({ nodeId, userId, onComplete }) {
  const { sessionManager } = useEngines();
  const [node, setNode] = useState(null);
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const consecutiveErrorsRef = useRef(0);
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

      if (!completionResult.feedback.isCorrect) {
        consecutiveErrorsRef.current += 1;
        setConsecutiveErrors(consecutiveErrorsRef.current);
      }

      setResult(completionResult);
    } catch (error) {
      console.error('Submission failed:', error);
      setResult({ success: false, feedback: { isCorrect: false, message: `Error: ${error.message}` }, progressUpdate: { xp: 0 } });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHint = () => {
    setHintsUsed(prev => prev + 1);
    setHintVisible(true);
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

  // No question (video lesson placeholder)
  if (!question) {
    return <VideoPlaceholder node={node} onComplete={onComplete} />;
  }

  // Show result screen after submission
  if (result) {
    const handleFeedbackContinue = () => {
      if (result.feedback.isCorrect) {
        onComplete(result);
      } else {
        // Stay on the same question — reset for retry
        setResult(null);
        setUserAnswer('');
      }
    };

    return (
      <FeedbackOrchestrator
        result={result}
        consecutiveErrors={consecutiveErrorsRef.current}
        timeElapsed={timeElapsed}
        onContinue={handleFeedbackContinue}
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

            {/* Hint Panel */}
            {hintVisible && (
              <div className="mt-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg text-amber-200 text-sm animate-[fadeIn_0.3s_ease-in]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">💡</span>
                    <span>
                      {question.hint || 'No hint available for this question. Think carefully about the key concepts!'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHintVisible(false)}
                    className="text-amber-400/60 hover:text-amber-200 transition-colors shrink-0 text-lg leading-none"
                    aria-label="Close hint"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

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

const VIDEO_MIN_SECONDS = 10;

/**
 * Video Lesson Placeholder
 * Requires minimum time on screen before allowing completion.
 */
function VideoPlaceholder({ node, onComplete }) {
  const [elapsed, setElapsed] = useState(0);
  const canComplete = elapsed >= VIDEO_MIN_SECONDS;

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => {
        if (prev >= VIDEO_MIN_SECONDS) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = VIDEO_MIN_SECONDS - elapsed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-8 border border-slate-700/30 max-w-md text-center">
        <h1 className="text-2xl font-bold text-sky-100 mb-2">{node?.title}</h1>
        <p className="text-sky-300 text-lg mb-4">
          📹 Video lesson
        </p>
        <p className="text-sky-400/70 text-sm mb-6">
          Real video coming in a future update. Review the topic, then continue.
        </p>
        {!canComplete && (
          <p className="text-amber-300/80 text-sm mb-4">
            Please spend at least {remaining}s on this lesson before continuing…
          </p>
        )}
        <button
          onClick={() => onComplete({ success: true })}
          disabled={!canComplete}
          className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ minHeight: '44px' }}
        >
          {canComplete ? 'Mark Complete & Continue' : `Wait ${remaining}s…`}
        </button>
      </div>
    </div>
  );
}

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
