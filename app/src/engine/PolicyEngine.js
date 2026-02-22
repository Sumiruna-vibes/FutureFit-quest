// app/src/engine/PolicyEngine.js
import SkillTree from './SkillTree.js'; // ✅ Added .js extension

/**
 * 🎓 LESSON: ACCESS CONTROL (THE BOUNCER)
 * 
 * This component decides what the user is allowed to see.
 * It enforces the rules of the game.
 * 
 * Feature: "Developer Mode" allows us to bypass rules for testing.
 */

class PolicyEngine {
    constructor() {
        this.tree = SkillTree;
        // Default: not in developer mode
        this.isDeveloper = false;
    }

    /**
     * 🎓 NEW: Configure the policy engine at runtime
     * Allows toggling developer mode without recreating the instance
     */
    configure(userProfile = {}) {
        this.isDeveloper = userProfile.isDeveloper || false;
        return this; // Allow chaining: policyEngine.configure({...})
    }

    /**
     * The main check.
     * @param {string} nodeId - The node they want to enter
     * @param {object} userState - Their current progress (completedNodes)
     */
    canAccessNode(nodeId, userState) {
        // 1. DEVELOPER OVERRIDE (The "God Mode")
        if (this.isDeveloper) {
            console.log(`🔓 [Policy] Dev Mode: Accessing ${nodeId}`);
            return { allowed: true, reason: 'DEV_OVERRIDE' };
        }

        // 2. Find the node in the map
        const targetNode = this.tree.find(n => n.id === nodeId);
        if (!targetNode) {
            return { allowed: false, reason: 'NODE_NOT_FOUND' };
        }

        // 3. Check Prerequisites
        const prereqs = targetNode.prerequisites;
        
        // Are all prerequisites present in the user's completed list?
        const allMet = prereqs.every(req => userState.completedNodes.includes(req));

        if (allMet) {
            return { allowed: true, reason: 'PREREQS_MET' };
        } else {
            return { allowed: false, reason: 'LOCKED_PREREQ_MISSING' };
        }
    }

    /**
     * Returns one of 5 visual states for the UI.
     *
     * States (spec: Architecture v1.1 Section 3.2):
     *   COMPLETED      – node is in completedNodes
     *   IN_PROGRESS    – node has been attempted but not completed
     *   UNLOCKED_NEW   – all prereqs met, not yet started
     *   LOCKED_NEAR    – exactly 1 prerequisite unmet
     *   LOCKED_FAR     – 2+ prerequisites unmet
     *
     * @param {string} nodeId
     * @param {{ completedNodes: string[], attemptedNodes?: string[] }} userState
     */
    getVisualState(nodeId, userState) {
        const completed = userState.completedNodes || [];
        const attempted = userState.attemptedNodes || [];

        if (completed.includes(nodeId)) return 'COMPLETED';

        const targetNode = this.tree.find(n => n.id === nodeId);
        if (!targetNode) return 'LOCKED_FAR';

        const unmetPrereqs = targetNode.prerequisites.filter(
            req => !completed.includes(req)
        );

        if (unmetPrereqs.length === 0) {
            // Accessible — distinguish in-progress from new
            return attempted.includes(nodeId) ? 'IN_PROGRESS' : 'UNLOCKED_NEW';
        }

        return unmetPrereqs.length === 1 ? 'LOCKED_NEAR' : 'LOCKED_FAR';
    }
}

// 🎓 SINGLETON PATTERN: Create one instance for the entire app
const policyEngine = new PolicyEngine();

// Export the instance as default (for React components)
export default policyEngine;

// Export the class as a named export (for tests)
export { PolicyEngine };