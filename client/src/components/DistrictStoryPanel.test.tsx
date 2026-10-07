import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DistrictStoryPanel } from "./DistrictStoryPanel";

describe("DistrictStoryPanel & Map Overview Dialog", () => {
  it("should render district panel and open global map overview dialog with active quest pulses", () => {
    render(<DistrictStoryPanel balance={10000} population={1200} />);

    // 点击打开全局地图概览弹窗
    const mapBtn = screen.getByText("🗺️ 城市全局地图概览");
    fireEvent.click(mapBtn);

    expect(screen.getByText("Ice Snow City 城市全局地图与区块全景概览")).toBeTruthy();

    // 验证繁华商业街区块带有未完成主线任务的感叹号提示
    const exclamationIcon = screen.getByTitle("有待完成的主线任务");
    expect(exclamationIcon).toBeTruthy();
    expect(exclamationIcon.textContent).toBe("!");

    // 点击繁华商业街热点卡片（通过热点网格按钮），验证速览卡片中是否展示了繁荣度升级阶段进度条与里程碑提示
    const commercialHotspot = screen.getByTestId("hotspot-district-commercial");
    fireEvent.click(commercialHotspot);

    expect(screen.getByText("区块繁荣度升级阶段")).toBeTruthy();
    expect(screen.getByText("下一个里程碑解锁目标")).toBeTruthy();
  });
});
