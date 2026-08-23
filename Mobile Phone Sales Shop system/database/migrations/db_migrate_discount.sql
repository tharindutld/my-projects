-- ============================================================
-- Migration: Add Discount Columns to tblproducts
-- Run this in phpMyAdmin -> SQL tab on mobile_store_db
-- ============================================================

-- Add DiscountPercent column (0-100, default 0 = no discount)
ALTER TABLE `tblproducts` 
    ADD COLUMN `DiscountPercent` decimal(5,2) NOT NULL DEFAULT 0.00 AFTER `Price`;

-- Add DiscountStartDate and DiscountEndDate for time-limited promotions
ALTER TABLE `tblproducts` 
    ADD COLUMN `DiscountStartDate` date DEFAULT NULL AFTER `DiscountPercent`,
    ADD COLUMN `DiscountEndDate` date DEFAULT NULL AFTER `DiscountStartDate`;

-- Verify: SELECT ID, ProductName, Price, DiscountPercent, DiscountStartDate, DiscountEndDate FROM tblproducts;
