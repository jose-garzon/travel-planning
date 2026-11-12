-- Flight budget items become transfers (feature 015). The amount stays a
-- unit price per traveler: a shared flight is charged to everyone ("all"),
-- a per-person one only to its member ("opt-in" + participant). Items with
-- no stop, or whose leg is missing or has no date, are flagged for review.
INSERT INTO `transfer` (
  `id`, `trip_id`, `gap`, `mode`, `from_name`, `to_name`, `depart_date`,
  `cost`, `currency`, `rate`, `charge`, `link`, `notes`, `needs_review`,
  `version`, `created_by`, `created_at`
)
SELECT
  `b`.`id`,
  `b`.`trip_id`,
  COALESCE(`b`.`stop`, 0),
  'flight',
  COALESCE(`l`.`from_name`, ''),
  COALESCE(`l`.`to_name`, ''),
  COALESCE(`l`.`date`, date(`b`.`created_at` / 1000, 'unixepoch')),
  `b`.`amount`,
  `b`.`currency`,
  `b`.`rate`,
  CASE WHEN `b`.`user_id` IS NULL THEN 'all' ELSE 'opt-in' END,
  `b`.`link`,
  `b`.`label`,
  CASE WHEN `b`.`stop` IS NULL OR `l`.`date` IS NULL THEN 1 ELSE 0 END,
  1,
  COALESCE(`b`.`user_id`, (
    SELECT `m`.`user_id` FROM `trip_member` `m`
    WHERE `m`.`trip_id` = `b`.`trip_id`
    ORDER BY `m`.`role` = 'owner' DESC, `m`.`joined_at` LIMIT 1
  )),
  `b`.`created_at`
FROM `budget_item` `b`
LEFT JOIN `trip_leg` `l`
  ON `l`.`trip_id` = `b`.`trip_id` AND `l`.`position` = COALESCE(`b`.`stop`, 0)
WHERE `b`.`category` = 'flights'
  AND EXISTS (SELECT 1 FROM `trip_member` `m` WHERE `m`.`trip_id` = `b`.`trip_id`);
--> statement-breakpoint
INSERT INTO `transfer_participant` (`transfer_id`, `user_id`)
SELECT `id`, `user_id` FROM `budget_item`
WHERE `category` = 'flights' AND `user_id` IS NOT NULL;
--> statement-breakpoint
DELETE FROM `budget_item` WHERE `category` = 'flights';
