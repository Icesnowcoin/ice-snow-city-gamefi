import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Contract events log table - stores on-chain event records.
 */
export const contractEvents = mysqlTable("contract_events", {
  id: int("id").autoincrement().primaryKey(),
  eventName: varchar("eventName", { length: 128 }).notNull(),
  txHash: varchar("txHash", { length: 66 }),
  blockNumber: bigint("blockNumber", { mode: "number" }),
  fromAddress: varchar("fromAddress", { length: 42 }),
  toAddress: varchar("toAddress", { length: 42 }),
  amount: varchar("amount", { length: 78 }),
  params: text("params"),
  status: mysqlEnum("status", ["success", "failed", "pending"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractEvent = typeof contractEvents.$inferSelect;
export type InsertContractEvent = typeof contractEvents.$inferInsert;

/**
 * Contract parameters table - stores current contract configuration.
 */
export const contractParams = mysqlTable("contract_params", {
  id: int("id").autoincrement().primaryKey(),
  paramName: varchar("paramName", { length: 128 }).notNull().unique(),
  paramValue: varchar("paramValue", { length: 256 }).notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: varchar("updatedBy", { length: 64 }),
});

export type ContractParam = typeof contractParams.$inferSelect;
export type InsertContractParam = typeof contractParams.$inferInsert;

/**
 * Secret keys table - stores secret key hashes and history.
 */
export const secretKeys = mysqlTable("secret_keys", {
  id: int("id").autoincrement().primaryKey(),
  keyHash: varchar("keyHash", { length: 66 }).notNull(),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: varchar("createdBy", { length: 64 }),
});

export type SecretKey = typeof secretKeys.$inferSelect;
export type InsertSecretKey = typeof secretKeys.$inferInsert;

/**
 * Treasury transactions table - stores ISC flow in/out of CityTreasury.
 */
export const treasuryTransactions = mysqlTable("treasury_transactions", {
  id: int("id").autoincrement().primaryKey(),
  txType: mysqlEnum("txType", ["deposit", "withdraw"]).notNull(),
  amount: varchar("amount", { length: 78 }).notNull(),
  txHash: varchar("txHash", { length: 66 }),
  fromAddress: varchar("fromAddress", { length: 42 }),
  toAddress: varchar("toAddress", { length: 42 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TreasuryTransaction = typeof treasuryTransactions.$inferSelect;
export type InsertTreasuryTransaction = typeof treasuryTransactions.$inferInsert;
