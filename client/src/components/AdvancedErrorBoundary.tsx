import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  level?: 'page' | 'section' | 'component';
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
  errorTimestamp: number | null;
}

/**
 * Advanced Error Boundary Component
 * Provides comprehensive error handling with retry logic and recovery options
 */
class AdvancedErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      maxRetries: 3,
      isRetrying: false,
      errorTimestamp: null,
    };
  }

  componentDidMount() {
    this.previousResetKeys = this.props.resetKeys || [];
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary when resetKeys change
    if (this.props.resetKeys && this.previousResetKeys) {
      const keysChanged = this.props.resetKeys.some((key, index) => key !== this.previousResetKeys[index]);
      if (keysChanged) {
        this.resetErrorBoundary();
        this.previousResetKeys = this.props.resetKeys;
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorTimestamp: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by AdvancedErrorBoundary:', error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      errorTimestamp: null,
    });
  };

  handleRetry = async () => {
    const { retryCount, maxRetries } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Simulate retry delay with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);

    this.resetTimeoutId = setTimeout(() => {
      this.setState((prevState) => ({
        ...prevState,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));
      this.resetErrorBoundary();
    }, delay);
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorSeverity = (error: Error): 'critical' | 'warning' | 'info' => {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('timeout')) {
      return 'warning';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'info';
    }
    return 'critical';
  };

  getErrorIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'info':
        return <AlertTriangle className="w-6 h-6 text-blue-500" />;
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { error, errorInfo, retryCount, maxRetries, isRetrying, errorTimestamp } = this.state;
      const severity = this.getErrorSeverity(error);
      const canRetry = retryCount < maxRetries;
      const showDetails = this.props.showDetails !== false;

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(error, this.handleRetry);
      }

      const levelClasses = {
        page: 'min-h-screen',
        section: 'min-h-96',
        component: 'min-h-48',
      };

      return (
        <div className={`flex items-center justify-center p-4 bg-background/50 ${levelClasses[this.props.level || 'component']}`}>
          <Card className="w-full max-w-2xl border-destructive/50">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                {this.getErrorIcon(severity)}
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {severity === 'critical' && '发生错误'}
                    {severity === 'warning' && '连接问题'}
                    {severity === 'info' && '资源不可用'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {severity === 'critical' && '应用遇到了一个意外错误，请尝试重新加载或重试'}
                    {severity === 'warning' && '网络连接出现问题，请检查网络并重试'}
                    {severity === 'info' && '请求的资源不可用，请稍后重试'}
                  </CardDescription>
                </div>
                <Badge variant={severity === 'critical' ? 'destructive' : 'secondary'}>
                  {severity === 'critical' && '严重'}
                  {severity === 'warning' && '警告'}
                  {severity === 'info' && '信息'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Message */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-mono text-muted-foreground break-words">
                  {error.message || '未知错误'}
                </p>
              </div>

              {/* Error Details */}
              {showDetails && errorInfo && (
                <details className="cursor-pointer">
                  <summary className="text-sm text-muted-foreground hover:text-foreground">
                    查看详细信息
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-lg overflow-auto max-h-64">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Retry Information */}
              {canRetry && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                  <p className="text-blue-900 dark:text-blue-100">
                    重试次数: {retryCount} / {maxRetries}
                  </p>
                  {retryCount > 0 && (
                    <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                      使用指数退避策略重试，延迟: {Math.min(1000 * Math.pow(2, retryCount - 1), 10000)}ms
                    </p>
                  )}
                </div>
              )}

              {/* Error Timestamp */}
              {errorTimestamp && (
                <div className="text-xs text-muted-foreground">
                  错误时间: {new Date(errorTimestamp).toLocaleString()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={isRetrying}
                    className="gap-2"
                    variant={severity === 'critical' ? 'default' : 'outline'}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {isRetrying ? `重试中... (${retryCount + 1}/${maxRetries})` : '重试'}
                  </Button>
                )}

                <Button onClick={this.handleReload} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  重新加载页面
                </Button>

                {severity !== 'critical' && (
                  <Button onClick={this.resetErrorBoundary} variant="ghost">
                    关闭
                  </Button>
                )}
              </div>

              {/* Max Retries Reached */}
              {!canRetry && (
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-red-900 dark:text-red-100">
                    已达到最大重试次数。请重新加载页面或联系支持。
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdvancedErrorBoundary;

/**
 * Hook for using error boundary functionality in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { setError };
}

/**
 * Wrapper component for sections with error boundary
 */
export function ErrorBoundarySection({
  children,
  title,
  onError,
}: {
  children: ReactNode;
  title?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}) {
  return (
    <AdvancedErrorBoundary level="section" onError={onError}>
      <div className="space-y-4">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {children}
      </div>
    </AdvancedErrorBoundary>
  );
}
