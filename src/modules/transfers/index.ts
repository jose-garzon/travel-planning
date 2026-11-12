import "server-only";
import { randomUUID } from "node:crypto";
import { DrizzleTransfersRepository } from "@/modules/transfers/data/drizzle-transfers-repository";
import { createTransfer } from "@/modules/transfers/service/create-transfer";
import { deleteTransfer } from "@/modules/transfers/service/delete-transfer";
import { listTransfers } from "@/modules/transfers/service/list-transfers";
import type { TripContextReader } from "@/modules/transfers/service/ports";
import { transferCosts } from "@/modules/transfers/service/transfer-costs";
import { updateTransfer } from "@/modules/transfers/service/update-transfer";

export type { TransfersMessages } from "@/modules/transfers/messages/load";
export { loadTransfersMessages } from "@/modules/transfers/messages/load";
export type { TripContext, TripContextReader } from "@/modules/transfers/service/ports";
export type {
  TransferDto,
  TransferError,
  TransferInput,
  TransfersDto,
  TransferUpdate,
} from "@/modules/transfers/service/schemas";
export { transferInputSchema, transferUpdateSchema } from "@/modules/transfers/service/schemas";

type Args<F> = F extends (first: infer A, ...rest: never[]) => unknown ? A : never;

/** The transfers API with the trips port injected by the app layer. */
export function createTransfersApi({ trips }: { trips: TripContextReader }) {
  const deps = {
    transfers: new DrizzleTransfersRepository(),
    trips,
    ids: { next: () => randomUUID() },
    clock: { now: () => Date.now() },
  };
  return {
    listTransfers: (query: Args<typeof listTransfers>) => listTransfers(query, deps),
    transferCosts: (tripId: string) => transferCosts({ tripId }, deps),
    createTransfer: (command: Args<typeof createTransfer>) => createTransfer(command, deps),
    updateTransfer: (command: Args<typeof updateTransfer>) => updateTransfer(command, deps),
    deleteTransfer: (command: Args<typeof deleteTransfer>) => deleteTransfer(command, deps),
  };
}
