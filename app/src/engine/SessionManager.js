/**
 * SessionManager v0.1
 * 
 * The Workflow Orchestrator - sits between UI components and Phase 1 engines.
 * 
 * ARCHITECTURE ROLE:
 * User Action → SessionManager → [Assessment → Storage → Progress → Policy] → Result
 * 
 * V1.0 MIGRATION NOTES (see DEVLOG Chapter 7 for full checklist):
 * - Replace inline validation with AssessmentEngine.validate()
 * - Add meta.assessmentEngineVersion to events
 * - Replace fail-fast with transactional rollback
 * - Implement full achievement detection (currently stubbed)
 * - Add feedback template system
 * 
 * Migration checklist: DEVLOG_Chapter_7_SessionManager.md
 * Architecture rationale: Architecture_Decisions_Log.md Decision 4
 */

import { getNode, getQuestion, getUnlockedNodes } from './SkillTree.js';
import RESKILLING_TREE from './SkillTree.js';

/**
 * @typedef {Object} AttemptData
 * @property {string} submissionUuid - Client-generated UUID for idempotency
 * @property {any} userAnswer - The user's answer (string | number | array)
 * @property {number} timeSpentMs - Time spent on question in milliseconds
 * @property {number} hintsUsed - Number of hints clicked (0 if none)
 */

/**
 * @typedef {Object} CompletionResult
 * @property {boolean} success - Whether the workflow completed successfully
 * @property {Object} nextNode - The next lesson node to display
 * @property {Object} progressUpdate - Current XP, streak, level, etc.
 * @property {Array} achievements - Badges earned (v0.1: always empty)
 * @property {Object} feedback - Correctness, message, celebration trigger
 */

class SessionManager {
  /**
   * @param {Object} engines - The Phase 1 engines injected via dependency injection
   * @param {Object} engines.storage - SafeLocalStorage instance
   * @param {Object} engines.eventManager - EventManager instance
   * @param {Object} engines.progressService - ProgressService instance
   * @param {Object} engines.policyEngine - PolicyEngine instance
   */
  constructor(engines) {
    this.storage = engines.storage;
    this.eventManager = engines.eventManager;
    this.progressService = engines.progressService;
    this.policyEngine = engines.policyEngine;
    
    // V0.1 metadata for event tracking
    this.version = '0.1.0';
    
    // Track processed submissions for idempotency
    this._processedSubmissions = new Set();
  }

  // =========================================================================
  // PRIMARY ACTION: Lesson Completion Workflow
  // =========================================================================

  /**
   * Orchestrates the full lesson completion workflow.
   * 
   * WORKFLOW STEPS:
   * 1. Idempotency check (prevent duplicate submissions)
   * 2. Validate answer (v0.1: inline; v1.0: Assessment Engine)
   * 3. Write attempt event to storage
   * 4. Calculate updated progress
   * 5. Determine next node
   * 6. Check for celebration-worthy milestones
   * 7. Return structured result
   * 
   * @param {string} userId - The user ID
   * @param {string} nodeId - The lesson node ID
   * @param {AttemptData} attemptData - The attempt details from UI
   * @returns {Promise<CompletionResult>} The result with next node, progress, feedback
   */
  async handleLessonCompletion(userId, nodeId, attemptData) {
    // STEP 1: Idempotency Check
    // Architecture.pdf: "Make attempt_events writes idempotent by accepting 
    // a client-generated submission_uuid"
    if (this._processedSubmissions.has(attemptData.submissionUuid)) {
      console.warn(`⚠️ [SessionManager] Duplicate submission detected: ${attemptData.submissionUuid}`);
      // Return cached result or throw - for v0.1, we'll throw
      throw new Error('DUPLICATE_SUBMISSION');
    }

    // STEP 2: Validate Answer
    // V0.1: Simple inline validation
    // V1.0: Replace with await this.assessmentEngine.validate(...)
    const assessment = this._validateAnswer(nodeId, attemptData);

    // STEP 3: Write Attempt Event
    // Build the complete event payload with all metadata
    const eventPayload = {
      nodeId: nodeId,
      questionId: this._getQuestionId(nodeId), // v0.1: derived from nodeId
      submissionUuid: attemptData.submissionUuid,
      userAnswer: attemptData.userAnswer,
      timeSpentMs: attemptData.timeSpentMs,
      hintsUsed: attemptData.hintsUsed,
      isCorrect: assessment.isCorrect,
      scoreAwarded: assessment.scoreAwarded,
      misconceptionCode: assessment.misconceptionCode // v0.1: always null
    };

    // Add session manager version to metadata
    // EventManager will add timestamp, eventId, and userAgent automatically
    const eventId = this.eventManager.recordEvent(
      userId, 
      'QUIZ_ATTEMPT', 
      eventPayload
    );

    // Mark this submission as processed
    this._processedSubmissions.add(attemptData.submissionUuid);

    // STEP 4: Calculate Updated Progress
    const userHistory = this.eventManager.getUserHistory(userId);
    const progressUpdate = this.progressService.calculateUserState(userHistory);

    // STEP 5: Determine Next Node
    // Get list of completed nodes from user history
    const completedNodes = this._getCompletedNodes(userHistory);
    
    // Add current node to completed list
    if (assessment.isCorrect) {
      completedNodes.push(nodeId);
    }
    
    // Find next available node
    const nextNode = this._getNextNode(completedNodes);

    // STEP 6: Check for Celebrations
    // v0.1: Only branch completion
    // v1.0: Add streak milestones, level-ups, tree completion
    const celebration = this._checkCelebrations(userId, nodeId, progressUpdate);

    // STEP 7: Return Structured Result
    return {
      success: true,
      nextNode: nextNode,
      progressUpdate: progressUpdate,
      achievements: [], // v0.1 stub - implement in v1.0
      feedback: {
        isCorrect: assessment.isCorrect,
        message: assessment.message,
        celebration: celebration // null or 'BRANCH_COMPLETE'
      }
    };
  }

  // =========================================================================
  // STATE ACCESS: Progress Queries
  // =========================================================================

  /**
   * Returns the user's current progress state.
   * 
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} XP, streak, level, current node, etc.
   */
  async getCurrentProgress(userId) {
    const userHistory = this.eventManager.getUserHistory(userId);
    const progress = this.progressService.calculateUserState(userHistory);
    
    // Get completed nodes from history
    const completedNodes = this._getCompletedNodes(userHistory);
    
    // Find current/next node
    const nextNode = this._getNextNode(completedNodes);
    
    return {
      ...progress,
      completedNodes: completedNodes,
      currentNode: nextNode
    };
  }

  // =========================================================================
  // NAVIGATION: Available Lessons
  // =========================================================================

  /**
   * Returns the list of lessons currently unlocked for the user.
   * 
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of available lesson nodes
   */
  async getAvailableLessons(userId) {
    const userHistory = this.eventManager.getUserHistory(userId);
    const completedNodes = this._getCompletedNodes(userHistory);
    
    // Use SkillTree helper to get unlocked nodes
    const unlocked = getUnlockedNodes(completedNodes);
    
    // Filter through PolicyEngine (respects developer mode)
    return unlocked.filter(node => {
      const access = this.policyEngine.canAccessNode(node.id, { completedNodes });
      return access.allowed;
    });
  }

  // =========================================================================
  // ACHIEVEMENTS: Badge/Milestone Detection
  // =========================================================================

  /**
   * Checks if the user has earned any new achievements.
   * 
   * V0.1: Returns empty array (stub)
   * V1.0: Implement full badge detection logic
   * 
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of newly earned badges
   */
  async checkAchievements(userId) {
    // V0.1 STUB
    // V1.0: Implement detection for:
    // - Streak milestones (7, 30, 100 days)
    // - XP level-ups
    // - Tree/branch completions
    // - Mastery unlocks
    return [];
  }

  // =========================================================================
  // DEBUG: System State Inspector
  // =========================================================================

  /**
   * Returns raw engine state for developer mode debugging.
   * 
   * SECURITY: This should only be accessible when isDeveloper === true
   * 
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Complete system state snapshot
   */
  async getSystemState(userId) {
    const userHistory = this.eventManager.getUserHistory(userId);
    const progress = this.progressService.calculateUserState(userHistory);
    const availableNodes = await this.getAvailableLessons(userId);
    
    return {
      version: this.version,
      userId: userId,
      eventCount: userHistory.length,
      progress: progress,
      availableNodes: availableNodes,
      processedSubmissions: Array.from(this._processedSubmissions),
      timestamp: new Date().toISOString()
    };
  }

  // =========================================================================
  // PRIVATE METHODS: Internal Logic
  // =========================================================================

  /**
   * V0.1 INLINE VALIDATION
   * 
   * Simple validation logic for structured question types.
   * Uses SkillTree question metadata for correct answers.
   * 
   * V1.0 MIGRATION: Replace entire method with:
   * ```
   * const assessment = await this.assessmentEngine.validate({
   *   questionId: nodeId,
   *   questionType: question.type,
   *   rubric: question.rubric,
   *   userAnswer: attemptData.userAnswer,
   *   locale: 'en-US'
   * });
   * ```
   * 
   * @private
   */
  _validateAnswer(nodeId, attemptData) {
    const { userAnswer, hintsUsed } = attemptData;

    // Get question metadata from SkillTree
    const question = getQuestion(nodeId);
    
    if (!question) {
      throw new Error(`Node ${nodeId} does not have a question`);
    }

    const { questionType, correctAnswer } = question;
    let isCorrect = false;
    let baseScore = 10; // Fixed score for v0.1

    // Type-specific validation
    switch (questionType) {
      case 'multiple_choice':
        isCorrect = userAnswer === correctAnswer;
        break;
      
      case 'numeric':
        // Use tolerance from question metadata if provided
        const tolerance = question.tolerance || 0.01;
        isCorrect = Math.abs(parseFloat(userAnswer) - parseFloat(correctAnswer)) < tolerance;
        break;
      
      case 'text':
        // Check if question specifies case sensitivity
        const caseSensitive = question.caseSensitive || false;
        if (caseSensitive) {
          isCorrect = userAnswer.trim() === correctAnswer.trim();
        } else {
          isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();
        }
        break;
      
      default:
        throw new Error(`Unknown question type: ${questionType}`);
    }

    // Apply hint penalty (v0.1: simple linear penalty)
    const scoreAwarded = isCorrect ? Math.max(baseScore - (hintsUsed * 2), 1) : 0;

    // V0.1: Static feedback messages
    // V1.0: Look up from feedback template database using misconceptionCode
    const message = isCorrect 
      ? 'Correct! Well done.' 
      : 'Not quite right. Try reviewing the lesson.';

    return {
      isCorrect: isCorrect,
      scoreAwarded: scoreAwarded,
      message: message,
      misconceptionCode: null // V1.0: Assessment Engine will detect this
    };
  }

  /**
   * Checks if this completion triggered any celebration-worthy milestones.
   * 
   * V0.1: Only branch completion
   * V1.0: Add streak milestones, level-ups, tree completion
   * 
   * @private
   */
  _checkCelebrations(userId, nodeId, progressUpdate) {
    // V0.1: Simple branch completion check
    // This is a placeholder - PolicyEngine would need a method like:
    // this.policyEngine.isBranchComplete(userId, nodeId)
    
    // For now, return null (no celebration)
    // V1.0: Implement sophisticated milestone detection
    return null;
  }

  /**
   * Derives question ID from node ID.
   * 
   * V0.1: Node ID is the question ID
   * V1.0: May have separate question IDs if questions are reused across nodes
   * 
   * @private
   */
  _getQuestionId(nodeId) {
    // V0.1: Simple 1:1 mapping
    // Each node has at most one question, so nodeId = questionId
    return `q_${nodeId}`;
  }

  /**
   * Extracts list of completed node IDs from user's event history.
   * 
   * A node is "completed" when the user answered its question correctly.
   * 
   * @private
   */
  _getCompletedNodes(userHistory) {
    const completedSet = new Set();
    
    userHistory.forEach(event => {
      if (event.type === 'QUIZ_ATTEMPT' && event.payload.isCorrect) {
        completedSet.add(event.payload.nodeId);
      }
    });
    
    return Array.from(completedSet);
  }

  /**
   * Determines the next node the user should attempt.
   * 
   * V0.1: Simple linear progression through tree
   * V1.0: Could use adaptive logic (difficulty adjustment, spaced repetition)
   * 
   * @private
   */
  _getNextNode(completedNodes) {
    // Find first unlocked node that isn't completed
    const available = getUnlockedNodes(completedNodes);
    
    if (available.length === 0) {
      // All nodes completed or no nodes unlocked
      // Return null or a "course complete" marker
      return null;
    }
    
    // V0.1: Return first available node
    // V1.0: Could apply adaptive logic here
    return available[0];
  }
}

// Export the class for EngineContext to instantiate
export default SessionManager;

// Named export for testing
export { SessionManager };