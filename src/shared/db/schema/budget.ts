// Budget tables (feature budget plan "Data model").
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { trip } from "./trips";

export const budgetItem = sqliteTable(
  "budget_item",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    category: text("category", {
      enum: ["flights", "lodging", "transport", "food", "other"],
    }).notNull(),
    label: text("label").notNull(),
    /** Minor units in `currency`. */
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    /** Units of trip currency per one unit of `currency`, stored at entry. */
    rate: text("rate").notNull(),
    /** Set for a per-person item (a flight): it counts for this member only. */
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    link: text("link"),
    /** Leg position of the stop it belongs to; null is the whole trip. */
    stop: integer("stop"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("budget_item_trip_idx").on(table.tripId)],
);

/** Optional cap per trip, in trip currency minor units. */
export const tripBudget = sqliteTable("trip_budget", {
  tripId: text("trip_id")
    .primaryKey()
    .references(() => trip.id, { onDelete: "cascade" }),
  cap: integer("cap"),
});
