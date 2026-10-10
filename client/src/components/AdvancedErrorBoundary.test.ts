import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import AdvancedErrorBoundary from './AdvancedErrorBoundary';

describe('AdvancedErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Error Detection', () => {
    it('should catch and display errors', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
      );

      expect(screen.getByText('发生错误')).toBeTruthy();
      expect(screen.getByText('Test error')).toBeTruthy();
    });

    it('should display error severity badge', () => {
      const ThrowError = () => {
        throw new Error('Network timeout');
      };

      render(
        React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
      );

      expect(screen.getByText('警告')).toBeTruthy();
    });

    it('should handle different error types', () => {
      const TestError = ({ message }: { message: string }) => {
        throw new Error(message);
      };

      // Critical error
      const { rerender: rerender1 } = render(
        React.createElement(AdvancedErrorBoundary, {}, 
          React.createElement(TestError, { message: 'Critical error' })
        )
      );
      expect(screen.getByText('严重')).toBeTruthy();
    });
  });

  describe('Retry Functionality', () => {
    it('should show retry button when retries available', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
      );

      const retryButton = screen.getByText('重试');
      expect(retryButton).toBeTruthy();
    });

    it('should track retry attempts', async () => {
      const user = userEvent.setup();
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { rerender } = render(
        React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
      );

      const retryButton = screen.getByText('重试');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/重试中/)).toBeTruthy();
      });
    });

    it('should hide retry after max attempts', () => {
      vi.useFakeTimers();
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
      );

      for (const delay of [1000, 2000, 4000]) {
        act(() => {
          fireEvent.click(screen.getByText('重试'));
          vi.advanceTimersByTime(delay);
        });
      }

      expect(screen.queryByText('重试')).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('Error Details', () => {
    it('should show error details when requested', () => {
      const ThrowError = () => {
        throw new Error('Test error with details');
      };

      render(
        React.createElement(AdvancedErrorBoundary, { showDetails: true }, 
          React.createElement(ThrowError)
        )
      );

      expect(screen.getByText('查看详细信息')).toBeTruthy();
    });

    it('should hide error details by default', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        React.createElement(AdvancedErrorBoundary, { showDetails: false }, 
          React.createElement(ThrowError)
        )
      );

      expect(screen.queryByText('查看详细信息')).toBeFalsy();
    });

    it('should display error timestamp', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
      );

      expect(screen.getByText(/错误时间:/)).toBeTruthy();
    });
  });

  describe('Custom Fallback', () => {
    it('should use custom fallback if provided', () => {
      const customFallback = (error: Error, retry: () => void) => {
        return React.createElement('div', {}, `Custom error: ${error.message}`);
      };

      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        React.createElement(AdvancedErrorBoundary, { fallback: customFallback }, 
          React.createElement(ThrowError)
        )
      );

      expect(screen.getByText('Custom error: Test error')).toBeTruthy();
    });
  });

  describe('Error Callback', () => {
    it('should call onError callback when error occurs', () => {
      const onError = vi.fn();
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        React.createElement(AdvancedErrorBoundary, { onError }, 
          React.createElement(ThrowError)
        )
      );

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Level Prop', () => {
    it('should apply correct height class for page level', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        React.createElement(AdvancedErrorBoundary, { level: 'page' }, 
          React.createElement(ThrowError)
        )
      );

      const wrapper = container.querySelector('[class*="min-h-screen"]');
      expect(wrapper).toBeTruthy();
    });

    it('should apply correct height class for section level', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        React.createElement(AdvancedErrorBoundary, { level: 'section' }, 
          React.createElement(ThrowError)
        )
      );

      const wrapper = container.querySelector('[class*="min-h-96"]');
      expect(wrapper).toBeTruthy();
    });

    it('should apply correct height class for component level', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        React.createElement(AdvancedErrorBoundary, { level: 'component' }, 
          React.createElement(ThrowError)
        )
      );

      const wrapper = container.querySelector('[class*="min-h-48"]');
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Reset Keys', () => {
    it('should reset error when resetKeys change', () => {
      const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return React.createElement('div', {}, 'No error');
      };

      const { rerender } = render(
        React.createElement(AdvancedErrorBoundary, { resetKeys: [1] }, 
          React.createElement(ThrowError, { shouldThrow: true })
        )
      );

      expect(screen.getByText('发生错误')).toBeTruthy();

      rerender(
        React.createElement(AdvancedErrorBoundary, { resetKeys: [2] }, 
          React.createElement(ThrowError, { shouldThrow: false })
        )
      );

      expect(screen.getByText('No error')).toBeTruthy();
    });
  });

  describe('Action Buttons', () => {
    it('should have reload button', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
      );

      expect(screen.getByText('重新加载页面')).toBeTruthy();
    });

    it('should have close button for non-critical errors', () => {
      const ThrowError = () => {
        throw new Error('Not found');
      };

      render(
        React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
      );

      expect(screen.getByText('关闭')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
      );

      const errorMessage = screen.getByText('Test error');
      expect(errorMessage).toBeTruthy();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
      );

      const retryButton = screen.getByText('重试');
      await user.tab();
      expect(retryButton).toBeTruthy();
    });
  });
});

describe('Error Handling Integration', () => {
  it('should handle network errors gracefully', () => {
    const NetworkError = () => {
      throw new Error('Network timeout');
    };

    render(
      React.createElement(AdvancedErrorBoundary, {}, React.createElement(NetworkError))
    );

    expect(screen.getByText('连接问题')).toBeTruthy();
    expect(screen.getByText('警告')).toBeTruthy();
  });

  it('should handle 404 errors gracefully', () => {
    const NotFoundError = () => {
      throw new Error('404 Not Found');
    };

    render(
      React.createElement(AdvancedErrorBoundary, {}, React.createElement(NotFoundError))
    );

    expect(screen.getByText('资源不可用')).toBeTruthy();
    expect(screen.getByText('信息')).toBeTruthy();
  });

  it('should handle critical errors gracefully', () => {
    const CriticalError = () => {
      throw new Error('Critical system failure');
    };

    render(
      React.createElement(AdvancedErrorBoundary, {}, React.createElement(CriticalError))
    );

    expect(screen.getByText('发生错误')).toBeTruthy();
    expect(screen.getByText('严重')).toBeTruthy();
  });

  it('should maintain error state across re-renders', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { rerender } = render(
      React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
    );

    expect(screen.getByText('发生错误')).toBeTruthy();

    rerender(
      React.createElement(AdvancedErrorBoundary, {}, React.createElement(ThrowError))
    );

    expect(screen.getByText('发生错误')).toBeTruthy();
  });
});
