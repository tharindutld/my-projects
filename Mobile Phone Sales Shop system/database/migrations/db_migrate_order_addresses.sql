-- ============================================================
-- Migration: Add Shipping & Billing Addresses to tbl_order_master
-- ============================================================

ALTER TABLE `tbl_order_master`
  ADD COLUMN `ShippingName` VARCHAR(150) DEFAULT NULL AFTER `UserId`,
  ADD COLUMN `ShippingPhone` VARCHAR(20) DEFAULT NULL AFTER `ShippingName`,
  ADD COLUMN `ShippingCountry` VARCHAR(100) DEFAULT NULL AFTER `ShippingPhone`,
  ADD COLUMN `ShippingAddress` VARCHAR(255) DEFAULT NULL AFTER `ShippingCountry`,
  ADD COLUMN `ShippingPostalCode` VARCHAR(20) DEFAULT NULL AFTER `ShippingAddress`,
  ADD COLUMN `BillingName` VARCHAR(150) DEFAULT NULL AFTER `ShippingPostalCode`,
  ADD COLUMN `BillingPhone` VARCHAR(20) DEFAULT NULL AFTER `BillingName`,
  ADD COLUMN `BillingCountry` VARCHAR(100) DEFAULT NULL AFTER `BillingPhone`,
  ADD COLUMN `BillingAddress` VARCHAR(255) DEFAULT NULL AFTER `BillingCountry`,
  ADD COLUMN `BillingPostalCode` VARCHAR(20) DEFAULT NULL AFTER `BillingAddress`;
