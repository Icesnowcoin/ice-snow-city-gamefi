import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfessionType } from "@shared/types/profession";
import { SkillTree } from "./SkillTree";

describe("SkillTree", () => {
  it("renders configured bonuses and locked skills", () => {
    render(<SkillTree profession={ProfessionType.MERCHANT} level={5} />);
    expect(screen.getByText("商人 · 技能树")).toBeTruthy();
    expect(screen.getByText("+15%" )).toBeTruthy();
    expect(screen.getAllByText("需要 Lv.10").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "激活" }).every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
  });

  it("activates an unlocked skill through the real callback", () => {
    const onActivate = vi.fn();
    render(<SkillTree profession={ProfessionType.MERCHANT} level={10} onActivate={onActivate} />);
    fireEvent.click(screen.getAllByRole("button", { name: "激活" })[0]);
    expect(onActivate).toHaveBeenCalledWith("profitBonus");
  });
});
