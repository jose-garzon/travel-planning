import type { Page } from "@playwright/test";

export type SeedTransfer = {
  gap: number;
  mode: string;
  from: string;
  to: string;
  departDate: string;
  departTime?: string;
};

/**
 * Seeds a transfer through the public API (`POST /api/v1/trips/{id}/transfers`),
 * as the signed-in member of `page`. The route and the schema stay the single
 * way in, so scenarios exercise what the app and the agent use.
 */
export async function seedTransfer(
  page: Page,
  tripId: string,
  transfer: SeedTransfer,
): Promise<void> {
  const response = await page.request.post(`/api/v1/trips/${tripId}/transfers`, {
    data: { charge: "all", ...transfer },
  });
  if (response.status() !== 201) {
    throw new Error(`seedTransfer: ${response.status()} ${(await response.text()).slice(0, 200)}`);
  }
}
