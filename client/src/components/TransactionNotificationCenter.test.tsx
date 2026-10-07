import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SimulatedTradeNotificationProvider, useSimulatedTradeNotifications } from "@/contexts/SimulatedTradeNotificationContext";
import { TransactionNotificationProvider } from "@/contexts/TransactionNotificationContext";
import { SIMULATED_TRADE_HISTORY } from "@/lib/simulatedTradeHistory";
import { TransactionNotificationCenter } from "./TransactionNotificationCenter";

function SeedNotification() {
  const { recordNotification, registerRetryHandler } = useSimulatedTradeNotifications();
  useEffect(() => registerRetryHandler((trades) => {
    trades.forEach((trade, index) => recordNotification({ ...trade, status: "PENDING", txHash: `${trade.txHash}-retry` }, 20 + index));
    return trades.length;
  }), [recordNotification, registerRetryHandler]);
  return <>
    <button type="button" onClick={() => recordNotification(SIMULATED_TRADE_HISTORY[0], 7)}>seed</button>
    <button type="button" onClick={() => recordNotification({ ...SIMULATED_TRADE_HISTORY[0], id: "sim-failed-001", status: "FAILED", txHash: "0xfailed001" }, 8)}>seed failed</button>
  </>;
}

describe("TransactionNotificationCenter", () => {
  it("shows simulated history, filters, expands details, copies a log, and clears read items", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(
      <LanguageProvider>
        <TransactionNotificationProvider>
          <SimulatedTradeNotificationProvider>
            <SeedNotification />
            <TransactionNotificationCenter />
          </SimulatedTradeNotificationProvider>
        </TransactionNotificationProvider>
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByText("seed"));
    fireEvent.click(screen.getByText("seed failed"));
    fireEvent.click(screen.getByRole("button", { name: /打开通知中心|Open notification center/ }));
    expect(screen.getByTestId("simulated-notification-center")).toBeInTheDocument();
    expect(screen.getByTestId("simulated-notification-completed")).toBeInTheDocument();
    expect(screen.getByTestId("simulated-notification-failed")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("simulated-retry-all-failed"));
    await waitFor(() => expect(screen.getByTestId("simulated-notification-pending")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/批量重试完成|已重新发起 1 笔失败交易/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("模拟交易状态筛选"), { target: { value: "FAILED" } });
    expect(screen.getByTestId("simulated-notification-failed")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("模拟交易状态筛选"), { target: { value: "ALL" } });
    const completedNotification = screen.getByTestId("simulated-notification-completed");
    fireEvent.click(within(completedNotification).getByTestId("simulated-notification-details"));
    expect(screen.getByText("sim-trade-001")).toBeInTheDocument();
    fireEvent.click(within(completedNotification).getByTestId("simulated-notification-copy"));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Trade ID: sim-trade-001")));
    fireEvent.click(screen.getByTestId("simulated-mark-all-read"));
    expect(screen.queryByLabelText("未读")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("simulated-clear-read"));
    await waitFor(() => expect(screen.getByText("暂无模拟 Toast 记录")).toBeInTheDocument());
  });
});
