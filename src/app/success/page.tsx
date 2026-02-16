'use client';

import { useEffect, useState } from 'react';
import { detectLanguage, getMessages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SuccessPage() {
  const [messages, setMessages] = useState(getMessages('en'));

  useEffect(() => {
    setMessages(getMessages(detectLanguage()));
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const s = messages.success;

  const handleClose = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card padding="lg" className="text-center max-w-sm w-full">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-teal/20 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-teal-light">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold mb-3">{s.title}</h1>
        <p className="text-text-muted mb-8">{s.description}</p>
        <Button
          variant="primary"
          size="lg"
          onClick={handleClose}
          className="w-full"
        >
          {s.close}
        </Button>
      </Card>
    </main>
  );
}
