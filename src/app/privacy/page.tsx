import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Doppler VPN',
  description: 'Doppler VPN Privacy Policy - Learn how we protect your data',
};

const sections = [
  {
    title: 'No-Logs Policy',
    content:
      'We operate a strict no-logs policy. We do not track, store, or share any of the following: your browsing activity, connection timestamps, originating IP addresses, DNS queries, bandwidth usage, or any other data that could identify you or your online activities. VPN traffic is encrypted end-to-end and is never inspected, logged, or stored.',
  },
  {
    title: 'What We Collect',
    content:
      'We only collect the minimum information necessary to provide our service: a randomly generated device identifier (not linked to your personal identity), payment information (processed securely by Apple App Store or Google Play — we never see your payment details), anonymous aggregated server load statistics to maintain performance, and your email address only if you voluntarily contact support.',
  },
  {
    title: 'VPN Data Handling',
    content:
      'When you connect to our VPN service, your internet traffic is encrypted using the WireGuard protocol and routed through our servers. We do not inspect, log, store, modify, or sell any data that passes through our VPN tunnel. Our DNS-level ad blocker and content filter operate on our DNS resolver and do not log individual queries or browsing patterns.',
  },
  {
    title: 'Data Security',
    content:
      'We use industry-standard encryption protocols including WireGuard to protect your connection. All data transmission between your device and our servers is encrypted end-to-end. Our server infrastructure is configured to minimize data retention by design.',
  },
  {
    title: 'Third Parties',
    content:
      'We do not sell, trade, or share your personal information with third parties. We use RevenueCat for subscription management (they process only anonymous purchase identifiers) and Apple/Google app stores for payment processing. These providers are bound by their own privacy policies and contractual obligations.',
  },
  {
    title: "Children's Privacy",
    content:
      'Our content filtering feature includes parental control capabilities. We do not knowingly collect personal information from children under 13. The content filter operates at the DNS level without collecting or storing any personal data about users of any age.',
  },
  {
    title: 'Contact Us',
    content:
      'If you have any questions about this Privacy Policy, please contact us at privacy@dopplervpn.com',
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <a href="/" className="inline-block mb-6 text-sm text-text-muted hover:text-text-primary transition-colors">
        &larr; Back
      </a>

      <h1 className="font-display text-3xl md:text-4xl font-semibold text-text-primary mb-4">
        Privacy Policy
      </h1>
      <p className="text-text-muted mb-8">Last updated: February 2026</p>

      <div className="max-w-none">
        <p className="text-text-muted text-lg leading-relaxed mb-8">
          At Doppler VPN, your privacy is our top priority. This Privacy Policy explains how we
          handle your information when you use our VPN, ad blocking, and content filtering services.
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
