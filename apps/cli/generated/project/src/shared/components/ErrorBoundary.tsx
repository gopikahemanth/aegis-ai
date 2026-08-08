// src/shared/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-500">
          <h2>Something went wrong.</h2>
          <button onClick={() => window.location.reload()} className="mt-4 underline">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;

export type { Props };

export type { State };
