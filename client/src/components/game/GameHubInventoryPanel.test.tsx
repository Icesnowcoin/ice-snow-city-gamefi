import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GameHubInventoryPanel, { getInventoryRecycleValue } from "./GameHubInventoryPanel";
import { GAME_HUB_ASSET_SHOP_ITEMS } from "./GameHubAssetShopPanel";

type RecycleHarnessProps = {
  itemId: string;
  onRecycle: (refund: number) => void;
};

function RecycleHarness({ itemId, onRecycle }: RecycleHarnessProps) {
  const [ownedItemIds, setOwnedItemIds] = useState([itemId]);
  return (
    <GameHubInventoryPanel
      ownedItemIds={ownedItemIds}
      onRecycle={(item, refund) => {
        setOwnedItemIds((current) => current.filter((id) => id !== item.id));
        onRecycle(refund);
      }}
    />
  );
}

describe("GameHubInventoryPanel", () => {
  it("shows an empty state before the player buys an item", () => {
    render(<GameHubInventoryPanel ownedItemIds={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /打开我的背包/ }));

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("背包还是空的")).toBeDefined();
    expect(screen.getByText("购买后实时同步至背包")).toBeDefined();
  });

  it("shows purchased buildings and decorations and filters them by category", () => {
    render(<GameHubInventoryPanel ownedItemIds={["crystal-plaza", "aurora-fountain"]} />);

    fireEvent.click(screen.getByRole("button", { name: /打开我的背包/ }));

    expect(screen.getByText("冰晶广场")).toBeDefined();
    expect(screen.getByText("极光喷泉")).toBeDefined();
    expect(screen.getByTestId("inventory-owned-count").textContent).toBe("2");

    fireEvent.click(screen.getByRole("tab", { name: "建筑" }));

    expect(screen.getByTestId("inventory-item-crystal-plaza")).toBeDefined();
    expect(screen.queryByTestId("inventory-item-aurora-fountain")).toBeNull();
  });

  it("lets the player set and clear an item as the city focus", () => {
    render(<GameHubInventoryPanel ownedItemIds={["city-skyline"]} />);

    fireEvent.click(screen.getByRole("button", { name: /打开我的背包/ }));
    fireEvent.click(screen.getByRole("button", { name: "将天际线塔楼设为城市焦点" }));

    expect(screen.getByRole("status").textContent).toContain("已将 天际线塔楼 设为城市焦点");
    expect(screen.getByRole("button", { name: "取消天际线塔楼城市焦点" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "取消天际线塔楼城市焦点" }));

    expect(screen.getByRole("status").textContent).toContain("已取消 天际线塔楼 的城市焦点");
  });

  it("confirms recycle, returns 60% simulated ISC and removes the item from inventory", () => {
    const onRecycle = vi.fn();
    const item = GAME_HUB_ASSET_SHOP_ITEMS.find((shopItem) => shopItem.id === "crystal-plaza")!;
    const refund = getInventoryRecycleValue(item);

    render(<RecycleHarness itemId={item.id} onRecycle={onRecycle} />);
    fireEvent.click(screen.getByRole("button", { name: /打开我的背包/ }));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`回收${item.name}`) }));

    expect(screen.getByRole("alertdialog")).toBeDefined();
    expect(screen.getByText(new RegExp(`${refund.toLocaleString()} 虚拟 ISC`))).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "确认回收" }));

    expect(onRecycle).toHaveBeenCalledWith(refund);
    expect(screen.queryByTestId(`inventory-item-${item.id}`)).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(`返还 ${refund.toLocaleString()} 虚拟 ISC`);
  });

  it("does not allow a second recycle action after the item has been removed", () => {
    const onRecycle = vi.fn();
    render(<RecycleHarness itemId="aurora-fountain" onRecycle={onRecycle} />);

    fireEvent.click(screen.getByRole("button", { name: /打开我的背包/ }));
    fireEvent.click(screen.getByRole("button", { name: /回收极光喷泉/ }));
    fireEvent.click(screen.getByRole("button", { name: "确认回收" }));

    expect(onRecycle).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /回收极光喷泉/ })).toBeNull();
  });
});


it("places an owned item and marks it as placed", () => {
  const onPlace = vi.fn();
  render(<GameHubInventoryPanel ownedItemIds={["crystal-plaza"]} onPlace={onPlace} />);

  fireEvent.click(screen.getByRole("button", { name: /打开我的背包/ }));
  fireEvent.click(screen.getByRole("button", { name: "放置冰晶广场到城市场景" }));

  expect(onPlace).toHaveBeenCalledWith(expect.objectContaining({ id: "crystal-plaza" }));
  expect(screen.getByRole("status").textContent).toContain("已将 冰晶广场 布置到城市场景");
});


type UpgradeHarnessProps = {
  onUpgrade: (cost: number) => boolean;
};

function UpgradeHarness({ onUpgrade }: UpgradeHarnessProps) {
  const [levels, setLevels] = useState<Record<string, number>>({ "crystal-plaza": 1 });
  return (
    <GameHubInventoryPanel
      ownedItemIds={["crystal-plaza"]}
      placedItemIds={["crystal-plaza"]}
      buildingUpgradeLevels={levels}
      onUpgrade={(item, cost) => {
        const success = onUpgrade(cost);
        if (success) setLevels((current) => ({ ...current, [item.id]: (current[item.id] ?? 1) + 1 }));
        return success;
      }}
    />
  );
}

it("upgrades a placed building and updates its level and efficiency", () => {
  const onUpgrade = vi.fn(() => true);
  render(<UpgradeHarness onUpgrade={onUpgrade} />);

  fireEvent.click(screen.getByRole("button", { name: /打开我的背包/ }));
  fireEvent.click(screen.getByTestId("inventory-upgrade-crystal-plaza"));

  expect(onUpgrade).toHaveBeenCalledWith(2500);
  expect(screen.getByRole("status").textContent).toContain("已升级至 L2");
  expect(screen.getByTestId("inventory-item-crystal-plaza").textContent).toContain("效率 125%");
});

it("shows insufficient balance feedback when an upgrade is rejected", () => {
  const onUpgrade = vi.fn(() => false);
  render(<UpgradeHarness onUpgrade={onUpgrade} />);

  fireEvent.click(screen.getByRole("button", { name: /打开我的背包/ }));
  fireEvent.click(screen.getByTestId("inventory-upgrade-crystal-plaza"));

  expect(screen.getByRole("status").textContent).toContain("需要 2,500 虚拟 ISC");
  expect(screen.getByTestId("inventory-item-crystal-plaza").textContent).toContain("L1");
});

it("disables upgrade after the building reaches the level cap", () => {
  render(
    <GameHubInventoryPanel
      ownedItemIds={["crystal-plaza"]}
      placedItemIds={["crystal-plaza"]}
      buildingUpgradeLevels={{ "crystal-plaza": 3 }}
      onUpgrade={vi.fn(() => true)}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /打开我的背包/ }));

  const upgradeButton = screen.getByTestId("inventory-upgrade-crystal-plaza") as HTMLButtonElement;
  expect(upgradeButton.disabled).toBe(true);
  expect(upgradeButton.textContent).toContain("MAX");
});
