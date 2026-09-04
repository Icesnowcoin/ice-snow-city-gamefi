import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PrivateSpacePanel, type PrivateSpaceData } from "./PrivateSpacePanel";

const space: PrivateSpaceData = {
  spaceName: "Aurora Home",
  description: "A shared space",
  accessList: ["player-1", "player-2"],
  furniture: [{ furnitureId: "chair-1", name: "冰晶椅" }],
  decorations: ["极光灯"],
  photos: ["https://example.com/photo.png"],
};

describe("PrivateSpacePanel", () => {
  it("shows an honest empty state without space data", () => {
    render(<PrivateSpacePanel currentPlayerId="player-1" />);
    expect(screen.getByText(/暂无私密空间资料/)).toBeTruthy();
  });

  it("shows access and submits furniture, decoration, and invitation callbacks", () => {
    const onAddFurniture = vi.fn();
    const onAddDecoration = vi.fn();
    const onInvite = vi.fn();
    render(<PrivateSpacePanel space={space} currentPlayerId="player-1" onAddFurniture={onAddFurniture} onAddDecoration={onAddDecoration} onInvite={onInvite} />);
    expect(screen.getByText("可访问")).toBeTruthy();
    expect(screen.getByText("player-2")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("家具名称"), { target: { value: "书架" } });
    fireEvent.click(screen.getAllByRole("button", { name: "添加" })[0]);
    fireEvent.change(screen.getByLabelText("装饰名称"), { target: { value: "雪花灯" } });
    fireEvent.click(screen.getAllByRole("button", { name: "添加" })[1]);
    fireEvent.change(screen.getByLabelText("邀请玩家 ID"), { target: { value: "player-3" } });
    fireEvent.click(screen.getByRole("button", { name: "邀请" }));
    expect(onAddFurniture).toHaveBeenCalledWith("书架");
    expect(onAddDecoration).toHaveBeenCalledWith("雪花灯");
    expect(onInvite).toHaveBeenCalledWith("player-3");
  });
});
