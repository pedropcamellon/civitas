import React, { Component, type ComponentType, type PropsWithChildren } from "react";
import { ErrorFallback, type ErrorFallbackProps } from "@/components/ErrorFallback";

export type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, stackTrace: string) => void;
}>;

type State = { error: Error | null };

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { error: null };

  static defaultProps = { FallbackComponent: ErrorFallback };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.props.onError?.(error, info.componentStack);
  }

  resetError = () => this.setState({ error: null });

  render() {
    const { FallbackComponent } = this.props;
    return this.state.error && FallbackComponent
      ? <FallbackComponent error={this.state.error} resetError={this.resetError} />
      : this.props.children;
  }
}
