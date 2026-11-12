import "server-only";
import { eq, inArray } from "drizzle-orm";
import type { Transfer } from "@/modules/transfers/domain/transfer";
import type { NewTransfer, TransfersRepository } from "@/modules/transfers/service/ports";
import { db } from "@/shared/db/client";
import { transfer, transferParticipant } from "@/shared/db/schema/transfers";

type Row = typeof transfer.$inferSelect;

function toTransfer(row: Row, participantIds: string[]): Transfer {
  return {
    id: row.id,
    tripId: row.tripId,
    gap: row.gap,
    mode: row.mode,
    from: row.fromName,
    to: row.toName,
    departDate: row.departDate,
    departTime: row.departTime,
    departTz: row.departTz,
    arriveDate: row.arriveDate,
    arriveTime: row.arriveTime,
    arriveTz: row.arriveTz,
    cost: row.cost,
    currency: row.currency,
    rate: row.rate,
    charge: row.charge,
    bookingRef: row.bookingRef,
    link: row.link,
    notes: row.notes,
    needsReview: row.needsReview,
    version: row.version,
    createdBy: row.createdBy,
    createdAt: row.createdAt.getTime(),
    participantIds,
  };
}

/** `TransfersRepository` over `transfer` + `transfer_participant`. Two queries per list. */
export class DrizzleTransfersRepository implements TransfersRepository {
  async listForTrip(tripId: string): Promise<Transfer[]> {
    const rows = await db.select().from(transfer).where(eq(transfer.tripId, tripId));
    if (rows.length === 0) {
      return [];
    }
    const participants = await db
      .select()
      .from(transferParticipant)
      .where(
        inArray(
          transferParticipant.transferId,
          rows.map((row) => row.id),
        ),
      );
    return rows.map((row) =>
      toTransfer(
        row,
        participants.filter((p) => p.transferId === row.id).map((p) => p.userId),
      ),
    );
  }

  async create(record: NewTransfer): Promise<Transfer> {
    const { from, to, createdAt, ...rest } = record;
    await db.insert(transfer).values({
      ...rest,
      fromName: from,
      toName: to,
      createdAt: new Date(createdAt),
    });
    return { ...record, participantIds: [] };
  }
}
