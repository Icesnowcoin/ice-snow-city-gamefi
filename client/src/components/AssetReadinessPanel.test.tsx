import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssetReadinessPanel } from "./AssetReadinessPanel";

describe("AssetReadinessPanel", () => {
  it("诚实显示默认资产待导入状态", () => {
    render(<AssetReadinessPanel />);
    expect(screen.getAllByText("待导入").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("当前阻塞项")).toBeInTheDocument();
  });

  it("显示全部门禁通过的报告", () => {
    render(<AssetReadinessPanel manifest={[]} textures={[]} animations={[]} />);
    expect(screen.getByText("可运行")).toBeInTheDocument();
    expect(screen.getByText("所有已登记资产均通过当前门禁。")).toBeInTheDocument();
  });
});
