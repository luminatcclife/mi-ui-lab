import React from 'react';

interface LiveErrorBoundaryProps {
  children: React.ReactNode;
  /** Cuando cambia, el boundary se reintenta (p. ej. el sourceCode fue editado). */
  resetKey: string;
  fallback: (error: Error) => React.ReactNode;
}

interface LiveErrorBoundaryState {
  error: Error | null;
}

/**
 * Aísla los fallos en tiempo de ejecución de una pieza personalizada
 * renderizada en vivo, para que un componente roto no tumbe todo mi-ui-lab.
 */
export class LiveErrorBoundary extends React.Component<
  LiveErrorBoundaryProps,
  LiveErrorBoundaryState
> {
  state: LiveErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): LiveErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: LiveErrorBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}
