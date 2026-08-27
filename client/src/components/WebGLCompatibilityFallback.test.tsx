import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WebGLCompatibilityFallback } from './WebGLCompatibilityFallback';
import { checkGraphicsCapability } from '../lib/webglCompatibility';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    systemDiagnostics: {
      reportWebGLFailure: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ success: true }),
          isLoading: false,
        }),
      },
    },
  },
}));

describe('WebGLCompatibilityFallback & Compatibility Detection', () => {
  it('detects graphics capability without throwing errors in JSDOM', () => {
    const result = checkGraphicsCapability();
    expect(typeof result.hasWebGL).toBe('boolean');
    expect(typeof result.hasWebGL2).toBe('boolean');
    expect(typeof result.hasWebGPU).toBe('boolean');
  });

  it('renders fallback UI correctly, supports FAQ toggle, retry and report expansion', async () => {
    const handleRetry = vi.fn();
    const handleSimplified = vi.fn();

    render(
      <WebGLCompatibilityFallback
        errorMessage="Custom WebGL missing error"
        rendererInfo="Software Mock GPU"
        onRetry={handleRetry}
        onEnterSimplifiedMode={handleSimplified}
      />
    );

    expect(screen.getByText('3D 图形渲染受限 / WebGL 不可用')).toBeDefined();
    expect(screen.getByText('Custom WebGL missing error')).toBeDefined();

    // Test FAQ accordion toggle
    const faqToggle = screen.getByText('如何开启硬件加速或解决 WebGL 问题？（FAQ）');
    expect(faqToggle).toBeDefined();
    fireEvent.click(faqToggle);

    expect(screen.getByText(/如何在 Chrome \/ Edge 中开启硬件加速？/)).toBeDefined();
    expect(screen.getByText(/如何在 Firefox 中开启 WebGL？/)).toBeDefined();

    // Test error report preview trigger
    const reportToggle = screen.getByText('查看并发送设备错误报告给开发者');
    fireEvent.click(reportToggle);
    expect(screen.getByText('诊断报告预览')).toBeDefined();

    const retryBtn = screen.getByRole('button', { name: /重新检测并重试/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);

    const simplifiedBtn = screen.getByRole('button', { name: /进入 2D 简化管理模式/i });
    fireEvent.click(simplifiedBtn);
    expect(handleSimplified).toHaveBeenCalledTimes(1);
  });
});
