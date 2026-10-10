import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { vi } from "vitest";
import { createSimulatedStatusEvent, createSimulatedTradeSocket } from "@/lib/simulatedTradeSocket";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { calculateSimulatedFeeAllocation } from "@/lib/simulatedTradeHistory";
import { SimulatedTradeHistoryPanel } from "./SimulatedTradeHistoryPanel";

describe("SimulatedTradeHistoryPanel", () => {
  afterEach(() => vi.useRealTimers());
  it("splits a simulated fee into 60% treasury and 40% marketing", () => {
    expect(calculateSimulatedFeeAllocation("12500")).toMatchObject({
      totalFeeIsc: "12500.000000",
      treasuryIsc: "7500.000000",
      marketingIsc: "5000.000000",
      treasuryBps: 6000,
      marketingBps: 4000,
    });
  });

  it("renders local-only history and expands the first order fee detail", () => {
    render(
      <LanguageProvider>
        <SimulatedTradeHistoryPanel />
      </LanguageProvider>,
    );

    expect(screen.getByText("模拟市场交易历史")).toBeInTheDocument();
    expect(screen.getByText("仅模拟")).toBeInTheDocument();
    expect(screen.getByText("国库（60%）")).toBeInTheDocument();
    expect(screen.getByText("营销钱包（40%）")).toBeInTheDocument();
    expect(screen.getByText(/7,500/)).toBeInTheDocument();
    expect(screen.getAllByText(/5,000/).length).toBeGreaterThan(0);
  });

  it("shows a skeleton while the simulated socket is initially connecting", () => {
    const socket = createSimulatedTradeSocket();
    const originalConnect = socket.connect;
    socket.connect = () => {};
    act(() => {
      render(
        <LanguageProvider>
          <SimulatedTradeHistoryPanel socket={socket} />
        </LanguageProvider>,
      );
    });

    expect(screen.getByTestId("trade-history-skeleton")).toBeInTheDocument();
    expect(screen.getByText("正在同步模拟订单状态…")).toBeInTheDocument();
    socket.connect = originalConnect;
    act(() => socket.close());
  });

  it("updates a pending order from a simulated WebSocket event", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const socket = createSimulatedTradeSocket();
    render(
      <LanguageProvider>
        <SimulatedTradeHistoryPanel socket={socket} />
      </LanguageProvider>,
    );

    expect(screen.getAllByText("待处理").length).toBeGreaterThan(0);
    act(() => {
      socket.publish(createSimulatedStatusEvent("sim-trade-004", 10, "COMPLETED", "0xstreamedcompleted"));
    });
    expect(screen.getAllByText("已完成").length).toBeGreaterThan(0);
    expect(screen.getByText("已同步事件 10")).toBeInTheDocument();
    expect(screen.getByTestId("simulated-trade-completed-toast")).toBeInTheDocument();
    expect(screen.getByText("模拟交易已完成")).toBeInTheDocument();
    expect(screen.getByText("Aurora Business Plot")).toBeInTheDocument();
    const detailsToggle = screen.getByTestId("simulated-trade-details-toggle");
    expect(detailsToggle).toHaveAttribute("aria-expanded", "false");
    act(() => detailsToggle.click());
    expect(detailsToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("simulated-trade-toast-details")).toBeInTheDocument();
    expect(screen.getByText("订单类型")).toBeInTheDocument();
    expect(screen.getByText("Token ID")).toBeInTheDocument();
    expect(screen.getByText("local-hardhat")).toBeInTheDocument();
    const copyLogButton = screen.getByTestId("simulated-trade-copy-log");
    await act(async () => {
      copyLogButton.click();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Trade ID: sim-trade-004"));
    expect(screen.getByText("日志已复制")).toBeInTheDocument();
    act(() => detailsToggle.click());
    expect(detailsToggle).toHaveAttribute("aria-expanded", "false");
    act(() => vi.advanceTimersByTime(800));
    act(() => vi.advanceTimersByTime(2400));
    expect(screen.queryByTestId("simulated-trade-completed-toast")).not.toBeInTheDocument();
  });

  it("shows distinct pending and failed toast notifications", async () => {
    vi.useFakeTimers();
    const socket = createSimulatedTradeSocket();
    render(
      <LanguageProvider>
        <SimulatedTradeHistoryPanel socket={socket} />
      </LanguageProvider>,
    );

    await act(async () => {
      socket.publish(createSimulatedStatusEvent("sim-trade-001", 11, "PENDING", "0xpending"));
      await Promise.resolve();
    });
    expect(screen.getByTestId("simulated-trade-pending-toast")).toBeInTheDocument();
    expect(screen.getByText("模拟交易待处理")).toBeInTheDocument();
    expect(screen.getByTestId("simulated-trade-pending-icon")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("simulated-trade-pending-toast")).toBeInTheDocument();
    const pendingProgress = screen.getByRole("progressbar", { name: "交易处理中" });
    expect(pendingProgress).toHaveAttribute("aria-valuetext", "正在处理中");
    expect(pendingProgress).not.toHaveAttribute("aria-valuenow");
    expect(screen.getByText("正在等待模拟网络确认…")).toBeInTheDocument();
    expect(pendingProgress.querySelector(".motion-safe\\:animate-\\[pending-toast-progress_1\\.4s_ease-in-out_infinite\\]")).toBeInTheDocument();

    await act(async () => {
      socket.publish(createSimulatedStatusEvent("sim-trade-001", 12, "FAILED", "0xfailed"));
      await Promise.resolve();
    });
    expect(screen.queryByTestId("simulated-trade-pending-toast")).not.toBeInTheDocument();
    expect(screen.getByTestId("simulated-trade-failed-toast")).toBeInTheDocument();
    expect(screen.getByText("模拟交易失败")).toBeInTheDocument();
    expect(screen.getByTestId("simulated-trade-failed-icon")).toBeInTheDocument();
    act(() => screen.getByTestId("simulated-trade-details-toggle").click());
    const failedWriteText = vi.fn().mockRejectedValue(new Error("permission denied"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: failedWriteText } });
    await act(async () => {
      screen.getByTestId("simulated-trade-copy-log").click();
      await Promise.resolve();
    });
    expect(failedWriteText).toHaveBeenCalledWith(expect.stringContaining("Error: Simulated trade reported FAILED"));
    expect(screen.getByRole("alert")).toHaveTextContent("复制失败");
    act(() => vi.advanceTimersByTime(3200));
    expect(screen.queryByTestId("simulated-trade-failed-toast")).not.toBeInTheDocument();
  });

  it("retries a failed trade through the local simulated stream", async () => {
    vi.useFakeTimers();
    const socket = createSimulatedTradeSocket();
    render(
      <LanguageProvider>
        <SimulatedTradeHistoryPanel socket={socket} />
      </LanguageProvider>,
    );

    await act(async () => {
      socket.publish(createSimulatedStatusEvent("sim-trade-001", 20, "FAILED", "0xfailedretry"));
      await Promise.resolve();
    });
    act(() => screen.getByTestId("simulated-trade-details-toggle").click());
    const retryButton = screen.getByTestId("simulated-trade-retry");
    expect(retryButton).toHaveTextContent("重试");
    await act(async () => {
      retryButton.click();
      await Promise.resolve();
    });
    expect(screen.getByTestId("simulated-trade-pending-toast")).toBeInTheDocument();
    expect(screen.getByText("模拟交易待处理")).toBeInTheDocument();
    expect(screen.getByTestId("simulated-trade-pending-progress")).toBeInTheDocument();
  });

  it("shows reconnecting and recovers after a simulated disconnect", () => {
    vi.useFakeTimers();
    const socket = createSimulatedTradeSocket();
    render(
      <LanguageProvider>
        <SimulatedTradeHistoryPanel socket={socket} />
      </LanguageProvider>,
    );

    act(() => socket.disconnect?.("模拟网络暂时中断"));
    expect(screen.getByText("重连中（第 1 次）")).toBeInTheDocument();
    expect(screen.getByText("模拟网络提示：模拟网络暂时中断")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByText("实时连接")).toBeInTheDocument();
    act(() => vi.runOnlyPendingTimers());
  });

  it("filters pending orders without introducing live-chain records", async () => {
    const { userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <SimulatedTradeHistoryPanel />
      </LanguageProvider>,
    );

    await user.click(screen.getByRole("button", { name: "待处理" }));
    expect(screen.getByText("Crystal Market Residence")).toBeInTheDocument();
    expect(screen.queryByText("Aurora Business Plot")).not.toBeInTheDocument();
  });
});
