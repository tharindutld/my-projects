-- Migration: Add DeliveryStatus column to tbl_order_master
-- Target Table: tbl_order_master
-- Description: Adds a status tracking column for shipping/delivery phases.

ALTER TABLE `tbl_order_master` ADD COLUMN `DeliveryStatus` VARCHAR(50) NOT NULL DEFAULT 'Processing';
