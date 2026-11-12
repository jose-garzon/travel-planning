import type { Route } from "@/modules/transfers/domain/gaps";
import type { Transfer } from "@/modules/transfers/domain/transfer";

/** What transfers needs to know about a trip; wired from the trips module by the app layer. */
export type TripContext = {
  currency: string;
  memberIds: string[];
  route: Route;
};

export type TripContextReader = {
  /** Null when the trip is missing or `userId` is not a member. */
  get(tripId: string, userId: string, locale: "en" | "es"): Promise<TripContext | null>;
};

export type NewTransfer = Omit<Transfer, "participantIds">;

export type TransfersRepository = {
  /** Every transfer of a trip with its participants, in two queries. */
  listForTrip(tripId: string): Promise<Transfer[]>;
  create(transfer: NewTransfer): Promise<Transfer>;
  find(tripId: string, transferId: string): Promise<Transfer | null>;
  /** Writes `transfer` only if the stored version is still `expectedVersion`; null when it is not. */
  update(transfer: Transfer, expectedVersion: number): Promise<Transfer | null>;
  /** False when the trip has no such transfer. */
  delete(tripId: string, transferId: string): Promise<boolean>;
};

export type IdGenerator = { next(): string };
export type Clock = { now(): number };
