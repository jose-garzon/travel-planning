import { describe, expect, it } from "vitest";
import { httpUrl } from "@/shared/kernel/http-url";

describe("httpUrl", () => {
  it.each(["https://example.com/a?b=1", "http://example.com"])("accepts %s", (value) => {
    expect(httpUrl.safeParse(value).success).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "ftp://example.com",
    "not a url",
  ])("rejects %s", (value) => {
    expect(httpUrl.safeParse(value).success).toBe(false);
  });
});
