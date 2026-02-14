'use client';

import { useEffect, useState } from 'react';
import { getTranslation, detectLanguage } from '@/lib/i18n';

export default function SuccessPage() {
  const [t, setT] = useState(getTranslation('en'));

  useEffect(() => {
    setT(getTranslation(detectLanguage()));
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const handleClose = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-bg flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-3">{t.success_title}</h1>
        <p className="text-gray-400 mb-8">{t.success_desc}</p>
        <button
          onClick={handleClose}
          className="w-full py-4 rounded-2xl font-semibold gradient-bg hover:opacity-90 transition-opacity"
        >
          {t.success_close}
        </button>
      </div>
    </main>
  );
}
