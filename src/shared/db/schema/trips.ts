// Trip tables (feature 005 plan "Data model"). A city id of null means
// free text (feature 4a); `code` is then the first 3 letters.
import { index, integer, primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const trip = sqliteTable("trip", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const tripMember = sqliteTable(
  "trip_member",
  {
    tripId: text("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "editor"] }).notNull(),
    // Set on join; the migration backfills it from `trip.created_at`.
    joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tripId, table.userId] }),
    index("trip_member_user_idx").on(table.userId),
  ],
);

/** The one active invite link of a trip (feature 009 plan "Data model"). */
export const tripInvite = sqliteTable("trip_invite", {
  tripId: text("trip_id")
    .primaryKey()
    .references(() => trip.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});

export const tripLeg = sqliteTable(
  "trip_leg",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    fromCityId: text("from_city_id"),
    fromCode: text("from_code").notNull(),
    fromName: text("from_name").notNull(),
    toCityId: text("to_city_id"),
    toCode: text("to_code").notNull(),
    toName: text("to_name").notNull(),
    date: text("date"),
  },
  (table) => [unique("trip_leg_trip_position_unique").on(table.tripId, table.position)],
);
