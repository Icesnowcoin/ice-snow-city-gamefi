import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AIBaselineDashboard from "./AIBaselineDashboard";

describe("AIBaselineDashboard", () => {
  it("displays the baseline overview and keeps real evidence pending", () => {
    render(<AIBaselineDashboard />);

    expect(screen.getByRole("heading", { name: "AI 基线资产质量仪表盘" })).toBeInTheDocument();
    expect(screen.getByText("procedural-baseline")).toBeInTheDocument();
    expect(screen.getByText("真实外部阻塞")).toBeInTheDocument();
    expect(screen.getByText("自动化通过 ≠ 高保真通过。只有真实 GLB/PBR/LOD/碰撞/动画、授权记录和真机证据完整后，才允许申请 verified。")).toBeInTheDocument();
    expect(screen.getByText("性能趋势 · CI 软件样本")).toBeInTheDocument();
  });

  it("filters assets by pending status and search query", () => {
    render(<AIBaselineDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "待补证据" }));
    expect(screen.getAllByText("待补证据").length).toBeGreaterThan(1);
    expect(screen.getByText("玩家角色基线")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "搜索资产" }), { target: { value: "银行" } });
    expect(screen.getByText("银行地标基线")).toBeInTheDocument();
    expect(screen.queryByText("玩家角色基线")).not.toBeInTheDocument();
  });

  it("shows a stable empty state for unmatched searches", () => {
    render(<AIBaselineDashboard />);
    fireEvent.change(screen.getByRole("textbox", { name: "搜索资产" }), { target: { value: "不存在的资产" } });
    expect(screen.getByText("没有匹配的 baseline 资产。")).toBeInTheDocument();
  });
});
