import { getAddress, isAddress } from "ethers";
import { z } from "zod";
import { buildWalletBindingMessage, recoverWalletFromBindingSignature } from "../walletBinding";
import { createWalletBindingChallenge, getWalletBindingChallenge, consumeWalletBindingChallenge } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const walletAddress = z.string().refine(isAddress, "钱包地址格式无效");

export const walletBindingsRouter = router({
  createChallenge: protectedProcedure.input(z.object({ walletAddress, chainId: z.number().int().positive(), domain: z.string().min(1).max(128) })).mutation(async ({ input, ctx }) => {
    const normalized = getAddress(input.walletAddress);
    const challenge = await createWalletBindingChallenge(ctx.user.id, normalized, input.chainId);
    const message = buildWalletBindingMessage({ domain: input.domain, address: normalized, chainId: input.chainId, nonce: challenge.nonce, issuedAt: challenge.issuedAt.toISOString(), expirationTime: challenge.expiresAt.toISOString() });
    return { ...challenge, walletAddress: normalized, message };
  }),

  verify: protectedProcedure.input(z.object({ walletAddress, chainId: z.number().int().positive(), domain: z.string().min(1).max(128), nonce: z.string().min(1).max(128), issuedAt: z.string().datetime(), expirationTime: z.string().datetime(), signature: z.string().regex(/^0x[0-9a-fA-F]{130}$/, "签名格式无效") })).mutation(async ({ input, ctx }) => {
    const normalized = getAddress(input.walletAddress);
    const challenge = await getWalletBindingChallenge(ctx.user.id, normalized, input.chainId, input.nonce);
    if (!challenge || challenge.verifiedAt || challenge.expiresAt.getTime() <= Date.now()) throw new Error("钱包绑定挑战不存在、已使用或已过期");
    const recovered = recoverWalletFromBindingSignature({ domain: input.domain, address: normalized, chainId: input.chainId, nonce: input.nonce, issuedAt: input.issuedAt, expirationTime: input.expirationTime }, input.signature);
    const consumed = await consumeWalletBindingChallenge(challenge.id);
    if (!consumed) throw new Error("钱包绑定挑战已被使用或已过期");
    return { verified: true, walletAddress: recovered, chainId: input.chainId } as const;
  }),
});
