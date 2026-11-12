// Window events between modules that cannot import each other (feature 015
// D-6): the transfer gap opens the sheet and the assistant; the agent opens
// the sheet back. Payload types are structural for that reason.

/** Editable fields of a transfer; `id` and `version` mean "edit this one". */
export type TransferPrefill = Partial<{
  id: string;
  version: number;
  mode: string;
  from: string;
  to: string;
  departDate: string;
  departTime: string | null;
  departTz: string | null;
  arriveDate: string | null;
  arriveTime: string | null;
  arriveTz: string | null;
  /** Major units (180.5), as the form shows it. */
  cost: number | null;
  currency: string | null;
  /** Trip-currency units per unit of `currency`, as stored. */
  rate: string | null;
  charge: string;
  bookingRef: string | null;
  link: string | null;
  notes: string | null;
}>;

export type OpenTransferSheet = {
  gap: number;
  prefill?: TransferPrefill;
  /** Edit is the default; delete opens the sheet at its confirmation. */
  action?: "edit" | "delete";
};

export type AskAssistantForGap = {
  gap: number;
  from: string | null;
  to: string | null;
  date: string | null;
};

const OPEN_SHEET = "transfer:open-sheet";
const ASK_ASSISTANT = "transfer:ask-assistant";

function emit<T>(name: string, detail: T) {
  window.dispatchEvent(new CustomEvent<T>(name, { detail }));
}

function subscribe<T>(name: string, listener: (detail: T) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<T>).detail);
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}

export function openTransferSheet(detail: OpenTransferSheet): void {
  emit(OPEN_SHEET, detail);
}

export function onOpenTransferSheet(listener: (detail: OpenTransferSheet) => void): () => void {
  return subscribe(OPEN_SHEET, listener);
}

export function askAssistantForGap(detail: AskAssistantForGap): void {
  emit(ASK_ASSISTANT, detail);
}

export function onAskAssistantForGap(listener: (detail: AskAssistantForGap) => void): () => void {
  return subscribe(ASK_ASSISTANT, listener);
}
