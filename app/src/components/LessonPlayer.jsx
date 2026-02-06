import React from 'react';

export default function LessonPlayer({ nodeId = null, userId = null, onComplete = () => {} }) {
  // Minimal placeholder LessonPlayer so imports resolve during build
  return (
    <main style={{padding:20}}>
      <h1>LessonPlayer (placeholder)</h1>
      <p>nodeId: {String(nodeId)}</p>
      <p>userId: {String(userId)}</p>
      <button onClick={() => onComplete(null)}>Back to dashboard</button>
      <button onClick={() => onComplete({feedback:{celebration:true}})}>Complete (sample)</button>
    </main>
  );
}
