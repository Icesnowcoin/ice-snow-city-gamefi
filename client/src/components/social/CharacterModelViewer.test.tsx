import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateSnapshot: vi.fn(),
  downloadDataUrl: vi.fn(),
  shareUrl: vi.fn((platform: string) => `https://share.test/${platform}`),
  fileName: vi.fn(() => "ice-snow-city-player-character-snapshot.png"),
  toastSuccess: vi.fn(),
}));

vi.mock("@babylonjs/core", () => {
  class FakeVector3 {
    constructor(public x = 0, public y = 0, public z = 0) {}
  }
  class FakeColor3 {
    constructor(public r = 0, public g = 0, public b = 0) {}
  }
  class FakeColor4 {
    constructor(public r = 0, public g = 0, public b = 0, public a = 1) {}
  }
  class FakeAbstractMesh {
    material: unknown = null;
    position = new FakeVector3();
    rotation = new FakeVector3();
    scaling = new FakeVector3(1, 1, 1);
    isVisible = true;
  }
  class FakeTransformNode extends FakeAbstractMesh {}
  class FakeStandardMaterial {
    diffuseColor = new FakeColor3();
    specularColor = new FakeColor3();
  }
  class FakeScene {
    clearColor = new FakeColor4();
    fogMode = 0;
    fogColor = new FakeColor3();
    render = vi.fn();
    dispose = vi.fn();
  }
  class FakeEngine {
    runRenderLoop = vi.fn();
    resize = vi.fn();
    dispose = vi.fn();
    constructor(public canvas: HTMLCanvasElement) {}
  }
  class FakeArcRotateCamera {
    alpha = 0;
    radius = 6;
    lowerRadiusLimit = 3.5;
    upperRadiusLimit = 9;
    wheelPrecision = 50;
    attachControl = vi.fn();
    setTarget = vi.fn();
    constructor(..._args: unknown[]) {}
  }
  class FakeLight {
    diffuse = new FakeColor3();
    groundColor = new FakeColor3();
    intensity = 1;
    constructor(..._args: unknown[]) {}
  }
  class FakeMesh extends FakeAbstractMesh {}
  const mesh = () => new FakeMesh();
  return {
    AbstractMesh: FakeAbstractMesh,
    ArcRotateCamera: FakeArcRotateCamera,
    Color3: FakeColor3,
    Color4: FakeColor4,
    DirectionalLight: FakeLight,
    Engine: FakeEngine,
    HemisphericLight: FakeLight,
    MeshBuilder: {
      CreateBox: mesh,
      CreateCylinder: mesh,
      CreateGround: mesh,
      CreateSphere: mesh,
    },
    Scene: FakeScene,
    SceneLoader: { ImportMeshAsync: vi.fn() },
    StandardMaterial: FakeStandardMaterial,
    TransformNode: FakeTransformNode,
    Vector3: FakeVector3,
  };
});

vi.mock("@babylonjs/loaders/glTF", () => ({}));
vi.mock("@/lib/profilePoster", () => ({
  downloadDataUrl: mocks.downloadDataUrl,
  generateCharacterSnapshotPosterDataUrlAsync: mocks.generateSnapshot,
  getCharacterSnapshotPosterFileName: mocks.fileName,
  getCharacterSnapshotShareUrl: mocks.shareUrl,
}));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess } }));

import CharacterModelViewer from "./CharacterModelViewer";

describe("CharacterModelViewer snapshot sharing", () => {
  beforeEach(() => {
    mocks.generateSnapshot.mockReset();
    mocks.generateSnapshot.mockResolvedValue("data:image/png;base64,poster");
    mocks.downloadDataUrl.mockReset();
    mocks.shareUrl.mockClear();
    mocks.toastSuccess.mockReset();
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  it("captures the current state and exposes download and social share actions", async () => {
    render(createElement(CharacterModelViewer, { playerName: "雪城开拓者", userId: "user_123" }));

    const captureButton = await screen.findByRole("button", { name: "拍照并生成角色分享海报" });
    await waitFor(() => expect(captureButton).not.toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: /切换穿搭为商务外套/ }));
    fireEvent.click(screen.getByRole("button", { name: /切换配饰为时尚墨镜/ }));
    fireEvent.change(screen.getByLabelText("海报宣言 / 游戏 ID"), { target: { value: "从打工人到城市建设者 · ID: ISC-001" } });
    fireEvent.click(screen.getByRole("button", { name: "添加贴纸：冰雪先锋" }));
    fireEvent.click(screen.getByRole("button", { name: "放大贴纸：冰雪先锋" }));
    fireEvent.click(screen.getByRole("button", { name: "旋转贴纸：冰雪先锋" }));
    fireEvent.click(captureButton);

    expect(await screen.findByAltText("雪城开拓者 的角色快照海报")).toBeInTheDocument();
    expect(mocks.generateSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      playerName: "雪城开拓者",
      userId: "user_123",
      outfitLabel: "商务外套",
      accessoryLabel: "时尚墨镜",
      customText: "从打工人到城市建设者 · ID: ISC-001",
      stickerPlacements: expect.arrayContaining([expect.objectContaining({ stickerId: "winter-pioneer", scale: 1.15, rotation: 15 })]),
    }));

    fireEvent.click(screen.getByRole("button", { name: "下载角色快照海报" }));
    expect(mocks.downloadDataUrl).toHaveBeenCalledWith("data:image/png;base64,poster", "ice-snow-city-player-character-snapshot.png");

    fireEvent.click(screen.getByRole("button", { name: "分享到 Twitter" }));
    expect(mocks.downloadDataUrl).toHaveBeenCalledTimes(2);
    expect(mocks.shareUrl).toHaveBeenCalledWith("twitter", expect.objectContaining({ outfitLabel: "商务外套", accessoryLabel: "时尚墨镜", customText: "从打工人到城市建设者 · ID: ISC-001" }));
    expect(window.open).toHaveBeenCalledWith("https://share.test/twitter", "_blank", "noopener,noreferrer");
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows an accessible error when screenshot generation fails", async () => {
    mocks.generateSnapshot.mockRejectedValueOnce(new Error("canvas failed"));
    render(createElement(CharacterModelViewer, { playerName: "雪城开拓者", userId: "user_123" }));

    const captureButton = await screen.findByRole("button", { name: "拍照并生成角色分享海报" });
    await waitFor(() => expect(captureButton).not.toBeDisabled());
    fireEvent.click(captureButton);

    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      expect(alerts.some((alert) => alert.textContent?.includes("生成角色快照失败，请重试"))).toBe(true);
    });
  });
});
