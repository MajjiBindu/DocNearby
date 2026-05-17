import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-medical-grey flex flex-col items-center justify-center p-6 text-center">
          <div className="medical-card p-12 max-w-xl space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-secondary tracking-tight">System Interruption</h1>
            <p className="text-medical-text-light font-medium leading-relaxed">
              We encountered a technical anomaly while processing this view. Our diagnostic logs have been updated.
            </p>
            <div className="pt-6">
              <button
                onClick={() => window.location.href = '/'}
                className="btn-primary !px-10 !py-4 text-lg w-full focus-visible:ring-offset-2"
              >
                Return to Home HQ
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-8 p-4 bg-slate-50 rounded-xl text-left text-xs font-mono text-rose-500 overflow-auto max-h-40 border border-slate-100">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
