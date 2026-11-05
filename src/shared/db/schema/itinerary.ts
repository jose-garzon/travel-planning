// Itinerary tables (feature itinerary plan "Data model").
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { trip } from "./trips";

export const activity = sqliteTable(
  "activity",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    title: text("title").notNull(),
    startTime: text("start_time"),
    durationMinutes: integer("duration_minutes"),
    /** Minor units (cents) in `currency`; null when free or unknown. */
    costPerPerson: integer("cost_per_person"),
    currency: text("currency"),
    /** Units of trip currency per one unit of `currency`, stored at entry. */
    rate: text("rate"),
    link: text("link"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("activity_trip_date_idx").on(table.tripId, table.date)],
);

export const activityParticipant = sqliteTable(
  "activity_participant",
  {
    activityId: text("activity_id")
      .notNull()
      .references(() => activity.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.userId] })],
);
