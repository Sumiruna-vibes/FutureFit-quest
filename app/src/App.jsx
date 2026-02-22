/**
 * App.jsx
 * 
 * Root application component - wraps everything in EngineProvider
 * 
 * V0.1: Handles navigation between Dashboard and LessonPlayer
 * V0.2: Add React Router for proper URLs
 */

import { useState, useEffect } from 'react';
import { EngineProvider } from './contexts/EngineContext';
import Dashboard from './components/Dashboard';
import LessonPlayer from './components/LessonPlayer';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentLesson, setCurrentLesson] = useState(null);
  
  // Hardcoded userId for v0.1 (single user)
  const userId = 'user_001';

  const handleStartLesson = (nodeId) => {
    setCurrentLesson(nodeId);
    setCurrentView('lesson');
  };

  const [dashboardKey, setDashboardKey] = useState(0);

  const handleLessonComplete = (result) => {
    // result can be null (user clicked back) or completion data
    if (result && result.feedback?.celebration) {
      console.log('🎉 Celebration:', result.feedback.celebration);
    }

    setCurrentView('dashboard');
    setCurrentLesson(null);
    // Increment key to force Dashboard to remount and reload progress
    setDashboardKey(prev => prev + 1);
  };

  return (
    <>
      {currentView === 'dashboard' ? (
        <Dashboard key={dashboardKey} onStartLesson={handleStartLesson} />
      ) : (
        <LessonPlayer
          nodeId={currentLesson}
          userId={userId}
          onComplete={handleLessonComplete}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <EngineProvider>
      <AppContent />
    </EngineProvider>
  );
}