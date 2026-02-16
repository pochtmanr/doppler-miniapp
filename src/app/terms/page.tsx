import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Doppler VPN',
  description: 'Doppler VPN Terms of Service',
};

const sections = [
  {
    title: 'Service Description',
    content:
      "Doppler VPN provides a virtual private network service that encrypts your internet connection and hides your IP address for privacy purposes. The service also includes DNS-level ad blocking and content filtering with parental controls. The service is provided 'as is' and 'as available.'",
  },
  {
    title: 'Acceptable Use',
    content:
      'You agree to use Doppler VPN only for lawful purposes and in compliance with all applicable local, national, and international laws. You may not use the service for any illegal activities, to circumvent geo-restrictions or content licensing agreements, to harm others, to distribute malware, to infringe on intellectual property rights, or to interfere with our service operations. We reserve the right to terminate accounts that violate these terms.',
  },
  {
    title: 'Subscriptions & Payments',
    content:
      'Doppler VPN Premium includes access to premium VPN servers in 50+ locations, DNS-level ad blocking, content filtering with parental controls, and connection on up to 10 devices simultaneously. Subscriptions are billed through the Apple App Store or Google Play Store. Plans are available on a monthly, 6-month, or annual basis and auto-renew unless canceled at least 24 hours before the end of the current billing period. You can cancel your subscription at any time through your device\'s app store settings. Refunds are subject to the respective app store\'s refund policies.',
  },
  {
    title: 'Limitation of Liability',
    content:
      'To the maximum extent permitted by law, Doppler VPN shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.',
  },
  {
    title: 'Changes to Terms',
    content:
      'We may update these Terms of Service from time to time. We will notify you of any material changes through the app or via email. Continued use of the service after changes constitutes acceptance of the new terms.',
  },
  {
    title: 'Contact',
    content:
      'For questions about these Terms of Service, please contact us at legal@dopplervpn.com',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <a href="/" className="inline-block mb-6 text-sm text-text-muted hover:text-text-primary transition-colors">
        &larr; Back
      </a>

      <h1 className="font-display text-3xl md:text-4xl font-semibold text-text-primary mb-4">
        Terms of Service
      </h1>
      <p className="text-text-muted mb-8">Last updated: February 2026</p>

      <div className="max-w-none">
        <p className="text-text-muted text-lg leading-relaxed mb-8">
          By using Doppler VPN, you agree to these Terms of Service. Please read them carefully.
        </p>

        {sections.map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="font-display text-xl md:text-2xl font-semibold text-text-primary mb-3">
              {section.title}
            </h2>
            <p className="text-text-muted leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
