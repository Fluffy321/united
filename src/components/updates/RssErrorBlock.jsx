import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RssErrorBlock({ data, onRetry, retryLabel = 'Try alternate source' }) {
  const [expanded, setExpanded] = useState(false);

  const error = data?.error || 'Failed to load';
  const stage = data?.stage;
  const rssUrl = data?.rssUrl;
  const status = data?.status;
  const sample = data?.sample;
  const attempts = data?.attempts || [];

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {/* Primary error line */}
          <p className="text-xs font-semibold text-amber-900 mb-1">{error}</p>

          {/* Quick facts */}
          <div className="text-xs text-amber-800 space-y-0.5 mb-2">
            {stage && <div><span className="font-medium">Stage:</span> {stage}</div>}
            {rssUrl && <div className="truncate"><span className="font-medium">URL:</span> {rssUrl}</div>}
            {status != null && <div><span className="font-medium">Status:</span> {status}</div>}
          </div>

          {/* Attempts list */}
          {attempts.length > 0 && (
            <div className="text-xs text-amber-800 mb-2 space-y-0.5">
              {attempts.map((a, i) => (
                <div key={i} className="font-mono truncate">
                  {a.url?.split('/')[2] || a.url} — {a.status} {a.stage ? `(${a.stage})` : ''}
                </div>
              ))}
            </div>
          )}

          {/* Expandable sample */}
          {sample && (
            <div className="mb-2">
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Hide sample' : 'Show response sample'}
              </button>
              {expanded && (
                <pre className="mt-1 text-xs text-amber-900 bg-amber-100 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-24">
                  {sample}
                </pre>
              )}
            </div>
          )}

          <Button size="sm" variant="outline" onClick={onRetry} className="h-7 text-xs gap-1">
            <RefreshCw className="w-3 h-3" />
            {retryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}