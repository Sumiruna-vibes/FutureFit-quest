/**
 * App.jsx
 * 
 * Root application component - wraps everything in EngineProvider
 * 
 * V0.1: Just renders Dashboard
 * V0.2: Add routing (Dashboard, LessonPlayer, etc.)
 */

import { EngineProvider } from './contexts/EngineContext';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <EngineProvider>
      <Dashboard />
    </EngineProvider>
  );
}
