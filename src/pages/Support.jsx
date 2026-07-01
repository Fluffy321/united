import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, LifeBuoy, Mail } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'How do I join a community?',
    a: 'Open the Communities tab and search or browse to find your shul, school, or neighborhood. Tap a community and select Join. Some communities require admin approval before you can post.',
  },
  {
    q: 'How do I report a post, comment, or user?',
    a: 'Tap the "..." menu on any post, comment, or profile and select Report. Choose a reason and submit — our moderation team reviews every report. You can also Block a user from their profile\'s "..." menu.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Settings → Account, scroll to the Danger Zone, and select "Delete my account." Type DELETE to confirm. This is permanent and happens immediately — no email or waiting period required.',
  },
];

export default function Support() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Get Help</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[15px] font-semibold text-slate-900">Contact us</p>
              <p className="mt-1 text-[14px] text-slate-600">
                For anything we can't answer below, email{' '}
                <a href="mailto:support@junited.us" className="text-blue-600 underline font-semibold">
                  support@junited.us
                </a>{' '}
                and we'll get back to you as soon as we can.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Frequently asked questions</h2>
            <div className="space-y-5">
              {FAQ_ITEMS.map((item) => (
                <div key={item.q}>
                  <p className="text-[15px] font-semibold text-slate-800">{item.q}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[14px] text-slate-600">
            <p>
              For community standards and what's allowed on JUnited, see our{' '}
              <Link to="/guidelines" className="text-blue-600 underline font-semibold">
                Community Guidelines
              </Link>
              . For how we handle your data, see our{' '}
              <Link to="/privacy" className="text-blue-600 underline font-semibold">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
