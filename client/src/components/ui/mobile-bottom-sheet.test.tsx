import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { MobileBottomSheet, triggerMobileHaptic } from "./mobile-bottom-sheet";

function BottomSheetHarness({
  onHorizontalSwipe,
}: {
  onHorizontalSwipe?: (direction: "left" | "right") => boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        打开操作
      </button>
      <MobileBottomSheet
        open={open}
        onOpenChange={setOpen}
        title="商品操作"
        description="选择商品快捷操作"
        testId="mobile-bottom-sheet"
        haptic="light"
        onHorizontalSwipe={onHorizontalSwipe}
      >
        <p>快速操作内容</p>
      </MobileBottomSheet>
    </>
  );
}

describe("MobileBottomSheet", () => {
  it("opens from a touch-friendly trigger and exposes dialog semantics", async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });

    render(<BottomSheetHarness />);
    fireEvent.click(screen.getByRole("button", { name: "打开操作" }));

    await waitFor(() => {
      expect(screen.getByTestId("mobile-bottom-sheet")).toBeTruthy();
      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(screen.getByRole("heading", { name: "商品操作" })).toBeTruthy();
      expect(screen.getByText("快速操作内容")).toBeTruthy();
    });
    expect(vibrate).toHaveBeenCalledWith(10);
  });

  it("closes with the explicit close action and exposes the closed state during the exit animation", async () => {
    render(<BottomSheetHarness />);
    fireEvent.click(screen.getByRole("button", { name: "打开操作" }));

    await waitFor(() =>
      expect(screen.getByTestId("mobile-bottom-sheet")).toBeTruthy()
    );
    fireEvent.click(screen.getByRole("button", { name: "关闭底部操作面板" }));

    await waitFor(() => {
      expect(
        screen.getByTestId("mobile-bottom-sheet").getAttribute("data-state")
      ).toBe("closed");
    });
  });

  it("tracks a downward swipe, springs back below the threshold, and closes beyond the threshold", async () => {
    render(<BottomSheetHarness />);
    fireEvent.click(screen.getByRole("button", { name: "打开操作" }));

    const sheet = await screen.findByTestId("mobile-bottom-sheet");
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(sheet, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 200,
      width: 320,
      height: 400,
      top: 200,
      right: 320,
      bottom: 600,
      left: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(sheet, {
      pointerType: "touch",
      pageX: 20,
      pageY: 100,
      clientX: 20,
      clientY: 100,
    });
    fireEvent.pointerMove(sheet, {
      pointerType: "touch",
      pageX: 20,
      pageY: 150,
      clientX: 20,
      clientY: 150,
    });
    await waitFor(() =>
      expect(sheet.getAttribute("data-swipe-progress")).not.toBe("0.00")
    );
    fireEvent.pointerUp(sheet, {
      pointerType: "touch",
      pageX: 20,
      pageY: 150,
      clientX: 20,
      clientY: 150,
    });
    await waitFor(() =>
      expect(sheet.getAttribute("data-swipe-progress")).toBe("0.00")
    );
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.pointerDown(sheet, {
      pointerType: "touch",
      pageX: 20,
      pageY: 100,
      clientX: 20,
      clientY: 100,
    });
    fireEvent.pointerMove(sheet, {
      pointerType: "touch",
      pageX: 20,
      pageY: 260,
      clientX: 20,
      clientY: 260,
    });
    await waitFor(() =>
      expect(sheet.getAttribute("data-swipe-progress")).not.toBe("0.00")
    );
    fireEvent.pointerUp(sheet, {
      pointerType: "touch",
      pageX: 20,
      pageY: 260,
      clientX: 20,
      clientY: 260,
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("mobile-bottom-sheet").getAttribute("data-state")
      ).toBe("closed")
    );
  });

  it("tracks a horizontal swipe, calls the category callback, and clears horizontal progress on release", async () => {
    const onHorizontalSwipe = vi.fn(() => true);
    render(<BottomSheetHarness onHorizontalSwipe={onHorizontalSwipe} />);
    fireEvent.click(screen.getByRole("button", { name: "打开操作" }));

    const sheet = await screen.findByTestId("mobile-bottom-sheet");
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(sheet, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 200,
      width: 320,
      height: 400,
      top: 200,
      right: 320,
      bottom: 600,
      left: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(sheet, {
      pointerType: "touch",
      pageX: 260,
      pageY: 100,
      clientX: 260,
      clientY: 100,
    });
    fireEvent.pointerMove(sheet, {
      pointerType: "touch",
      pageX: 100,
      pageY: 110,
      clientX: 100,
      clientY: 110,
    });
    await waitFor(() => {
      expect(sheet.getAttribute("data-horizontal-swipe-progress")).not.toBe(
        "0.00"
      );
      expect(sheet.getAttribute("data-gesture-axis")).toBe("horizontal");
    });
    fireEvent.pointerUp(sheet, {
      pointerType: "touch",
      pageX: 100,
      pageY: 110,
      clientX: 100,
      clientY: 110,
    });

    await waitFor(() => {
      expect(onHorizontalSwipe).toHaveBeenCalledWith("left");
      expect(sheet.getAttribute("data-horizontal-swipe-progress")).toBe("0.00");
      expect(sheet.getAttribute("data-gesture-axis")).toBeNull();
    });
  });

  it("emits the success vibration pattern and safely degrades when vibration is unavailable", () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });

    triggerMobileHaptic("success");
    expect(vibrate).toHaveBeenCalledWith([12, 24, 12]);

    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: undefined,
    });
    expect(() => triggerMobileHaptic("success")).not.toThrow();
  });
});
