import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const drawStatus = pgEnum("draw_status", ["draft", "completed"]);
export const emailStatus = pgEnum("email_status", ["pending", "sent", "failed"]);

export const draws = pgTable(
  "draws",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    eventDate: date("event_date"),
    budget: text("budget"),
    message: text("message"),
    locale: text("locale").notNull().default("es"),
    status: drawStatus("status").notNull().default("draft"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("draws_owner_idx").on(t.ownerId)]
);

export const drawGroups = pgTable(
  "draw_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    drawId: uuid("draw_id")
      .notNull()
      .references(() => draws.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("draw_groups_draw_idx").on(t.drawId)]
);

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    drawId: uuid("draw_id")
      .notNull()
      .references(() => draws.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    groupId: uuid("group_id").references(() => drawGroups.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("participants_draw_idx").on(t.drawId)]
);

/**
 * Symmetric restriction between two groups: no member of group A may give
 * to a member of group B and vice versa. Stored with groupAId < groupBId.
 */
export const groupExclusions = pgTable(
  "group_exclusions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    drawId: uuid("draw_id")
      .notNull()
      .references(() => draws.id, { onDelete: "cascade" }),
    groupAId: uuid("group_a_id")
      .notNull()
      .references(() => drawGroups.id, { onDelete: "cascade" }),
    groupBId: uuid("group_b_id")
      .notNull()
      .references(() => drawGroups.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("group_exclusions_pair_idx").on(t.groupAId, t.groupBId)]
);

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    drawId: uuid("draw_id")
      .notNull()
      .references(() => draws.id, { onDelete: "cascade" }),
    giverId: uuid("giver_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    emailStatus: emailStatus("email_status").notNull().default("pending"),
    emailError: text("email_error"),
    emailAttempts: integer("email_attempts").notNull().default(0),
    emailSentAt: timestamp("email_sent_at"),
  },
  (t) => [
    uniqueIndex("assignments_giver_idx").on(t.giverId),
    uniqueIndex("assignments_receiver_idx").on(t.receiverId),
    index("assignments_draw_idx").on(t.drawId),
  ]
);

export const drawsRelations = relations(draws, ({ many, one }) => ({
  owner: one(users, { fields: [draws.ownerId], references: [users.id] }),
  participants: many(participants),
  groups: many(drawGroups),
  exclusions: many(groupExclusions),
  assignments: many(assignments),
}));

export const participantsRelations = relations(participants, ({ one }) => ({
  draw: one(draws, { fields: [participants.drawId], references: [draws.id] }),
  group: one(drawGroups, {
    fields: [participants.groupId],
    references: [drawGroups.id],
  }),
}));

export const drawGroupsRelations = relations(drawGroups, ({ one, many }) => ({
  draw: one(draws, { fields: [drawGroups.drawId], references: [draws.id] }),
  members: many(participants),
}));

export const groupExclusionsRelations = relations(groupExclusions, ({ one }) => ({
  draw: one(draws, { fields: [groupExclusions.drawId], references: [draws.id] }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  draw: one(draws, { fields: [assignments.drawId], references: [draws.id] }),
  giver: one(participants, {
    fields: [assignments.giverId],
    references: [participants.id],
  }),
  receiver: one(participants, {
    fields: [assignments.receiverId],
    references: [participants.id],
  }),
}));
