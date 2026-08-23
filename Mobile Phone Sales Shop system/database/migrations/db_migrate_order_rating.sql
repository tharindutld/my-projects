-- Migration: Add OrderRating column to tbl_order_master
-- Target Table: tbl_order_master
-- Description: Adds an integer customer rating (1-5) for completed orders.
-- Note: This column is also auto-created at runtime by config/db.php (ensureUserStatusColumn),
-- this file exists for documentation/manual-deploy purposes.

ALTER TABLE `tbl_order_master` ADD COLUMN `OrderRating` TINYINT UNSIGNED NULL DEFAULT NULL AFTER `DeliveryStatus`;
