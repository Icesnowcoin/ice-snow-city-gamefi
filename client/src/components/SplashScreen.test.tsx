import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SplashScreen from "./SplashScreen";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("./NetworkStatusIndicator", () => ({
  default: () => <div data-testid="network-status" />,
}));

describe("SplashScreen interactive snowflakes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders the approved 16:9 commercial-empire hero and progress semantics", () => {
    render(<SplashScreen />);

    const hero = screen.getByTestId("opening-hero-image");
    expect(hero.getAttribute("src")).toContain("isc_opening_hero_recomposed_v2_48a42ac8.webp");
    expect(hero.getAttribute("alt")).toContain("商业帝国");
    expect(screen.getByRole("progressbar", { name: "开场资源加载进度" })).toBeDefined();
    expect(screen.getByRole("button", { name: "进入游戏" })).toBeDefined();
  });

  it("renders touch-sized accessible snowflake buttons", () => {
    render(<SplashScreen />);

    const snowflakes = screen.getAllByRole("button", { name: /点击第/ });
    expect(snowflakes).toHaveLength(8);
    expect(snowflakes[0].getAttribute("aria-label")).toContain("冰晶碎裂效果");
  });

  it("increments the current-session score and creates burst haptic feedback", () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });

    render(<SplashScreen />);
    fireEvent.click(screen.getByRole("button", { name: /点击第 1 枚普通雪花/ }));

    expect(vibrate).toHaveBeenCalledWith(12);
    expect(screen.getByText(/冰晶碎裂，当前已击碎/)).toBeDefined();
    expect(screen.getByTestId("snowflake-score").getAttribute("aria-label")).toBe(
      "已击碎 1 枚雪花",
    );
  });

  it("awards five points and emits a richer particle burst for a golden snowflake", () => {
    const { container } = render(<SplashScreen />);
    const goldenSnowflake = screen.getByTestId("golden-snowflake-3");

    fireEvent.click(goldenSnowflake);

    expect(screen.getByTestId("snowflake-points").textContent).toBe("5");
    expect(screen.getByText(/冰晶碎裂，当前已击碎 1 枚雪花，获得 5 分/)).toBeDefined();
    expect(container.querySelectorAll(".isc-snowflake-burst--golden .isc-snowflake-fragment")).toHaveLength(12);
  });

  it("shows a milestone after every five snowflakes and clears it after the feedback window", () => {
    render(<SplashScreen />);
    const snowflake = screen.getByRole("button", { name: /点击第 2 枚普通雪花/ });

    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(snowflake);
    }

    expect(screen.getByText("冰晶连击 ×5 · 城市能量已同步")).toBeDefined();
    expect(screen.getByTestId("snowflake-score").getAttribute("aria-label")).toBe(
      "已击碎 5 枚雪花",
    );

    act(() => {
      vi.advanceTimersByTime(1_200);
    });

    expect(screen.queryByText("冰晶连击 ×5 · 城市能量已同步")).toBeNull();
  });

  it("clears the burst status after the short particle animation window", () => {
    render(<SplashScreen />);
    fireEvent.click(screen.getByRole("button", { name: /点击第 2 枚普通雪花/ }));
    expect(screen.getByText(/冰晶碎裂，当前已击碎/)).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(720);
    });

    expect(screen.queryByText("冰晶碎裂")).toBeNull();
  });
});
