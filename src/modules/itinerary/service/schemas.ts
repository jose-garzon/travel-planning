import { z } from "zod";

export const activityInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1).max(80),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  durationMinutes: z
    .number()
    .int()
    .min(1)
    .max(24 * 60)
    .nullable(),
  /** Major units as entered (12.50); stored as minor units. */
  costPerPerson: z.number().min(0).max(1_000_000).nullable(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable(),
  rate: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .nullable(),
  link: z.url().max(500).nullable(),
});

export type ActivityInput = z.infer<typeof activityInputSchema>;

export type ActivityDto = {
  id: string;
  date: string;
  title: string;
  startTime: string | null;
  durationMinutes: number | null;
  costPerPerson: number | null;
  currency: string | null;
  rate: string | null;
  /** Cost for one participant in trip-currency minor units. */
  costInTripCurrency: number;
  link: string | null;
  participantIds: string[];
  subscribed: boolean;
  overlaps: boolean;
};

export type ItineraryDto = {
  currency: string;
  activities: ActivityDto[];
};
