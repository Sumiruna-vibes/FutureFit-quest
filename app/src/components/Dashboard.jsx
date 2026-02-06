import React from 'react';

export default function Dashboard({ onStartLesson = () => {} }) {
  // Minimal placeholder Dashboard so imports resolve during build
  return (
    <main style={{padding:20}}>
      <h1>Dashboard (placeholder)</h1>
      <p>This is a lightweight placeholder until the real Dashboard is implemented.</p>
      <button onClick={() => onStartLesson('lesson_sample')}>Start sample lesson</button>
    </main>
  );
}
