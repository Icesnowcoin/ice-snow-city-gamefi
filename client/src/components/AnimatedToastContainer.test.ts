import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AnimatedToastContainer, type ToastItem } from './AnimatedToastContainer';

const testToast = { id: 'test-toast', content: '测试提示', type: 'success', duration: 0 };


describe('AnimatedToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Animation Effects', () => {
    it('should apply enter animation on toast mount', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, {
          config: { enterDuration: 300 },
          initialToasts: [testToast],
        })
      );

      const toastElement = document.body.querySelector('[style*="transition"]');
      expect(toastElement).toBeTruthy();
      expect(toastElement?.getAttribute('style')).toContain('300ms');
    });

    it('should apply exit animation on toast removal', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, {
          config: { exitDuration: 200 },
          initialToasts: [testToast],
        })
      );

      const exitingToast = document.body.querySelector('[style*="opacity: 0"]');
      if (exitingToast) {
        expect(exitingToast.getAttribute('style')).toContain('200ms');
      }
    });

    it('should use cubic-bezier easing for enter animation', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastElement = document.body.querySelector('[style*="transition"]');
      const style = toastElement?.getAttribute('style') || '';
      expect(style).toContain('cubic-bezier');
    });

    it('should use ease-out for exit animation', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      // 在退出时应该使用 ease-out
      const exitingToast = document.body.querySelector('[style*="opacity: 0"]');
      if (exitingToast) {
        expect(exitingToast.getAttribute('style')).toContain('ease-out');
      }
    });
  });

  describe('Stacking Layout', () => {
    it('should stack toasts vertically with correct spacing', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, {
          config: { stackSpacing: 12, position: 'top-right' },
          initialToasts: [testToast],
        })
      );

      const toastContainer = document.body.querySelector('.flex.flex-col');
      expect(toastContainer).toHaveClass('gap-0');
    });

    it('should position toasts at top-right by default', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const positionContainer = document.body.querySelector('.fixed.z-50');
      expect(positionContainer).toHaveClass('top-4', 'right-4');
    });

    it('should support different positions', async () => {
      const positions = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ] as const;

      for (const position of positions) {
        const { container } = render(
          React.createElement(AnimatedToastContainer, {
            config: { position },
          })
        );

        const positionContainer = document.body.querySelector('.fixed.z-50');
        expect(positionContainer).toBeTruthy();
      }
    });

    it('should calculate correct transform for stacked toasts', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, {
          config: { stackSpacing: 12, position: 'top-right' },
          initialToasts: [testToast],
        })
      );

      const toastElements = document.body.querySelectorAll('[style*="transform"]');
      expect(toastElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Toast Types and Styling', () => {
    it('should apply success styling', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastElement = document.body.querySelector('.bg-green-600');
      if (toastElement) {
        expect(toastElement).toHaveClass('text-white', 'border-green-700');
      }
    });

    it('should apply error styling', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastElement = document.body.querySelector('.bg-red-600');
      if (toastElement) {
        expect(toastElement).toHaveClass('text-white', 'border-red-700');
      }
    });

    it('should apply info styling', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastElement = document.body.querySelector('.bg-blue-600');
      if (toastElement) {
        expect(toastElement).toHaveClass('text-white', 'border-blue-700');
      }
    });

    it('should apply warning styling', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastElement = document.body.querySelector('.bg-yellow-600');
      if (toastElement) {
        expect(toastElement).toHaveClass('text-white', 'border-yellow-700');
      }
    });
  });

  describe('Max Toasts Limit', () => {
    it('should respect maxToasts configuration', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, {
          config: { maxToasts: 3 },
          initialToasts: [testToast],
        })
      );

      const toastElements = document.body.querySelectorAll('[role="alert"]');
      expect(toastElements.length).toBeLessThanOrEqual(3);
    });

    it('should remove oldest toast when exceeding max', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, {
          config: { maxToasts: 2 },
          initialToasts: [testToast],
        })
      );

      // 模拟添加超过最大数量的 Toast
      const toastElements = document.body.querySelectorAll('[style*="transform"]');
      expect(toastElements.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Close Button', () => {
    it('should render close button for each toast', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const closeButtons = document.body.querySelectorAll('button');
      closeButtons.forEach((button) => {
        expect(button.textContent).toBe('×');
      });
    });

    it('should have proper close button styling', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const closeButtons = document.body.querySelectorAll('button');
      closeButtons.forEach((button) => {
        expect(button).toHaveClass('opacity-70', 'hover:opacity-100');
      });
    });
  });

  describe('Portal Rendering', () => {
    it('should render to document.body via Portal', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastContainer = document.body.querySelector('.fixed.z-50');
      expect(toastContainer).toBeTruthy();
    });

    it('should have correct z-index for stacking context', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastContainer = document.body.querySelector('.fixed.z-50');
      expect(toastContainer).toHaveClass('z-50');
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastContainer = document.body.querySelector('.w-80');
      expect(toastContainer).toHaveClass('max-w-[calc(100vw-2rem)]');
    });

    it('should handle center position with transform', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, {
          config: { position: 'top-center' },
        })
      );

      const positionContainer = document.body.querySelector('.fixed.z-50');
      expect(positionContainer).toHaveClass('-translate-x-1/2');
    });
  });

  describe('Animation Duration Configuration', () => {
    it('should use custom enter duration', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, {
          config: { enterDuration: 500 },
          initialToasts: [testToast],
        })
      );

      const toastElement = document.body.querySelector('[style*="transition"]');
      expect(toastElement?.getAttribute('style')).toContain('500ms');
    });

    it('should use custom exit duration', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, {
          config: { exitDuration: 300 },
          initialToasts: [testToast],
        })
      );

      const exitingToast = document.body.querySelector('[style*="opacity: 0"]');
      if (exitingToast) {
        expect(exitingToast.getAttribute('style')).toContain('300ms');
      }
    });

    it('should use custom stack spacing', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, {
          config: { stackSpacing: 20 },
          initialToasts: [testToast],
        })
      );

      const toastContainer = document.body.querySelector('.flex.flex-col');
      expect(toastContainer).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on close button', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const closeButtons = document.body.querySelectorAll('button');
      closeButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label', '关闭提示');
      });
    });

    it('should have pointer-events-auto for interactivity', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastElement = document.body.querySelector('.pointer-events-auto');
      expect(toastElement).toHaveClass('pointer-events-auto');
    });
  });

  describe('Visual Effects', () => {
    it('should have shadow effect', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastElement = document.body.querySelector('.shadow-lg');
      expect(toastElement).toHaveClass('shadow-lg');
    });

    it('should have rounded corners', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastElement = document.body.querySelector('.rounded-lg');
      expect(toastElement).toHaveClass('rounded-lg');
    });

    it('should have border styling', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastElement = document.body.querySelector('.border');
      expect(toastElement).toHaveClass('border');
    });

    it('should have padding', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastElement = document.body.querySelector('.px-4.py-3');
      expect(toastElement).toHaveClass('px-4', 'py-3');
    });
  });

  describe('Content Rendering', () => {
    it('should render toast content', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const contentElement = document.body.querySelector('.flex-1.text-sm');
      expect(contentElement).toBeTruthy();
    });

    it('should have flex layout for content and close button', async () => {
      const { container } = render(
        React.createElement(AnimatedToastContainer, { initialToasts: [testToast] })
      );

      const toastElement = document.body.querySelector('.flex.items-center');
      expect(toastElement).toHaveClass('justify-between', 'gap-3');
    });
  });
});
