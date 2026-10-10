import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PerformanceMonitorPanel } from "./PerformanceMonitorPanel";

describe("PerformanceMonitorPanel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows an honest waiting state when no Babylon engine is registered", () => {
    render(<PerformanceMonitorPanel />);
    expect(screen.getByTestId("performance-monitor-panel")).toBeTruthy();
    expect(screen.getByTestId("performance-monitor-unavailable")).toHaveTextContent("等待 Babylon.js 场景注册");
    expect(screen.getByText(/不伪造性能数据/)).toBeTruthy();
  });

  it("can be disabled and closed without leaving a sampling timer", () => {
    vi.useFakeTimers();
    const { rerender } = render(<PerformanceMonitorPanel enabled={false} />);
    expect(screen.queryByTestId("performance-monitor-panel")).toBeNull();

    const onClose = vi.fn();
    rerender(<PerformanceMonitorPanel onClose={onClose} sampleIntervalMs={250} />);
    fireEvent.click(screen.getByRole("button", { name: "关闭性能监控面板" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1_000));
  });
});
