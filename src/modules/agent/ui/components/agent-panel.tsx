"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import type { ChatMessage, Suggestion } from "@/modules/agent/domain/suggestion";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";

export type AgentPanelProps = { tripId: string; viewerId: string; tripCurrency: string };

type SuggestionState = "pending" | "saving" | "approved" | "dismissed" | "failed";

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
    },
  };
}

/**
 * Private chat with the trip assistant. History lives in this component only;
 * approved suggestions become activities or costs everyone can see.
 */
export function AgentPanel({ tripId, viewerId, tripCurrency }: AgentPanelProps) {
  const t = useTranslations("agent.chat");
  const locale = useLocale();
  const router = useRouter();
  const isOnline = useIsOnline();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [states, setStates] = useState<Record<string, SuggestionState>>({});
  const [draft, setDraft] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (content === "") {
      return;
    }
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setIsAsking(true);
    setError(null);
    const response = await fetch(`/api/v1/trips/${tripId}/agent`, {
      method: "POST",
      headers: { "content-type": "application/json", "accept-language": locale },
      body: JSON.stringify({ messages: next }),
    }).catch(() => null);
    setIsAsking(false);
    const payload = (await response?.json().catch(() => null)) as
      | { reply: string; suggestions: Suggestion[] }
      | { error?: { message?: string } }
      | null;
    if (response?.ok && payload !== null && "reply" in payload) {
      setMessages([...next, { role: "assistant", content: payload.reply }]);
      setSuggestions((current) => [...current, ...payload.suggestions]);
      return;
    }
    setError(
      (payload !== null && "error" in payload ? payload.error?.message : undefined) ?? t("failed"),
    );
  }

  async function approve(suggestion: Suggestion) {
    setStates((current) => ({ ...current, [suggestion.id]: "saving" }));
    const { url, body } = approvalRequest(suggestion, tripId, viewerId, tripCurrency);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "accept-language": locale },
      body: JSON.stringify(body),
    }).catch(() => null);
    setStates((current) => ({ ...current, [suggestion.id]: response?.ok ? "approved" : "failed" }));
    if (response?.ok) {
      router.refresh();
    }
  }

  return (
    <section aria-labelledby="agent-heading" className="flex flex-col gap-4">
      <h2 id="agent-heading" className="font-display text-3xl">
        {t("heading")}
      </h2>
      <p className="text-text-muted">{t("intro")}</p>
      <ol aria-live="polite" className="flex flex-col gap-3">
        {messages.map((message, index) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: messages are append-only.
            key={index}
            className={
              message.role === "user"
                ? "self-end rounded-md bg-secondary p-3 text-on-secondary"
                : "self-start whitespace-pre-wrap rounded-md border border-border-strong bg-surface-1 p-3"
            }
          >
            <span className="sr-only">{message.role === "user" ? t("you") : t("assistant")}: </span>
            {message.content}
          </li>
        ))}
        {isAsking ? <li className="text-text-muted">{t("thinking")}</li> : null}
      </ol>
      {suggestions.length === 0 ? null : (
        <ul className="flex flex-col gap-3" aria-label={t("suggestions")}>
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              state={states[suggestion.id] ?? "pending"}
              tripCurrency={tripCurrency}
              isOnline={isOnline}
              onApprove={() => approve(suggestion)}
              onDismiss={() =>
                setStates((current) => ({ ...current, [suggestion.id]: "dismissed" }))
              }
            />
          ))}
        </ul>
      )}
      {error === null ? null : (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      <form onSubmit={ask} className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <Input
            name="message"
            label={t("label")}
            placeholder={t("placeholder")}
            value={draft}
            maxLength={4000}
            disabled={!isOnline}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <Button type="submit" isLoading={isAsking} disabled={!isOnline || draft.trim() === ""}>
          {t("send")}
        </Button>
      </form>
      {!isOnline ? <p className="text-text-muted">{t("offline")}</p> : null}
    </section>
  );
}

type SuggestionCardProps = {
  suggestion: Suggestion;
  state: SuggestionState;
  tripCurrency: string;
  isOnline: boolean;
  onApprove: () => void;
  onDismiss: () => void;
};

function SuggestionCard({
  suggestion,
  state,
  tripCurrency,
  isOnline,
  onApprove,
  onDismiss,
}: SuggestionCardProps) {
  const t = useTranslations("agent.chat");
  if (state === "dismissed") {
    return null;
  }
  const title = suggestion.kind === "activity" ? suggestion.title : suggestion.label;
  const cost =
    suggestion.kind === "activity" && suggestion.costPerPerson !== null
      ? `${suggestion.costPerPerson} ${suggestion.currency ?? tripCurrency}`
      : t("free");
  const detail =
    suggestion.kind === "activity"
      ? t("activityDetail", { date: suggestion.date, cost })
      : t("budgetDetail", { amount: `${suggestion.amount} ${suggestion.currency}` });

  return (
    <li className="flex flex-col gap-2 rounded-md border-2 border-text bg-surface-1 p-4">
      <span className="font-semibold">{title}</span>
      <span className="text-sm">{detail}</span>
      <span className="text-sm text-text-muted">{t("estimate")}</span>
      {suggestion.sourceUrl === null ? null : (
        <a
          href={suggestion.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline"
        >
          {t("source")}
        </a>
      )}
      {state === "approved" ? (
        <p role="status" className="font-semibold text-sm">
          {t("approved")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={!isOnline}
            isLoading={state === "saving"}
            onClick={onApprove}
          >
            {t("approve")}
          </Button>
          <Button type="button" variant="outline" onClick={onDismiss}>
            {t("dismiss")}
          </Button>
          {state === "failed" ? (
            <p role="alert" className="text-error text-sm">
              {t("approveFailed")}
            </p>
          ) : null}
        </div>
      )}
    </li>
  );
}
