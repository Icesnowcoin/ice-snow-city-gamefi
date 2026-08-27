import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GameHubAssetShopPanel from "./GameHubAssetShopPanel";

describe("GameHubAssetShopPanel", () => {
  it("opens the simulated asset shop and purchases an affordable building", () => {
    const onPurchase = vi.fn();

    render(
      <GameHubAssetShopPanel
        balance={6800}
        ownedItemIds={[]}
        onPurchase={onPurchase}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开虚拟资产商店" }));

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("城市资产商店")).toBeDefined();
    expect(screen.getByText("冰晶广场")).toBeDefined();
    expect(screen.getByText("5,000 ISC")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "购买冰晶广场" }));

    expect(onPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ id: "crystal-plaza", price: 5000, kind: "建筑" }),
    );
    expect(screen.getByRole("status").textContent).toContain("已购买 冰晶广场");
  });

  it("disables purchases when the simulated balance is insufficient", () => {
    const onPurchase = vi.fn();

    render(
      <GameHubAssetShopPanel
        balance={100}
        ownedItemIds={[]}
        onPurchase={onPurchase}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开虚拟资产商店" }));

    const purchaseButton = screen.getByRole("button", { name: "购买冰晶广场" });
    expect((purchaseButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "购买天际线塔楼" })).toBeDefined();
    expect(onPurchase).not.toHaveBeenCalled();
  });

  it("shows an owned state and prevents duplicate simulated purchases", () => {
    const onPurchase = vi.fn();

    render(
      <GameHubAssetShopPanel
        balance={6800}
        ownedItemIds={["crystal-plaza"]}
        onPurchase={onPurchase}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "打开虚拟资产商店" }));

    const ownedButton = screen.getByRole("button", { name: "已拥有冰晶广场" });
    expect((ownedButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("1 件已拥有")).toBeDefined();
    expect(onPurchase).not.toHaveBeenCalled();
  });
});
