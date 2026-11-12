-- Shared budget items now store a unit price per traveler instead of a
-- group total. Convert existing totals: total / current member count.
UPDATE `budget_item`
SET `amount` = CAST(ROUND(CAST(`amount` AS REAL) / (
  SELECT COUNT(*) FROM `trip_member` WHERE `trip_member`.`trip_id` = `budget_item`.`trip_id`
)) AS INTEGER)
WHERE `user_id` IS NULL
  AND (SELECT COUNT(*) FROM `trip_member` WHERE `trip_member`.`trip_id` = `budget_item`.`trip_id`) > 0;
