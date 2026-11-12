// Transfer tables (feature 015 plan "Data model"). Times are local wall-clock
// in their IANA zone; instants are derived in the domain.
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { trip } from "./trips";

export const transfer = sqliteTable(
  "transfer",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    /** Index of the route gap the transfer sits in. */
    gap: integer("gap").notNull(),
    mode: text("mode", { enum: ["flight", "train", "bus", "ferry", "car", "other"] }).notNull(),
    /** Names as entered: a snapshot, to flag "Route changed". */
    fromName: text("from_name").notNull(),
    toName: text("to_name").notNull(),
    departDate: text("depart_date").notNull(),
    departTime: text("depart_time"),
    departTz: text("depart_tz"),
    arriveDate: text("arrive_date"),
    arriveTime: text("arrive_time"),
    arriveTz: text("arrive_tz"),
    /** Minor units (cents) in `currency`, per traveler; null when unknown. */
    cost: integer("cost"),
    currency: text("currency"),
    /** Units of trip currency per one unit of `currency`, stored at entry. */
    rate: text("rate"),
    charge: text("charge", { enum: ["all", "opt-in"] }).notNull(),
    bookingRef: text("booking_ref"),
    link: text("link"),
    notes: text("notes"),
    needsReview: integer("needs_review", { mode: "boolean" }).notNull().default(false),
    version: integer("version").notNull().default(1),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("transfer_trip_idx").on(table.tripId)],
);

export const transferParticipant = sqliteTable(
  "transfer_participant",
  {
    transferId: text("transfer_id")
      .notNull()
      .references(() => transfer.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.transferId, table.userId] })],
);
