import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const queryMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ signedNftOrders: { active: { invalidate: vi.fn() } } }),
    signedNftOrders: {
      active: { useQuery: queryMock },
      cancel: { useMutation: () => ({ mutateAsync: vi.fn() }) },
    },
  },
}));
vi.mock("@/components/social/SignedOrderCancelAction", () => ({
  SignedOrderCancelAction: () => null,
}));

import { SignedNftOrderList } from "./SignedNftOrderList";

const base = {
  offerer: "0x0000000000000000000000000000000000000003",
  nftContract: "0x0000000000000000000000000000000000000002",
  amount: "1",
  expiration: "1999999999",
  nonce: "1",
  itemType: 0,
  salt: "0x0000000000000000000000000000000000000000000000000000000000000004",
  signature: "0x",
  chainId: 97,
  marketplaceAddress: "0x0000000000000000000000000000000000000001",
};

const orders = [
  { ...base, orderHash: "0x0000000000000000000000000000000000000000000000000000000000000001", tokenId: "1", price: "200", status: "active" as const, createdAt: "2026-01-02T00:00:00.000Z" },
  { ...base, orderHash: "0x0000000000000000000000000000000000000000000000000000000000000002", tokenId: "2", price: "100", status: "cancelled" as const, createdAt: "2026-01-01T00:00:00.000Z" },
];

describe("SignedNftOrderList", () => {
  it("filters by status and sorts by price", () => {
    queryMock.mockReturnValue({ data: orders, isLoading: false, error: null });
    render(<SignedNftOrderList />);
    fireEvent.click(screen.getByRole("combobox", { name: "按订单状态筛选" }));
    fireEvent.click(screen.getByRole("option", { name: "已取消" }));
    fireEvent.click(screen.getByRole("combobox", { name: "订单排序方式" }));
    fireEvent.click(screen.getByRole("option", { name: "价格：从低到高" }));
    expect(screen.getByText("Token #2")).toBeTruthy();
    expect(screen.queryByText("Token #1")).toBeNull();
  });

  it("shows a clear-filter empty state when no order matches", () => {
    queryMock.mockReturnValue({ data: orders, isLoading: false, error: null });
    render(<SignedNftOrderList />);
    fireEvent.click(screen.getByRole("combobox", { name: "按订单状态筛选" }));
    fireEvent.click(screen.getByRole("option", { name: "已过期" }));
    expect(screen.getByText(/没有符合当前筛选条件/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "清除筛选条件" })).toBeTruthy();
  });
});
