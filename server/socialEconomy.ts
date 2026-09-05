import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, lt, or, sql } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";

import {
  gameConsumptionAllocations,
  guildMembers,
  guilds,
  playerAssets,
  socialFriendships,
  socialMessages,
  socialTransactions,
  socialWallets,
  teamMembers,
  teams,
} from "../drizzle/schema";
import { getDb } from "./db";

export const SOCIAL_ECONOMY = {
  megaphonePrice: 1_000,
  guildCreationFee: 1_000_000,
  teamCreationFee: 10_000,
  friendActivationFee: 20_000,
  teamDurationMs: 30 * 60 * 1_000,
  treasuryPercentage: 60,
  marketingPercentage: 40,
  treasuryAddress: "0x3B79D4A0bd73FCaB12DFEd34dA830b376A50e019",
  marketingWalletAddress: "0xF8A408495941ea30451Da613dC846Dcae47890f0",
} as const;

export type SocialChargeType =
  | "megaphone_purchase"
  | "guild_creation"
  | "team_creation"
  | "friend_activation";

export type SocialChannelType = "world" | "guild" | "team" | "private" | "community";

export class SocialEconomyError extends Error {
  constructor(
    public readonly code:
      | "DATABASE_UNAVAILABLE"
      | "ACCOUNT_NOT_INITIALIZED"
      | "INSUFFICIENT_BALANCE"
      | "INSUFFICIENT_MEGAPHONES"
      | "DUPLICATE_OPERATION"
      | "INVALID_INPUT"
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "EXPIRED"
      | "DUPLICATE_NAME",
    message: string,
  ) {
    super(message);
    this.name = "SocialEconomyError";
  }
}

export function splitGameConsumption(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new SocialEconomyError("INVALID_INPUT", "消费金额必须是正整数 ISC");
  }

  const treasuryAmount = Math.floor((amount * SOCIAL_ECONOMY.treasuryPercentage) / 100);
  const marketingAmount = amount - treasuryAmount;
  return { grossAmount: amount, treasuryAmount, marketingAmount };
}

function transactionId(prefix: string) {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`.slice(0, 64);
}

function normalizeContent(content: string) {
  const normalized = content.trim();
  if (!normalized || normalized.length > 500) {
    throw new SocialEconomyError("INVALID_INPUT", "消息内容必须为 1 至 500 个字符");
  }
  return normalized;
}

function pairFor(userA: number, userB: number) {
  if (!Number.isInteger(userA) || !Number.isInteger(userB) || userA === userB) {
    throw new SocialEconomyError("INVALID_INPUT", "好友双方用户标识无效");
  }
  return userA < userB
    ? { userLowId: userA, userHighId: userB }
    : { userLowId: userB, userHighId: userA };
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new SocialEconomyError("DATABASE_UNAVAILABLE", "游戏账本暂时不可用，请稍后重试");
  return db;
}

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function findExistingTransaction(tx: Tx, idempotencyKey: string) {
  const rows = await tx
    .select()
    .from(socialTransactions)
    .where(eq(socialTransactions.idempotencyKey, idempotencyKey))
    .limit(1);
  return rows[0] ?? null;
}

async function chargeGameConsumption(
  tx: Tx,
  input: {
    userId: number;
    type: SocialChargeType;
    amount: number;
    quantity?: number;
    scene: string;
    referenceId?: string;
    idempotencyKey: string;
    description: string;
  },
) {
    const existing = await findExistingTransaction(tx, input.idempotencyKey);
    if (existing) return existing;

    const split = splitGameConsumption(input.amount);
  const updated = await tx
    .update(playerAssets)
    .set({
      iscBalance: sql`${playerAssets.iscBalance} - ${input.amount}`,
      totalAssets: sql`${playerAssets.totalAssets} - ${input.amount}`,
    })
    .where(
      and(
        eq(playerAssets.userId, input.userId),
        gte(playerAssets.iscBalance, String(input.amount)),
      ),
    );

  if (!updated || Number((updated as { affectedRows?: number }).affectedRows ?? 0) !== 1) {
    const account = await tx
      .select({ userId: playerAssets.userId })
      .from(playerAssets)
      .where(eq(playerAssets.userId, input.userId))
      .limit(1);
    if (!account[0]) {
      throw new SocialEconomyError("ACCOUNT_NOT_INITIALIZED", "玩家 ISC 账户尚未初始化");
    }
    throw new SocialEconomyError("INSUFFICIENT_BALANCE", "ISC 余额不足");
  }

  const balanceRows = await tx
    .select({ iscBalance: playerAssets.iscBalance })
    .from(playerAssets)
    .where(eq(playerAssets.userId, input.userId))
    .limit(1);
  const balanceAfter = balanceRows[0]?.iscBalance ?? "0";
  const socialTransactionId = transactionId("social_tx");

  await tx.insert(socialTransactions).values({
    id: socialTransactionId,
    userId: input.userId,
    type: input.type,
    amount: input.amount,
    balanceAfter,
    quantity: input.quantity ?? 1,
    referenceId: input.referenceId,
    idempotencyKey: input.idempotencyKey,
    status: "completed",
    description: input.description,
  });

  await tx.insert(gameConsumptionAllocations).values({
    id: transactionId("allocation"),
    userId: input.userId,
    scene: input.scene,
    sourceTransactionId: socialTransactionId,
    grossAmount: split.grossAmount,
    treasuryAmount: split.treasuryAmount,
    marketingAmount: split.marketingAmount,
    treasuryAddress: SOCIAL_ECONOMY.treasuryAddress,
    marketingWalletAddress: SOCIAL_ECONOMY.marketingWalletAddress,
    idempotencyKey: `allocation:${input.idempotencyKey}`,
    status: "recorded",
  });

  return {
    ...input,
    ...split,
    id: socialTransactionId,
    balanceAfter,
  };
}

export async function getSocialWallet(userId: number) {
  const db = await requireDb();
  const rows = await db.select().from(socialWallets).where(eq(socialWallets.userId, userId)).limit(1);
  return rows[0] ?? { id: 0, userId, megaphones: 0, createdAt: null, updatedAt: null };
}

export async function purchaseMegaphones(userId: number, quantity: number, idempotencyKey: string) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new SocialEconomyError("INVALID_INPUT", "一次最多购买 100 个喇叭");
  }
  if (!idempotencyKey || idempotencyKey.length > 128) {
    throw new SocialEconomyError("INVALID_INPUT", "缺少有效的幂等键");
  }

  const db = await requireDb();
  return db.transaction(async (tx) => {
    const existing = await findExistingTransaction(tx, idempotencyKey);
    if (existing) {
      return { charge: existing, wallet: await getSocialWalletInTransaction(tx, userId) };
    }

    const charge = await chargeGameConsumption(tx, {
      userId,
      type: "megaphone_purchase",
      amount: SOCIAL_ECONOMY.megaphonePrice * quantity,
      quantity,
      scene: "world_channel_megaphone",
      idempotencyKey,
      description: `购买 ${quantity} 个世界频道喇叭`,
    });

    await tx
      .insert(socialWallets)
      .values({ userId, megaphones: quantity })
      .onDuplicateKeyUpdate({
        set: { megaphones: sql`${socialWallets.megaphones} + ${quantity}` },
      });

    return { charge, wallet: await getSocialWalletInTransaction(tx, userId) };
  });
}

async function getSocialWalletInTransaction(tx: Tx, userId: number) {
  const rows = await tx.select().from(socialWallets).where(eq(socialWallets.userId, userId)).limit(1);
  return rows[0] ?? { id: 0, userId, megaphones: 0, createdAt: null, updatedAt: null };
}

export async function sendChannelMessage(input: {
  senderUserId: number;
  channelType: SocialChannelType;
  channelId?: string;
  recipientUserId?: number;
  content: string;
  idempotencyKey: string;
}) {
  const content = normalizeContent(input.content);
  if (!input.idempotencyKey || input.idempotencyKey.length > 128) {
    throw new SocialEconomyError("INVALID_INPUT", "缺少有效的幂等键");
  }
  if (input.channelType === "world" && input.channelId && input.channelId !== "world") {
    throw new SocialEconomyError("INVALID_INPUT", "世界频道标识无效");
  }
  if (input.channelType === "private" && !input.recipientUserId) {
    throw new SocialEconomyError("INVALID_INPUT", "私聊消息缺少接收者");
  }

  const db = await requireDb();
  return db.transaction(async (tx) => {
    const existing = await findExistingTransaction(tx, `message:${input.idempotencyKey}`);
    if (existing?.referenceId) {
      const messages = await tx.select().from(socialMessages).where(eq(socialMessages.id, existing.referenceId)).limit(1);
      if (messages[0]) return messages[0];
    }

    let megaphoneConsumed = false;
    if (input.channelType === "world") {
      const updated = await tx
        .update(socialWallets)
        .set({ megaphones: sql`${socialWallets.megaphones} - 1` })
        .where(and(eq(socialWallets.userId, input.senderUserId), gte(socialWallets.megaphones, 1)));
      if (!updated || Number((updated as { affectedRows?: number }).affectedRows ?? 0) !== 1) {
        throw new SocialEconomyError("INSUFFICIENT_MEGAPHONES", "世界频道发言需要 1 个喇叭，请先购买");
      }
      megaphoneConsumed = true;
    }

    if (input.channelType === "private") {
      const recipientUserId = input.recipientUserId as number;
      const { userLowId, userHighId } = pairFor(input.senderUserId, recipientUserId);
      const friendship = await tx
        .select({ id: socialFriendships.id })
        .from(socialFriendships)
        .where(
          and(
            eq(socialFriendships.userLowId, userLowId),
            eq(socialFriendships.userHighId, userHighId),
            eq(socialFriendships.status, "active"),
            eq(socialFriendships.privateChatEnabled, true),
          ),
        )
        .limit(1);
      if (!friendship[0]) throw new SocialEconomyError("FORBIDDEN", "双方尚未开通永久私聊权限");
    }

    if (input.channelType === "guild") {
      if (!input.channelId) throw new SocialEconomyError("INVALID_INPUT", "工会频道缺少工会标识");
      const membership = await tx
        .select({ id: guildMembers.id })
        .from(guildMembers)
        .where(and(eq(guildMembers.guildId, input.channelId), eq(guildMembers.userId, input.senderUserId)))
        .limit(1);
      if (!membership[0]) throw new SocialEconomyError("FORBIDDEN", "您不是该工会成员");
    }

    if (input.channelType === "team") {
      if (!input.channelId) throw new SocialEconomyError("INVALID_INPUT", "队伍频道缺少队伍标识");
      const team = await tx.select().from(teams).where(eq(teams.id, input.channelId)).limit(1);
      if (!team[0]) throw new SocialEconomyError("NOT_FOUND", "队伍不存在");
      if (team[0].status !== "active" || team[0].expiresAt.getTime() <= Date.now()) {
        throw new SocialEconomyError("EXPIRED", "该队伍已过期");
      }
      const membership = await tx
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, input.channelId), eq(teamMembers.userId, input.senderUserId)))
        .limit(1);
      if (!membership[0]) throw new SocialEconomyError("FORBIDDEN", "您不是该队伍成员");
    }

    const messageId = transactionId("message");
    await tx.insert(socialMessages).values({
      id: messageId,
      senderUserId: input.senderUserId,
      channelType: input.channelType,
      channelId: input.channelType === "world" ? "world" : input.channelId,
      recipientUserId: input.recipientUserId,
      content,
      megaphoneConsumed,
    });

    if (input.channelType === "world") {
      await tx.insert(socialTransactions).values({
        id: transactionId("message_tx"),
        userId: input.senderUserId,
        type: "world_message",
        amount: 0,
        balanceAfter: "0",
        quantity: 1,
        referenceId: messageId,
        idempotencyKey: `message:${input.idempotencyKey}`,
        status: "completed",
        description: "消耗 1 个喇叭发送世界频道消息",
      });
    }

    const messages = await tx.select().from(socialMessages).where(eq(socialMessages.id, messageId)).limit(1);
    return messages[0];
  });
}

export async function createGuild(input: {
  userId: number;
  name: string;
  description?: string;
  idempotencyKey: string;
}) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 64) throw new SocialEconomyError("INVALID_INPUT", "工会名称必须为 2 至 64 个字符");
  if (!input.idempotencyKey) throw new SocialEconomyError("INVALID_INPUT", "缺少有效的幂等键");

  const db = await requireDb();
  return db.transaction(async (tx) => {
    const existing = await findExistingTransaction(tx, input.idempotencyKey);
    if (existing?.referenceId) {
      const guild = await tx.select().from(guilds).where(eq(guilds.id, existing.referenceId)).limit(1);
      if (guild[0]) return guild[0];
    }

    const guildId = transactionId("guild");
    try {
      await tx.insert(guilds).values({
        id: guildId,
        ownerUserId: input.userId,
        name,
        description: input.description?.trim() || null,
        status: "active",
      });
    } catch (error) {
      if (String(error).toLowerCase().includes("duplicate")) {
        throw new SocialEconomyError("DUPLICATE_NAME", "该工会名称已被使用");
      }
      throw error;
    }

    await chargeGameConsumption(tx, {
      userId: input.userId,
      type: "guild_creation",
      amount: SOCIAL_ECONOMY.guildCreationFee,
      scene: "guild_creation",
      referenceId: guildId,
      idempotencyKey: input.idempotencyKey,
      description: `创建工会：${name}`,
    });
    await tx.insert(guildMembers).values({ guildId, userId: input.userId, role: "leader" });
    const rows = await tx.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
    return rows[0];
  });
}

export async function createTeam(input: { userId: number; name: string; idempotencyKey: string }) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 64) throw new SocialEconomyError("INVALID_INPUT", "队伍名称必须为 2 至 64 个字符");
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const existing = await findExistingTransaction(tx, input.idempotencyKey);
    if (existing?.referenceId) {
      const team = await tx.select().from(teams).where(eq(teams.id, existing.referenceId)).limit(1);
      if (team[0]) return team[0];
    }

    const teamId = transactionId("team");
    const expiresAt = new Date(Date.now() + SOCIAL_ECONOMY.teamDurationMs);
    await chargeGameConsumption(tx, {
      userId: input.userId,
      type: "team_creation",
      amount: SOCIAL_ECONOMY.teamCreationFee,
      scene: "team_creation",
      referenceId: teamId,
      idempotencyKey: input.idempotencyKey,
      description: `创建临时队伍：${name}`,
    });
    await tx.insert(teams).values({
      id: teamId,
      creatorUserId: input.userId,
      name,
      status: "active",
      expiresAt,
    });
    await tx.insert(teamMembers).values({ teamId, userId: input.userId, role: "leader" });
    const rows = await tx.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    return rows[0];
  });
}

export async function activateFriendship(input: { userId: number; friendUserId: number; idempotencyKey: string }) {
  const { userLowId, userHighId } = pairFor(input.userId, input.friendUserId);
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(socialFriendships)
      .where(and(eq(socialFriendships.userLowId, userLowId), eq(socialFriendships.userHighId, userHighId)))
      .limit(1);
    if (existing[0]?.status === "active" && existing[0].privateChatEnabled) return existing[0];
    if (existing[0]?.status === "blocked") throw new SocialEconomyError("FORBIDDEN", "该好友关系已被阻止");

    const friendshipId = transactionId("friendship");
    await chargeGameConsumption(tx, {
      userId: input.userId,
      type: "friend_activation",
      amount: SOCIAL_ECONOMY.friendActivationFee,
      scene: "friend_private_chat_activation",
      referenceId: friendshipId,
      idempotencyKey: input.idempotencyKey,
      description: `添加好友并永久开启私聊：${input.friendUserId}`,
    });
    await tx.insert(socialFriendships).values({
      id: friendshipId,
      userLowId,
      userHighId,
      initiatedByUserId: input.userId,
      status: "active",
      privateChatEnabled: true,
    });
    const rows = await tx.select().from(socialFriendships).where(eq(socialFriendships.id, friendshipId)).limit(1);
    return rows[0];
  });
}

export async function listChannelMessages(input: {
  userId: number;
  channelType: SocialChannelType;
  channelId?: string;
  recipientUserId?: number;
  limit?: number;
}) {
  const db = await requireDb();
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const conditions = [eq(socialMessages.channelType, input.channelType)];
  if (input.channelType === "private") {
    if (!input.recipientUserId) throw new SocialEconomyError("INVALID_INPUT", "私聊查询缺少接收者");
    const privateCondition = or(
      and(eq(socialMessages.senderUserId, input.userId), eq(socialMessages.recipientUserId, input.recipientUserId)),
      and(eq(socialMessages.senderUserId, input.recipientUserId), eq(socialMessages.recipientUserId, input.userId)),
    );
    if (!privateCondition) throw new SocialEconomyError("INVALID_INPUT", "私聊查询条件无效");
    conditions.push(privateCondition);
    const { userLowId, userHighId } = pairFor(input.userId, input.recipientUserId);
    const friendship = await db
      .select({ id: socialFriendships.id })
      .from(socialFriendships)
      .where(and(eq(socialFriendships.userLowId, userLowId), eq(socialFriendships.userHighId, userHighId), eq(socialFriendships.status, "active"), eq(socialFriendships.privateChatEnabled, true)))
      .limit(1);
    if (!friendship[0]) throw new SocialEconomyError("FORBIDDEN", "双方尚未开通永久私聊权限");
  } else if (input.channelType === "world") {
    conditions.push(eq(socialMessages.channelId, "world"));
  } else if (input.channelId) {
    conditions.push(eq(socialMessages.channelId, input.channelId));
    if (input.channelType === "guild") {
      const membership = await db.select({ id: guildMembers.id }).from(guildMembers).where(and(eq(guildMembers.guildId, input.channelId), eq(guildMembers.userId, input.userId))).limit(1);
      if (!membership[0]) throw new SocialEconomyError("FORBIDDEN", "您不是该工会成员");
    }
    if (input.channelType === "team") {
      const team = await db.select().from(teams).where(eq(teams.id, input.channelId)).limit(1);
      if (!team[0]) throw new SocialEconomyError("NOT_FOUND", "队伍不存在");
      if (team[0].status !== "active" || team[0].expiresAt.getTime() <= Date.now()) throw new SocialEconomyError("EXPIRED", "该队伍已过期");
      const membership = await db.select({ id: teamMembers.id }).from(teamMembers).where(and(eq(teamMembers.teamId, input.channelId), eq(teamMembers.userId, input.userId))).limit(1);
      if (!membership[0]) throw new SocialEconomyError("FORBIDDEN", "您不是该队伍成员");
    }
  }
  return db
    .select()
    .from(socialMessages)
    .where(and(...conditions))
    .orderBy(desc(socialMessages.createdAt))
    .limit(limit);
}

export async function expireTeams(now = new Date()) {
  const db = await requireDb();
  await db
    .update(teams)
    .set({ status: "expired" })
    .where(and(eq(teams.status, "active"), lt(teams.expiresAt, now)));
  return { expiredBefore: now.toISOString() };
}

export async function getAllocationSummary(userId: number) {
  const db = await requireDb();
  const rows = await db
    .select({
      scene: gameConsumptionAllocations.scene,
      grossAmount: sql<number>`SUM(${gameConsumptionAllocations.grossAmount})`,
      treasuryAmount: sql<number>`SUM(${gameConsumptionAllocations.treasuryAmount})`,
      marketingAmount: sql<number>`SUM(${gameConsumptionAllocations.marketingAmount})`,
    })
    .from(gameConsumptionAllocations)
    .where(eq(gameConsumptionAllocations.userId, userId))
    .groupBy(gameConsumptionAllocations.scene);
  return rows;
}
