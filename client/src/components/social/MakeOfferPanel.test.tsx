import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MakeOfferPanel } from "./MakeOfferPanel";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    signedNftOrders: {
      submitOffer: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
  },
}));

describe("MakeOfferPanel", () => {
  it("shows the offer form and locks ERC-721 quantity to one", () => {
    render(
      <MakeOfferPanel
        marketplaceAddress="0x0000000000000000000000000000000000000001"
        chainId={97}
        nftContract="0x0000000000000000000000000000000000000002"
        tokenId="1"
        itemType={0}
      />,
    );
    expect(screen.getByText("出价（Make Offer）")).toBeTruthy();
    expect(screen.getByLabelText("数量")).toBeDisabled();
    expect(screen.getByLabelText("报价（ISC）")).toBeTruthy();
  });
});
