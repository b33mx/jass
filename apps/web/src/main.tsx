import liff from '@line/liff';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import { setLineUserId } from './lib/api.ts';

liff.init({ liffId: import.meta.env.VITE_LIFF_ID }).then(async () => {
  if (liff.isLoggedIn()) {
    const profile = await liff.getProfile();
    setLineUserId(profile.userId);
  }
}).finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
});
