-- Migration to support Batch Stock and IMEI tracking
CREATE TABLE IF NOT EXISTS `tbl_stock_batches` (
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

CREATE TABLE IF NOT EXISTS `tbl_stock_imeis` (
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
