import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function JewishHubBackButton() {
  return (
    <Link
      to="/JewishHub"
      aria-label="Back to Jewish Hub"
      className="motion-press mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
    >
      <ArrowLeft className="h-4 w-4" />
    </Link>
  );
}
