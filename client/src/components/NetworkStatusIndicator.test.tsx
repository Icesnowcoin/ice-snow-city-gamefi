import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NetworkStatusIndicator, { classifyPing } from "./NetworkStatusIndicator";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("classifyPing", () => {
  it("maps latency to the expected signal quality", () => {
    expect(classifyPing(80)).toBe("good");
    expect(classifyPing(180)).toBe("fair");
    expect(classifyPing(420)).toBe("weak");
  });
});

describe("NetworkStatusIndicator", () => {
  it("measures same-origin latency and shows a Ping value with strong signal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    vi.stubGlobal("performance", { now: vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(145) });

    render(<NetworkStatusIndicator lang="zh" />);

    await act(async () => {
      await Promise.resolve();
    });

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-label")).toContain("Ping 45ms");
    expect(screen.getByText("45ms")).toBeDefined();
    expect(screen.getByText("网络良好")).toBeDefined();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("network_probe="),
      expect.objectContaining({ method: "HEAD", cache: "no-store" }),
    );
  });

  it("shows a clear offline state when the browser reports no network", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    vi.stubGlobal("fetch", vi.fn());

    render(<NetworkStatusIndicator lang="zh" />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole("status").getAttribute("aria-label")).toContain("无网络");
    expect(screen.getByText("无网络")).toBeDefined();
    expect(screen.getByText("--")).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reveals the connection type when the compact indicator is activated", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    vi.stubGlobal("navigator", { onLine: true, connection: { effectiveType: "4g" } });

    render(<NetworkStatusIndicator lang="en" />);
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("status"));
    expect(screen.getByText("Type: 4g")).toBeDefined();
  });
});
