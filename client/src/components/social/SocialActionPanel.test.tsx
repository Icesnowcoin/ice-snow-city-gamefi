import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SocialActionPanel, type SocialActionPanelFees } from "./SocialActionPanel";

const fees: SocialActionPanelFees = {
  giftServiceFee: 0,
  invitationFee: 10_000,
  reportFee: 0,
  treasuryPercentage: 60,
  marketingPercentage: 40,
};

describe("SocialActionPanel", () => {
  it("blocks a gift when the requested amount exceeds the real available balance", () => {
    const onGift = vi.fn();
    render(
      <SocialActionPanel
        target={{ id: 7, displayName: "Aurora" }}
        availableIsc={500}
        fees={fees}
        onGift={onGift}
        onInvite={vi.fn()}
        onReport={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("赠送金额"), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: "赠送" }));
    expect(onGift).not.toHaveBeenCalled();
    expect(screen.getByText("余额不足或金额无效")).toBeTruthy();
  });

  it("passes target id, amount, and an idempotency key to the gift callback", async () => {
    const onGift = vi.fn().mockResolvedValue(undefined);
    render(
      <SocialActionPanel
        target={{ id: 7, displayName: "Aurora" }}
        availableIsc={5_000}
        fees={fees}
        onGift={onGift}
        onInvite={vi.fn()}
        onReport={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("赠送金额"), { target: { value: "1200" } });
    fireEvent.change(screen.getByPlaceholderText("留言（可选）"), { target: { value: "欢迎来到城市" } });
    fireEvent.click(screen.getByRole("button", { name: "赠送" }));

    await waitFor(() => expect(onGift).toHaveBeenCalledTimes(1));
    expect(onGift).toHaveBeenCalledWith(expect.objectContaining({ targetUserId: 7, amount: 1200, message: "欢迎来到城市" }));
    expect(onGift.mock.calls[0][0].idempotencyKey).toMatch(/^social_gift_7_/);
    expect(screen.getByRole("status")).toHaveTextContent("请求已提交");
  });

  it("submits invitation and report only after their forms are completed", async () => {
    const onInvite = vi.fn().mockResolvedValue(undefined);
    const onReport = vi.fn().mockResolvedValue(undefined);
    render(
      <SocialActionPanel
        target={{ id: 9, displayName: "Builder" }}
        availableIsc={20_000}
        fees={fees}
        onGift={vi.fn()}
        onInvite={onInvite}
        onReport={onReport}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("邀请留言（可选）"), { target: { value: "一起建设" } });
    fireEvent.click(screen.getByRole("button", { name: "邀请" }));
    await waitFor(() => expect(onInvite).toHaveBeenCalledWith(expect.objectContaining({ targetUserId: 9, message: "一起建设" })));

    fireEvent.change(screen.getByPlaceholderText("请描述具体原因"), { target: { value: "不当行为" } });
    fireEvent.click(screen.getByRole("button", { name: "提交举报" }));
    await waitFor(() => expect(onReport).toHaveBeenCalledWith(expect.objectContaining({ targetUserId: 9, reason: "不当行为" })));
  });
});
