-- ============================================================
-- Migration: Sales & Order Management Schema
-- ============================================================

-- 1. Add Quantity to tblorders for cart quantity support
ALTER TABLE `tblorders` 
    ADD COLUMN `Quantity` INT(11) NOT NULL DEFAULT 1 AFTER `PId`;

-- 2. Modify tblcart to support primary key and auto increment (if not already set)
-- In case primary key already exists, we will handle potential duplicate index issues in PHP
-- But we list the commands here for manual phpMyAdmin import
ALTER TABLE `tblcart` ADD PRIMARY KEY (`ID`);
ALTER TABLE `tblcart` MODIFY `ID` INT(11) NOT NULL AUTO_INCREMENT;

-- 3. Create Order Master table for storing order details
CREATE TABLE IF NOT EXISTS `tbl_order_master` (
  `ID` INT(11) NOT NULL AUTO_INCREMENT,
  `OrderNumber` VARCHAR(50) NOT NULL UNIQUE,
  `UserId` INT(11) NOT NULL,
  `TotalAmount` DECIMAL(10,2) NOT NULL,
  `PaymentMethod` VARCHAR(50) NOT NULL,
  `TransactionDetails` TEXT DEFAULT NULL,
  `OrderStatus` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `OrderDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Create Order Items table for storing products per order
CREATE TABLE IF NOT EXISTS `tbl_order_items` (
  `ID` INT(11) NOT NULL AUTO_INCREMENT,
  `OrderMasterId` INT(11) NOT NULL,
  `ProductId` INT(11) NOT NULL,
  `ProductQty` INT(11) NOT NULL DEFAULT 1,
  `ProductPrice` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`ID`),
  FOREIGN KEY (`OrderMasterId`) REFERENCES `tbl_order_master` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
