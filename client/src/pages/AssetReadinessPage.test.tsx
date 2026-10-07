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
    expect(screen.getAllByText("8").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("外部发布门禁")).toBeInTheDocument();
    expect(screen.getByText("真实 GLB / PBR 资产")).toBeInTheDocument();
    expect(screen.getByText("pending-import")).toBeInTheDocument();
    expect(screen.getByText("iOS / Android 真机性能")).toBeInTheDocument();
    expect(screen.getByText("pending-device")).toBeInTheDocument();
    expect(screen.getByText("GitHub Token 轮换")).toBeInTheDocument();
    expect(screen.getByText("pending-account-action")).toBeInTheDocument();
    expect(screen.getByText(/不会自动解除门禁/)).toBeInTheDocument();
    expect(screen.getAllByText("开发基线可预览")).toHaveLength(8);
    expect(screen.getAllByText("待导入真实文件")).toHaveLength(8);
    expect(screen.getByText("0 可运行")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /返回游戏/ })).toHaveAttribute("href", "/game");
  });
});
