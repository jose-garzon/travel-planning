"use client";

import { ArrowUp, RotateCcw, Square, Undo2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { ChatMessage, Suggestion } from "@/modules/agent/domain/suggestion";
import { AgentReply } from "@/modules/agent/ui/components/agent-reply";
import { flyToStation } from "@/modules/agent/ui/components/fly-to-station";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { SectionHeader } from "@/shared/ui/components/section-header";
import { cx } from "@/shared/ui/cx";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";
import { formatMoney } from "@/shared/ui/money";

/** One city of the route with the days spent there, used to seed prompts. */
export type AgentStop = { city: string; from: string | null; to: string | null };

export type AgentPanelProps = {
  tripId: string;
  viewerId: string;
  tripCurrency: string;
  /** Origin city, then each destination in route order. */
  origin: string | null;
  stops: AgentStop[];
};

type SuggestionState = "pending" | "saving" | "approved" | "dismissed" | "failed";

/** A chat turn plus the suggestions that came with it (assistant only). */
type Turn = ChatMessage & { suggestions?: Suggestion[] };

/** Approves a suggestion through the public itinerary or budget API. */
function approvalRequest(
  suggestion: Suggestion,
  tripId: string,
  viewerId: string,
  tripCurrency: string,
) {
  if (suggestion.kind === "activity") {
    return {
      url: `/api/v1/trips/${tripId}/activities`,
      body: {
        title: suggestion.title,
        date: suggestion.date,
        startTime: suggestion.startTime,
        durationMinutes: suggestion.durationMinutes,
        costPerPerson: suggestion.costPerPerson,
        currency: suggestion.costPerPerson === null ? null : (suggestion.currency ?? tripCurrency),
        rate: null,
        link: suggestion.sourceUrl,
      },
    };
  }
  return {
    url: `/api/v1/trips/${tripId}/budget/items`,
    body: {
      category: suggestion.category,
      label: suggestion.label,
      amount: suggestion.amount,
      currency: suggestion.currency,
      rate: null,
      userId: suggestion.perPerson ? viewerId : null,
      link: suggestion.sourceUrl,
      stop: suggestion.stop ?? null,
    },
  };
}

/** Where this trip's chat is kept between reloads (this tab only). */
function storageKey(tripId: string): string {
  return `agent-chat:${tripId}`;
}

/** Where an added suggestion was created, so it can be taken back. */
type Created = Record<string, string>;

type StoredChat = {
  turns: Turn[];
  states: Record<string, SuggestionState>;
  created?: Created;
};

/** A reply as screen readers should hear it: no Markdown marks or URLs. */
function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function loadChat(tripId: string): StoredChat | null {
  try {
    const raw = sessionStorage.getItem(storageKey(tripId));
    return raw === null ? null : (JSON.parse(raw) as StoredChat);
  } catch {
    return null;
  }
}

function saveChat(tripId: string, chat: StoredChat): void {
  try {
    if (chat.turns.length === 0) {
      sessionStorage.removeItem(storageKey(tripId));
    } else {
      sessionStorage.setItem(storageKey(tripId), JSON.stringify(chat));
    }
  } catch {
    // Storage blocked (private mode): the chat lives in memory only.
  }
}

/** A saving request does not survive a reload: show it as not added yet. */
function settled(states: Record<string, SuggestionState>): Record<string, SuggestionState> {
  return Object.fromEntries(
    Object.entries(states).map(([id, state]) => [id, state === "saving" ? "pending" : state]),
  );
}

/** First and last day of the route, to keep edited dates inside the trip. */
function tripRange(stops: AgentStop[]): { min?: string; max?: string } {
  const days = stops.flatMap((stop) => [stop.from, stop.to]).filter((day) => day !== null);
  days.sort();
  return { min: days[0], max: days.at(-1) };
}

const LIMIT_KEY = "agent-limit";

/** The daily limit counts UTC days (the API's "today"): next UTC midnight. */
function nextReset(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function isLimitedToday(): boolean {
  try {
    return localStorage.getItem(LIMIT_KEY) === utcDay();
  } catch {
    return false;
  }
}

function rememberLimit(): void {
  try {
    localStorage.setItem(LIMIT_KEY, utcDay());
  } catch {
    // Storage blocked: the limit shows again on the next 429.
  }
}

/** After this long, "Searching…" says it is still at it. */
const SLOW_MS = 10_000;

/** Message the API sent with a failed response, if any. */
async function errorMessage(response: Response | null): Promise<string | undefined> {
  const payload = (await response?.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return payload?.error?.message;
}

/** City a budget suggestion belongs to; undefined for the whole trip. */
function stopName(stop: number | null, stops: AgentStop[]): string | undefined {
  return stop === null ? undefined : stops[stop]?.city;
}

function nightsBetween(from: string, to: string): number {
  return Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000));
}

/**
 * Private chat with the trip assistant. History is kept in this tab's
 * session storage, per trip; approved suggestions become activities or
 * costs everyone can see.
 */
export function AgentPanel({ tripId, viewerId, tripCurrency, origin, stops }: AgentPanelProps) {
  const t = useTranslations("agent.chat");
  const locale = useLocale();
  const router = useRouter();
  const isOnline = useIsOnline();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [states, setStates] = useState<Record<string, SuggestionState>>({});
  const [draft, setDraft] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The question that failed, for "Try again". */
  const [failedPrompt, setFailedPrompt] = useState<string | null>(null);
  /** Read out by screen readers: the latest reply only. */
  const [announcement, setAnnouncement] = useState("");
  const [isRestored, setIsRestored] = useState(false);
  /** Turns that came back from session storage (prices may be stale). */
  const [restoredCount, setRestoredCount] = useState(0);
  /** Member corrections, applied when a card (or "Add all") is added. */
  const [edits, setEdits] = useState<Record<string, Suggestion>>({});
  /** Cards with the edit fields open; "Add all" leaves those alone. */
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [isSlow, setIsSlow] = useState(false);
  /** The daily limit is spent: retrying cannot help until tomorrow. */
  const [isLimited, setIsLimited] = useState(false);
  /** Add errors per card, so "Add all" can report them on each card. */
  const [failures, setFailures] = useState<Record<string, string>>({});
  /** The card just dismissed: only its Undo takes focus (never on restore). */
  const [justDismissed, setJustDismissed] = useState<string | null>(null);
  /** Added suggestion id → its resource URL (for Undo). */
  const [created, setCreated] = useState<Created>({});
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Restore after mount (storage is client-only), then keep it in sync.
  useEffect(() => {
    const stored = loadChat(tripId);
    if (stored !== null) {
      setTurns(stored.turns);
      setStates(settled(stored.states));
      setRestoredCount(stored.turns.length);
      setCreated(stored.created ?? {});
    }
    setIsLimited(isLimitedToday());
    setIsRestored(true);
  }, [tripId]);

  useEffect(() => {
    if (isRestored) {
      saveChat(tripId, { turns, states, created });
    }
  }, [tripId, turns, states, created, isRestored]);

  // A new reply opens at its start (read before adding); the member's own
  // question and the thinking car sit at the bottom.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on new turns only.
  useEffect(() => {
    const box = scrollRef.current;
    if (box === null) {
      return;
    }
    const last = turns.at(-1);
    const reply = box.querySelector<HTMLElement>(`[data-turn="${turns.length - 1}"]`);
    if (!isAsking && last?.role === "assistant" && reply !== null) {
      box.scrollTo({ top: reply.offsetTop - box.offsetTop, behavior: "smooth" });
      return;
    }
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [turns.length, isAsking, isSlow]);

  const dayFormat = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const formatDay = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00Z`));

  useEffect(() => {
    if (!isAsking) {
      setIsSlow(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsSlow(true);
      setAnnouncement(t("thinkingSlow"));
    }, SLOW_MS);
    return () => clearTimeout(timer);
  }, [isAsking, t]);

  const starters = buildStarters();
  const range = tripRange(stops);

  function buildStarters(): string[] {
    const first = stops[0];
    const prompts: string[] = [];
    if (first?.from) {
      prompts.push(t("starterActivities", { city: first.city, date: formatDay(first.from) }));
    }
    if (origin !== null && first?.from) {
      prompts.push(
        t("starterFlights", { from: origin, to: first.city, date: formatDay(first.from) }),
      );
    }
    const stay = stops.find((stop) => stop.from !== null && stop.to !== null);
    if (stay?.from && stay.to) {
      prompts.push(
        t("starterLodging", { city: stay.city, nights: nightsBetween(stay.from, stay.to) }),
      );
    }
    if (first !== undefined) {
      prompts.push(t("starterFood", { city: first.city }));
    }
    return prompts.length === 0 ? [t("starterGeneric")] : prompts.slice(0, 4);
  }

  async function ask(raw: string) {
    const content = raw.trim();
    if (content === "" || isAsking) {
      return;
    }
    const before = turns;
    const next: Turn[] = [...before, { role: "user", content }];
    setTurns(next);
    setDraft("");
    setIsAsking(true);
    setError(null);
    setFailedPrompt(null);
    setAnnouncement(t("thinking"));
    const controller = new AbortController();
    abortRef.current = controller;
    const history: ChatMessage[] = next.map(({ role, content: text }) => ({ role, content: text }));
    const response = await fetch(`/api/v1/trips/${tripId}/agent`, {
      method: "POST",
      headers: { "content-type": "application/json", "accept-language": locale },
      body: JSON.stringify({ messages: history }),
      signal: controller.signal,
    }).catch(() => null);
    abortRef.current = null;
    setIsAsking(false);
    if (controller.signal.aborted) {
      // Stopped by the member: hand the question back, no error.
      setTurns(before);
      setDraft(content);
      setAnnouncement(t("stopped"));
      composerRef.current?.focus();
      return;
    }
    const payload = (await response?.json().catch(() => null)) as
      | { reply: string; suggestions: Suggestion[] }
      | { error?: { message?: string } }
      | null;
    if (response?.ok && payload !== null && "reply" in payload) {
      setTurns([
        ...next,
        { role: "assistant", content: payload.reply, suggestions: payload.suggestions },
      ]);
      setAnnouncement(
        [
          plainText(payload.reply),
          t("suggestionCount", { count: payload.suggestions.length }),
        ].join(" "),
      );
      return;
    }
    // Nothing was answered: take the question back so it can be sent again.
    setTurns(before);
    setDraft(content);
    setAnnouncement("");
    if (response?.status === 429) {
      setIsLimited(true);
      rememberLimit();
      return;
    }
    setFailedPrompt(content);
    setError(
      (payload !== null && "error" in payload ? payload.error?.message : undefined) ?? t("failed"),
    );
  }

  // Enter sends, Shift+Enter breaks the line (not while composing IME text).
  function sendOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void ask(draft);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  function newChat() {
    setTurns([]);
    setStates({});
    setEdits({});
    setEditing({});
    setFailures({});
    setCreated({});
    setRestoredCount(0);
    setError(null);
    setFailedPrompt(null);
    setAnnouncement("");
    composerRef.current?.focus();
  }

  /** Approves the suggestion as shown on its card (edits included). */
  async function approve(suggestion: Suggestion, announce = true): Promise<string | null> {
    setStates((current) => ({ ...current, [suggestion.id]: "saving" }));
    setFailures(({ [suggestion.id]: _, ...rest }) => rest);
    const { url, body } = approvalRequest(suggestion, tripId, viewerId, tripCurrency);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "accept-language": locale },
      body: JSON.stringify(body),
    }).catch(() => null);
    setStates((current) => ({ ...current, [suggestion.id]: response?.ok ? "approved" : "failed" }));
    if (!response?.ok) {
      // The card shows why and opens its fields to fix it.
      const message = (await errorMessage(response)) ?? t("approveFailed");
      setFailures((current) => ({ ...current, [suggestion.id]: message }));
      setEditing((current) => ({ ...current, [suggestion.id]: true }));
      return message;
    }
    const saved = (await response.json().catch(() => null)) as { id?: string } | null;
    if (saved?.id !== undefined) {
      const resource = `${url}/${saved.id}`;
      setCreated((current) => ({ ...current, [suggestion.id]: resource }));
    }
    if (announce) {
      setAnnouncement(t("approved"));
    }
    const card = document.querySelector<HTMLElement>(`[data-suggestion="${suggestion.id}"]`);
    if (card !== null) {
      flyToStation(card, suggestion.kind === "activity" ? "itinerary-heading" : "budget-heading");
    }
    router.refresh();
    return null;
  }

  /** Adds every untouched suggestion of a reply, then says how it went. */
  async function addAll(suggestions: Suggestion[]): Promise<string[]> {
    const added: string[] = [];
    for (const suggestion of suggestions) {
      if ((await approve(edits[suggestion.id] ?? suggestion, false)) === null) {
        added.push(suggestion.id);
      }
    }
    setAnnouncement(
      t("addAllResult", { added: added.length, failed: suggestions.length - added.length }),
    );
    return added;
  }

  /** Takes an added suggestion back out of the trip (this tab only knows it). */
  async function unapprove(id: string): Promise<boolean> {
    const resource = created[id];
    if (resource === undefined) {
      return false;
    }
    const response = await fetch(resource, {
      method: "DELETE",
      headers: { "accept-language": locale },
    }).catch(() => null);
    if (!response?.ok) {
      setAnnouncement(t("undoFailed"));
      return false;
    }
    setStates((current) => ({ ...current, [id]: "pending" }));
    setCreated(({ [id]: _, ...rest }) => rest);
    router.refresh();
    return true;
  }

  async function undoAll(ids: string[]) {
    let undone = 0;
    for (const id of ids) {
      if (await unapprove(id)) {
        undone += 1;
      }
    }
    setAnnouncement(t("undoneCount", { count: undone }));
  }

  function dismiss(id: string, isDismissed: boolean) {
    setStates((current) => ({ ...current, [id]: isDismissed ? "dismissed" : "pending" }));
    setJustDismissed(isDismissed ? id : null);
  }

  /** Closes a card's fields; cancelling also drops the member's changes. */
  function closeEdit(id: string, keep: boolean) {
    setEditing((current) => ({ ...current, [id]: false }));
    if (!keep) {
      setEdits(({ [id]: _, ...rest }) => rest);
    }
  }

  const isEmpty = turns.length === 0;
  const hasNote = !isOnline || isEmpty;

  return (
    <section
      id="assistant"
      aria-labelledby="agent-heading"
      className="flex min-h-0 scroll-mt-6 flex-col gap-4 rounded-md flex-1 bg-surface-1 p-5 max-lg:border-0 lg:border lg:border-border lg:shadow-md"
    >
      {/* On phones the drawer's Close sits top-right: keep the header clear. */}
      <div className="max-lg:pe-12">
        <SectionHeader
          id="agent-heading"
          title={t("heading")}
          tone="line"
          rule={false}
          action={
            isEmpty ? null : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={RotateCcw}
                labelHidden
                onClick={newChat}
              >
                {t("newChat")}
              </Button>
            )
          }
        />
      </div>
      {isEmpty ? <p className="text-sm text-text-muted">{t("intro")}</p> : null}
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto"
      >
        {isEmpty ? (
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm">{t("startersLabel")}</p>
            <ul className="flex flex-col gap-2">
              {starters.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    disabled={!isOnline || isAsking || isLimited}
                    onClick={() => void ask(prompt)}
                    className="min-h-touch w-full cursor-pointer rounded-md border-2 border-border bg-bg px-4 py-2 text-left transition duration-fast ease-out ui-focus:outline-2 ui-focus:outline-focus ui-focus:outline-offset-2 ui-focus:outline-solid ui-hover:not-disabled:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ol className="flex flex-col gap-4">
          {turns.map((turn, index) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: turns are append-only.
              key={index}
              data-turn={index}
              data-role={turn.role}
              className="agent-stop flex flex-col gap-3"
            >
              {restoredCount > 0 && index === 0 ? (
                <p className="text-sm text-text-muted">{t("restored")}</p>
              ) : null}
              {restoredCount > 0 && index === restoredCount ? (
                <hr className="border-border" />
              ) : null}
              <span className="sr-only">{turn.role === "user" ? t("you") : t("assistant")}: </span>
              {turn.role === "user" ? (
                <p className="ms-8 self-end rounded-md bg-surface-2 px-4 py-2 font-semibold wrap-anywhere">
                  {turn.content}
                </p>
              ) : (
                <div className="motion-safe:animate-fade-in">
                  <AgentReply content={turn.content} />
                </div>
              )}
              {turn.suggestions === undefined || turn.suggestions.length === 0 ? null : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-text-muted">{t("estimate")}</p>
                    <AddAll
                      pending={turn.suggestions.filter(
                        (suggestion) =>
                          (states[suggestion.id] ?? "pending") === "pending" &&
                          editing[suggestion.id] !== true,
                      )}
                      editingCount={
                        turn.suggestions.filter(
                          (suggestion) =>
                            editing[suggestion.id] === true && states[suggestion.id] !== "approved",
                        ).length
                      }
                      added={turn.suggestions
                        .map((suggestion) => suggestion.id)
                        .filter((id) => states[id] === "approved" && created[id] !== undefined)}
                      isOnline={isOnline}
                      onAddAll={addAll}
                      onUndoAll={undoAll}
                    />
                  </div>
                  <ul className="flex flex-col gap-3" aria-label={t("suggestions")}>
                    {turn.suggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        isLead={
                          suggestion.id ===
                          turn.suggestions?.find(
                            (other) =>
                              !["dismissed", "approved"].includes(states[other.id] ?? "pending"),
                          )?.id
                        }
                        failure={failures[suggestion.id] ?? null}
                        focusUndo={justDismissed === suggestion.id}
                        onCloseEdit={(keep) => closeEdit(suggestion.id, keep)}
                        onUndoAdd={
                          created[suggestion.id] === undefined
                            ? undefined
                            : () => void unapprove(suggestion.id)
                        }
                        suggestion={edits[suggestion.id] ?? suggestion}
                        state={states[suggestion.id] ?? "pending"}
                        range={range}
                        isEditing={editing[suggestion.id] === true}
                        onEditing={(open) =>
                          setEditing((current) => ({ ...current, [suggestion.id]: open }))
                        }
                        onEdit={(next) =>
                          setEdits((current) => ({ ...current, [suggestion.id]: next }))
                        }
                        tripCurrency={tripCurrency}
                        stops={stops}
                        isOnline={isOnline}
                        formatDay={formatDay}
                        onApprove={approve}
                        onDismiss={(isDismissed) => dismiss(suggestion.id, isDismissed)}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
          {isAsking ? (
            <li
              data-role="pending"
              className="agent-stop flex min-h-8 flex-wrap items-center gap-3 text-text-muted"
            >
              <span aria-hidden="true" className="agent-ride" />
              {isSlow ? t("thinkingSlow") : t("thinking")}
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Square}
                onClick={() => abortRef.current?.abort()}
              >
                {t("stop")}
              </Button>
            </li>
          ) : null}
        </ol>
      </div>

      {isLimited ? <LimitNotice /> : null}
      <AskError
        error={error}
        canRetry={failedPrompt !== null && isOnline && !isAsking}
        onRetry={() => {
          if (failedPrompt !== null) {
            void ask(failedPrompt);
          }
        }}
      />
      <form onSubmit={submit} className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor="agent-message" className="font-semibold">
            {t("label")}
          </label>
          <textarea
            ref={composerRef}
            id="agent-message"
            name="message"
            rows={2}
            placeholder={
              stops[0] === undefined
                ? t("placeholderGeneric")
                : t("placeholder", { city: stops[0].city })
            }
            value={draft}
            maxLength={4000}
            disabled={!isOnline || isLimited}
            aria-describedby={hasNote ? "agent-note" : undefined}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={sendOnEnter}
            className="field-sizing-content max-h-composer min-h-touch overflow-y-auto scrollbar-none w-full resize-none rounded-md border border-border-strong bg-surface-1 px-4 py-3 text-md text-text leading-normal placeholder:text-text-muted transition duration-fast ease-out ui-hover:not-disabled:border-accent ui-focus:outline-2 ui-focus:outline-solid ui-focus:outline-focus ui-focus:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <ComposerNote isOnline={isOnline} isEmpty={isEmpty} />
        </div>
        <Button
          type="submit"
          icon={ArrowUp}
          labelHidden
          isLoading={isAsking}
          disabled={!isOnline || isLimited || draft.trim() === ""}
        >
          {t("send")}
        </Button>
      </form>
    </section>
  );
}

/** An approved card takes the line colour: it now belongs to the route. */
function cardBorder(state: SuggestionState): string {
  return state === "approved" ? "border-line" : "border-text";
}

/** Major units from a form field; null when blank or not a number. */
function parseAmount(raw: string): number | null {
  const value = Number(raw.replace(",", "."));
  return raw.trim() === "" || !Number.isFinite(value) || value < 0 ? null : value;
}

/**
 * "Add all" for a reply with two or more suggestions still to decide; once
 * a batch went in, "Undo" takes the whole batch back out.
 */
function AddAll({
  pending,
  editingCount,
  added,
  isOnline,
  onAddAll,
  onUndoAll,
}: {
  pending: Suggestion[];
  editingCount: number;
  added: string[];
  isOnline: boolean;
  onAddAll: (suggestions: Suggestion[]) => Promise<string[]>;
  onUndoAll: (ids: string[]) => Promise<void>;
}) {
  const t = useTranslations("agent.chat");
  const [isBusy, setIsBusy] = useState(false);
  const [batch, setBatch] = useState<string[]>([]);
  const live = batch.filter((id) => added.includes(id));
  if (live.length > 0) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        icon={Undo2}
        disabled={!isOnline}
        isLoading={isBusy}
        onClick={async () => {
          setIsBusy(true);
          await onUndoAll(live);
          setBatch([]);
          setIsBusy(false);
        }}
      >
        {t("undoAll", { count: live.length })}
      </Button>
    );
  }
  if (pending.length < 2 && !isBusy) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {editingCount === 0 ? null : (
        <span className="text-sm text-text-muted">{t("beingEdited", { count: editingCount })}</span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!isOnline}
        isLoading={isBusy}
        onClick={async () => {
          setIsBusy(true);
          setBatch(await onAddAll(pending));
          setIsBusy(false);
        }}
      >
        {t("addAll", { count: pending.length })}
      </Button>
    </div>
  );
}

type SuggestionCardProps = {
  suggestion: Suggestion;
  state: SuggestionState;
  tripCurrency: string;
  stops: AgentStop[];
  range: { min?: string; max?: string };
  isOnline: boolean;
  isEditing: boolean;
  formatDay: (iso: string) => string;
  onEditing: (open: boolean) => void;
  onEdit: (next: Suggestion) => void;
  /** Resolves to an error message, or null once added. */
  onApprove: (suggestion: Suggestion) => Promise<string | null>;
  onDismiss: (isDismissed: boolean) => void;
  /** The first open card of a reply carries the solid button. */
  isLead: boolean;
  failure: string | null;
  focusUndo: boolean;
  onCloseEdit: (keep: boolean) => void;
  /** Present while this tab knows where the added item lives. */
  onUndoAdd?: () => void;
};

/** A dismissed card shrinks to one line that can be undone. */
function DismissedRow({
  title,
  autoFocus,
  onUndo,
}: {
  title: string;
  autoFocus: boolean;
  onUndo: () => void;
}) {
  const t = useTranslations("agent.chat");
  const undoRef = useRef<HTMLButtonElement>(null);
  // Focus stays on the card's spot right after a dismiss, never on restore.
  useEffect(() => {
    if (autoFocus) {
      undoRef.current?.focus();
    }
  }, [autoFocus]);
  return (
    <li className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
      <span className="line-through">{title}</span>
      <span>{t("dismissed")}</span>
      <button
        ref={undoRef}
        type="button"
        onClick={onUndo}
        className="min-h-touch cursor-pointer font-semibold text-text underline underline-offset-2 ui-hover:text-accent ui-focus:outline-2 ui-focus:outline-focus ui-focus:outline-solid"
      >
        {t("undo")}
      </button>
    </li>
  );
}

/** Title, one-line detail, who pays (per-person costs) and the source. */
function CardSummary({
  suggestion,
  title,
  detail,
  isAdded,
}: {
  suggestion: Suggestion;
  title: string;
  detail: string;
  isAdded: boolean;
}) {
  const t = useTranslations("agent.chat");
  return (
    <div className="flex flex-col gap-1">
      <span className="font-semibold">{title}</span>
      <span className="text-sm">{detail}</span>
      {suggestion.kind === "budget" && suggestion.perPerson ? (
        <span className="text-sm text-text-muted">{isAdded ? t("forYouAdded") : t("forYou")}</span>
      ) : null}
      {suggestion.sourceUrl === null ? null : (
        <a
          href={suggestion.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-sm text-text-muted underline underline-offset-2 ui-hover:text-accent"
        >
          {t("source")}
        </a>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  state,
  tripCurrency,
  stops,
  range,
  isOnline,
  isEditing,
  formatDay,
  onEditing,
  onEdit,
  onApprove,
  onDismiss,
  isLead,
  failure,
  focusUndo,
  onCloseEdit,
  onUndoAdd,
}: SuggestionCardProps) {
  const t = useTranslations("agent.chat");
  const locale = useLocale();
  const cardRef = useRef<HTMLLIElement>(null);
  const [isValid, setIsValid] = useState(true);
  const title = suggestion.kind === "activity" ? suggestion.title : suggestion.label;

  if (state === "dismissed") {
    return (
      <DismissedRow
        title={title}
        autoFocus={focusUndo}
        onUndo={() => {
          onDismiss(false);
          // Back on Dismiss, not on Add: one stray Enter must not add it.
          requestAnimationFrame(() =>
            cardRef.current?.querySelector<HTMLElement>("[data-dismiss]")?.focus(),
          );
        }}
      />
    );
  }
  // Suggestions carry major units; formatMoney takes minor units.
  const money = (amount: number, currency: string) =>
    formatMoney(Math.round(amount * 100), currency, locale);
  const currency =
    suggestion.kind === "activity" ? (suggestion.currency ?? tripCurrency) : suggestion.currency;
  const detail = cardDetail(suggestion, currency, stops, formatDay, money, t);
  const isAdded = state === "approved";

  return (
    <li
      ref={cardRef}
      data-suggestion={suggestion.id}
      className={cx(
        "flex flex-col gap-3 rounded-md border-2 bg-bg p-4 transition-colors duration-normal",
        state === "failed" ? "border-error" : cardBorder(state),
      )}
    >
      <CardSummary suggestion={suggestion} title={title} detail={detail} isAdded={isAdded} />
      {isEditing && !isAdded ? (
        <SuggestionFields
          suggestion={suggestion}
          currency={currency}
          range={range}
          onChange={onEdit}
          onValidity={setIsValid}
        />
      ) : null}
      {isAdded ? (
        <AddedNote kind={suggestion.kind} onUndo={onUndoAdd} />
      ) : (
        <CardActions
          isLead={isLead}
          isEditing={isEditing}
          canAdd={isOnline && (!isEditing || isValid)}
          isValid={isValid}
          isSaving={state === "saving"}
          failure={failure}
          onAdd={() => void onApprove(suggestion)}
          onEdit={() => onEditing(true)}
          onCloseEdit={onCloseEdit}
          onDismiss={() => onDismiss(true)}
        />
      )}
    </li>
  );
}

/** Add, edit (Done / Cancel while open) and a quiet dismiss, on one row. */
function CardActions({
  isLead,
  isEditing,
  canAdd,
  isValid,
  isSaving,
  failure,
  onAdd,
  onEdit,
  onCloseEdit,
  onDismiss,
}: {
  isLead: boolean;
  isEditing: boolean;
  canAdd: boolean;
  isValid: boolean;
  isSaving: boolean;
  failure: string | null;
  onAdd: () => void;
  onEdit: () => void;
  onCloseEdit: (keep: boolean) => void;
  onDismiss: () => void;
}) {
  const t = useTranslations("agent.chat");
  const quiet =
    "min-h-touch cursor-pointer px-2 font-semibold text-sm text-text-muted underline-offset-2 ui-hover:text-text ui-hover:underline ui-focus:outline-2 ui-focus:outline-focus ui-focus:outline-solid";
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {/* The reason sits right under the fields it is about, above the buttons. */}
      {failure === null ? null : (
        <p role="alert" className="basis-full text-error text-sm">
          {failure}
        </p>
      )}
      <Button
        type="button"
        size="sm"
        variant={isLead ? "primary" : "outline"}
        disabled={!canAdd}
        isLoading={isSaving}
        onClick={onAdd}
      >
        {t("approve")}
      </Button>
      {isEditing ? (
        <>
          <button
            type="button"
            className={cx(quiet, "disabled:cursor-not-allowed disabled:opacity-50")}
            disabled={!isValid}
            onClick={() => onCloseEdit(true)}
          >
            {t("editDone")}
          </button>
          <button type="button" className={quiet} onClick={() => onCloseEdit(false)}>
            {t("editCancel")}
          </button>
        </>
      ) : (
        <button type="button" className={quiet} onClick={onEdit}>
          {t("edit")}
        </button>
      )}
      <button type="button" data-dismiss className={quiet} onClick={onDismiss}>
        {t("dismiss")}
      </button>
    </div>
  );
}

type ChatT = ReturnType<typeof useTranslations<"agent.chat">>;

/** The card's one-line summary: date and cost, or category, amount and city. */
function cardDetail(
  suggestion: Suggestion,
  currency: string,
  stops: AgentStop[],
  formatDay: (iso: string) => string,
  money: (amount: number, currency: string) => string,
  t: ChatT,
): string {
  return suggestion.kind === "activity"
    ? suggestion.costPerPerson === null
      ? t("activityDetailFree", { date: formatDay(suggestion.date) })
      : t("activityDetail", {
          date: formatDay(suggestion.date),
          cost: money(suggestion.costPerPerson, currency),
        })
    : [
        t("budgetDetail", {
          category: t(`categories.${suggestion.category}`),
          amount: money(suggestion.amount, suggestion.currency),
        }),
        stopName(suggestion.stop, stops) ?? t("wholeTrip"),
      ]
        // A label that already names the city ("Bogotá → Cartagena") needs no repeat.
        .filter((part, index) => index === 0 || !suggestion.label.includes(part))
        .join(" · ");
}

/** Fields a member can correct before adding: the date and the price. */
function SuggestionFields({
  suggestion,
  currency,
  range,
  onChange,
  onValidity,
}: {
  suggestion: Suggestion;
  currency: string;
  range: { min?: string; max?: string };
  onChange: (next: Suggestion) => void;
  onValidity: (isValid: boolean) => void;
}) {
  const t = useTranslations("agent.chat");
  const isActivity = suggestion.kind === "activity";
  const [date, setDate] = useState(isActivity ? suggestion.date : "");
  const [price, setPrice] = useState(
    String(isActivity ? (suggestion.costPerPerson ?? 0) : suggestion.amount),
  );
  const amount = parseAmount(price);
  const isDateValid =
    !isActivity ||
    (date !== "" &&
      (range.min === undefined || date >= range.min) &&
      (range.max === undefined || date <= range.max));
  const isPriceValid = amount !== null && (isActivity || amount > 0);

  // Only valid values reach the card, so its summary line never lies.
  useEffect(() => {
    onValidity(isDateValid && isPriceValid);
    if (!isDateValid || !isPriceValid || amount === null) {
      return;
    }
    if (suggestion.kind === "activity") {
      const cost = amount === 0 ? null : amount;
      if (suggestion.date !== date || suggestion.costPerPerson !== cost) {
        onChange({ ...suggestion, date, costPerPerson: cost });
      }
    } else if (suggestion.amount !== amount) {
      onChange({ ...suggestion, amount });
    }
  }, [date, amount, isDateValid, isPriceValid, suggestion, onChange, onValidity]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {isActivity ? (
        <Input
          label={t("editDate")}
          type="date"
          required
          min={range.min}
          max={range.max}
          value={date}
          error={isDateValid ? undefined : t("editDateError")}
          onChange={(event) => setDate(event.target.value)}
        />
      ) : null}
      <Input
        label={isActivity ? t("editCost", { currency }) : t("editAmount", { currency })}
        hint={isActivity ? t("editCostHint") : undefined}
        inputMode="decimal"
        required
        value={price}
        error={isPriceValid ? undefined : t("editAmountError")}
        onChange={(event) => setPrice(event.target.value)}
      />
    </div>
  );
}

/** An added card points to where it now lives on the page. */
function AddedNote({ kind, onUndo }: { kind: Suggestion["kind"]; onUndo?: () => void }) {
  const t = useTranslations("agent.chat");
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold text-sm">
      {t("approved")}
      <a
        href={kind === "activity" ? "#itinerary" : "#budget"}
        className="underline underline-offset-2 ui-hover:text-accent"
      >
        {kind === "activity" ? t("seeItinerary") : t("seeBudget")}
      </a>
      {onUndo === undefined ? null : (
        <button
          type="button"
          onClick={onUndo}
          className="min-h-touch cursor-pointer text-text-muted underline-offset-2 ui-hover:text-text ui-hover:underline ui-focus:outline-2 ui-focus:outline-focus ui-focus:outline-solid"
        >
          {t("undo")}
        </button>
      )}
    </p>
  );
}

/** Under the composer: why it is disabled (offline), or the privacy promise. */
function ComposerNote({ isOnline, isEmpty }: { isOnline: boolean; isEmpty: boolean }) {
  const t = useTranslations("agent.chat");
  if (isOnline && !isEmpty) {
    return null;
  }
  return (
    <p id="agent-note" className="text-sm text-text-muted">
      {isOnline ? t("private") : t("offline")}
    </p>
  );
}

/** The daily quota is spent: a notice with the reset time, not an error. */
function LimitNotice() {
  const t = useTranslations("agent.chat");
  const locale = useLocale();
  return (
    <p role="status" className="rounded-md bg-surface-2 px-4 py-3 text-sm">
      {t("rateLimited", {
        time: new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(nextReset()),
      })}
    </p>
  );
}

/** Why the last question got no answer, with "Try again" when it can help. */
function AskError({
  error,
  canRetry,
  onRetry,
}: {
  error: string | null;
  canRetry: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations("agent.chat");
  if (error === null) {
    return null;
  }
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3">
      <p className="text-error">{error}</p>
      {canRetry ? (
        <Button type="button" variant="outline" size="sm" icon={RotateCcw} onClick={onRetry}>
          {t("retry")}
        </Button>
      ) : null}
    </div>
  );
}
