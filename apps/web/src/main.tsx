import liff from '@line/liff';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import { setLineUserId } from './lib/api';

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

async function bootstrap() {
  const liffId = import.meta.env.VITE_LIFF_ID;

  if (!liffId) {
    console.error('[LIFF] VITE_LIFF_ID is not configured');
    applyLiffStatePath();
    renderApp();
    return;
  }

  try {
    await liff.init({ liffId });
  } catch (err) {
    console.error('[LIFF] init error:', err);
    applyLiffStatePath();
    renderApp();
    return;
  }

  // Outside LINE app and not logged in → redirect to LINE login
  if (!liff.isLoggedIn() && !liff.isInClient()) {
    liff.login();
    return;
  }

  try {
    // getDecodedIDToken is synchronous (cached) — no network call needed
    const idToken = liff.getDecodedIDToken();
    if (idToken?.sub) {
      setLineUserId(idToken.sub);
    } else {
      const profile = await liff.getProfile();
      setLineUserId(profile.userId);
    }
  } catch (err) {
    console.error('[LIFF] get user id error:', err);
  }

  applyLiffStatePath();
  renderApp();
}

bootstrap();
