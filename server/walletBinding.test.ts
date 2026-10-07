import { Wallet } from "ethers";

const TEST_WALLET = new Wallet("0x1111111111111111111111111111111111111111111111111111111111111111");
import { describe, expect, it } from "vitest";
import { buildWalletBindingMessage, recoverWalletFromBindingSignature } from "./walletBinding";

describe("wallet binding", () => {
  it("recovers the challenged wallet from an explicit signature", async () => {
    const wallet = TEST_WALLET;
    const challenge = { domain: "ice-snow-city.test", address: wallet.address, chainId: 97, nonce: "one-time-1", issuedAt: new Date(Date.now() - 1000).toISOString(), expirationTime: new Date(Date.now() + 60_000).toISOString() };
    const signature = await wallet.signMessage(buildWalletBindingMessage(challenge));
    expect(recoverWalletFromBindingSignature(challenge, signature)).toBe(wallet.address);
  });

  it("rejects an expired challenge", () => {
    const wallet = TEST_WALLET;
    expect(() => buildWalletBindingMessage({ domain: "ice-snow-city.test", address: wallet.address, chainId: 97, nonce: "expired", issuedAt: new Date(0).toISOString(), expirationTime: new Date(0).toISOString() })).toThrow("过期");
  });
});
