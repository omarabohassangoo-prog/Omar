// ============================================================
// main.tsx - نقطة الدخول للتطبيق لتشغيل محرك الصوت وتركيب واجهة React
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app-main';
import './core/audio-engine';
import './index.css';

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("❌ Failed to find the root element to mount the application.");
}
