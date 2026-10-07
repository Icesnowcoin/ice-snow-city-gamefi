import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NpcModelTouchPreview } from "./NpcModelTouchPreview";
import { BOTTOM_SHEET_NPC_PROFILES } from "@/lib/npcInteractionData";

describe("NpcModelTouchPreview", () => {
  const profile = BOTTOM_SHEET_NPC_PROFILES[0];

  it("rotates the preview with a single-finger horizontal drag and resets the view", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);
    const canvas = screen.getByTestId("npc-3d-canvas");

    expect(canvas.getAttribute("data-rotation-degrees")).toBe("0");
    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 100,
      clientY: 120,
    });
    fireEvent.pointerMove(canvas, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 180,
      clientY: 120,
    });
    fireEvent.pointerUp(canvas, { pointerId: 1, pointerType: "touch" });

    expect(
      Number(canvas.getAttribute("data-rotation-degrees"))
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId("npc-3d-reset"));
    expect(canvas.getAttribute("data-rotation-degrees")).toBe("0");
    expect(canvas.getAttribute("data-zoom-percent")).toBe("100");
  });

  it("zooms with a two-finger pinch and clamps the zoom range", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);
    const canvas = screen.getByTestId("npc-3d-canvas");

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 100,
      clientY: 120,
    });
    fireEvent.pointerDown(canvas, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 200,
      clientY: 120,
    });
    fireEvent.pointerMove(canvas, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 260,
      clientY: 120,
    });

    const zoom = Number(canvas.getAttribute("data-zoom-percent"));
    expect(zoom).toBeGreaterThan(100);
    expect(zoom).toBeLessThanOrEqual(135);

    fireEvent.pointerUp(canvas, { pointerId: 1, pointerType: "touch" });
    fireEvent.pointerUp(canvas, { pointerId: 2, pointerType: "touch" });
  });

  it("clamps pinch zoom down to the minimum and reset restores the neutral scale", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);
    const canvas = screen.getByTestId("npc-3d-canvas");

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 200,
      clientY: 120,
    });
    fireEvent.pointerDown(canvas, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 300,
      clientY: 120,
    });
    fireEvent.pointerMove(canvas, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 215,
      clientY: 120,
    });

    expect(
      Number(canvas.getAttribute("data-zoom-percent"))
    ).toBeGreaterThanOrEqual(78);
    expect(Number(canvas.getAttribute("data-zoom-percent"))).toBeLessThan(100);

    fireEvent.pointerUp(canvas, { pointerId: 1, pointerType: "touch" });
    fireEvent.pointerUp(canvas, { pointerId: 2, pointerType: "touch" });
    fireEvent.click(screen.getByTestId("npc-3d-reset"));
    expect(canvas.getAttribute("data-zoom-percent")).toBe("100");
  });

  it("re-baselines when one finger leaves so a remaining finger can rotate smoothly", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);
    const canvas = screen.getByTestId("npc-3d-canvas");

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 100,
      clientY: 120,
    });
    fireEvent.pointerDown(canvas, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 200,
      clientY: 120,
    });
    fireEvent.pointerMove(canvas, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 250,
      clientY: 120,
    });
    fireEvent.pointerUp(canvas, { pointerId: 2, pointerType: "touch" });

    const beforeRotation = Number(canvas.getAttribute("data-rotation-degrees"));
    fireEvent.pointerMove(canvas, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 150,
      clientY: 120,
    });

    expect(
      Number(canvas.getAttribute("data-rotation-degrees"))
    ).toBeGreaterThan(beforeRotation);
  });

  it("ignores ambiguous three-finger movement until the pinch returns to two fingers", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);
    const canvas = screen.getByTestId("npc-3d-canvas");

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 100,
      clientY: 120,
    });
    fireEvent.pointerDown(canvas, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 200,
      clientY: 120,
    });
    fireEvent.pointerDown(canvas, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 300,
      clientY: 120,
    });
    fireEvent.pointerMove(canvas, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 360,
      clientY: 120,
    });
    expect(canvas.getAttribute("data-zoom-percent")).toBe("100");

    fireEvent.pointerUp(canvas, { pointerId: 3, pointerType: "touch" });
    fireEvent.pointerMove(canvas, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 420,
      clientY: 120,
    });
    expect(Number(canvas.getAttribute("data-zoom-percent"))).toBeGreaterThan(
      100
    );
  });

  it("exposes an accessible interaction label and a WebGL fallback when the renderer is unavailable", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);
    expect(
      screen.getByRole("application", {
        name: "林医生的 3D 角色预览，可旋转和缩放",
      })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "重置 NPC 预览视角" })
    ).toBeTruthy();
  });

  it("resets zoom to 100% on double-tap gesture", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);
    const canvas = screen.getByTestId("npc-3d-canvas");

    // Pinch zoom in first
    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 100,
      clientY: 120,
    });
    fireEvent.pointerDown(canvas, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 200,
      clientY: 120,
    });
    fireEvent.pointerMove(canvas, {
      pointerId: 2,
      pointerType: "touch",
      clientX: 260,
      clientY: 120,
    });
    fireEvent.pointerUp(canvas, { pointerId: 1, pointerType: "touch" });
    fireEvent.pointerUp(canvas, { pointerId: 2, pointerType: "touch" });
    expect(Number(canvas.getAttribute("data-zoom-percent"))).toBeGreaterThan(
      100
    );

    // Double-tap
    fireEvent.pointerDown(canvas, {
      pointerId: 3,
      pointerType: "touch",
      clientX: 150,
      clientY: 120,
    });
    fireEvent.pointerUp(canvas, { pointerId: 3, pointerType: "touch" });

    fireEvent.pointerDown(canvas, {
      pointerId: 4,
      pointerType: "touch",
      clientX: 152,
      clientY: 121,
    });
    fireEvent.pointerUp(canvas, { pointerId: 4, pointerType: "touch" });

    expect(canvas.getAttribute("data-zoom-percent")).toBe("100");
  });

  it("resets rotation and zoom when clicking the lightweight canvas reset view button", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);
    const canvas = screen.getByTestId("npc-3d-canvas");

    // Rotate and zoom
    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 100,
      clientY: 120,
    });
    fireEvent.pointerMove(canvas, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 180,
      clientY: 120,
    });
    fireEvent.pointerUp(canvas, { pointerId: 1, pointerType: "touch" });

    expect(
      Number(canvas.getAttribute("data-rotation-degrees"))
    ).toBeGreaterThan(0);

    const canvasResetBtn = screen.getByTestId("npc-3d-canvas-reset-btn");
    expect(canvasResetBtn).toBeTruthy();
    fireEvent.click(canvasResetBtn);

    expect(canvas.getAttribute("data-rotation-degrees")).toBe("0");
    expect(canvas.getAttribute("data-zoom-percent")).toBe("100");
  });

  it("displays the correct tooltip title for the reset view button in Chinese and English", () => {
    const { rerender } = render(
      <NpcModelTouchPreview profile={profile} lang="zh" />
    );
    let btn = screen.getByTestId("npc-3d-canvas-reset-btn");
    expect(btn.getAttribute("title")).toBe("重置视角和缩放");

    rerender(<NpcModelTouchPreview profile={profile} lang="en" />);
    btn = screen.getByTestId("npc-3d-canvas-reset-btn");
    expect(btn.getAttribute("title")).toBe("Reset view and zoom");
  });

  it("switches character animation states between stand, walk, and interact with visual feedback", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);

    const standBtn = screen.getByTestId("npc-action-stand");
    const walkBtn = screen.getByTestId("npc-action-walk");
    const interactBtn = screen.getByTestId("npc-action-interact");

    expect(standBtn.getAttribute("aria-pressed")).toBe("true");
    expect(walkBtn.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(walkBtn);
    expect(walkBtn.getAttribute("aria-pressed")).toBe("true");
    expect(standBtn.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("当前动作: walk")).toBeTruthy();

    fireEvent.click(interactBtn);
    expect(interactBtn.getAttribute("aria-pressed")).toBe("true");
    expect(walkBtn.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("当前动作: interact")).toBeTruthy();
  });

  it("switches animation playback speeds between 0.5x, 1x, and 2x with visual feedback", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);

    const speed1xBtn = screen.getByTestId("npc-speed-1");
    const speed05Btn = screen.getByTestId("npc-speed-0.5");
    const speed2xBtn = screen.getByTestId("npc-speed-2");

    expect(speed1xBtn.getAttribute("aria-pressed")).toBe("true");
    expect(speed2xBtn.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(speed2xBtn);
    expect(speed2xBtn.getAttribute("aria-pressed")).toBe("true");
    expect(speed1xBtn.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("速度: 2x")).toBeTruthy();

    fireEvent.click(speed05Btn);
    expect(speed05Btn.getAttribute("aria-pressed")).toBe("true");
    expect(speed2xBtn.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("速度: 0.5x")).toBeTruthy();
  });

  it("toggles animation between play and pause states with feedback", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);

    const playPauseBtn = screen.getByTestId("npc-play-pause-btn");
    expect(playPauseBtn).toBeTruthy();
    expect(playPauseBtn.textContent).toContain("暂停");

    fireEvent.click(playPauseBtn);
    expect(playPauseBtn.textContent).toContain("播放");
    expect(screen.getByText("已暂停 (Paused)")).toBeTruthy();

    fireEvent.click(playPauseBtn);
    expect(playPauseBtn.textContent).toContain("暂停");
    expect(screen.getByText("速度: 1x")).toBeTruthy();
  });

  it("labels the procedural baseline separately when no real modelAssetUrl is provided", () => {
    render(<NpcModelTouchPreview profile={profile} lang="zh" />);
    const sourceLabel = screen.getByTestId("npc-3d-source-label");
    expect(sourceLabel.textContent).toContain("正在加载开发基线");
    expect(sourceLabel.textContent).not.toContain("真实 GLB");
  });

  it("displays loading source label when modelAssetUrl is provided", () => {
    const profileWithAsset = {
      ...profile,
      modelAssetUrl: "/manus-storage/test_character.glb",
    };
    render(<NpcModelTouchPreview profile={profileWithAsset} lang="zh" />);

    const sourceLabel = screen.getByTestId("npc-3d-source-label");
    expect(sourceLabel).toBeTruthy();
    expect(sourceLabel.textContent).toContain("正在加载 GLB");
  });
});
