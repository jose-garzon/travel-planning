import "server-only";
import { sql } from "drizzle-orm";
import type { UsageRepository } from "@/modules/agent/service/ports";
import { db } from "@/shared/db/client";

export class DrizzleUsageRepository implements UsageRepository {
  /** One statement: upsert +1, returning the new count. */
  async take(userId: string, day: string): Promise<number> {
    const result = await db.run(sql`
      INSERT INTO agent_usage (user_id, day, count) VALUES (${userId}, ${day}, 1)
      ON CONFLICT (user_id, day) DO UPDATE SET count = count + 1
      RETURNING count
    `);
    const count = Number(result.rows[0]?.count ?? 1);
    return count - 1;
  }
}
