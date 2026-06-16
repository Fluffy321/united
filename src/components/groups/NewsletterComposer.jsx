// DEFERRED: no backing table — do not use in beta
import React, { useState } from 'react';
import { Mail, Calendar, MessageSquare, X, Send, Loader2, Eye, Edit3 } from 'lucide-react';
import { dataService } from '@/services';
import { toast } from 'sonner';

export default function NewsletterComposer({ group, memberEmails, onClose, onSent }) {
  const [step, setStep] = useState('compose'); // compose, preview, sending
  const [subject, setSubject] = useState('');
  const [topDiscussions, setTopDiscussions] = useState([]);
  const [upcomingEvents, setUptoDateEvents] = useState([]);
  const [includeDiscussions, setIncludeDiscussions] = useState(true);
  const [includeEvents, setIncludeEvents] = useState(true);
  const [customMessage, setCustomMessage] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');

  const handleGenerateContent = async () => {
    try {
      const discussions = await dataService.entities.GroupDiscussion.filter({ group_id: group.id }, '-created_date', 5);
      const events = await dataService.entities.CommunityEvent.filter({ community_id: group.id }, '-event_date', 5);
      
      setTopDiscussions(discussions);
      setUptoDateEvents(events);
      
      if (!subject) {
        setSubject(`📰 ${group.name} Weekly Digest - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`);
      }
      
      toast.success('Content loaded!');
    } catch (error) {
      toast.error('Failed to load content');
    }
  };

  const generateHtmlTemplate = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .section { background: white; padding: 24px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .section h2 { color: #1e3a8a; font-size: 18px; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
    .item { background: #f8fafc; padding: 16px; margin: 12px 0; border-radius: 12px; border: 1px solid #e2e8f0; }
    .item h3 { margin: 0 0 8px; font-size: 16px; color: #0f172a; }
    .item p { margin: 0 0 8px; font-size: 14px; color: #475569; }
    .meta { font-size: 12px; color: #64748b; display: flex; gap: 12px; }
    .cta-button { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 12px; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 16px 16px; margin-top: 20px; }
    .footer p { margin: 0; font-size: 12px; color: #64748b; }
    .custom-message { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📰 ${group.name} Newsletter</h1>
    <p>${today}</p>
  </div>
  
  ${customMessage ? `<div class="custom-message"><strong>Message from Admin:</strong><br/><br/>${customMessage.replace(/\n/g, '<br/>')}</div>` : ''}
  
  ${includeDiscussions && topDiscussions.length > 0 ? `
  <div class="section">
    <h2>💬 Top Discussions</h2>
    ${topDiscussions.slice(0, 5).map(d => `
      <div class="item">
        <h3>${d.title}</h3>
        <p>by ${d.user_name}</p>
        <div class="meta">
          <span>👍 ${d.likes_count || 0} likes</span>
          <span>💭 ${d.comments_count || 0} comments</span>
        </div>
      </div>
    `).join('')}
    <a href="#" class="cta-button">View All Discussions</a>
  </div>
  ` : ''}
  
  ${includeEvents && upcomingEvents.length > 0 ? `
  <div class="section">
    <h2>📅 Upcoming Events</h2>
    ${upcomingEvents.slice(0, 5).map(e => `
      <div class="item">
        <h3>${e.title}</h3>
        <p>${e.description?.substring(0, 100) || ''}${e.description?.length > 100 ? '...' : ''}</p>
        <div class="meta">
          <span>📆 ${new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          ${e.event_time ? `<span>🕐 ${e.event_time}</span>` : ''}
          ${e.location ? `<span>📍 ${e.location}</span>` : ''}
        </div>
      </div>
    `).join('')}
    <a href="#" class="cta-button">View All Events</a>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>You're receiving this because you're a member of ${group.name}.</p>
    <p style="margin-top: 8px;">Want to unsubscribe? <a href="#" style="color: #2563eb;">Click here</a></p>
  </div>
</body>
</html>`;
    
    return html;
  };

  const handlePreview = () => {
    const html = generateHtmlTemplate();
    setPreviewHtml(html);
    setStep('preview');
  };

  const handleSend = async () => {
    setStep('sending');
    try {
      const html = generateHtmlTemplate();
      const response = await dataService.functions.invoke('sendGroupNewsletter', {
        groupId: group.id,
        groupName: group.name,
        memberUserIds: memberEmails, // Pass user IDs, backend resolves emails
        subject: subject,
        htmlContent: html,
      });
      
      if (response.data?.success) {
        toast.success(`Newsletter sent! ${response.data.sent_count} delivered, ${response.data.failed_count} failed`);
        onSent?.(response.data);
        onClose();
      } else {
        toast.error('Failed to send newsletter');
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setStep('compose');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Send Newsletter</h2>
              <p className="text-xs text-slate-500">To {memberEmails.length} members</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'compose' && (
            <div className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter newsletter subject"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Optional Message from Admin
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personal message to your community..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Content Sections */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">Include in Newsletter:</p>
                
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={includeDiscussions}
                    onChange={(e) => setIncludeDiscussions(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Top Discussions</p>
                    <p className="text-xs text-slate-500">Include top {topDiscussions.length} discussions by engagement</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={includeEvents}
                    onChange={(e) => setIncludeEvents(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Upcoming Events</p>
                    <p className="text-xs text-slate-500">Include next {upcomingEvents.length} upcoming events</p>
                  </div>
                </label>
              </div>

              {/* Load Content Button */}
              {topDiscussions.length === 0 && upcomingEvents.length === 0 && (
                <button
                  onClick={handleGenerateContent}
                  className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  📥 Load Latest Discussions & Events
                </button>
              )}

              {/* Preview */}
              {(topDiscussions.length > 0 || upcomingEvents.length > 0) && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-800 font-semibold mb-2">Ready to Preview:</p>
                  <div className="flex items-center gap-4 text-xs text-blue-700">
                    {includeDiscussions && <span>💬 {topDiscussions.length} discussions</span>}
                    {includeEvents && <span>📅 {upcomingEvents.length} events</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Preview</h3>
                <button
                  onClick={() => setStep('compose')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[500px]"
                  title="Newsletter Preview"
                />
              </div>
            </div>
          )}

          {step === 'sending' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-600 font-semibold">Sending newsletter...</p>
              <p className="text-sm text-slate-500 mt-2">This may take a moment</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step === 'compose' && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePreview}
              disabled={!subject || (topDiscussions.length === 0 && upcomingEvents.length === 0)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview Newsletter
            </button>
          </div>
        )}

        {step === 'preview' && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={() => setStep('compose')}
              className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSend}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
              Send to {memberEmails.length} Members
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
