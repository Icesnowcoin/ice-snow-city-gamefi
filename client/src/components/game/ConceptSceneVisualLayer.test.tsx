import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConceptSceneVisualLayer from "./ConceptSceneVisualLayer";

describe("ConceptSceneVisualLayer", () => {
  it("renders the supplied night concept inside the playable scene", () => {
    render(<ConceptSceneVisualLayer />);
    expect(screen.getByTestId("concept-scene-visual-layer")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "冰雪城市夜景概念参考" })).toHaveAttribute(
      "src",
      "/manus-storage/reference-night_0510cd30.png",
    );
    expect(screen.getByText(/概念图已落实为游戏内视觉导览层/)).toBeInTheDocument();
  });

  it("switches between day and night mood references and syncs the Babylon backdrop", () => {
    render(<ConceptSceneVisualLayer />);
    const backdropEvent = vi.fn();
    window.addEventListener("isc-concept-backdrop-mode", backdropEvent);
    fireEvent.click(screen.getByRole("tab", { name: "日景" }));
    expect(screen.getByRole("img", { name: "冰雪城市日景概念参考" })).toHaveAttribute(
      "src",
      "/manus-storage/reference-daylight_841dc8eb.png",
    );
    expect(screen.getByRole("img", { name: "冰雪城市日景概念参考" })).toHaveClass(
      "concept-scene-visual-layer__image--transitioning",
    );
    expect(screen.getByText("场景切换中")).toBeInTheDocument();
    expect(backdropEvent).toHaveBeenCalledTimes(1);
    expect(backdropEvent.mock.calls[0][0]).toMatchObject({ detail: "day" });
    window.removeEventListener("isc-concept-backdrop-mode", backdropEvent);
  });

  it("switches to the city core hero concept used by the playable scene", () => {
    render(<ConceptSceneVisualLayer />);
    fireEvent.click(screen.getByRole("tab", { name: "城市核心" }));
    expect(screen.getByRole("img", { name: "城市核心冰晶能源塔概念图" })).toHaveAttribute(
      "src",
      "/manus-storage/city-core-hero_0b6cd13b.png",
    );
  });

  it("can collapse and reopen without removing the game scene", () => {
    render(<ConceptSceneVisualLayer />);
    fireEvent.click(screen.getByRole("button", { name: "关闭城市视觉层" }));
    expect(screen.getByRole("button", { name: "展开城市视觉层" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "展开城市视觉层" }));
    expect(screen.getByRole("img", { name: "冰雪城市夜景概念参考" })).toBeInTheDocument();
  });
});
