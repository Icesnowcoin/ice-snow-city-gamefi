import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const trpcMock = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
const toastMock = vi.hoisted(() => ({ loading: vi.fn(() => "toast-1"), success: vi.fn(), error: vi.fn() }));
vi.mock("@/lib/trpc", () => ({
  trpc: { signedNftOrders: { cancel: { useMutation: () => trpcMock } } },
}));
vi.mock("sonner", () => ({ toast: toastMock }));

import { SignedOrderCancelAction, getExplorerTxUrl, type SignedOrderCancelActionProps } from "./SignedOrderCancelAction";

const order: SignedOrderCancelActionProps["order"] = {
  orderHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
  offerer: "0x0000000000000000000000000000000000000003",
  nftContract: "0x0000000000000000000000000000000000000002",
  tokenId: BigInt(1),
  amount: BigInt(1),
  price: BigInt(100),
  expiration: BigInt(Math.floor(Date.now() / 1000) + 3600),
  nonce: BigInt(1),
  itemType: 0,
  salt: "0x0000000000000000000000000000000000000000000000000000000000000004",
  status: "active",
};

function renderAction(overrides: Partial<SignedOrderCancelActionProps["order"]> = {}) {
  return render(<SignedOrderCancelAction order={{ ...order, ...overrides }} marketplaceAddress="0x0000000000000000000000000000000000000001" expectedChainId={56} />);
}

describe("SignedOrderCancelAction", () => {
  it("maps supported networks to their transaction explorer", () => {
    expect(getExplorerTxUrl(97, "0xabc")).toBe("https://testnet.bscscan.com/tx/0xabc");
    expect(getExplorerTxUrl(56, "0xabc")).toBe("https://bscscan.com/tx/0xabc");
    expect(getExplorerTxUrl(999, "0xabc")).toBeNull();
  });
  it("hides the cancel action for non-active orders", () => {
    renderAction({ status: "fulfilled" });
    expect(screen.queryByRole("button", { name: /撤销挂单/ })).toBeNull();
  });

  it("shows a friendly error and does not claim cancellation without a wallet", async () => {
    renderAction();
    fireEvent.click(screen.getByRole("button", { name: /撤销挂单/ }));
    await waitFor(() => expect(screen.getByText("撤销失败")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toMatch(/钱包|取消/);
    expect(trpcMock.mutateAsync).not.toHaveBeenCalled();
  });
});
