import React, { useState, useCallback, useRef } from 'react';
import { Sparkles, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EventSummaryButton({ event }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const summaryCache = React.useRef({});

  const generateSummary = useCallback(async () => {
    const cacheKey = event.id;
    
    if (summaryCache.current[cacheKey]) {
      setSummary(summaryCache.current[cacheKey]);
      setShowSummary(true);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const prompt = `Provide a concise 2-3 sentence summary of this event for someone deciding whether to attend:

Event: ${event.title || 'Untitled Event'}
Description: ${event.body || 'No description'}
Date: ${event.event_date || 'TBD'}
Time: ${event.event_time || 'TBD'}
Location: ${event.location_text || 'TBD'}

Highlight the main purpose, key activity, and why someone should attend.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
      });

      const generatedSummary = result.data || result;
      summaryCache.current[cacheKey] = generatedSummary;
      setSummary(generatedSummary);
      setShowSummary(true);
    } catch (err) {
      console.error('Summary generation error:', err);
      setError('Could not generate summary. Try again.');
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  }, [event]);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      {!showSummary ? (
        <button
          onClick={generateSummary}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 disabled:opacity-50 text-purple-700 font-semibold text-[13px] rounded-lg border border-purple-200 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating summary...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Summarize with AI
            </>
          )}
        </button>
      ) : (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-3.5 border border-purple-100 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] leading-relaxed text-slate-700 flex-1">{summary}</p>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-1 hover:bg-white rounded transition-colors"
              title="Copy summary"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
          <button
            onClick={() => setShowSummary(false)}
            className="text-[12px] text-purple-600 font-semibold hover:text-purple-700 transition-colors"
          >
            Hide summary
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}