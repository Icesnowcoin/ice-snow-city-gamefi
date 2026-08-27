import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileEditor, type ProfileDraft } from "./ProfileEditor";

const initialProfile: ProfileDraft = {
  displayName: "Ice Builder",
  bio: "Building a sustainable commercial empire.",
  avatarUrl: "https://example.com/avatar.png",
};

describe("ProfileEditor", () => {
  it("renders real initial profile values and submits the edited draft", () => {
    const onSave = vi.fn();
    render(<ProfileEditor initialProfile={initialProfile} onSave={onSave} />);

    expect(screen.getByDisplayValue(initialProfile.displayName)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("显示名称"), { target: { value: "New Builder" } });
    fireEvent.change(screen.getByLabelText("个人简介"), { target: { value: "New bio" } });
    fireEvent.click(screen.getByRole("button", { name: "保存资料" }));

    expect(onSave).toHaveBeenCalledWith({
      ...initialProfile,
      displayName: "New Builder",
      bio: "New bio",
    });
  });

  it("disables saving for an empty display name and while saving", () => {
    const onSave = vi.fn();
    const savingView = render(<ProfileEditor initialProfile={initialProfile} onSave={onSave} isSaving />);
    expect(screen.getByRole("button", { name: "保存中..." })).toBeDisabled();
    savingView.unmount();

    const { unmount } = render(<ProfileEditor initialProfile={initialProfile} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("显示名称"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "保存资料" })).toBeDisabled();
    unmount();
  });
});
