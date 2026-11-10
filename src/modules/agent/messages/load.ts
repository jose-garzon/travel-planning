import type { Locale } from "@/shared/i18n/routing";
import type chatEn from "./en/chat.json";

export type AgentMessages = { chat: typeof chatEn };

export async function loadAgentMessages(locale: Locale): Promise<AgentMessages> {
  return { chat: (await import(`./${locale}/chat.json`)).default };
}
