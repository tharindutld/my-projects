-- Migration SQL for loyalty program
ALTER TABLE tbluser ADD COLUMN LoyaltyPoints INT NOT NULL DEFAULT 0;
ALTER TABLE tbl_order_master ADD COLUMN PointsAwarded TINYINT(1) NOT NULL DEFAULT 0;
