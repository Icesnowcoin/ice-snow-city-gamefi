import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HighFidelityAssetGallery from "./HighFidelityAssetGallery";

describe("HighFidelityAssetGallery", () => {
  it("shows the generated city core reference by default", () => {
    render(<HighFidelityAssetGallery />);

    expect(screen.getByTestId("high-fidelity-gallery")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "城市核心 · 英雄角度" })).toHaveAttribute(
      "src",
      "/manus-storage/city-core-hero_0b6cd13b.png",
    );
    expect(screen.getByText("reference-only")).toBeInTheDocument();
  });

  it("filters references and switches the selected preview", () => {
    render(<HighFidelityAssetGallery />);

    fireEvent.click(screen.getByRole("tab", { name: /用户参考/ }));
    expect(screen.getByRole("img", { name: "城市核心 · 英雄角度" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "预览城市核心 · 日景比例" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "预览夜景灯光参考" }));
    expect(screen.getByRole("img", { name: "夜景灯光参考" })).toHaveAttribute(
      "src",
      "/manus-storage/reference-night_0510cd30.png",
    );
  });

  it("opens and closes the enlarged preview", () => {
    render(<HighFidelityAssetGallery />);

    fireEvent.click(screen.getByRole("button", { name: "放大预览：城市核心 · 英雄角度" }));
    expect(screen.getByRole("dialog", { name: "城市核心 · 英雄角度" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭预览" }));
    expect(screen.queryByRole("dialog", { name: "城市核心 · 英雄角度" })).not.toBeInTheDocument();
  });
});
