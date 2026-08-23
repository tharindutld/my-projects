-- =============================================
-- Product Management Module - Category Migration
-- Run this SQL in phpMyAdmin on mobile_store_db
-- =============================================

-- 1. Create tblcategory table for product types
CREATE TABLE IF NOT EXISTS `tblcategory` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `CategoryName` varchar(250) NOT NULL,
  `Status` int(1) NOT NULL DEFAULT 1,
  `CreationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `idx_status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Insert default categories
INSERT INTO `tblcategory` (`CategoryName`, `Status`) VALUES
('Smartphone', 1),
('Tablet', 1),
('Feature Phone', 1),
('Accessories', 1),
('Wearable', 1);

-- 3. Add CategoryName column to tblproducts (if it doesn't already exist)
ALTER TABLE `tblproducts` ADD COLUMN IF NOT EXISTS `CategoryName` varchar(100) DEFAULT NULL AFTER `BrandName`;

-- 4. Add index for category filtering
ALTER TABLE `tblproducts` ADD KEY IF NOT EXISTS `idx_category` (`CategoryName`);

-- 5. Set default category for existing products
UPDATE `tblproducts` SET `CategoryName` = 'Smartphone' WHERE `CategoryName` IS NULL;
