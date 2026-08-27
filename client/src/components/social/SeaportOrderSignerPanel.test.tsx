import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const trpcMock = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
vi.mock("@/lib/trpc", () => ({
  trpc: { signedNftOrders: { submit: { useMutation: () => trpcMock } } },
}));

import { SeaportOrderSignerPanel } from "./SeaportOrderSignerPanel";

const props = {
  nftContract: "0x0000000000000000000000000000000000000002",
  marketplaceAddress: "0x0000000000000000000000000000000000000001",
  chainId: 56,
};

describe("SeaportOrderSignerPanel", () => {
  it("previews the 10% market commission and locks ERC-721 quantity to one", () => {
    render(<SeaportOrderSignerPanel {...props} />);

    const amount = screen.getByLabelText("数量") as HTMLInputElement;
    expect(amount.value).toBe("1");
    expect(amount.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("价格（ISC 最小单位）"), {
      target: { value: "1000000000000000000000" },
    });

    expect(screen.getByText("1000.0000 ISC")).toBeTruthy();
    expect(screen.getByText("100.0000 ISC")).toBeTruthy();
    expect(screen.getByText("900.0000 ISC")).toBeTruthy();
  });

  it("does not pretend to sign when no browser wallet is available", async () => {
    const originalEthereum = window.ethereum;
    Object.defineProperty(window, "ethereum", { configurable: true, value: undefined });
    render(<SeaportOrderSignerPanel {...props} />);
    fireEvent.change(screen.getByLabelText("价格（ISC 最小单位）"), {
      target: { value: "1000000000000000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /一键签署/ }));

    await waitFor(() => {
      expect(screen.getByText("无法签名")).toBeTruthy();
      expect(screen.getByRole("alert").textContent).toMatch(/钱包|签名/);
    });
    Object.defineProperty(window, "ethereum", { configurable: true, value: originalEthereum });
  });
});
