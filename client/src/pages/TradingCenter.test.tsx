import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TradingCenter from "./TradingCenter";

describe("TradingCenter gameplay-only boundary", () => {
  it("explains that land and buildings are gameplay assets, not NFTs", () => {
    render(<TradingCenter />);

    expect(screen.getByText("游戏内资产中心")).toBeTruthy();
    expect(screen.getByText(/已停止土地、建筑、环境和背包物品的 NFT 铸造/)).toBeTruthy();
    expect(screen.getByText("由游戏内升级和生产系统管理")).toBeTruthy();
    expect(screen.getByText(/钱包签名验证仍可在钱包授权页使用/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /连接钱包|授权并买入|立即卖出/ })).toBeNull();
  });
});
