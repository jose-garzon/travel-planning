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
    // `owner` only for now; `editor`/`viewer` arrive in #6.
    role: text("role", { enum: ["owner"] }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tripId, table.userId] }),
    index("trip_member_user_idx").on(table.userId),
  ],
);

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
