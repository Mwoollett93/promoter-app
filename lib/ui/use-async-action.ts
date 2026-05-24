"use client";

import * as React from "react";

export function useAsyncAction() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = React.useCallback(() => setError(null), []);

  return { loading, error, run, clearError, setError };
}
