import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AssetReadinessPage from "./AssetReadinessPage";

describe("AssetReadinessPage", () => {
  it("renders the readiness entry with the registered asset list", () => {
    render(<AssetReadinessPage />);

    expect(screen.getByText("资产就绪与运行时验收")).toBeInTheDocument();
    expect(screen.getByText("已登记资产清单")).toBeInTheDocument();
    expect(screen.getByText("真实交付证据状态")).toBeInTheDocument();
    expect(screen.getByText("待提交证据")).toBeInTheDocument();
    expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: /返回游戏/ })).toHaveAttribute("href", "/game");
  });
});
