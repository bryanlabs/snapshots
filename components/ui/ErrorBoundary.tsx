"use client";

import React from "react";
import { motion } from "framer-motion";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          retry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback = ({
  error,
  retry,
}: {
  error?: Error;
  retry: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center"
  >
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className="text-red-500 text-lg font-medium mb-4"
    >
      Something went wrong
    </motion.div>
    <p className="text-muted-foreground mb-6 max-w-md">
      {error?.message || "An unexpected error occurred. Please try again."}
    </p>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={retry}
      className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
    >
      Try Again
    </motion.button>
  </motion.div>
);
