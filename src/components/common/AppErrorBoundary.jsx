import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { captureError } from '@/lib/analytics';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && this.props.resetKey && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error, info) {
    console.error('JUnited app error:', error, info);
    captureError(error, {
      componentStack: info?.componentStack,
      boundary: this.props.inline ? 'inline' : 'app',
    });
  }

  handleGoHome = () => {
    this.setState({ hasError: false }, () => {
      window.location.assign(this.props.homePath || '/Feed');
    });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // Inline variant — used to protect individual page sections.
    // Renders a compact error card instead of blowing up the full page.
    if (this.props.inline) {
      return (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center">
          <AlertTriangle className="h-5 w-5 text-slate-400" />
          <p className="text-[13px] font-semibold text-slate-600">
            {this.props.fallbackMessage || 'This section could not load.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      );
    }

    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#F6F8FB] px-4">
        <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-slate-950">Something did not load right.</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Refresh the page. If it happens again, the app now shows this screen instead of going blank.
          </p>
          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh app
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              Go to Feed
            </button>
          </div>
        </section>
      </main>
    );
  }
}
