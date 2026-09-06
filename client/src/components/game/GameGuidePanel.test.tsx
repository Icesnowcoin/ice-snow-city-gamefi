import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GameGuidePanel from "./GameGuidePanel";

describe("GameGuidePanel", () => {
  it("shows current scene operations and switches the active tab", () => {
    const onSelectTab = vi.fn();

    render(<GameGuidePanel activeTab="scenes" onSelectTab={onSelectTab} />);

    expect(screen.getByRole("region", { name: "城市任务引导面板" })).toBeDefined();
    expect(screen.getByText("查看城市总览")).toBeDefined();
    expect(screen.getByText("购买土地与建筑")).toBeDefined();
    expect(screen.getByRole("list", { name: "当前场景可执行操作" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "查看建设详情：进入建设视角" }));
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("模拟建设数据")).toBeDefined();
    expect(screen.getByText("1,280,000 ISC")).toBeDefined();
    expect(screen.getByText(/以下数据用于演示建设玩法/)).toBeDefined();
    expect(screen.getByText("18 小时 40 分钟")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "模拟加速施工" }));
    expect(screen.getByText("40%")).toBeDefined();
    expect(screen.getByText("15 小时 40 分钟")).toBeDefined();
    expect(screen.getByRole("status").textContent).toContain("进度提升 8%");
    expect(screen.getByTestId("construction-feedback").getAttribute("data-feedback-kind")).toBe("accelerate");
    expect(screen.getByText("加速施工成功")).toBeDefined();
    expect(screen.getByText("+8% 进度 · -3 小时")).toBeDefined();
    expect(document.querySelectorAll(".isc-construction-feedback__particle").length).toBe(8);

    fireEvent.click(screen.getByRole("button", { name: "模拟追加投资" }));
    expect(screen.getByText("44%")).toBeDefined();
    expect(screen.getByText("1,380,000 ISC")).toBeDefined();
    expect(screen.getByText("+1,400 城市人口")).toBeDefined();
    expect(screen.getByRole("status").textContent).toContain("追加 100,000 ISC");
    expect(screen.getByTestId("construction-feedback").getAttribute("data-feedback-kind")).toBe("investment");
    expect(screen.getByText("追加投资成功")).toBeDefined();
    expect(screen.getByText("+100,000 ISC · +200 容量")).toBeDefined();
    expect(document.querySelectorAll(".isc-construction-feedback__particle").length).toBe(12);

    fireEvent.click(screen.getByRole("button", { name: "进入建设场景" }));
    expect(onSelectTab).toHaveBeenCalledWith("scene");

    fireEvent.click(screen.getByRole("button", { name: "打开商城：浏览道具商城" }));
    expect(onSelectTab).toHaveBeenCalledWith("shop");
  });

  it("celebrates completion at 100% and disables further simulated construction actions", () => {
    const onSelectTab = vi.fn();

    render(<GameGuidePanel activeTab="scene" onSelectTab={onSelectTab} />);
    fireEvent.click(screen.getByRole("button", { name: "查看建设详情：进入建设视角" }));

    const accelerateButton = screen.getByRole("button", { name: "模拟加速施工" });
    for (let index = 0; index < 9; index += 1) {
      fireEvent.click(accelerateButton);
    }

    expect(screen.getByText("100%")).toBeDefined();
    expect(screen.getByText("已完成验收 · 建筑等级已升级")).toBeDefined();
    expect(screen.getByText("LEVEL 2")).toBeDefined();
    expect(screen.getByRole("status").textContent).toContain("建筑已完成验收");
    expect(screen.getByTestId("construction-feedback").getAttribute("data-feedback-kind")).toBe("completion");
    expect(screen.getByText("建筑完工升级")).toBeDefined();
    expect(screen.getByText("100% 完工 · 城市能量已同步")).toBeDefined();
    expect(document.querySelectorAll(".isc-construction-feedback__particle").length).toBe(16);
    expect((accelerateButton as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "模拟追加投资" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(accelerateButton);
    expect(screen.getByText("100%")).toBeDefined();
    expect(screen.getByTestId("construction-feedback").getAttribute("data-feedback-kind")).toBe("completion");
  });

  it("allows completed buildings to claim simulated revenue once with a coin drop effect", () => {
    const onSelectTab = vi.fn();
    const onRevenueClaim = vi.fn();

    render(
      <GameGuidePanel
        activeTab="scene"
        onSelectTab={onSelectTab}
        onRevenueClaim={onRevenueClaim}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "查看建设详情：进入建设视角" }));

    const accelerateButton = screen.getByRole("button", { name: "模拟加速施工" });
    for (let index = 0; index < 9; index += 1) {
      fireEvent.click(accelerateButton);
    }

    const claimButton = screen.getByRole("button", { name: "收取收益" });
    expect(screen.getByTestId("construction-revenue-card")).toBeDefined();
    expect(screen.getByText("+6,800 虚拟 ISC")).toBeDefined();

    fireEvent.click(claimButton);
    expect(onRevenueClaim).toHaveBeenCalledWith(6800);
    expect(screen.getByRole("status").textContent).toContain("收益已收取");
    expect(screen.getByText("已收取")).toBeDefined();
    expect(screen.getByText("收益收取成功")).toBeDefined();
    expect(screen.getByText("+6,800 虚拟 ISC")).toBeDefined();
    expect(screen.getByTestId("construction-feedback").getAttribute("data-feedback-kind")).toBe("revenue");
    expect(document.querySelectorAll('[data-testid="revenue-coin"]').length).toBe(18);
    expect((claimButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(claimButton);
    expect(screen.getByTestId("construction-feedback").getAttribute("data-feedback-kind")).toBe("revenue");
  });

  it("supports collapse, dismiss, and reopen controls", () => {
    const onSelectTab = vi.fn();

    render(<GameGuidePanel activeTab="tasks" onSelectTab={onSelectTab} />);

    fireEvent.click(screen.getByRole("button", { name: "收起任务引导" }));
    expect(screen.queryByRole("list", { name: "当前场景可执行操作" })).toBeNull();
    expect(screen.getByText("当前场景：领取城市任务")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "展开任务引导" }));
    expect(screen.getByRole("list", { name: "当前场景可执行操作" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "关闭任务引导" }));
    expect(screen.getByRole("button", { name: "重新打开任务引导" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "重新打开任务引导" }));
    expect(screen.getByRole("region", { name: "城市任务引导面板" })).toBeDefined();
  });
});
