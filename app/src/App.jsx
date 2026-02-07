/**
 * App.jsx
 * 
 * Root application component - wraps everything in EngineProvider
 * 
 * V0.1: Handles navigation between Dashboard and LessonPlayer
 * V0.2: Add React Router for proper URLs
 */

import { useState } from 'react';
import { EngineProvider } from './contexts/EngineContext';
import Dashboard from './components/Dashboard';
import LessonPlayer from './components/LessonPlayer';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentLesson, setCurrentLesson] = useState(null);
  
  // Hardcoded userId for v0.1 (single user)
  const userId = 'user_001';

  const handleStartLesson = (nodeId) => {
    setCurrentLesson(nodeId);
    setCurrentView('lesson');
  };

  const handleLessonComplete = (result) => {
    // result can be null (user clicked back) or completion data
    if (result && result.feedback?.celebration) {
      // v0.2: Trigger celebration animation here
      console.log('🎉 Celebration:', result.feedback.celebration);
    }
    
    setCurrentView('dashboard');
    setCurrentLesson(null);
  };

  return (
    <EngineProvider>
      {currentView === 'dashboard' ? (
        <Dashboard onStartLesson={handleStartLesson} />
      ) : (
        <LessonPlayer
          nodeId={currentLesson}
          userId={userId}
          onComplete={handleLessonComplete}
        />
      )}
    </EngineProvider>
  );
}
