import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const txTypeEnum = pgEnum("tx_type", [
  "credit",
  "debit",
  "arena_entry",
  "arena_win",
  "refund",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),          // Clerk user ID
  username: text("username").unique(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
  id: text("id").primaryKey(),          // same as users.id
  balance: integer("balance").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: txTypeEnum("type").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const arenas = pgTable("arenas", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  bounty: integer("bounty").default(0).notNull(),
  maxPlayers: integer("max_players").default(2).notNull(),
  status: text("status", { enum: ["waiting", "active", "completed"] })
    .default("waiting")
    .notNull(),
  winnerId: text("winner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
});

export const arenaPlayers = pgTable("arena_players", {
  arenaId: text("arena_id").notNull().references(() => arenas.id),
  userId: text("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  score: integer("score").default(0).notNull(),
});
