import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import Markdown from "react-markdown";
import { Icon } from "@/shared/ui/components/icon";

/** The site a link points at, the way a ticket names the operator. */
function host(href: string): string | null {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Text content of a node tree, to tell a price from a name. */
function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(text).join("");
  }
  return "";
}

/** Bold text that carries a price (a symbol or a currency code) is a fare. */
const FIGURE = /[$€£¥₩₹]\s?\d|\b[A-Z]{3}\s?\d[\d.,]{2,}|\d[\d.,]{2,}\s?[A-Z]{3}\b/;

/**
 * An assistant reply, read as a travel note: Markdown parsed (no raw
 * HTML), links shown as source chips named by their site, bold prices
 * set as amber fare tags (the time/price chip of DESIGN.md), lists
 * marked with line-coloured stations.
 */
export function AgentReply({ content }: { content: string }) {
  return (
    <div className="agent-reply min-w-0 flex-1 wrap-anywhere">
      <Markdown
        skipHtml
        components={{
          a: ({ href, children }) => {
            const site = href === undefined ? null : host(href);
            const label = text(children);
            // A bare URL as its own label reads as the site name.
            const shown = site !== null && (label === href || label === "") ? site : children;
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={href}
                className="inline-flex max-w-full items-center gap-1 rounded-full border-2 border-text px-2 align-baseline font-semibold text-sm leading-normal transition duration-fast ease-out ui-hover:border-accent ui-hover:text-accent ui-focus:outline-2 ui-focus:outline-focus ui-focus:outline-solid"
              >
                <span className="truncate">{shown}</span>
                <Icon icon={ArrowUpRight} size="sm" />
              </a>
            );
          },
          strong: ({ children }) =>
            FIGURE.test(text(children)) ? (
              <strong className="rounded-sm bg-sun px-1 font-bold text-on-sun tabular-nums">
                {children}
              </strong>
            ) : (
              <strong className="font-bold">{children}</strong>
            ),
          h1: ({ children }) => <p className="agent-reply-heading">{children}</p>,
          h2: ({ children }) => <p className="agent-reply-heading">{children}</p>,
          h3: ({ children }) => <p className="agent-reply-heading">{children}</p>,
          img: () => null,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
