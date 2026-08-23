-- Create stock log table to record all stock movement logs (Restocks, Sales, Manual Corrections)
CREATE TABLE IF NOT EXISTS `tbl_stock_log` (
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

-- Seed the log table using current stock counts from tblproducts as the initial baseline
INSERT INTO tbl_stock_log (ProductId, Quantity, MovementType, ReferenceInfo, LogDate)
SELECT ID, Stock, 'Restock', 'Initial Baseline Import', CreationDate 
FROM tblproducts
WHERE ID NOT IN (SELECT DISTINCT ProductId FROM tbl_stock_log);
