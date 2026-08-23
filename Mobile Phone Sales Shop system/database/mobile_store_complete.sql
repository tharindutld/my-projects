-- phpMyAdmin SQL Dump
-- Host: 127.0.0.1
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Disable foreign keys for safe clean import
--
SET FOREIGN_KEY_CHECKS = 0;

--
-- Drop existing tables if they exist
--
DROP TABLE IF EXISTS `tbl_stock_imeis`;
DROP TABLE IF EXISTS `tbl_stock_batches`;
DROP TABLE IF EXISTS `tbl_stock_log`;
DROP TABLE IF EXISTS `tbl_order_items`;
DROP TABLE IF EXISTS `tbl_order_master`;
DROP TABLE IF EXISTS `tbluseraddress`;
DROP TABLE IF EXISTS `tblwish`;
DROP TABLE IF EXISTS `tblorders`;
DROP TABLE IF EXISTS `tblcart`;
DROP TABLE IF EXISTS `tblproducts`;
DROP TABLE IF EXISTS `tblcategory`;
DROP TABLE IF EXISTS `tblbrand`;
DROP TABLE IF EXISTS `staff_users`;
DROP TABLE IF EXISTS `tbluser`;

-- --------------------------------------------------------

--
-- Table structure for table `tbluser` (Customer Profiles)
--
CREATE TABLE `tbluser` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(50) DEFAULT NULL,
  `LastName` varchar(50) DEFAULT NULL,
  `MobileNumber` varchar(20) DEFAULT NULL,
  `Gender` varchar(10) DEFAULT NULL,
  `BirthDate` date DEFAULT NULL,
  `Email` varchar(120) DEFAULT NULL,
  `Password` varchar(255) NOT NULL,
  `LoyaltyPoints` int(11) NOT NULL DEFAULT 0,
  `RegDate` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  UNIQUE KEY `unique_email` (`Email`),
  UNIQUE KEY `unique_mobile` (`MobileNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed Customer Accounts (All passwords: 'password')
INSERT INTO `tbluser` (`ID`, `FirstName`, `LastName`, `MobileNumber`, `Gender`, `BirthDate`, `Email`, `Password`, `LoyaltyPoints`, `RegDate`) VALUES
(1, 'John', 'Doe', '0771234567', 'Male', '1995-03-12', 'customer@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 250, '2026-05-10 10:00:00'),
(2, 'Jane', 'Smith', '0779876543', 'Female', '1998-07-24', 'jane@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 120, '2026-05-12 14:30:00'),
(3, 'Tharindu', 'Dissanayake', '0719108628', 'Male', '1996-11-05', 'tharindu@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 500, '2026-05-15 08:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `staff_users` (System Users for Admin Panel)
--
CREATE TABLE `staff_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `gender` enum('Male','Female') NOT NULL,
  `birth_date` date NOT NULL,
  `role` enum('Admin','Sales person','Technician') NOT NULL,
  `status` enum('Active','Inactive') NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed Staff Accounts (All passwords: 'password')
INSERT INTO `staff_users` (`id`, `first_name`, `last_name`, `email`, `phone`, `gender`, `birth_date`, `role`, `status`, `password`) VALUES
(1, 'Super', 'Admin', 'admin@mobilestore.com', '0700000000', 'Male', '1990-01-01', 'Admin', 'Active', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(2, 'Tharindu', 'Dissanayake', 'tharindutld@gmail.com', '0719108628', 'Male', '2019-06-03', 'Admin', 'Active', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(3, 'chiran', 'jayasumana', 'chiran@gmail.com', '0711234567', 'Male', '2018-05-10', 'Admin', 'Active', '$2y$10$qgbq3OgXFoY2vwmWFLqP3u5cWm4lF2wy6pIslMcXdUkJ2tXoDDmx6'),
(4, 'John', 'Sales', 'sales@mobilestore.com', '0722222222', 'Male', '1995-05-15', 'Sales person', 'Active', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- --------------------------------------------------------

--
-- Table structure for table `tblbrand` (Product Brands)
--
CREATE TABLE `tblbrand` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `BrandName` varchar(250) NOT NULL,
  `Status` int(1) NOT NULL DEFAULT 1,
  `CreationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `idx_status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed Brands
INSERT INTO `tblbrand` (`ID`, `BrandName`, `Status`, `CreationDate`) VALUES
(1, 'Apple', 1, '2026-05-10 05:05:00'),
(2, 'Samsung', 1, '2026-05-10 14:55:33'),
(3, 'Google', 1, '2026-05-11 16:00:35'),
(4, 'OnePlus', 1, '2026-05-12 11:20:00'),
(5, 'Xiaomi', 1, '2026-05-12 11:20:00');

-- --------------------------------------------------------

--
-- Table structure for table `tblcategory` (Product Categories)
--
CREATE TABLE `tblcategory` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `CategoryName` varchar(250) NOT NULL,
  `Status` int(1) NOT NULL DEFAULT 1,
  `CreationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `idx_status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed Categories
INSERT INTO `tblcategory` (`ID`, `CategoryName`, `Status`, `CreationDate`) VALUES
(1, 'Smartphone', 1, '2026-05-10 05:05:00'),
(2, 'Tablet', 1, '2026-05-10 05:05:00'),
(3, 'Wearable', 1, '2026-05-10 05:05:00'),
(4, 'Accessories', 1, '2026-05-10 05:05:00');

-- --------------------------------------------------------

--
-- Table structure for table `tblproducts` (Device Inventory Catalog)
--
CREATE TABLE `tblproducts` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ProductName` varchar(200) NOT NULL,
  `BrandName` varchar(100) DEFAULT NULL,
  `CategoryName` varchar(100) DEFAULT NULL,
  `ModelNumber` varchar(50) DEFAULT NULL,
  `SimType` varchar(50) DEFAULT 'Dual SIM',
  `Color` varchar(50) DEFAULT NULL,
  `RAM` varchar(50) DEFAULT NULL,
  `ROM` varchar(50) DEFAULT NULL,
  `ExpandableUpto` varchar(50) DEFAULT NULL,
  `FrontCamera` varchar(100) DEFAULT NULL,
  `Processor` varchar(100) DEFAULT NULL,
  `Display` varchar(100) DEFAULT NULL,
  `KeyFeature` mediumtext DEFAULT NULL,
  `Specification` mediumtext DEFAULT NULL,
  `Image1` varchar(200) DEFAULT NULL,
  `Image2` varchar(200) DEFAULT NULL,
  `Image3` varchar(200) DEFAULT NULL,
  `Stock` int(11) NOT NULL DEFAULT 0,
  `Price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `DiscountPercent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `DiscountStartDate` date DEFAULT NULL,
  `DiscountEndDate` date DEFAULT NULL,
  `Status` int(1) DEFAULT 1,
  `CreationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `idx_status` (`Status`),
  KEY `idx_brand` (`BrandName`),
  KEY `idx_category` (`CategoryName`),
  KEY `idx_price` (`Price`),
  KEY `idx_stock` (`Stock`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed Products
INSERT INTO `tblproducts` (`ID`, `ProductName`, `BrandName`, `CategoryName`, `ModelNumber`, `Color`, `RAM`, `ROM`, `ExpandableUpto`, `FrontCamera`, `Processor`, `Display`, `KeyFeature`, `Specification`, `Image1`, `Image2`, `Image3`, `Stock`, `Price`, `DiscountPercent`, `DiscountStartDate`, `DiscountEndDate`, `Status`, `CreationDate`) VALUES
(1, 'iPhone 15 Pro Max', 'Apple', 'Smartphone', 'APPLE001', 'Natural Titanium', '8GB', '256GB', 'None', '12MP', 'A17 Pro', '6.7\" Super Retina XDR OLED', 'Titanium design, Action button, USB-C', 'Stunning mobile gaming specs.', '24_1.jpg', '24_2.jpg', '24_3.jpg', 45, 340000.00, 0.00, NULL, NULL, 1, '2026-05-10 10:15:00'),
(2, 'Galaxy S24 Ultra', 'Samsung', 'Smartphone', 'SAMSUNG001', 'Titanium Black', '12GB', '512GB', 'None', '12MP', 'Snapdragon 8 Gen 3', '6.8\" Dynamic AMOLED 2X', 'S-Pen included, Galaxy AI integrated', 'Premium zoom cameras.', '25_1.jpg', '25_2.jpg', '25_3.jpg', 30, 320000.00, 5.00, '2026-05-15', '2026-06-15', 1, '2026-05-10 10:20:00'),
(3, 'Pixel 8 Pro', 'Google', 'Smartphone', 'GOOGLE001', 'Bay Blue', '12GB', '128GB', 'None', '10.5MP', 'Google Tensor G3', '6.7\" Super Actua Display', 'Magic Eraser, Best Take camera tools', 'Pure Android experience.', '26_1.jpg', '26_2.jpg', '26_3.jpg', 18, 240000.00, 0.00, NULL, NULL, 1, '2026-05-11 11:00:00'),
(4, 'OnePlus 12', 'OnePlus', 'Smartphone', 'ONEPLUS001', 'Flowy Emerald', '16GB', '512GB', 'None', '32MP', 'Snapdragon 8 Gen 3', '6.82\" 120Hz AMOLED', '100W SuperVOOC Fast Charging', 'Hasselblad camera tuning.', '27_1.jpg', '27_2.jpg', '27_3.jpg', 15, 195000.00, 0.00, NULL, NULL, 1, '2026-05-12 09:30:00'),
(5, 'iPad Air M2', 'Apple', 'Tablet', 'APPLE003', 'Space Gray', '8GB', '128GB', 'None', '12MP', 'Apple M2', '11\" Liquid Retina', 'M2 Chip, Supports Apple Pencil Pro', 'Lightweight power tablet.', '28_1.jpg', '28_2.jpg', '28_3.jpg', 12, 180000.00, 10.00, '2026-05-18', '2026-06-18', 1, '2026-05-12 10:00:00'),
(6, 'Apple Watch Series 9', 'Apple', 'Wearable', 'APPLE004', 'Midnight', 'None', '64GB', 'None', 'None', 'S9 SiP', 'Always-On Retina display', 'Double tap gesture, health tracking', 'Siri on-device processing.', '29_1.jpg', '29_2.jpg', '29_3.jpg', 22, 115000.00, 0.00, NULL, NULL, 1, '2026-05-13 14:00:00'),
(7, 'Galaxy Buds 2 Pro', 'Samsung', 'Accessories', 'SAMSUNG002', 'Bora Purple', 'None', 'None', 'None', 'None', 'Custom Bluetooth', 'None', 'Hi-Fi Audio, Active Noise Cancelling', 'Sweat resistant design.', '30_1.jpg', '30_2.jpg', '30_3.jpg', 50, 38000.00, 0.00, NULL, NULL, 1, '2026-05-13 14:15:00'),
(8, 'Redmi Note 13', 'Xiaomi', 'Smartphone', 'XIAOMI001', 'Mint Green', '8GB', '256GB', '1TB', '16MP', 'Dimensity 6080', '6.67\" 120Hz AMOLED', '108MP Triple Camera, 33W Fast Charge', 'Exceptional budget smartphone.', '31_1.jpg', '31_2.jpg', '31_3.jpg', 25, 65000.00, 0.00, NULL, NULL, 1, '2026-05-14 08:30:00'),
(9, 'iPhone 13 (Low Stock Demo)', 'Apple', 'Smartphone', 'APPLE002', 'Starlight', '4GB', '128GB', 'None', '12MP', 'A15 Bionic', '6.1\" Super Retina XDR', 'Excellent dual camera system', 'Great value iOS device.', '32_1.jpg', '32_2.jpg', '32_3.jpg', 3, 155000.00, 0.00, NULL, NULL, 1, '2026-05-15 09:00:00'),
(10, 'Galaxy A54 (Out of Stock Demo)', 'Samsung', 'Smartphone', 'SAMSUNG003', 'Awesome Violet', '8GB', '128GB', '1TB', '32MP', 'Exynos 1380', '6.4\" Super AMOLED', 'IP67 dust/water resistance', 'Perfect midranger.', '33_1.jpg', '33_2.jpg', '33_3.jpg', 0, 95000.00, 0.00, NULL, NULL, 1, '2026-05-15 09:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `tblcart` (Shopping Cart State)
--
CREATE TABLE `tblcart` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ProductId` int(11) NOT NULL,
  `ProductQty` int(11) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tblorders` (Intermediary Cart Orders)
--
CREATE TABLE `tblorders` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) DEFAULT NULL,
  `PId` int(11) DEFAULT NULL,
  `Quantity` int(11) NOT NULL DEFAULT 1,
  `OrderDate` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `UserId` (`UserId`),
  KEY `PId` (`PId`),
  CONSTRAINT `tblorders_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `tbluser` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `tblorders_ibfk_2` FOREIGN KEY (`PId`) REFERENCES `tblproducts` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tblwish` (Customer Wishlists)
--
CREATE TABLE `tblwish` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) DEFAULT NULL,
  `ProductId` int(11) DEFAULT NULL,
  `Date` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `UserId` (`UserId`),
  KEY `ProductId` (`ProductId`),
  CONSTRAINT `tblwish_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `tbluser` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `tblwish_ibfk_2` FOREIGN KEY (`ProductId`) REFERENCES `tblproducts` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed Wishlist Details
INSERT INTO `tblwish` (`ID`, `UserId`, `ProductId`, `Date`) VALUES
(1, 1, 1, '2026-05-23 10:00:00'),
(2, 2, 4, '2026-05-23 11:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbluseraddress` (Customer Addresses)
--
CREATE TABLE `tbluseraddress` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) NOT NULL,
  `RecipientName` varchar(150) DEFAULT NULL,
  `Country` varchar(100) NOT NULL,
  `StreetAddress` varchar(255) NOT NULL,
  `City` varchar(100) DEFAULT NULL,
  `District` varchar(100) DEFAULT NULL,
  `PostalCode` varchar(20) NOT NULL,
  `MobilePhone` varchar(20) NOT NULL,
  `CreationDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `tbluseraddress_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `tbluser` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed Addresses
INSERT INTO `tbluseraddress` (`ID`, `UserId`, `RecipientName`, `Country`, `StreetAddress`, `PostalCode`, `MobilePhone`, `CreationDate`) VALUES
(1, 1, 'John Doe', 'Sri Lanka', '123 Galle Road, Colombo 03', '00300', '0771234567', '2026-05-10 10:05:00'),
(2, 2, 'Jane Smith', 'Sri Lanka', '45 Kandy Road, Peradeniya', '20400', '0779876543', '2026-05-12 14:35:00'),
(3, 3, 'Tharindu Dissanayake', 'Sri Lanka', '10 Negombo Road, Kurunegala', '60000', '0719108628', '2026-05-15 08:20:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_order_master` (Sales Order Ledger Header)
--
CREATE TABLE `tbl_order_master` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `OrderNumber` varchar(50) NOT NULL,
  `UserId` int(11) NOT NULL,
  `ShippingName` varchar(150) DEFAULT NULL,
  `ShippingPhone` varchar(20) DEFAULT NULL,
  `ShippingCountry` varchar(100) DEFAULT NULL,
  `ShippingAddress` varchar(255) DEFAULT NULL,
  `ShippingPostalCode` varchar(20) DEFAULT NULL,
  `BillingName` varchar(150) DEFAULT NULL,
  `BillingPhone` varchar(20) DEFAULT NULL,
  `BillingCountry` varchar(100) DEFAULT NULL,
  `BillingAddress` varchar(255) DEFAULT NULL,
  `BillingPostalCode` varchar(20) DEFAULT NULL,
  `TotalAmount` decimal(10,2) NOT NULL,
  `PaymentMethod` varchar(50) NOT NULL,
  `TransactionDetails` text DEFAULT NULL,
  `OrderStatus` varchar(50) NOT NULL DEFAULT 'Pending',
  `PointsAwarded` tinyint(1) NOT NULL DEFAULT 0,
  `DeliveryStatus` varchar(50) NOT NULL DEFAULT 'Processing',
  `OrderDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  UNIQUE KEY `OrderNumber` (`OrderNumber`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `tbl_order_master_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `tbluser` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed Orders
INSERT INTO `tbl_order_master` (`ID`, `OrderNumber`, `UserId`, `ShippingName`, `ShippingPhone`, `ShippingCountry`, `ShippingAddress`, `ShippingPostalCode`, `BillingName`, `BillingPhone`, `BillingCountry`, `BillingAddress`, `BillingPostalCode`, `TotalAmount`, `PaymentMethod`, `TransactionDetails`, `OrderStatus`, `PointsAwarded`, `DeliveryStatus`, `OrderDate`) VALUES
(1, 'ORD-20260515-09452', 1, 'John Doe', '0771234567', 'Sri Lanka', '123 Galle Road, Colombo 03', '00300', 'John Doe', '0771234567', 'Sri Lanka', '123 Galle Road, Colombo 03', '00300', 340000.00, 'Cash', 'Collected from store counter.', 'Completed', 1, 'Delivered', '2026-05-15 09:45:00'),
(2, 'ORD-20260518-11204', 2, 'Jane Smith', '0779876543', 'Sri Lanka', '45 Kandy Road, Peradeniya', '20400', 'Jane Smith', '0779876543', 'Sri Lanka', '45 Kandy Road, Peradeniya', '20400', 608000.00, 'Card', 'Paid via Credit / Debit Card', 'Completed', 1, 'Delivered', '2026-05-18 11:20:00'),
(3, 'ORD-20260522-16109', 3, 'Tharindu Dissanayake', '0719108628', 'Sri Lanka', '10 Negombo Road, Kurunegala', '60000', 'Tharindu Dissanayake', '0719108628', 'Sri Lanka', '10 Negombo Road, Kurunegala', '60000', 240000.00, 'Card', 'Paid via Credit / Debit Card', 'Pending', 0, 'Processing', '2026-05-22 16:10:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_order_items` (Sales Order Items Detail)
--
CREATE TABLE `tbl_order_items` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `OrderMasterId` int(11) NOT NULL,
  `ProductId` int(11) NOT NULL,
  `ProductQty` int(11) NOT NULL,
  `ProductPrice` decimal(10,2) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `OrderMasterId` (`OrderMasterId`),
  KEY `ProductId` (`ProductId`),
  CONSTRAINT `tbl_order_items_ibfk_1` FOREIGN KEY (`OrderMasterId`) REFERENCES `tbl_order_master` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `tbl_order_items_ibfk_2` FOREIGN KEY (`ProductId`) REFERENCES `tblproducts` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed Order Items
INSERT INTO `tbl_order_items` (`ID`, `OrderMasterId`, `ProductId`, `ProductQty`, `ProductPrice`) VALUES
(1, 1, 1, 1, 340000.00),
(2, 2, 2, 2, 304000.00), -- Galaxy S24 Ultra discounted price (320000 - 5%) = 304000
(3, 3, 3, 1, 240000.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_stock_batches` (Inventory Batches)
--
CREATE TABLE `tbl_stock_batches` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ProductId` int(11) NOT NULL,
  `BatchNumber` varchar(100) NOT NULL,
  `Dealer` varchar(100) NOT NULL,
  `PurchaseDate` date NOT NULL,
  `CostPrice` decimal(10,2) NOT NULL,
  `SellingPrice` decimal(10,2) NOT NULL,
  `InitialQuantity` int(11) NOT NULL,
  `CurrentQuantity` int(11) NOT NULL,
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  UNIQUE KEY `unique_batch` (`BatchNumber`),
  KEY `ProductId` (`ProductId`),
  CONSTRAINT `tbl_stock_batches_ibfk_1` FOREIGN KEY (`ProductId`) REFERENCES `tblproducts` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Inventory Batches
INSERT INTO `tbl_stock_batches` (`ID`, `ProductId`, `BatchNumber`, `Dealer`, `PurchaseDate`, `CostPrice`, `SellingPrice`, `InitialQuantity`, `CurrentQuantity`) VALUES
(1, 1, 'BAT-IP15-001', 'Apex Mobiles Ltd', '2026-05-10', 290000.00, 340000.00, 46, 45),
(2, 2, 'BAT-S24U-001', 'Vertex Distribution', '2026-05-10', 270000.00, 320000.00, 32, 30),
(3, 3, 'BAT-PX8P-001', 'Global Cellular Wholesalers', '2026-05-11', 205000.00, 240000.00, 18, 18);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_stock_imeis` (IMEI Numbers Tracking)
--
CREATE TABLE `tbl_stock_imeis` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `BatchId` int(11) NOT NULL,
  `IMEI` varchar(50) NOT NULL,
  `Status` enum('Available','Sold','Returned','Damaged') NOT NULL DEFAULT 'Available',
  `SoldOrderId` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `unique_imei` (`IMEI`),
  KEY `BatchId` (`BatchId`),
  CONSTRAINT `tbl_stock_imeis_ibfk_1` FOREIGN KEY (`BatchId`) REFERENCES `tbl_stock_batches` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed IMEI entries
INSERT INTO `tbl_stock_imeis` (`ID`, `BatchId`, `IMEI`, `Status`, `SoldOrderId`) VALUES
(1, 1, '357924082345671', 'Sold', 1),
(2, 1, '357924082345672', 'Available', NULL),
(3, 2, '862045091238471', 'Sold', 2),
(4, 2, '862045091238472', 'Sold', 2),
(5, 2, '862045091238473', 'Available', NULL),
(6, 3, '358102049876231', 'Available', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_stock_log` (Inventory Movement Logs)
--
CREATE TABLE `tbl_stock_log` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ProductId` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `MovementType` varchar(50) NOT NULL,
  `ReferenceInfo` varchar(255) DEFAULT NULL,
  `LogDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `ProductId` (`ProductId`),
  CONSTRAINT `tbl_stock_log_ibfk_1` FOREIGN KEY (`ProductId`) REFERENCES `tblproducts` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Stock Logs
INSERT INTO `tbl_stock_log` (`ID`, `ProductId`, `Quantity`, `MovementType`, `ReferenceInfo`, `LogDate`) VALUES
(1, 1, 46, 'Restock', 'Initial Baseline Import', '2026-05-10 10:15:00'),
(2, 2, 32, 'Restock', 'Initial Baseline Import', '2026-05-10 10:20:00'),
(3, 3, 18, 'Restock', 'Initial Baseline Import', '2026-05-11 11:00:00'),
(4, 4, 15, 'Restock', 'Initial Baseline Import', '2026-05-12 09:30:00'),
(5, 5, 12, 'Restock', 'Initial Baseline Import', '2026-05-12 10:00:00'),
(6, 6, 22, 'Restock', 'Initial Baseline Import', '2026-05-13 14:00:00'),
(7, 7, 50, 'Restock', 'Initial Baseline Import', '2026-05-13 14:15:00'),
(8, 8, 25, 'Restock', 'Initial Baseline Import', '2026-05-14 08:30:00'),
(9, 9, 3, 'Restock', 'Initial Baseline Import', '2026-05-15 09:00:00'),
(10, 10, 0, 'Restock', 'Initial Baseline Import', '2026-05-15 09:30:00'),
(11, 1, -1, 'Sale', 'Reduced automatically after sale (ORD-20260515-09452)', '2026-05-15 09:45:00'),
(12, 2, -2, 'Sale', 'Reduced automatically after sale (ORD-20260518-11204)', '2026-05-18 11:20:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_repairs`
--
CREATE TABLE `tbl_repairs` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `CustomerName` varchar(150) NOT NULL,
  `DeviceName` varchar(150) NOT NULL,
  `Issue` text NOT NULL,
  `Cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `Income` decimal(10,2) NOT NULL DEFAULT 0.00,
  `TechnicianId` int(11) NOT NULL,
  `Status` enum('Pending','In-progress','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  `RepairDate` date NOT NULL,
  `RepairNotes` text DEFAULT NULL,
  `PartsUsed` varchar(255) DEFAULT NULL,
  `LaborTime` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `TechnicianId` (`TechnicianId`),
  CONSTRAINT `fk_repairs_technician` FOREIGN KEY (`TechnicianId`) REFERENCES `staff_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `tbl_repairs`
INSERT INTO `tbl_repairs` (`ID`, `CustomerName`, `DeviceName`, `Issue`, `Cost`, `Income`, `TechnicianId`, `Status`, `RepairDate`) VALUES
(1, 'John Doe', 'iPhone 13', 'Screen replacement', 12000.00, 22000.00, 3, 'Completed', '2026-05-31'),
(2, 'Jane Smith', 'Samsung Galaxy S22', 'Battery replacement', 5000.00, 9500.00, 3, 'Completed', '2026-05-30'),
(3, 'Kasun Perera', 'OnePlus 10R', 'Charging port repair', 3500.00, 7000.00, 4, 'Completed', '2026-05-29'),
(4, 'Ruwan Silva', 'Google Pixel 6', 'Back glass replacement', 6000.00, 11000.00, 3, 'Completed', '2026-05-26'),
(5, 'Tharindu D.', 'iPhone 14', 'Camera glass repair', 8000.00, 15000.00, 4, 'Completed', '2026-05-21');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_returns`
--
CREATE TABLE `tbl_returns` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ProductId` int(11) NOT NULL,
  `ReturnDate` date NOT NULL,
  `Reason` varchar(255) NOT NULL,
  `Status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Approved',
  PRIMARY KEY (`ID`),
  KEY `ProductId` (`ProductId`),
  CONSTRAINT `fk_returns_product` FOREIGN KEY (`ProductId`) REFERENCES `tblproducts` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `tbl_returns`
INSERT INTO `tbl_returns` (`ID`, `ProductId`, `ReturnDate`, `Reason`, `Status`) VALUES
(1, 1, '2026-05-28', 'Defective proximity sensor', 'Approved'),
(2, 8, '2026-05-24', 'Audio jack connection loose', 'Approved'),
(3, 4, '2026-05-19', 'Screen flickering issue', 'Approved');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_employee_feedback`
--
CREATE TABLE `tbl_employee_feedback` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `EmployeeId` int(11) NOT NULL,
  `UserId` int(11) NOT NULL,
  `Rating` tinyint(4) NOT NULL CHECK (`Rating` BETWEEN 1 AND 5),
  `Comments` text DEFAULT NULL,
  `FeedbackDate` date NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `EmployeeId` (`EmployeeId`),
  KEY `UserId` (`UserId`),
  CONSTRAINT `fk_feedback_employee` FOREIGN KEY (`EmployeeId`) REFERENCES `staff_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_user` FOREIGN KEY (`UserId`) REFERENCES `tbluser` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `tbl_employee_feedback`
INSERT INTO `tbl_employee_feedback` (`ID`, `EmployeeId`, `UserId`, `Rating`, `Comments`, `FeedbackDate`) VALUES
(1, 4, 1, 5, 'Highly responsive sales representative! Explained all options clearly.', '2026-05-30'),
(2, 4, 2, 4, 'Friendly and fast purchase checkout.', '2026-05-28'),
(3, 3, 1, 5, 'My iPhone screen was repaired perfectly in under an hour. Great job.', '2026-05-29'),
(4, 3, 3, 5, 'Highly skilled technician, very neat repair finish.', '2026-05-26'),
(5, 4, 3, 3, 'Service was fine, but had to wait in line for checkout.', '2026-05-25');

-- Alter table tbl_order_master to add ProcessedById column and set foreign keys/seeds
ALTER TABLE `tbl_order_master` ADD COLUMN `ProcessedById` INT NULL DEFAULT NULL;
ALTER TABLE `tbl_order_master` ADD CONSTRAINT `fk_order_processed_by` FOREIGN KEY (`ProcessedById`) REFERENCES `staff_users`(`id`) ON DELETE SET NULL;
UPDATE `tbl_order_master` SET `ProcessedById` = 4 WHERE `ID` IN (1, 2);
UPDATE `tbl_order_master` SET `ProcessedById` = 3 WHERE `ID` = 3;

-- --------------------------------------------------------

--
-- Re-enable foreign key checks
--
SET FOREIGN_KEY_CHECKS = 1;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
