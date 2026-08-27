import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfessionSelector } from "./ProfessionSelector";
import { ProfessionType } from "@shared/types/profession";

describe("ProfessionSelector", () => {
  it("renders the configured professions and current status", () => {
    render(<ProfessionSelector currentProfession={ProfessionType.COMMONER} totalAssets={0} level={1} onSelect={vi.fn()} />);
    expect(screen.getByText("选择职业")).toBeTruthy();
    expect(screen.getByText("当前职业")).toBeTruthy();
    expect(screen.getByText("平民")).toBeTruthy();
    expect(screen.getByText("商人")).toBeTruthy();
  });

  it("enables the next profession only when real requirements are met", () => {
    const onSelect = vi.fn();
    const { rerender } = render(<ProfessionSelector currentProfession={ProfessionType.COMMONER} totalAssets={299999} level={9} onSelect={onSelect} />);
    expect(screen.getByRole("button", { name: "未满足解锁条件" })).toBeDisabled();

    rerender(<ProfessionSelector currentProfession={ProfessionType.COMMONER} totalAssets={300000} level={10} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "转为此职业" }));
    expect(onSelect).toHaveBeenCalledWith(ProfessionType.MERCHANT);
  });
});
