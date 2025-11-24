/**
 * Centralized Error Logging Service
 * Provides consistent error handling and logging across the application
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorLog {
  message: string;
  severity: ErrorSeverity;
  timestamp: string;
  context?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

class ErrorLogService {
  private logs: ErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 errors in memory

  /**
   * Log an error with context
   */
  logError(
    message: string,
    error?: Error | unknown,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    const errorLog: ErrorLog = {
      message,
      severity,
      timestamp: new Date().toISOString(),
      context,
      error: error instanceof Error ? error : undefined,
      metadata,
    };

    // Add to in-memory logs
    this.logs.push(errorLog);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console logging based on severity
    const consoleMessage = `[${severity.toUpperCase()}] ${context ? `[${context}] ` : ''}${message}`;
    
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(consoleMessage, error);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(consoleMessage, error);
        break;
      case ErrorSeverity.LOW:
        console.log(consoleMessage, error);
        break;
    }

    // In production, send to external error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(errorLog);
    }
  }

  /**
   * Log API errors specifically
   */
  logApiError(
    endpoint: string,
    error: any,
    severity: ErrorSeverity = ErrorSeverity.HIGH
  ): void {
    const message = `API Error: ${endpoint}`;
    const metadata = {
      endpoint,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
    };

    this.logError(message, error, severity, 'API', metadata);
  }

  /**
   * Log authentication errors
   */
  logAuthError(
    message: string,
    error?: Error | unknown,
    metadata?: Record<string, any>
  ): void {
    this.logError(message, error, ErrorSeverity.HIGH, 'Authentication', metadata);
  }

  /**
   * Log component errors
   */
  logComponentError(
    componentName: string,
    error: Error | unknown,
    metadata?: Record<string, any>
  ): void {
    this.logError(
      `Component Error: ${componentName}`,
      error,
      ErrorSeverity.MEDIUM,
      'Component',
      metadata
    );
  }

  /**
   * Log network errors
   */
  logNetworkError(
    message: string,
    error?: Error | unknown,
    metadata?: Record<string, any>
  ): void {
    this.logError(message, error, ErrorSeverity.HIGH, 'Network', metadata);
  }

  /**
   * Get recent error logs
   */
  getRecentLogs(count: number = 10): ErrorLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by severity
   */
  getLogsBySeverity(severity: ErrorSeverity): ErrorLog[] {
    return this.logs.filter(log => log.severity === severity);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON (for debugging)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Send to external error tracking service (e.g., Sentry, LogRocket)
   * This is a placeholder - implement based on your service
   */
  private sendToExternalService(errorLog: ErrorLog): void {
    // Example: Send to Sentry
    // if (window.Sentry) {
    //   window.Sentry.captureException(errorLog.error, {
    //     level: errorLog.severity,
    //     tags: {
    //       context: errorLog.context,
    //     },
    //     extra: errorLog.metadata,
    //   });
    // }

    // Example: Send to custom backend endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorLog),
    // }).catch(() => {
    //   // Silently fail to avoid infinite error loops
    // });

    // For now, just track that we would send it
    if (errorLog.severity === ErrorSeverity.CRITICAL || errorLog.severity === ErrorSeverity.HIGH) {
      console.log('[ErrorLogService] Would send to external service in production:', errorLog.message);
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogService();

// Helper functions for common use cases
export const logError = (message: string, error?: Error | unknown, severity?: ErrorSeverity) => {
  errorLogger.logError(message, error, severity);
};

export const logApiError = (endpoint: string, error: any) => {
  errorLogger.logApiError(endpoint, error);
};

export const logAuthError = (message: string, error?: Error | unknown) => {
  errorLogger.logAuthError(message, error);
};

export const logComponentError = (componentName: string, error: Error | unknown) => {
  errorLogger.logComponentError(componentName, error);
};

export const logNetworkError = (message: string, error?: Error | unknown) => {
  errorLogger.logNetworkError(message, error);
};

export default errorLogger;
