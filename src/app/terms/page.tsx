import { redirect } from 'next/navigation';

// The landing's terms are the only copy; it picks the reader's language itself.
// Kept as a route because Telegram and BotFather may already hold this URL.
export default function TermsPage() {
  redirect('https://www.dopplervpn.org/terms');
}
