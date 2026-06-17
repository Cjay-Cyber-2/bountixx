import { pgTable, text, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const rankEnum = pgEnum("rank", ["recruit", "challenger", "elite", "champion", "legendary"]);
export const roomStatusEnum = pgEnum("room_status", ["lobby", "live", "ended", "cancelled"]);
export const playerStatusEnum = pgEnum("player_status", ["invited", "joined", "ready", "completed", "forfeited"]);
export const txTypeEnum = pgEnum("tx_type", ["earned", "spent", "purchased", "gifted"]);
export const inviteStatusEnum = pgEnum("invite_status", ["pending", "accepted", "declined"]);
export const categoryEnum = pgEnum("category", ["coding", "trivia", "logic", "math", "writing", "design", "meme"]);
export const difficultyEnum = pgEnum("difficulty", ["rookie", "challenger", "elite", "legendary"]);
export const bountyTierEnum = pgEnum("bounty_tier", ["bronze", "silver", "gold", "mythic"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),                          // Clerk user ID (e.g. "user_...")
  email: text("email").unique(),
  username: text("username").unique().notNull(),
  avatarUrl: text("avatar_url"),
  coinsBalance: integer("coins_balance").default(0).notNull(),
  xp: integer("xp").default(0).notNull(),
  rank: rankEnum("rank").default("recruit").notNull(),
  roomsCreatedCount: integer("rooms_created_count").default(0).notNull(),
  consecutiveWins: integer("consecutive_wins").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at"),
});

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  taskRaw: text("task_raw").notNull(),
  taskNormalised: text("task_normalised"),
  canonicalAnswer: text("canonical_answer"),
  category: categoryEnum("category"),
  title: text("title"),
  difficulty: difficultyEnum("difficulty"),
  language: text("language"),          // coding rooms: the analysed programming language
  starterCode: text("starter_code"),   // coding rooms: starter program shown in the editor
  status: roomStatusEnum("status").default("lobby").notNull(),
  adminId: text("admin_id").notNull().references(() => users.id),
  playerCap: integer("player_cap").default(2).notNull(),
  timerSeconds: integer("timer_seconds"),
  bountyTier: bountyTierEnum("bounty_tier").default("bronze").notNull(),
  prizePool: integer("prize_pool").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  questionsJson: text("questions_json"),
});

export const testCases = pgTable("test_cases", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id),
  input: text("input").notNull(),
  expectedOutput: text("expected_output").notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const roomPlayers = pgTable("room_players", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id),
  userId: text("user_id").notNull().references(() => users.id),
  status: playerStatusEnum("status").default("invited").notNull(),
  joinedAt: timestamp("joined_at"),
  submittedAt: timestamp("submitted_at"),
});

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id),
  userId: text("user_id").notNull().references(() => users.id),
  code: text("code"),
  answer: text("answer"),
  language: text("language"),
  testsPassed: integer("tests_passed").default(0).notNull(),
  testsTotal: integer("tests_total").default(0).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  isWinner: boolean("is_winner").default(false).notNull(),
});

export const coinTransactions = pgTable("coin_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: txTypeEnum("type").notNull(),
  reference: text("reference"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  badgeId: text("badge_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

export const invites = pgTable("invites", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id),
  inviterId: text("inviter_id").notNull().references(() => users.id),
  inviteeId: text("invitee_id").notNull().references(() => users.id),
  status: inviteStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushTokens = pgTable("push_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
