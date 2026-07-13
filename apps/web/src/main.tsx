import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import { captureLineRecipientFromUrl } from './lib/api';

function applyLiffStatePath(): void {
  // LIFF may not update window.location before init resolves.
  // If liff.state is still in the query string, apply it now so
  // BrowserRouter mounts at the correct path instead of '/'.
  const liffState = new URLSearchParams(window.location.search).get('liff.state');
  if (liffState && window.location.pathname === '/') {
    try {
      const target = new URL(liffState, window.location.origin);
      window.history.replaceState({}, '', target.pathname + target.search + target.hash);
    } catch {
      // ignore malformed liff.state
    }
  }
}

function renderApp(): void {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

function bootstrap() {
  applyLiffStatePath();
  captureLineRecipientFromUrl();
  renderApp();
}

bootstrap();
