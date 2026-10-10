import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReceivedOffersPanel } from "./ReceivedOffersPanel";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ signedNftOrders: { receivedOffers: { invalidate: vi.fn() } } }),
    signedNftOrders: {
      receivedOffers: { useQuery: () => ({ data: undefined, isLoading: false }) },
      fulfillBuyOffer: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
  },
}));

describe("ReceivedOffersPanel", () => {
  it("does not expose an accept action without the holder wallet", () => {
    render(<ReceivedOffersPanel />);
    expect(screen.getByText("连接 NFT 持有者钱包后，系统才会查询针对你当前持仓的报价。")).toBeTruthy();
    expect(screen.queryByText("接受报价")).toBeNull();
  });
});
