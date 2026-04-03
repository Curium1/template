import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { loadModules } from './core/modules/moduleLoader';
import App from './App';
import './index.css';

async function bootstrap() {
  // Load all modules before rendering
  await loadModules();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap().catch(err => {
  console.error('[Bootstrap] Failed to start application:', err);
  document.getElementById('root')!.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;color:#ef4444;">
      <div style="text-align:center">
        <h1>Startfel</h1>
        <p>Applikationen kunde inte startas. Kontrollera konsolen.</p>
      </div>
    </div>
  `;
});
