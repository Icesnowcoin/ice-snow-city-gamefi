import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarriagePanel, type MarriageProfile } from "./MarriagePanel";

describe("MarriagePanel", () => {
  it("submits a trimmed proposal only when a target is provided", () => {
    const onPropose = vi.fn();
    const profile: MarriageProfile = { status: "single" };
    render(<MarriagePanel profile={profile} onPropose={onPropose} />);
    expect(screen.getByRole("button", { name: "求婚" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("对玩家发起求婚"), { target: { value: "  Aurora  " } });
    fireEvent.click(screen.getByRole("button", { name: "求婚" }));
    expect(onPropose).toHaveBeenCalledWith("Aurora");
  });

  it("renders incoming proposal actions from the supplied profile", () => {
    const onRespond = vi.fn();
    render(<MarriagePanel profile={{ status: "proposed", proposalFrom: "North Star" }} onRespond={onRespond} />);
    expect(screen.getByText(/North Star/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "接受" }));
    expect(onRespond).toHaveBeenCalledWith(true);
  });

  it("shows spouse interactions and divorce callback only for a married profile", () => {
    const onInteract = vi.fn();
    const onDivorce = vi.fn();
    render(<MarriagePanel profile={{ status: "married", spouseName: "Aurora", marriedAt: "2026-08-25" }} onInteract={onInteract} onDivorce={onDivorce} />);
    fireEvent.click(screen.getByRole("button", { name: "联系配偶" }));
    fireEvent.click(screen.getByRole("button", { name: "访问空间" }));
    fireEvent.click(screen.getByRole("button", { name: "申请离婚" }));
    expect(onInteract).toHaveBeenNthCalledWith(1, "message");
    expect(onInteract).toHaveBeenNthCalledWith(2, "visit");
    expect(onDivorce).toHaveBeenCalledTimes(1);
  });
});
