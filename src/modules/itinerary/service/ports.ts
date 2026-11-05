import type { Activity } from "@/modules/itinerary/domain/activity";

/** What itinerary needs to know about a trip; wired from the trips module by the app layer. */
export type TripContext = {
  currency: string;
  memberIds: string[];
  startDate: string | null;
  endDate: string | null;
};

export type TripContextReader = {
  /** Null when the trip is missing or `userId` is not a member. */
  get(tripId: string, userId: string): Promise<TripContext | null>;
};

export type NewActivity = Omit<Activity, "participantIds">;

export type ActivitiesRepository = {
  listForTrip(tripId: string): Promise<Activity[]>;
  find(tripId: string, activityId: string): Promise<Activity | null>;
  create(activity: NewActivity, subscribeCreator: boolean): Promise<Activity>;
  update(activity: NewActivity): Promise<void>;
  remove(tripId: string, activityId: string): Promise<void>;
  setSubscription(activityId: string, userId: string, subscribed: boolean): Promise<void>;
};

export type IdGenerator = { next(): string };
