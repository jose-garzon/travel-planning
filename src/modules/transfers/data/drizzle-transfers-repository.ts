import "server-only";
import { and, eq, inArray } from "drizzle-orm";
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

  async find(tripId: string, transferId: string): Promise<Transfer | null> {
    const [row] = await db
      .select()
      .from(transfer)
      .where(and(eq(transfer.tripId, tripId), eq(transfer.id, transferId)));
    if (row === undefined) {
      return null;
    }
    const participants = await db
      .select()
      .from(transferParticipant)
      .where(eq(transferParticipant.transferId, transferId));
    return toTransfer(
      row,
      participants.map((p) => p.userId),
    );
  }

  async update(record: Transfer, expectedVersion: number): Promise<Transfer | null> {
    const { id, tripId, from, to, createdAt, createdBy, participantIds, ...rest } = record;
    const changed = await db
      .update(transfer)
      .set({ ...rest, fromName: from, toName: to })
      .where(
        and(
          eq(transfer.id, id),
          eq(transfer.tripId, tripId),
          eq(transfer.version, expectedVersion),
        ),
      )
      .returning({ id: transfer.id });
    return changed.length === 0 ? null : record;
  }

  async addParticipant(transferId: string, userId: string): Promise<void> {
    await db.insert(transferParticipant).values({ transferId, userId }).onConflictDoNothing();
  }

  async removeParticipant(transferId: string, userId: string): Promise<void> {
    await db
      .delete(transferParticipant)
      .where(
        and(eq(transferParticipant.transferId, transferId), eq(transferParticipant.userId, userId)),
      );
  }

  async delete(tripId: string, transferId: string): Promise<boolean> {
    const removed = await db
      .delete(transfer)
      .where(and(eq(transfer.tripId, tripId), eq(transfer.id, transferId)))
      .returning({ id: transfer.id });
    return removed.length > 0;
  }
}
