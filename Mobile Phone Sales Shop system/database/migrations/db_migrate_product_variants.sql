--
-- Database Migration: Product Variant Architecture
--

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create the new tblproduct_variants table
CREATE TABLE IF NOT EXISTS `tblproduct_variants` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ProductId` int(11) NOT NULL,
  `Color` varchar(50) DEFAULT NULL,
  `RAM` varchar(50) DEFAULT NULL,
  `ROM` varchar(50) DEFAULT NULL,
  `Price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `Stock` int(11) NOT NULL DEFAULT 0,
  `CreationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `idx_product_id` (`ProductId`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`ProductId`) REFERENCES `tblproducts` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Modify related tables: Drop old foreign keys and columns, add new columns and foreign keys

-- tblorders
ALTER TABLE `tblorders` DROP FOREIGN KEY `tblorders_ibfk_2`;
ALTER TABLE `tblorders` CHANGE COLUMN `PId` `VariantId` int(11) DEFAULT NULL;
ALTER TABLE `tblorders` ADD CONSTRAINT `tblorders_ibfk_2` FOREIGN KEY (`VariantId`) REFERENCES `tblproduct_variants` (`ID`) ON DELETE CASCADE;

-- tbl_order_items
ALTER TABLE `tbl_order_items` DROP FOREIGN KEY `tbl_order_items_ibfk_2`;
ALTER TABLE `tbl_order_items` CHANGE COLUMN `ProductId` `VariantId` int(11) NOT NULL;
ALTER TABLE `tbl_order_items` ADD CONSTRAINT `tbl_order_items_ibfk_2` FOREIGN KEY (`VariantId`) REFERENCES `tblproduct_variants` (`ID`) ON DELETE CASCADE;

-- tbl_stock_batches
ALTER TABLE `tbl_stock_batches` DROP FOREIGN KEY `tbl_stock_batches_ibfk_1`;
ALTER TABLE `tbl_stock_batches` CHANGE COLUMN `ProductId` `VariantId` int(11) NOT NULL;
ALTER TABLE `tbl_stock_batches` ADD CONSTRAINT `tbl_stock_batches_ibfk_1` FOREIGN KEY (`VariantId`) REFERENCES `tblproduct_variants` (`ID`) ON DELETE CASCADE;

-- tbl_stock_log
ALTER TABLE `tbl_stock_log` DROP FOREIGN KEY `tbl_stock_log_ibfk_1`;
ALTER TABLE `tbl_stock_log` CHANGE COLUMN `ProductId` `VariantId` int(11) NOT NULL;
ALTER TABLE `tbl_stock_log` ADD CONSTRAINT `tbl_stock_log_ibfk_1` FOREIGN KEY (`VariantId`) REFERENCES `tblproduct_variants` (`ID`) ON DELETE CASCADE;

-- tblcart
ALTER TABLE `tblcart` CHANGE COLUMN `ProductId` `VariantId` int(11) NOT NULL;
ALTER TABLE `tblcart` ADD CONSTRAINT `fk_cart_variant` FOREIGN KEY (`VariantId`) REFERENCES `tblproduct_variants` (`ID`) ON DELETE CASCADE;

-- tbl_returns
ALTER TABLE `tbl_returns` DROP FOREIGN KEY `fk_returns_product`;
ALTER TABLE `tbl_returns` CHANGE COLUMN `ProductId` `VariantId` int(11) NOT NULL;
ALTER TABLE `tbl_returns` ADD CONSTRAINT `fk_returns_variant` FOREIGN KEY (`VariantId`) REFERENCES `tblproduct_variants` (`ID`) ON DELETE CASCADE;

-- 3. Remove variant-specific columns from tblproducts
ALTER TABLE `tblproducts` DROP COLUMN `Color`;
ALTER TABLE `tblproducts` DROP COLUMN `RAM`;
ALTER TABLE `tblproducts` DROP COLUMN `ROM`;
ALTER TABLE `tblproducts` DROP COLUMN `Price`;
ALTER TABLE `tblproducts` DROP COLUMN `Stock`;

SET FOREIGN_KEY_CHECKS = 1;
