import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { NEON_COLOR } from '../utils/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
          <AlertTriangle className="h-16 w-16 mb-4" style={{ color: NEON_COLOR }} />
          <h2 className="text-2xl font-bold mb-2">Er is iets misgegaan</h2>
          <p className="text-gray-400 mb-6 max-w-md">{this.state.error?.message ?? 'Onbekende fout'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 font-bold text-black rounded-lg"
            style={{ backgroundColor: NEON_COLOR }}
          >
            Pagina herladen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
