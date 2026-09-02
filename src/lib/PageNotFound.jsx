import { Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PageNotFoundView() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F8FC] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] text-slate-950">
      <section className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Search className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">Page not found</p>
        <h1 className="mt-2 text-[28px] font-black leading-tight tracking-[-0.04em]">We couldn’t find that page</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
          The link may be old or the page may have moved. Your JUnited account and information are safe.
        </p>
        <Link
          to="/Feed"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0A1838] px-4 text-sm font-black text-white transition active:scale-[0.98]"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to Home
        </Link>
      </section>
    </main>
  );
}

export default function PageNotFound() {
  return <PageNotFoundView />;
}
