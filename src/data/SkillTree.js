// src/data/SkillTree.js

/**
 * 🎓 LESSON: STATIC CONTENT DEFINITION
 * 
 * This is the "Map" of our world.
 * It is a Directed Acyclic Graph (DAG).
 * 
 * Structure:
 * - Nodes have IDs.
 * - Nodes have 'prerequisites' (what you must finish first).
 */

const RESKILLING_TREE = [
    {
        id: 'module_1_intro',
        title: 'Why Data Matters',
        type: 'video',
        prerequisites: [] // No requirements, start here
    },
    {
        id: 'module_1_quiz',
        title: 'Data vs. Information',
        type: 'quiz',
        prerequisites: ['module_1_intro'] // Must watch video first
    },
    {
        id: 'module_2_excel',
        title: 'Excel Logic Basics',
        type: 'simulation',
        prerequisites: ['module_1_quiz'] // Must pass quiz first
    },
    {
        id: 'module_3_python',
        title: 'Python for Non-Coders',
        type: 'challenge',
        prerequisites: ['module_2_excel'] // Locked until Excel is done
    }
];

module.exports = RESKILLING_TREE;
