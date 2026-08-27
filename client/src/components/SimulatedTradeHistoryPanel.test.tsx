import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { calculateSimulatedFeeAllocation } from "@/lib/simulatedTradeHistory";
import { SimulatedTradeHistoryPanel } from "./SimulatedTradeHistoryPanel";

describe("SimulatedTradeHistoryPanel", () => {
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
