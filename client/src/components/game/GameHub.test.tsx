import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GameHub from "./GameHub";

vi.mock("./GameSceneSystem", () => ({ GameSceneSystem: () => <div /> }));
vi.mock("@/game/components/AgriculturalMapViewer", () => ({
  default: () => <div data-testid="mock-agricultural-map">Babylon.js 3D 农业地图</div>,
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

it("shows claimable building coin markers and hides them after bulk collection", async () => {
  render(<GameHub />);

  expect((await screen.findByTestId("mock-agricultural-map")).textContent).toContain("Babylon.js 3D");

  fireEvent.click(screen.getByTestId("claim-all-revenue"));

  expect(screen.getByTestId("claimable-revenue-summary").textContent).toContain("可领取：0");
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

it("places a purchased asset into the playable scene", async () => {
  render(<GameHub />);

  fireEvent.click(screen.getByRole("button", { name: "mock place" }));

  expect(await screen.findByTestId("mock-agricultural-map")).toBeDefined();
  expect(screen.getByTestId("game-total-assets")).toBeDefined();
});

it("shows a recycle coin flight and pulses total assets after recycling", () => {
  render(<GameHub />);

  fireEvent.click(screen.getByRole("button", { name: "mock recycle" }));

  expect(screen.getByTestId("recycle-coin-flight")).toBeDefined();
  expect(screen.getByTestId("recycle-coin-flight").getAttribute("aria-label")).toContain("3,000");
  expect(screen.getByTestId("game-total-assets").className).toContain("game-asset-panel-pulse");
  expect(screen.getByTestId("virtual-isc-total").textContent).toContain("3,000");
});
