// src/data/PolicyEngine.js
import SkillTree from './SkillTree';

/**
 * 🎓 LESSON: ACCESS CONTROL (THE BOUNCER)
 * 
 * This component decides what the user is allowed to see.
 * It enforces the rules of the game.
 * 
 * Feature: "Developer Mode" allows us to bypass rules for testing.
 */

class PolicyEngine {
    constructor(userProfile = {}) {
        this.tree = SkillTree;
        // Check if user has special architect privileges
        this.isDeveloper = userProfile.isDeveloper || false;
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
     * Returns the Visual State for the UI (Cloud, Fog, Locked)
     */
    getVisualState(nodeId, userState) {
        if (userState.completedNodes.includes(nodeId)) return 'COMPLETED';
        
        const access = this.canAccessNode(nodeId, userState);
        if (access.allowed) return 'UNLOCKED';
        
        return 'LOCKED';
    }
}

export default PolicyEngine;
