Phase 2: Step 1 — EngineProvider (React Context)
I’ve added the planning entry to AI_CHATLOG.md. Here’s the proposed EngineContext.jsx implementation:

javascript
// app/src/contexts/EngineContext.jsx
import React, { createContext, useContext, useMemo } from 'react';
import SafeLocalStorage from '../engine/SafeLocalStorage';
import EventManager from '../engine/EventManager';
import ProgressService from '../engine/ProgressService';
import PolicyEngine from '../engine/PolicyEngine';
import SkillTree from '../engine/SkillTree';
const EngineContext = createContext(null);
export function EngineProvider({ children, userProfile = {} }) {
    const engines = useMemo(() => {
        // Instantiate all engines once (singletons)
        const storage = new SafeLocalStorage();
        const eventManager = new EventManager(storage);
        const progressService = new ProgressService();
        const policyEngine = new PolicyEngine(userProfile);
        
        return {
            storage,
            eventManager,
            progressService,
            policyEngine,
            skillTree: SkillTree
        };
    }, [userProfile.isDeveloper]); // Recreate only if developer mode changes
    return (
        <EngineContext.Provider value={engines}>
            {children}
        </EngineContext.Provider>
    );
}
export function useEngine() {
    const engines = useContext(EngineContext);
    if (!engines) {
        throw new Error('useEngine must be used within EngineProvider');
    }
    return engines;
}