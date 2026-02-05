/**
 * SkillTree.js
 * 
 * The Content Graph - defines the learning path structure.
 * 
 * STRUCTURE:
 * - Nodes represent lessons/activities (videos, quizzes, simulations)
 * - Prerequisites create a Directed Acyclic Graph (DAG)
 * - Question metadata enables SessionManager to validate answers
 * 
 * V0.1 ENHANCEMENTS (Feb 2026):
 * - Added question metadata for quiz/challenge nodes
 * - questionType, correctAnswer, options for validation
 * 
 * V1.0 TODO:
 * - Move to database/JSON config file
 * - Add rubrics for open-ended questions
 * - Add misconception patterns
 * - Add feedback templates per question
 */

const RESKILLING_TREE = [
    // =========================================================================
    // MODULE 1: Introduction to Data Thinking
    // =========================================================================
    
    {
        id: 'module_1_intro',
        title: 'Why Data Matters',
        type: 'video',
        prerequisites: [], // Start here
        
        // Video-specific metadata
        duration: 180, // 3 minutes
        videoUrl: null, // v0.1: placeholder, v1.0: actual URL
        
        // No question metadata (not a quiz)
        hasQuestion: false
    },
    
    {
        id: 'module_1_quiz',
        title: 'Data vs. Information',
        type: 'quiz',
        prerequisites: ['module_1_intro'],
        
        // Question metadata for SessionManager validation
        hasQuestion: true,
        question: {
            prompt: 'What is the main difference between data and information?',
            questionType: 'multiple_choice',
            correctAnswer: 'B',
            options: [
                { id: 'A', text: 'Data is stored in databases, information is stored in files' },
                { id: 'B', text: 'Data is raw facts, information is data with context and meaning' },
                { id: 'C', text: 'Data is numerical, information is textual' },
                { id: 'D', text: 'Data is old, information is current' }
            ],
            
            // V1.0: Add these fields when Assessment Engine exists
            // misconceptionPatterns: {
            //   'A': 'CONFUSES_STORAGE_WITH_MEANING',
            //   'C': 'CONFUSES_FORMAT_WITH_SEMANTICS',
            //   'D': 'CONFUSES_RECENCY_WITH_VALUE'
            // },
            // feedbackTemplateId: 'data_vs_info_001',
            // rubric: null // Not needed for multiple choice
        }
    },
    
    // =========================================================================
    // MODULE 2: Excel Logic Basics
    // =========================================================================
    
    {
        id: 'module_2_excel',
        title: 'Excel Logic Basics',
        type: 'simulation',
        prerequisites: ['module_1_quiz'],
        
        // Simulation-specific metadata
        simulationType: 'interactive_demo',
        
        // This node teaches concepts, has a practice question at the end
        hasQuestion: true,
        question: {
            prompt: 'If cell A1 contains 10 and B1 contains 20, what does =A1+B1 return?',
            questionType: 'numeric',
            correctAnswer: 30,
            tolerance: 0.01, // Allow floating-point rounding
            
            // v0.1: Numeric validation
            // v1.0: Parse Excel formula syntax
        }
    },
    
    // =========================================================================
    // MODULE 3: Python for Non-Coders
    // =========================================================================
    
    {
        id: 'module_3_python',
        title: 'Python for Non-Coders',
        type: 'challenge',
        prerequisites: ['module_2_excel'],
        
        hasQuestion: true,
        question: {
            prompt: 'What keyword do you use to create a function in Python?',
            questionType: 'text',
            correctAnswer: 'def',
            caseSensitive: true, // Python keywords are case-sensitive
            
            // v0.1: Simple string match
            // v1.0: Accept variations like "def " or "def()" and provide hints
        }
    },
    
    // =========================================================================
    // FUTURE MODULES (Locked until Module 3 complete)
    // =========================================================================
    
    // V1.0: Add more modules as content is developed
    // Example structure:
    // {
    //   id: 'module_4_api_basics',
    //   title: 'Understanding APIs',
    //   type: 'interactive',
    //   prerequisites: ['module_3_python'],
    //   hasQuestion: true,
    //   question: { ... }
    // }
];

/**
 * Helper function to get a specific node by ID
 * @param {string} nodeId - The node ID to find
 * @returns {Object|null} The node object or null if not found
 */
export function getNode(nodeId) {
    return RESKILLING_TREE.find(node => node.id === nodeId) || null;
}

/**
 * Helper function to get question metadata for a node
 * @param {string} nodeId - The node ID
 * @returns {Object|null} The question object or null if node has no question
 */
export function getQuestion(nodeId) {
    const node = getNode(nodeId);
    if (!node || !node.hasQuestion) {
        return null;
    }
    return node.question;
}

/**
 * Helper function to check if all prerequisites are met
 * @param {string} nodeId - The node to check
 * @param {Array<string>} completedNodeIds - Array of completed node IDs
 * @returns {boolean} True if all prerequisites are met
 */
export function arePrerequisitesMet(nodeId, completedNodeIds) {
    const node = getNode(nodeId);
    if (!node) return false;
    
    return node.prerequisites.every(prereqId => 
        completedNodeIds.includes(prereqId)
    );
}

/**
 * Helper function to get all nodes that are currently unlocked
 * @param {Array<string>} completedNodeIds - Array of completed node IDs
 * @returns {Array<Object>} Array of unlocked nodes
 */
export function getUnlockedNodes(completedNodeIds) {
    return RESKILLING_TREE.filter(node => 
        !completedNodeIds.includes(node.id) && 
        arePrerequisitesMet(node.id, completedNodeIds)
    );
}

// Export the tree as default
export default RESKILLING_TREE;

// Named exports for helper functions (used by PolicyEngine and SessionManager)
export { RESKILLING_TREE };
