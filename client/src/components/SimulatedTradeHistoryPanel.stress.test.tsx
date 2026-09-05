import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { generateSimulatedTrades, summarizeSimulatedTrades } from "@/lib/simulatedTradeStress";
import { SimulatedTradeHistoryPanel } from "./SimulatedTradeHistoryPanel";

describe("SimulatedTradeHistoryPanel stress behavior", () => {
  afterEach(() => cleanup());
  it("renders and filters 1200 simulated orders within the local test budget", async () => {
    const trades = generateSimulatedTrades(1200);
    const renderStarted = performance.now();
    render(
      <LanguageProvider>
        <SimulatedTradeHistoryPanel trades={trades} />
      </LanguageProvider>,
    );
    expect(performance.now() - renderStarted).toBeLessThan(2000);
    expect(screen.getAllByText("Stress District 1").length).toBeGreaterThan(0);

    const filterStarted = performance.now();
    const user = userEvent.setup();
    const pendingButton = screen.getByRole("button", { name: "待处理" });
    await user.click(pendingButton);
    await waitFor(() => {
      expect(pendingButton).toHaveAttribute("aria-pressed", "true");
      expect(screen.getAllByRole("row")).toHaveLength(51);
    });
    expect(performance.now() - filterStarted).toBeLessThan(2000);
  });

  it("keeps integer fee allocation exact under the 1200-order load", () => {
    const summary = summarizeSimulatedTrades(generateSimulatedTrades(1200));
    expect(summary.orderCount).toBe(1200);
    expect(summary.remainderMicros).toBe(BigInt("0"));
    expect(summary.totalFeeMicros).toBe(summary.treasuryMicros + summary.marketingMicros);
  });
});
