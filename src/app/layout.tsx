import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Doppler VPN — Subscribe',
  description: 'Get Doppler VPN Pro subscription',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
