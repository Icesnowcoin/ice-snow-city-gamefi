import { TRPCError } from "@trpc/server";
import { isAddress, isHexString, TypedDataEncoder, verifyTypedData } from "ethers";
import { z } from "zod";

import { getSignedNftOrder, insertSignedNftOrder, listActiveSignedNftOrders, listReceivedBuyOffers, markSignedNftOrderCancelled, markSignedNftOrderFulfilled } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const ORDER_TYPES = {
  Order: [
    { name: "offerer", type: "address" },
    { name: "nftContract", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "price", type: "uint256" },
    { name: "expiration", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "itemType", type: "uint8" },
    { name: "salt", type: "bytes32" },
  ],
};

const address = z.string().refine(isAddress, "地址格式无效");
const uintString = z.string().regex(/^\d+$/, "必须是非负整数");
const bytes32 = z.string().refine((value) => isHexString(value, 32), "必须是 bytes32");
const orderSchema = z.object({
  offerer: address,
  nftContract: address,
  tokenId: uintString,
  amount: uintString,
  price: uintString,
  expiration: uintString,
  nonce: uintString,
  itemType: z.union([z.literal(0), z.literal(1)]),
  salt: bytes32,
});

const submitSchema = z.object({
  order: orderSchema,
  signature: z.string().refine((value) => isHexString(value, 65), "签名必须是 65 字节十六进制数据"),
  chainId: z.number().int().positive(),
  marketplaceAddress: address,
});

const offerOrderSchema = orderSchema.extend({ orderType: z.literal(1) });
const offerSubmitSchema = z.object({
  order: offerOrderSchema,
  signature: z.string().refine((value) => isHexString(value, 65), "签名必须是 65 字节十六进制数据"),
  chainId: z.number().int().positive(),
  marketplaceAddress: address,
});

const OFFER_ORDER_TYPES = {
  Order: [
    { name: "offerer", type: "address" }, { name: "nftContract", type: "address" },
    { name: "tokenId", type: "uint256" }, { name: "amount", type: "uint256" },
    { name: "price", type: "uint256" }, { name: "expiration", type: "uint256" },
    { name: "nonce", type: "uint256" }, { name: "itemType", type: "uint8" },
    { name: "orderType", type: "uint8" }, { name: "salt", type: "bytes32" },
  ],
};

function normalizeOrder(order: z.infer<typeof orderSchema>) {
  return {
    ...order,
    tokenId: BigInt(order.tokenId),
    amount: BigInt(order.amount),
    price: BigInt(order.price),
    expiration: BigInt(order.expiration),
    nonce: BigInt(order.nonce),
  };
}

export const signedNftOrdersRouter = router({
  cancel: protectedProcedure
    .input(z.object({
      orderHash: z.string().refine((value) => isHexString(value, 32), "订单哈希必须是 bytes32"),
      offerer: address,
      cancelTxHash: z.string().refine((value) => isHexString(value, 32), "取消交易哈希无效"),
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await getSignedNftOrder(input.orderHash);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
      if (existing.userId !== ctx.user.id || existing.offerer.toLowerCase() !== input.offerer.toLowerCase()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "你无权撤销此订单" });
      }
      if (existing.status !== "active") {
        return { orderHash: input.orderHash, status: existing.status, updated: false, message: "订单已经不是可撤销状态" } as const;
      }
      await markSignedNftOrderCancelled(input.orderHash, input.cancelTxHash);
      return { orderHash: input.orderHash, status: "cancelled", updated: true, message: "订单取消已登记，链上状态以交易确认和事件为准" } as const;
    }),

  recordFulfilled: protectedProcedure
    .input(z.object({
      orderHash: z.string().refine((value) => isHexString(value, 32), "订单哈希必须是 bytes32"),
      buyerAddress: address,
      fulfillTxHash: z.string().refine((value) => isHexString(value, 32), "成交交易哈希无效"),
      chainId: z.number().int().positive(),
      marketplaceAddress: address,
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await getSignedNftOrder(input.orderHash);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
      if (existing.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "卖家不能购买自己的订单" });
      if (existing.offerer.toLowerCase() === input.buyerAddress.toLowerCase()) throw new TRPCError({ code: "BAD_REQUEST", message: "买家不能与卖家相同" });
      if (existing.chainId !== input.chainId || existing.marketplaceAddress.toLowerCase() !== input.marketplaceAddress.toLowerCase()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "成交网络或市场合约与订单不一致" });
      }
      if (existing.status !== "active") {
        return { orderHash: input.orderHash, status: existing.status, updated: false, message: "订单已经不是可成交状态" } as const;
      }
      await markSignedNftOrderFulfilled(input.orderHash, input.fulfillTxHash);
      return { orderHash: input.orderHash, status: "fulfilled", updated: true, message: "成交交易已登记，链上资产转移以交易事件为准" } as const;
    }),

  submitOffer: protectedProcedure.input(offerSubmitSchema).mutation(async ({ input, ctx }) => {
    const order = normalizeOrder(input.order as z.infer<typeof orderSchema>);
    if (order.itemType === 0 && order.amount !== BigInt(1)) throw new TRPCError({ code: "BAD_REQUEST", message: "ERC-721 报价数量必须为 1" });
    if (order.itemType === 1 && order.amount <= BigInt(0)) throw new TRPCError({ code: "BAD_REQUEST", message: "ERC-1155 报价数量必须大于 0" });
    if (order.price <= BigInt(0) || order.expiration <= BigInt(Math.floor(Date.now() / 1000))) throw new TRPCError({ code: "BAD_REQUEST", message: "报价价格必须大于 0 且未过期" });
    const domain = { name: "Ice Snow City Seaport Style Marketplace", version: "2", chainId: input.chainId, verifyingContract: input.marketplaceAddress };
    let recovered: string;
    try { recovered = verifyTypedData(domain, OFFER_ORDER_TYPES, order, input.signature); } catch { throw new TRPCError({ code: "BAD_REQUEST", message: "BUY_OFFER 的 EIP-712 签名无法验证" }); }
    if (recovered.toLowerCase() !== order.offerer.toLowerCase()) throw new TRPCError({ code: "BAD_REQUEST", message: "报价签名者与买方地址不一致" });
    const orderHash = TypedDataEncoder.hash(domain, OFFER_ORDER_TYPES, order);
    const existing = await getSignedNftOrder(orderHash);
    if (existing) return { orderHash, status: existing.status, created: false, message: "报价已经登记，无需重复提交" } as const;
    await insertSignedNftOrder({ ...order, orderHash, userId: ctx.user.id, tokenId: order.tokenId.toString(), amount: order.amount.toString(), price: order.price.toString(), expiration: order.expiration.toString(), nonce: order.nonce.toString(), itemType: order.itemType, orderType: 1, salt: order.salt, signature: input.signature, chainId: input.chainId, marketplaceAddress: input.marketplaceAddress, status: "active" });
    return { orderHash, status: "active", created: true, message: "买方报价已登记，等待 NFT 持有人接受；尚未发生资产转移" } as const;
  }),

  submit: protectedProcedure.input(submitSchema).mutation(async ({ input, ctx }) => {
    const order = normalizeOrder(input.order);
    if (order.itemType === 0 && order.amount !== BigInt(1)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "ERC-721 订单数量必须为 1" });
    }
    if (order.itemType === 1 && order.amount <= BigInt(0)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "ERC-1155 订单数量必须大于 0" });
    }
    if (order.price <= BigInt(0)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "订单价格必须大于 0" });
    }
    if (order.expiration <= BigInt(Math.floor(Date.now() / 1000))) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "订单已过期" });
    }
    const domain = {
      name: "Ice Snow City Seaport Style Marketplace",
      version: "1",
      chainId: input.chainId,
      verifyingContract: input.marketplaceAddress,
    };
    let recovered: string;
    try {
      recovered = verifyTypedData(domain, ORDER_TYPES, order, input.signature);
    } catch {
      throw new TRPCError({ code: "BAD_REQUEST", message: "EIP-712 签名无法验证" });
    }
    if (recovered.toLowerCase() !== order.offerer.toLowerCase()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "签名者与订单卖家不一致" });
    }

    const orderHash = TypedDataEncoder.hash(domain, ORDER_TYPES, order);
    const existing = await getSignedNftOrder(orderHash);
    if (existing) {
      if (existing.signature.toLowerCase() !== input.signature.toLowerCase()) {
        throw new TRPCError({ code: "CONFLICT", message: "订单哈希已存在但签名不一致" });
      }
      return { orderHash, status: existing.status, created: false, message: "订单已经登记，无需重复提交" } as const;
    }

    await insertSignedNftOrder({
      orderHash,
      userId: ctx.user.id,
      offerer: order.offerer,
      nftContract: order.nftContract,
      tokenId: order.tokenId.toString(),
      amount: order.amount.toString(),
      price: order.price.toString(),
      expiration: order.expiration.toString(),
      nonce: order.nonce.toString(),
      itemType: order.itemType,
      salt: order.salt,
      signature: input.signature,
      chainId: input.chainId,
      marketplaceAddress: input.marketplaceAddress,
      status: "active",
    });

    return { orderHash, status: "active", created: true, message: "签名订单已登记，尚未发生链上资产转移" } as const;
  }),

  active: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(50), offset: z.number().int().min(0).default(0) }).optional()).query(async ({ input }) => {
    const orders = await listActiveSignedNftOrders(input?.limit ?? 50, input?.offset ?? 0);
    return orders.map(({ orderHash, offerer, nftContract, tokenId, amount, price, expiration, nonce, itemType, orderType, salt, signature, chainId, marketplaceAddress, status, createdAt }) => ({
      orderHash,
      offerer,
      nftContract,
      tokenId,
      amount,
      price,
      expiration,
      nonce,
      itemType,
      salt,
      signature,
      chainId,
      marketplaceAddress,
      status,
      createdAt,
    }));
  }),

  fulfillBuyOffer: protectedProcedure.input(z.object({ orderHash: bytes32, fulfillTxHash: bytes32 })).mutation(async ({ input }) => {
    const order = await getSignedNftOrder(input.orderHash);
    if (!order || order.orderType !== 1 || order.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "报价不存在或已不再有效" });
    await markSignedNftOrderFulfilled(input.orderHash, input.fulfillTxHash);
    return { orderHash: input.orderHash, status: "fulfilled", message: "买方报价已被链上接受，成交凭证已登记" } as const;
  }),

  receivedOffers: protectedProcedure.input(z.object({
    walletAddress: address,
    chainId: z.number().int().positive(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  })).query(async ({ input }) => {
    const results = await listReceivedBuyOffers(input.walletAddress, input.chainId, input.limit, input.offset);
    return results.map(({ order }) => ({
      orderHash: order.orderHash, offerer: order.offerer, nftContract: order.nftContract,
      tokenId: order.tokenId, amount: order.amount, price: order.price,
      expiration: order.expiration, nonce: order.nonce, itemType: order.itemType,
      orderType: order.orderType, salt: order.salt, signature: order.signature,
      chainId: order.chainId, marketplaceAddress: order.marketplaceAddress,
      status: order.status, createdAt: order.createdAt,
    }));
  }),
});
