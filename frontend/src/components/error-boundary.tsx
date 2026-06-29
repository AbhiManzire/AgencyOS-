'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/design-system';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallbackTitle?: string;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly message: string;
}

/** Client-side error boundary for catching render errors in child trees. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled UI error', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={this.props.fallbackTitle ?? 'Something went wrong'}
          message={this.state.message || 'An unexpected error occurred in the application.'}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload page
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
