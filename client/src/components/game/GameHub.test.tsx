import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GameHub from "./GameHub";

vi.mock("./GameSceneSystem", () => ({ GameSceneSystem: () => <div /> }));
vi.mock("./PlayableGameScene", () => ({
  default: ({ placedAssets = [], claimableBuildingIds = [] }: { placedAssets?: Array<{ id: string; name: string }>; claimableBuildingIds?: string[] }) => (
    <div data-testid="mock-playable-scene">
      {placedAssets.map((asset) => <span key={asset.id}>{asset.name}</span>)}
      {claimableBuildingIds.map((id) => <span key={id} data-testid={`claimable-building-${id}`}>🪙 可收取</span>)}
      <span data-testid="placed-scene-count">城市场景已布置 {placedAssets.length} 件资产</span>
    </div>
  ),
}));
vi.mock("./GameEconomy", () => ({ default: () => <div /> }));
vi.mock("./GameTasks", () => ({ default: () => <div /> }));
vi.mock("./GameProperty", () => ({ default: () => <div /> }));
vi.mock("./GameFarm", () => ({ default: () => <div /> }));
vi.mock("./GameShop", () => ({ default: () => <div /> }));
vi.mock("./GameSocial", () => ({ default: () => <div /> }));
vi.mock("./NPCSystem", () => ({ NPCSystem: () => <div /> }));
vi.mock("./GameGuidePanel", () => ({ default: () => <div /> }));
vi.mock("./GameHubAssetShopPanel", async () => {
  const actual = await vi.importActual<typeof import("./GameHubAssetShopPanel")>("./GameHubAssetShopPanel");
  return { ...actual, default: () => <div /> };
});
vi.mock("./GameHubInventoryPanel", () => ({
  getBuildingEfficiency: (level: number) => 100 + Math.max(0, level - 1) * 25,
  default: ({
    onPlace,
    onRecycle,
  }: {
    onPlace: (item: { id: string; name: string; kind: "建筑" | "装饰"; icon: string; price: number; description: string; benefit: string }) => void;
    onRecycle: (item: { id: string; name: string }, refund: number) => void;
  }) => (
    <>
      <button type="button" onClick={() => onPlace({ id: "crystal-plaza", name: "冰晶广场", kind: "建筑", icon: "🏙️", price: 5000, description: "", benefit: "" })}>
        mock place
      </button>
      <button type="button" onClick={() => onRecycle({ id: "crystal-plaza", name: "冰晶广场" }, 3000)}>
        mock recycle
      </button>
    </>
  ),
}));

it("shows claimable building coin markers and hides them after bulk collection", () => {
  render(<GameHub />);

  expect(screen.getByTestId("claimable-building-central-commerce-center").textContent).toContain("可收取");
  expect(screen.getByTestId("claimable-building-aurora-plaza").textContent).toContain("可收取");
  expect(screen.getByTestId("claimable-building-crystal-logistics-hub").textContent).toContain("可收取");

  fireEvent.click(screen.getByTestId("claim-all-revenue"));

  expect(screen.queryByTestId("claimable-building-central-commerce-center")).toBeNull();
  expect(screen.queryByTestId("claimable-building-aurora-plaza")).toBeNull();
  expect(screen.queryByTestId("claimable-building-crystal-logistics-hub")).toBeNull();
});

it("collects all completed building revenue and updates total assets once", () => {
  render(<GameHub />);

  fireEvent.click(screen.getByTestId("claim-all-revenue"));

  expect(screen.getByTestId("virtual-isc-total").textContent).toContain("16,100");
  expect(screen.getByTestId("claimable-revenue-summary").textContent).toContain("可领取：0");
  expect(screen.getByTestId("bulk-revenue-coin-flight").getAttribute("aria-label")).toContain("16,100");
  expect(screen.getByTestId("claim-all-revenue")).toHaveProperty("disabled", true);

  fireEvent.click(screen.getByTestId("claim-all-revenue"));
  expect(screen.getByTestId("virtual-isc-total").textContent).toContain("16,100");
});

it("places a purchased asset into the playable scene", () => {
  render(<GameHub />);

  fireEvent.click(screen.getByRole("button", { name: "mock place" }));

  expect(screen.getByTestId("mock-playable-scene").textContent).toContain("冰晶广场");
  expect(screen.getByTestId("placed-scene-count").textContent).toContain("已布置 1 件资产");
});

it("shows a recycle coin flight and pulses total assets after recycling", () => {
  render(<GameHub />);

  fireEvent.click(screen.getByRole("button", { name: "mock recycle" }));

  expect(screen.getByTestId("recycle-coin-flight")).toBeDefined();
  expect(screen.getByTestId("recycle-coin-flight").getAttribute("aria-label")).toContain("3,000");
  expect(screen.getByTestId("game-total-assets").className).toContain("game-asset-panel-pulse");
  expect(screen.getByTestId("virtual-isc-total").textContent).toContain("3,000");
});
