import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, Bell, Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
    </div>
    <div className="text-[14px] text-slate-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function MinorSafetyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-900 text-[15px]">Young User Safety Policy</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white text-center">
          <div className="text-5xl mb-3">🛡️</div>
          <h1 className="text-[22px] font-bold mb-2">How We Protect Young Users on JUnited</h1>
          <p className="text-[14px] text-blue-100 leading-relaxed">
            JUnited is a community platform for all ages. We take the safety of users under 18 seriously.
          </p>
        </div>

        <Section icon={Shield} title="Age Requirements">
          <p><strong>Minimum age: 13 years old.</strong> JUnited is not intended for children under 13 and complies with applicable child safety regulations.</p>
          <p>All new users are required to provide their date of birth during signup. Users under 13 are blocked from creating an account.</p>
          <p>Users aged 13–17 are flagged as minors and automatically receive enhanced privacy protections.</p>
        </Section>

        <Section icon={Lock} title="Minor Account Protections (Ages 13–17)">
          <ul className="list-disc pl-4 space-y-1.5">
            <li><strong>Profile hidden by default</strong> — Minor profiles are not discoverable in public search or member directories.</li>
            <li><strong>DMs restricted to connections only</strong> — Adults cannot send direct messages to minors unless the minor has accepted their connection request.</li>
            <li><strong>Age-restricted communities</strong> — Minors cannot join communities marked "Adults Only" (e.g., Singles groups).</li>
            <li><strong>Reduced location pings</strong> — Location-based notifications are disabled for minor accounts.</li>
            <li><strong>No public member listing</strong> — Minors do not appear in adult-facing community member directories.</li>
          </ul>
        </Section>

        <Section icon={Eye} title="Parent Supervision (Optional)">
          <p>At signup, teens aged 13–17 may optionally enter a parent or guardian's email address to enable supervised mode.</p>
          <p>If supervised mode is active, the parent or guardian will receive:</p>
          <ul className="list-disc pl-4 space-y-1 mt-1">
            <li>A periodic activity summary (posts, connections, communities joined)</li>
            <li>Notification of any content flagged by our moderation system</li>
            <li>The ability to request account deactivation</li>
          </ul>
          <p className="mt-2 font-semibold text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-[13px]">
            ⚠️ Transparency: We clearly disclose to the teen user that a parent has access before enabling supervision.
          </p>
        </Section>

        <Section icon={Users} title="Community Age Settings">
          <p>Community administrators can set a minimum age for their community (e.g., "Adults only – 18+", "13+", or "No minimum").</p>
          <p>JUnited enforces these settings: minor accounts are automatically prevented from joining age-restricted communities.</p>
        </Section>

        <Section icon={MessageCircle} title="Content Rules Around Minors">
          <ul className="list-disc pl-4 space-y-1.5">
            <li>Minor profile photos are not indexed by search engines (<code>noindex</code> meta tags applied).</li>
            <li>Posts by minors do not appear in externally-discoverable feeds without guardian opt-in.</li>
            <li>Mitzvah Circle requests involving minors require verified-helper matching before connecting.</li>
          </ul>
        </Section>

        <Section icon={Bell} title="Reporting & Moderation">
          <p>All content is automatically scanned by our AI moderation system. Flagged content involving minors is prioritized as high or critical in our admin review queue.</p>
          <p>Users can report concerns at any time using the flag icon on any post, comment, or profile.</p>
        </Section>

        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-center">
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Have questions or concerns about minor safety on JUnited?<br />
            Contact us at <a href="mailto:safety@junited.app" className="text-blue-600 font-semibold">safety@junited.app</a>
          </p>
          <p className="text-[11px] text-slate-400 mt-3">Last updated: April 2026</p>
        </div>
      </div>
    </div>
  );
}