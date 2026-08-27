import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mutateAsync = vi.hoisted(() => vi.fn());
vi.mock("@/lib/trpc", () => ({
  trpc: { signedNftOrders: { recordFulfilled: { useMutation: () => ({ mutateAsync }) } } },
}));
vi.mock("sonner", () => ({ toast: { loading: vi.fn(), success: vi.fn(), error: vi.fn() } }));

import { SignedOrderPurchaseAction, type PurchaseOrder } from "./SignedOrderPurchaseAction";

const order: PurchaseOrder = {
  orderHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
  offerer: "0x0000000000000000000000000000000000000003",
  nftContract: "0x0000000000000000000000000000000000000002",
  tokenId: "1",
  amount: "1",
  price: "1000000000000000000",
  expiration: "1999999999",
  nonce: "1",
  itemType: 0,
  salt: "0x0000000000000000000000000000000000000000000000000000000000000004",
  signature: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  chainId: 97,
  marketplaceAddress: "0x0000000000000000000000000000000000000001",
  status: "active",
};

const props = { order, iscTokenAddress: "0x0000000000000000000000000000000000000005" };

describe("SignedOrderPurchaseAction", () => {
  it("shows the purchase action for an active order", () => {
    render(<SignedOrderPurchaseAction {...props} />);
    expect(screen.getByRole("button", { name: /立即购买/ })).toBeTruthy();
  });

  it("does not claim success when no wallet is connected", async () => {
    render(<SignedOrderPurchaseAction {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /立即购买/ }));
    expect(screen.getByText("确认购买 NFT")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "确认并继续" }));
    await waitFor(() => expect(screen.getByText("请先连接钱包，再购买此 NFT。")).toBeTruthy());
    expect(screen.queryByText(/链上成交已确认/)).toBeNull();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
