import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NetworkModeProvider } from "@/contexts/NetworkModeContext";
import { NetworkModeSwitcher } from "./NetworkModeSwitcher";

const mutationMock = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false, options: null as null | { onSuccess?: (result: { alreadySubscribed: boolean }) => void } }));
vi.mock("@/lib/trpc", () => ({ trpc: { launchNotifications: { subscribe: { useMutation: (options: typeof mutationMock.options) => { mutationMock.options = options; return { mutate: mutationMock.mutate, isPending: mutationMock.isPending }; } } } } }));

const renderSwitcher = () => render(<LanguageProvider><NetworkModeProvider><NetworkModeSwitcher /></NetworkModeProvider></LanguageProvider>);

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  mutationMock.mutate.mockClear();
  mutationMock.isPending = false;
  mutationMock.options = null;
});

describe("NetworkModeSwitcher", () => {
  it("defaults to the safe testnet mode and exposes the controlled-demo notice", () => {
    renderSwitcher();
    expect(screen.getByRole("button", { name: /网络模式：测试网|Network mode: Testnet/ })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("network-mode-trigger"));
    expect(screen.getByTestId("network-mode-safety-note")).toHaveTextContent(/安全默认|Safe default/);
    expect(screen.getByText(/受控演示模式|Controlled demo/)).toBeInTheDocument();
  });

  it("shows the launch subscription form and rejects malformed email locally", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderSwitcher();
    fireEvent.click(screen.getByTestId("network-mode-trigger"));
    fireEvent.click(screen.getByTestId("network-mode-mainnet"));
    expect(screen.getByTestId("launch-notification-subscription")).toBeInTheDocument();
    expect(screen.getByTestId("launch-notification-privacy")).toHaveTextContent(/邮箱仅用于主网上线通知|email is used only for mainnet launch notifications/);
    fireEvent.click(screen.getByLabelText(/确认订阅用途|Confirm subscription purpose/));
    fireEvent.change(screen.getByLabelText(/上线通知邮箱|Launch notification email/), { target: { value: "not-an-email" } });
    fireEvent.submit(screen.getByTestId("launch-notification-subscription"));
    expect(screen.getByTestId("launch-notification-status")).toHaveTextContent(/有效邮箱|valid email/);
    expect(mutationMock.mutate).not.toHaveBeenCalled();
  });

  it("shows a loading spinner and disables repeat submission while the request is pending", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mutationMock.isPending = true;
    renderSwitcher();
    fireEvent.click(screen.getByTestId("network-mode-trigger"));
    fireEvent.click(screen.getByTestId("network-mode-mainnet"));
    const submit = screen.getByTestId("launch-notification-submit");
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("aria-busy", "true");
    expect(submit).toHaveAttribute("aria-label", expect.stringMatching(/提交中|Submitting subscription/));
    expect(screen.getByLabelText(/上线通知邮箱|Launch notification email/)).toBeDisabled();
    expect(screen.getByLabelText(/确认订阅用途|Confirm subscription purpose/)).toBeDisabled();
  });

  it("shows a public Twitter share action only for a new subscription", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderSwitcher();
    fireEvent.click(screen.getByTestId("network-mode-trigger"));
    fireEvent.click(screen.getByTestId("network-mode-mainnet"));
    act(() => mutationMock.options?.onSuccess?.({ alreadySubscribed: false }));
    const share = screen.getByTestId("launch-notification-share");
    expect(share).toHaveAccessibleName(/分享到 Twitter|Share on Twitter/);
    fireEvent.click(share);
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/twitter\.com\/intent\/tweet\?.*url=https?%3A%2F%2F[^&]+%2Fgame/), "_blank", "noopener,noreferrer");
    act(() => mutationMock.options?.onSuccess?.({ alreadySubscribed: true }));
    expect(screen.queryByTestId("launch-notification-share")).not.toBeInTheDocument();
  });

  it("opens Telegram sharing with the same game URL and copy as Twitter", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderSwitcher();
    fireEvent.click(screen.getByTestId("network-mode-trigger"));
    fireEvent.click(screen.getByTestId("network-mode-mainnet"));
    act(() => mutationMock.options?.onSuccess?.({ alreadySubscribed: false }));
    const twitter = screen.getByTestId("launch-notification-share");
    const telegram = screen.getByTestId("launch-notification-share-telegram");
    expect(telegram).toHaveAccessibleName(/分享到 Telegram|Share on Telegram/);
    expect(twitter.className).toMatch(/motion-safe:hover:scale-\[1\.02\]/);
    expect(twitter.className).toMatch(/transition-\[transform,background-color,box-shadow\]/);
    expect(telegram.className).toMatch(/motion-safe:hover:scale-\[1\.02\]/);
    expect(telegram.className).toMatch(/focus-visible:ring-2/);
    expect(telegram.querySelector("svg")).toHaveClass("motion-reduce:transition-none");
    fireEvent.click(twitter);
    fireEvent.click(telegram);
    const twitterUrl = String(open.mock.calls[0]?.[0]);
    const telegramUrl = String(open.mock.calls[1]?.[0]);
    expect(telegramUrl).toMatch(/^https:\/\/t\.me\/share\/url\?url=https?%3A%2F%2F[^&]+%2Fgame&text=/);
    expect(new URLSearchParams(twitterUrl.split("?")[1]).get("url")).toBe(new URLSearchParams(telegramUrl.split("?")[1]).get("url"));
    expect(decodeURIComponent(new URLSearchParams(twitterUrl.split("?")[1]).get("text") ?? "")).toBe(decodeURIComponent(new URLSearchParams(telegramUrl.split("?")[1]).get("text") ?? ""));
    act(() => mutationMock.options?.onSuccess?.({ alreadySubscribed: true }));
    expect(screen.queryByTestId("launch-notification-share-telegram")).not.toBeInTheDocument();
  });

  it("celebrates a new subscription but not a duplicate, then cleans up", () => {
    vi.useFakeTimers();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderSwitcher();
    fireEvent.click(screen.getByTestId("network-mode-trigger"));
    fireEvent.click(screen.getByTestId("network-mode-mainnet"));
    act(() => mutationMock.options?.onSuccess?.({ alreadySubscribed: false }));
    expect(screen.getByTestId("launch-confetti")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1800));
    expect(screen.queryByTestId("launch-confetti")).not.toBeInTheDocument();
    act(() => mutationMock.options?.onSuccess?.({ alreadySubscribed: true }));
    expect(screen.queryByTestId("launch-confetti")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("requires explicit acknowledgement before entering read-only mainnet preview", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderSwitcher();
    fireEvent.click(screen.getByTestId("network-mode-trigger"));
    fireEvent.click(screen.getByTestId("network-mode-mainnet"));
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /网络模式：测试网|Network mode: Testnet/ })).toBeInTheDocument();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByTestId("network-mode-mainnet"));
    expect(screen.getByRole("button", { name: /网络模式：主网|Network mode: Mainnet/ })).toBeInTheDocument();
    expect(screen.getByTestId("network-mode-safety-note")).toHaveTextContent(/主网只读预览|Mainnet read-only preview/);
    expect(window.localStorage.getItem("isc-network-mode")).toBe("mainnet");
  });
});
