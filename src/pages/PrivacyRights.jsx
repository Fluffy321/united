import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Download, Trash2, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { dataService, storageService } from '@/services';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

export default function PrivacyRights() {
  const { user, isLoadingAuth: loadingUser } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [analyticsOptOut, setAnalyticsOptOut] = useState(() => {
    const stored = storageService.getJson('junited_cookie_consent', {});
    return stored.analytics === false;
  });


  const handleExport = async () => {
    setExporting(true);
    try {
      // Collect all user data
      const [posts, comments, communities, mitzvahLogs] = await Promise.all([
        dataService.entities.UnifiedPost.filter({ user_id: user.id }, '-created_date', 200),
        dataService.entities.Comment.filter({ author_id: user.id }, '-created_date', 200),
        dataService.entities.UserCommunity.filter({ user_id: user.id }),
        dataService.entities.MitzvahLog ? dataService.entities.MitzvahLog.filter({ user_id: user.id }, '-created_date', 200) : Promise.resolve([]),
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        account: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          bio: user.bio,
          avatar_url: user.avatar_url,
          cityPreset: user.cityPreset,
          created_date: user.created_date,
        },
        posts,
        comments,
        communities,
        mitzvah_logs: mitzvahLogs,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `junited-data-export-${user.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportDone(true);
      toast.success('Data exported successfully');
    } catch (err) {
      toast.error('Export failed. Please try again or contact privacy@junited.app');
    } finally {
      setExporting(false);
    }
  };

  const handleAnalyticsToggle = () => {
    const newOptOut = !analyticsOptOut;
    setAnalyticsOptOut(newOptOut);
    const stored = storageService.getJson('junited_cookie_consent', {});
    stored.analytics = !newOptOut;
    stored.timestamp = new Date().toISOString();
    storageService.setJson('junited_cookie_consent', stored);
    window.__junited_analytics_enabled = !newOptOut;
    toast.success(newOptOut ? 'Analytics opted out' : 'Analytics opted in');
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-slate-900">Your Privacy Rights</h1>
          </div>
        </div>

        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-[13px] text-amber-800">
            Sign in to access your privacy rights tools.{' '}
            <button onClick={() => dataService.auth.redirectToLogin(window.location.href)} className="font-bold underline">Sign in →</button>
          </div>
        )}

        <div className="space-y-4">
          {/* Download data */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-900 mb-1">Download My Data</h2>
                <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
                  Export a complete copy of your JUnited data — posts, comments, community memberships, and mitzvah logs — in JSON format.
                </p>
                {exportDone ? (
                  <div className="flex items-center gap-2 text-[13px] text-green-700 font-semibold">
                    <CheckCircle className="w-4 h-4" /> Downloaded successfully
                  </div>
                ) : (
                  <button onClick={handleExport} disabled={exporting || !user}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all">
                    {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {exporting ? 'Exporting...' : 'Export My Data'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Correct my data */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">✏️</span>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-900 mb-1">Correct My Data</h2>
                <p className="text-[13px] text-slate-500 mb-3">Update your profile information, name, bio, avatar, and location at any time.</p>
                <Link to="/UserSettings"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-[13px] font-semibold hover:bg-green-700 active:scale-95 transition-all">
                  Go to Settings
                </Link>
              </div>
            </div>
          </div>

          {/* Stop analytics processing */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📊</span>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-900 mb-1">Stop Analytics Processing</h2>
                <p className="text-[13px] text-slate-500 mb-3">Opt out of optional analytics cookies. Essential cookies (required for login and security) cannot be disabled.</p>
                <div className="flex items-center gap-3">
                  <button onClick={handleAnalyticsToggle}
                    className={`relative w-10 h-6 rounded-full transition-colors ${analyticsOptOut ? 'bg-slate-300' : 'bg-blue-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${analyticsOptOut ? 'translate-x-1' : 'translate-x-5'}`} />
                  </button>
                  <span className="text-[13px] text-slate-600">
                    Analytics: <strong>{analyticsOptOut ? 'Opted out' : 'Opted in'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delete account */}
          <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-900 mb-1">Delete My Account</h2>
                <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
                  To permanently delete your account and all associated data, email us at{' '}
                  <a href="mailto:support@junited.org" className="text-blue-600 font-medium underline">support@junited.org</a>{' '}
                  from your registered address with the subject line "Delete my account". We process all deletion requests within 30 days.
                </p>
                <a
                  href="mailto:support@junited.org?subject=Delete%20my%20account"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 active:scale-95 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Email Support to Delete Account
                </a>
              </div>
            </div>
          </div>

          {/* Additional contact */}
          <div className="bg-slate-100 rounded-xl p-4 text-center text-[13px] text-slate-600">
            <p className="font-semibold text-slate-800 mb-1">Need help with another privacy request?</p>
            <p>Email <a href="mailto:privacy@junited.app" className="text-blue-600 underline font-semibold">privacy@junited.app</a>. We respond within 30 days.</p>
            <div className="flex justify-center gap-4 mt-3 text-blue-600">
              <Link to="/privacy" className="underline text-[12px]">Privacy Policy</Link>
              <Link to="/terms" className="underline text-[12px]">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
