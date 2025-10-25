import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[LinkBio] ErrorBoundary caught error', { error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-6 border rounded-lg bg-muted/30">
          <h3 className="font-semibold mb-2">Ocorreu um erro ao carregar o Link na Bio</h3>
          <p className="text-sm text-muted-foreground mb-4">Tente novamente. Se persistir, recarregue a página.</p>
          <button onClick={this.handleRetry} className="px-4 py-2 rounded bg-primary text-primary-foreground">Tentar novamente</button>
        </div>
      );
    }
    return this.props.children;
  }
}
