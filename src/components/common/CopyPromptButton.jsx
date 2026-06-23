import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Copy-to-clipboard button for AI implementation prompts. Used on the Future
 * Features (roadmap) and App Store Readiness admin tools so a prompt can be
 * one-click copied into Claude Code / Codex.
 */
export default function CopyPromptButton({ text, label = 'Copy Prompt' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Prompt copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : label}
    </button>
  );
}
