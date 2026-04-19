import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText, Send, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DMCAPolicy() {
  const [form, setForm] = useState({
    claimant_name: '',
    claimant_email: '',
    content_url: '',
    original_work_description: '',
    statement_of_ownership: false,
    statement_of_good_faith: false,
    signature: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.statement_of_ownership || !form.statement_of_good_faith) {
      toast.error('You must check both statements to submit.');
      return;
    }
    setSubmitting(true);
    try {
      // Send notification email to copyright team
      await base44.integrations.Core.SendEmail({
        to: 'dmca@junited.app',
        subject: `DMCA Takedown Request from ${form.claimant_name}`,
        body: `
DMCA TAKEDOWN REQUEST
Submitted: ${new Date().toISOString()}

Claimant: ${form.claimant_name}
Email: ${form.claimant_email}
Content URL: ${form.content_url}

Original Work Description:
${form.original_work_description}

Electronic Signature: ${form.signature}

Statements:
- Ownership statement signed: YES
- Good faith statement signed: YES
        `.trim(),
      });

      // Send confirmation to claimant
      await base44.integrations.Core.SendEmail({
        to: form.claimant_email,
        from_name: 'JUnited Trust & Safety',
        subject: 'DMCA Takedown Request Received — JUnited',
        body: `
Dear ${form.claimant_name},

We have received your DMCA takedown request regarding the content at:
${form.content_url}

Our team will review your request and take appropriate action within 24 hours of verification.

If we need more information, we will contact you at this email address.

Reference: DMCA-${Date.now()}

JUnited Trust & Safety
dmca@junited.app
        `.trim(),
      });

      setSubmitted(true);
    } catch (err) {
      toast.error('Submission failed. Please email dmca@junited.app directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">DMCA Copyright Policy</h1>
          </div>
        </div>

        {/* Policy overview */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-6 space-y-4 text-[15px] text-slate-700 leading-relaxed">
          <h2 className="font-bold text-slate-900 text-lg">Our Commitment</h2>
          <p>JUnited respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512. We respond to valid copyright infringement notices within <strong>24 hours</strong> of verification.</p>

          <h2 className="font-bold text-slate-900">Designated Copyright Agent</h2>
          <div className="bg-slate-50 rounded-xl p-4 text-[14px] space-y-1">
            <p><strong>JUnited Copyright Agent</strong></p>
            <p>Email: <a href="mailto:dmca@junited.app" className="text-blue-600 underline">dmca@junited.app</a></p>
            <p className="text-slate-500">Claims submitted via email are also accepted and acted upon within the same timeframe.</p>
          </div>

          <h2 className="font-bold text-slate-900">What Happens After You File</h2>
          <ol className="list-decimal pl-5 space-y-1 text-[14px]">
            <li>We acknowledge receipt within 2 hours.</li>
            <li>We review and verify the claim within 24 hours.</li>
            <li>If valid, the content is taken down and the uploader is notified.</li>
            <li>The uploader may file a counter-notice. You will be notified if they do.</li>
            <li>After 10–14 business days with no counter-notice, content remains down.</li>
          </ol>

          <h2 className="font-bold text-slate-900">Repeat Infringers</h2>
          <p>Users who repeatedly infringe copyright are permanently banned from the Platform under our repeat infringer policy.</p>

          <h2 className="font-bold text-slate-900">False Claims</h2>
          <p>Filing a false or misleading DMCA notice may expose you to liability under 17 U.S.C. § 512(f). Please only file if you are the copyright owner or authorized to act on their behalf.</p>
        </div>

        {/* Form */}
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-green-800 mb-2">Takedown Request Received</h2>
            <p className="text-green-700 text-[14px]">We've sent a confirmation to your email. Our team will review your claim within 24 hours. Thank you for helping keep JUnited safe.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 text-lg mb-4">Submit a Takedown Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">Your Full Legal Name *</label>
                <input name="claimant_name" value={form.claimant_name} onChange={handleChange} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[14px] focus:outline-none focus:border-blue-400 focus:bg-white"
                  placeholder="Full name" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">Your Email Address *</label>
                <input name="claimant_email" type="email" value={form.claimant_email} onChange={handleChange} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[14px] focus:outline-none focus:border-blue-400 focus:bg-white"
                  placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">URL of Infringing Content on JUnited *</label>
                <input name="content_url" value={form.content_url} onChange={handleChange} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[14px] focus:outline-none focus:border-blue-400 focus:bg-white"
                  placeholder="https://junited.app/..." />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">Description of the Original Copyrighted Work *</label>
                <textarea name="original_work_description" value={form.original_work_description} onChange={handleChange} required rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[14px] focus:outline-none focus:border-blue-400 focus:bg-white resize-none"
                  placeholder="Describe the original work that was copied and where it can be found online." />
              </div>

              {/* Statements */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="statement_of_ownership" checked={form.statement_of_ownership} onChange={handleChange}
                    className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0" />
                  <span className="text-[13px] text-slate-600">I have a good faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="statement_of_good_faith" checked={form.statement_of_good_faith} onChange={handleChange}
                    className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0" />
                  <span className="text-[13px] text-slate-600">The information in this notice is accurate and, under penalty of perjury, I am the copyright owner or authorized to act on the copyright owner's behalf.</span>
                </label>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">Electronic Signature (type your full name) *</label>
                <input name="signature" value={form.signature} onChange={handleChange} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[14px] focus:outline-none focus:border-blue-400 focus:bg-white"
                  placeholder="Full legal name as signature" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold text-[14px] hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit Takedown Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}