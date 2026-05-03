import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
    <div className="text-[15px] text-slate-700 leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
          </div>
        </div>

        <p className="text-[13px] text-slate-500 mb-6">Last updated: April 2026. Effective immediately for new users; existing users notified by email.</p>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <Section title="1. Information We Collect">
            <p><strong>Account Information:</strong> When you register, we collect your name, email address, and password (hashed). You may optionally provide a profile photo, bio, and location.</p>
            <p><strong>Profile & Posts:</strong> Content you create — posts, comments, community activity, mitzvah logs, event RSVPs — is stored and associated with your account.</p>
            <p><strong>Location:</strong> If you select a neighborhood or city in-app, we store that preference. We do not collect GPS or precise device location unless you explicitly share it.</p>
            <p><strong>Device & Usage Information:</strong> We collect browser type, device type, IP address, pages visited, and interaction data (likes, clicks, time spent) to operate and improve the Platform.</p>
            <p><strong>Communications:</strong> Direct messages you send to other users are stored to deliver the messages. We do not read private messages except for safety investigations.</p>
            <p><strong>Cookies & Local Storage:</strong> We use cookies and browser storage to keep you logged in, remember preferences, and analyze usage. See Section 5.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide, maintain, and improve the Platform</li>
              <li>To personalize your feed and community recommendations</li>
              <li>To send you notifications you've opted into (email, push)</li>
              <li>To detect and prevent fraud, abuse, and safety violations</li>
              <li>To comply with legal obligations</li>
              <li>To generate aggregated, anonymized analytics about Platform usage</li>
            </ul>
            <p>We do <strong>not</strong> use your data to train third-party AI models or sell it to advertisers.</p>
          </Section>

          <Section title="3. Who We Share Your Information With">
            <p><strong>We do not sell your personal data.</strong> We may share information with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Service providers:</strong> Hosting (hosting provider), email delivery (Resend), payment processing (payment provider / Wix). These providers are contractually bound to protect your data.</li>
              <li><strong>Other users:</strong> Content you post publicly is visible to other Platform users. Your name and profile photo appear alongside your posts.</li>
              <li><strong>Legal requirements:</strong> We may disclose information if required by law, court order, or to protect the safety of users.</li>
            </ul>
          </Section>

          <Section title="4. Data Retention">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Active accounts:</strong> Data retained while your account is active.</li>
              <li><strong>Deleted accounts:</strong> Soft-deleted for 30 days (recoverable), then permanently purged.</li>
              <li><strong>Posts from deleted accounts:</strong> Author replaced with "[Deleted User]" but post content retained if others engaged with it (comments, likes), to preserve conversation context.</li>
              <li><strong>Direct messages:</strong> Retained only as long as both participants have active accounts. When either participant deletes their account, DMs are purged within 30 days.</li>
            </ul>
          </Section>

          <Section title="5. Cookies">
            <p>We use essential cookies (required for login and security) and optional analytics cookies. You can manage cookie preferences via the cookie banner on your first visit or at any time in Settings → Privacy.</p>
            <p>We do not use third-party advertising cookies.</p>
          </Section>

          <Section title="6. Children's Data (COPPA)">
            <p>JUnited is available to users aged 13 and older. Users aged 13–17 are subject to additional protections: their profiles default to limited visibility, they cannot send or receive DMs from users outside their communities, and certain content categories are restricted.</p>
            <p>We do not knowingly collect personal information from children under 13. If you believe a child under 13 has registered, contact us at <a href="mailto:privacy@junited.app" className="text-blue-600 underline">privacy@junited.app</a>.</p>
          </Section>

          <Section title="7. Your Rights (GDPR & CCPA)">
            <p>Depending on your jurisdiction, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access:</strong> Request a copy of your data (JSON export available in Settings)</li>
              <li><strong>Correction:</strong> Update your profile and account data at any time</li>
              <li><strong>Deletion:</strong> Delete your account and all associated data</li>
              <li><strong>Portability:</strong> Download your data in machine-readable format</li>
              <li><strong>Opt-out:</strong> Opt out of analytics processing in Settings → Privacy</li>
              <li><strong>Non-discrimination:</strong> We will not discriminate against you for exercising privacy rights</li>
            </ul>
            <p>To exercise rights not available via Settings, email <a href="mailto:privacy@junited.app" className="text-blue-600 underline">privacy@junited.app</a>. We respond within 30 days.</p>
            <p><strong>California residents (CCPA):</strong> You may request disclosure of categories of data collected, opt out of any sale of data (we do not sell data), and request deletion.</p>
          </Section>

          <Section title="8. Security">
            <p>We use industry-standard security measures including encryption in transit (HTTPS/TLS), hashed passwords, and access controls. No system is 100% secure; in the event of a breach, we will notify affected users as required by law.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this Privacy Policy periodically. We'll notify you of material changes via email or in-app notice. Continued use after changes constitutes acceptance.</p>
          </Section>

          <Section title="10. Contact">
            <p>Privacy questions or requests: <a href="mailto:privacy@junited.app" className="text-blue-600 underline">privacy@junited.app</a></p>
          </Section>
        </div>
      </div>
    </div>
  );
}