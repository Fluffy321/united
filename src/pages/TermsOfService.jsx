import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Scale } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
    <div className="text-[15px] text-slate-700 leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8 text-[13px] text-amber-800">
          <strong>Note:</strong> These terms should be reviewed by a licensed attorney before public launch.
          Last updated: April 2026.
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using JUnited ("the Platform," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Platform.</p>
            <p>We may update these Terms at any time. Continued use after changes constitutes acceptance of the revised Terms. We will notify registered users of material changes via email or in-app notification.</p>
          </Section>

          <Section title="2. Account Creation & Eligibility">
            <p>You must be at least 13 years old to create an account. Users aged 13–17 are subject to additional protections described in our <Link to="/MinorSafetyPolicy" className="text-blue-600 underline">Minor Safety Policy</Link>.</p>
            <p>You agree to provide accurate, complete, and current information when registering. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.</p>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms, at our sole discretion.</p>
          </Section>

          <Section title="3. Acceptable Use">
            <p>You agree to use the Platform only for lawful purposes and in accordance with these Terms and our <Link to="/guidelines" className="text-blue-600 underline">Community Guidelines</Link>.</p>
            <p>You must not:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Post content that is unlawful, harmful, threatening, abusive, harassing, or defamatory</li>
              <li>Impersonate any person or entity</li>
              <li>Post spam, unsolicited commercial messages, or malicious code</li>
              <li>Attempt to gain unauthorized access to other accounts or platform systems</li>
              <li>Scrape, data-mine, or systematically collect data without written permission</li>
              <li>Use the Platform to violate any applicable law or regulation</li>
            </ul>
          </Section>

          <Section title="4. Content Ownership & License">
            <p><strong>Your Content:</strong> You retain full ownership of all content you post to JUnited ("Your Content").</p>
            <p><strong>License to JUnited:</strong> By posting Your Content, you grant JUnited a non-exclusive, royalty-free, worldwide, sublicensable license to display, distribute, store, and promote Your Content solely in connection with operating and improving the Platform. This license ends when you delete Your Content or your account, subject to reasonable wind-down periods and content that others have engaged with.</p>
            <p><strong>Representations:</strong> You represent that you have all rights necessary to grant this license and that Your Content does not infringe any third-party rights.</p>
          </Section>

          <Section title="5. Prohibited Conduct">
            <p>The following conduct is strictly prohibited and may result in immediate account termination:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Harassment, bullying, or targeted abuse of any user</li>
              <li>Lashon hara (defamatory speech) or public shaming</li>
              <li>Posting or soliciting adult content of any kind</li>
              <li>Hate speech targeting any group based on race, religion, ethnicity, gender, or sexual orientation</li>
              <li>Doxxing — sharing private personal information without consent</li>
              <li>Content that endangers minors in any way</li>
              <li>Coordinated inauthentic behavior or manipulation</li>
            </ul>
          </Section>

          <Section title="6. Termination">
            <p>You may delete your account at any time through Account Settings. Upon deletion, your account is soft-deleted for 30 days (allowing recovery), then permanently purged.</p>
            <p>We may suspend or terminate your access at any time, with or without notice, for violation of these Terms. Upon termination, your right to use the Platform ceases immediately.</p>
          </Section>

          <Section title="7. Dispute Resolution">
            <p><strong>Informal Resolution:</strong> We encourage you to contact us first at legal@junited.app to resolve disputes informally.</p>
            <p><strong>Community Mediation:</strong> For member-vs-member disputes, JUnited offers a community mediation process inspired by Beit Din principles. Participating in mediation is voluntary but encouraged before escalating.</p>
            <p><strong>Binding Arbitration:</strong> If informal resolution fails, disputes shall be resolved by binding individual arbitration under the rules of the American Arbitration Association, conducted in New York. Class actions are waived.</p>
            <p><strong>Governing Law:</strong> These Terms are governed by the laws of the State of New York, without regard to conflict-of-law principles.</p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>To the fullest extent permitted by law, JUnited and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</p>
            <p>Our total liability to you for any claims arising from these Terms or your use of the Platform shall not exceed the greater of (a) $100 USD or (b) amounts you paid us in the 12 months prior to the claim.</p>
            <p>The Platform is provided "as is" without warranties of any kind, express or implied.</p>
          </Section>

          <Section title="9. Contact">
            <p>Questions about these Terms? Contact us at <a href="mailto:legal@junited.app" className="text-blue-600 underline">legal@junited.app</a>.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}