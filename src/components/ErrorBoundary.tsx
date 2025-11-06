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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console so we can see it in Lovable logs
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-6 border rounded-md bg-card text-card-foreground">
          <h3 className="font-semibold mb-2">Ocorreu um erro ao carregar este bloco.</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tente atualizar a página ou clique em "Tentar novamente".
          </p>
          {this.state.error && (
            <details className="text-xs text-muted-foreground whitespace-pre-wrap mb-4">
              <summary className="cursor-pointer mb-2">Ver detalhes do erro</summary>
              <div className="p-3 rounded bg-muted">
                <div className="font-mono mb-2">{this.state.error.message}</div>
                <pre className="font-mono overflow-auto max-h-60">{(this.state.error as any).stack}</pre>
              </div>
            </details>
          )}
          <button
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
