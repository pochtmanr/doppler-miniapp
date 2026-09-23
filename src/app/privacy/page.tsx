import { redirect } from 'next/navigation';

// The landing's privacy policy is the only copy; it picks the reader's language itself.
// Kept as a route because Telegram and BotFather may already hold this URL.
export default function PrivacyPage() {
  redirect('https://www.dopplervpn.org/privacy');
}
