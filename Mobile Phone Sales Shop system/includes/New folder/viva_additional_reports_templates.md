# Mobile Store Management System — Viva Prep Guide: 10 Additional Reports

This document contains 10 report ideas that examiners frequently ask students to implement to test their database and coding skills. Each report below includes a brief explanation and a **complete, copy-pasteable PHP code template** that you can save as a new file (e.g. in `admin/reports/`) to run immediately.

---

## Index of Additional Reports
1. [Low Stock Alerts & Reorder Report](#1-low-stock-alerts--reorder-report-low_stock_reorderphp)
2. [Repair Workload & Technician Status Report](#2-repair-workload--technician-status-report-repair_workloadphp)
3. [Category-wise Revenue & Contribution Report](#3-category-wise-revenue--contribution-report-category_contributionphp)
4. [Loyalty Points Impact & Redemptions Report](#4-loyalty-points-impact--redemptions-report-loyalty_impactphp)
5. [Warranty Claim & Return Reason Audit Report](#5-warranty-claim--return-reason-audit-report-warranty_costphp)
6. [Payment Method Financial Settlement Report](#6-payment-method-financial-settlement-report-payment_settlementphp)
7. [Discount & Promotion Effectiveness Report](#7-discount--promotion-effectiveness-report-promo_effectivenessphp)
8. [Customer Retention & Repeat Buyer Leaderboard](#8-customer-retention--repeat-buyer-leaderboard-customer_retentionphp)
9. [Cancelled & Returned Orders Audit Log](#9-cancelled--returned-orders-audit-log-order_cancellationsphp)
10. [Device Service & Repair Profitability Analysis](#10-device-service--repair-profitability-analysis-repair_profitabilityphp)

---

### 1. Low Stock Alerts & Reorder Report (`low_stock_reorder.php`)
* **Goal**: Identifies product variants where the stock quantity is low (e.g. less than 5 units) so management can place replenishment orders.
* **Tables**: `tblproducts`, `tblproduct_variants`

```php
<?php
// Save as admin/reports/low_stock_reorder.php
session_start();
include('../../config/db.php');
$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

$threshold = isset($_GET['threshold']) ? (int)$_GET['threshold'] : 5;

$query = "
    SELECT v.ID as VariantId, p.ProductName, p.BrandName, p.ModelNumber, v.Color, v.RAM, v.ROM, v.Stock, v.Price
    FROM tblproduct_variants v
    JOIN tblproducts p ON v.ProductId = p.ID
    WHERE v.Stock <= $threshold AND p.Status = 1
    ORDER BY v.Stock ASC
";
$res = mysqli_query($conn, $query);
include('../../includes/admin/header.php');
?>
<div class="container-fluid">
    <div class="row">
        <?php include '../../includes/admin/sidebar.php'; ?>
        <div class="col-md-10 p-4">
            <h3 class="fw-bold mb-3">⚠️ Low Stock Alerts & Reorder Report</h3>
            
            <form method="GET" class="row g-3 mb-4 bg-white p-3 rounded shadow-sm">
                <div class="col-md-4">
                    <label class="form-label fw-bold">Stock Threshold Alert</label>
                    <input type="number" name="threshold" class="form-control" value="<?= $threshold; ?>">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="submit" class="btn btn-primary w-100">Apply Filter</button>
                </div>
            </form>

            <div class="card border-0 shadow-sm">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Product Details</th>
                                <th>Model Number</th>
                                <th class="text-center">Stock Level</th>
                                <th>Price (LKR)</th>
                                <th class="text-end">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php while($row = mysqli_fetch_assoc($res)): ?>
                            <tr>
                                <td>
                                    <span class="text-muted small"><?= $row['BrandName']; ?></span>
                                    <strong class="d-block"><?= htmlspecialchars($row['ProductName']); ?> (<?= $row['Color']; ?>)</strong>
                                </td>
                                <td><?= $row['ModelNumber']; ?></td>
                                <td class="text-center">
                                    <span class="badge bg-danger fs-6"><?= $row['Stock']; ?> units</span>
                                </td>
                                <td>Rs. <?= number_format($row['Price'], 2); ?></td>
                                <td class="text-end">
                                    <span class="badge bg-opacity-10 bg-danger text-danger">Reorder Required</span>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
<?php include '../../includes/admin/footer.php'; ?>
```

---

### 2. Repair Workload & Technician Status Report (`repair_workload.php`)
* **Goal**: Displays active, completed, and pending repairs assigned to each technician.
* **Tables**: `tbl_repairs`, `staff_users`

```php
<?php
// Save as admin/reports/repair_workload.php
session_start();
include('../../config/db.php');
$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

$query = "
    SELECT s.id, s.first_name, s.last_name,
           SUM(CASE WHEN r.Status = 'Pending' THEN 1 ELSE 0 END) as PendingCount,
           SUM(CASE WHEN r.Status = 'In Progress' THEN 1 ELSE 0 END) as ProgressCount,
           SUM(CASE WHEN r.Status = 'Completed' THEN 1 ELSE 0 END) as CompletedCount,
           COUNT(r.ID) as TotalAssigned
    FROM staff_users s
    LEFT JOIN tbl_repairs r ON s.id = r.TechnicianId
    WHERE s.role = 'Technician' AND s.status = 'Active'
    GROUP BY s.id
";
$res = mysqli_query($conn, $query);
include('../../includes/admin/header.php');
?>
<div class="container-fluid">
    <div class="row">
        <?php include '../../includes/admin/sidebar.php'; ?>
        <div class="col-md-10 p-4">
            <h3 class="fw-bold mb-4">🔧 Repair Workload & Technician Status</h3>
            <div class="card border-0 shadow-sm">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Technician Name</th>
                            <th class="text-center">Pending Jobs</th>
                            <th class="text-center">In Progress</th>
                            <th class="text-center">Completed Jobs</th>
                            <th class="text-end">Total Assigned</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = mysqli_fetch_assoc($res)): ?>
                        <tr>
                            <td><strong><?= $row['first_name'] . ' ' . $row['last_name']; ?></strong></td>
                            <td class="text-center"><span class="badge bg-warning text-dark"><?= $row['PendingCount']; ?></span></td>
                            <td class="text-center"><span class="badge bg-info text-white"><?= $row['ProgressCount']; ?></span></td>
                            <td class="text-center"><span class="badge bg-success text-white"><?= $row['CompletedCount']; ?></span></td>
                            <td class="text-end fw-bold"><?= $row['TotalAssigned']; ?> repair orders</td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php include '../../includes/admin/footer.php'; ?>
```

---

### 3. Category-wise Revenue & Contribution Report (`category_contribution.php`)
* **Goal**: Shows sales revenues and gross profit margins breakdown per product category (e.g. Smartphones vs Accessories).
* **Tables**: `tbl_order_master`, `tbl_order_items`, `tblproduct_variants`, `tblproducts`

```php
<?php
// Save as admin/reports/category_contribution.php
session_start();
include('../../config/db.php');
$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

$query = "
    SELECT p.CategoryName, 
           COUNT(oi.ID) as TotalItemsSold, 
           SUM(oi.ProductQty * oi.ProductPrice) as TotalRevenue
    FROM tbl_order_items oi
    JOIN tblproduct_variants v ON oi.VariantId = v.ID
    JOIN tblproducts p ON v.ProductId = p.ID
    JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
    WHERE m.OrderStatus = 'Completed'
    GROUP BY p.CategoryName
    ORDER BY TotalRevenue DESC
";
$res = mysqli_query($conn, $query);
include('../../includes/admin/header.php');
?>
<div class="container-fluid">
    <div class="row">
        <?php include '../../includes/admin/sidebar.php'; ?>
        <div class="col-md-10 p-4">
            <h3 class="fw-bold mb-4">📊 Product Category Sales & Revenue Share</h3>
            <div class="card border-0 shadow-sm">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Category Name</th>
                            <th class="text-center">Units Sold</th>
                            <th class="text-end">Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = mysqli_fetch_assoc($res)): ?>
                        <tr>
                            <td><strong><?= htmlspecialchars($row['CategoryName']); ?></strong></td>
                            <td class="text-center"><?= $row['TotalItemsSold']; ?> units</td>
                            <td class="text-end text-success fw-bold">Rs. <?= number_format($row['TotalRevenue'], 2); ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php include '../../includes/admin/footer.php'; ?>
```

---

### 4. Loyalty Points Impact & Redemptions Report (`loyalty_impact.php`)
* **Goal**: Monitors customer loyalty program activity (lifetime points awarded vs. current totals).
* **Tables**: `tbluser`

```php
<?php
// Save as admin/reports/loyalty_impact.php
session_start();
include('../../config/db.php');
$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

$query = "
    SELECT ID, FirstName, LastName, Email, LoyaltyPoints, RegDate
    FROM tbluser
    WHERE LoyaltyPoints > 0
    ORDER BY LoyaltyPoints DESC
";
$res = mysqli_query($conn, $query);
include('../../includes/admin/header.php');
?>
<div class="container-fluid">
    <div class="row">
        <?php include '../../includes/admin/sidebar.php'; ?>
        <div class="col-md-10 p-4">
            <h3 class="fw-bold mb-4">🏆 Customer Loyalty Leaderboard</h3>
            <div class="card border-0 shadow-sm">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Customer Profile</th>
                            <th>Email Address</th>
                            <th>Registration Date</th>
                            <th class="text-end">Loyalty Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = mysqli_fetch_assoc($res)): ?>
                        <tr>
                            <td><strong><?= htmlspecialchars($row['FirstName'] . ' ' . $row['LastName']); ?></strong></td>
                            <td><?= htmlspecialchars($row['Email']); ?></td>
                            <td><?= date('M d, Y', strtotime($row['RegDate'])); ?></td>
                            <td class="text-end text-warning fw-bold"><i class="bi bi-star-fill"></i> <?= $row['LoyaltyPoints']; ?> Points</td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php include '../../includes/admin/footer.php'; ?>
```

---

### 5. Warranty Claim & Return Reason Audit Report (`warranty_cost.php`)
* **Goal**: Analyzes returned merchandise and defect frequencies to check product batches.
* **Tables**: `tbl_returns`, `tblproduct_variants`, `tblproducts`

```php
<?php
// Save as admin/reports/warranty_cost.php
session_start();
include('../../config/db.php');
$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

$query = "
    SELECT r.ID, p.ProductName, p.BrandName, v.Color, r.ReturnDate, r.Quantity, v.Price
    FROM tbl_returns r
    JOIN tblproduct_variants v ON r.VariantId = v.ID
    JOIN tblproducts p ON v.ProductId = p.ID
    ORDER BY r.ReturnDate DESC
";
$res = mysqli_query($conn, $query);
include('../../includes/admin/header.php');
?>
<div class="container-fluid">
    <div class="row">
        <?php include '../../includes/admin/sidebar.php'; ?>
        <div class="col-md-10 p-4">
            <h3 class="fw-bold mb-4">📦 Returns & Warranty Replacements Audit</h3>
            <div class="card border-0 shadow-sm">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Product Returned</th>
                            <th>Claim Date</th>
                            <th class="text-center">Quantity Returned</th>
                            <th class="text-end">Retail Value (Loss Impact)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = mysqli_fetch_assoc($res)): ?>
                        <tr>
                            <td>
                                <span class="text-muted small"><?= $row['BrandName']; ?></span>
                                <strong class="d-block"><?= htmlspecialchars($row['ProductName']); ?> (<?= $row['Color']; ?>)</strong>
                            </td>
                            <td><?= date('M d, Y', strtotime($row['ReturnDate'])); ?></td>
                            <td class="text-center"><?= $row['Quantity']; ?></td>
                            <td class="text-end text-danger fw-bold">Rs. <?= number_format($row['Price'] * $row['Quantity'], 2); ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php include '../../includes/admin/footer.php'; ?>
```

---

### 6. Payment Method Financial Settlement Report (`payment_settlement.php`)
* **Goal**: Summarizes transaction counts and total revenue settled by Cash-on-Delivery (COD) vs. Credit/Debit Cards.
* **Tables**: `tbl_order_master`

```php
<?php
// Save as admin/reports/payment_settlement.php
session_start();
include('../../config/db.php');
$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

$query = "
    SELECT PaymentMethod, 
           COUNT(ID) as OrderCount, 
           SUM(TotalAmount) as TotalSettled,
           AVG(TotalAmount) as AvgSettled
    FROM tbl_order_master
    WHERE OrderStatus = 'Completed'
    GROUP BY PaymentMethod
";
$res = mysqli_query($conn, $query);
include('../../includes/admin/header.php');
?>
<div class="container-fluid">
    <div class="row">
        <?php include '../../includes/admin/sidebar.php'; ?>
        <div class="col-md-10 p-4">
            <h3 class="fw-bold mb-4">💳 Payment Settlement Summary</h3>
            <div class="card border-0 shadow-sm">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Payment Channel</th>
                            <th class="text-center">Orders Settled</th>
                            <th>Average Order Value</th>
                            <th class="text-end">Total Settled Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = mysqli_fetch_assoc($res)): ?>
                        <tr>
                            <td><strong><?= htmlspecialchars($row['PaymentMethod']); ?></strong></td>
                            <td class="text-center"><?= $row['OrderCount']; ?> orders</td>
                            <td>Rs. <?= number_format($row['AvgSettled'], 2); ?></td>
                            <td class="text-end text-success fw-bold">Rs. <?= number_format($row['TotalSettled'], 2); ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php include '../../includes/admin/footer.php'; ?>
```

---

### 7. Discount & Promotion Effectiveness Report (`promo_effectiveness.php`)
* **Goal**: Tracks how many orders are using promotional coupon discounts and monitors overall profit impact.
* **Tables**: `tbl_order_master`

```php
<?php
// Save as admin/reports/promo_effectiveness.php
session_start();
include('../../config/db.php');
$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

$query = "
    SELECT COUNT(ID) as TotalPromoOrders,
           SUM(DiscountAmount) as TotalPromoDiscounts,
           SUM(TotalAmount) as RemainingRevenue
    FROM tbl_order_master
    WHERE DiscountAmount > 0 AND OrderStatus = 'Completed'
";
$res = mysqli_query($conn, $query);
$data = mysqli_fetch_assoc($res);
include('../../includes/admin/header.php');
?>
<div class="container-fluid">
    <div class="row">
        <?php include '../../includes/admin/sidebar.php'; ?>
        <div class="col-md-10 p-4">
            <h3 class="fw-bold mb-4">🏷️ Promotion & Discount Effectiveness</h3>
            <div class="row g-4 mb-4">
                <div class="col-md-4">
                    <div class="card p-3 border-start border-primary border-4 bg-white shadow-sm">
                        <span class="text-muted small">Promotional Orders</span>
                        <h4 class="fw-bold mb-0 mt-1"><?= $data['TotalPromoOrders'] ?? 0; ?> orders</h4>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card p-3 border-start border-danger border-4 bg-white shadow-sm">
                        <span class="text-muted small">Total Discount Cost</span>
                        <h4 class="fw-bold mb-0 mt-1">Rs. <?= number_format($data['TotalPromoDiscounts'] ?? 0, 2); ?></h4>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card p-3 border-start border-success border-4 bg-white shadow-sm">
                        <span class="text-muted small">Post-Promo Revenue</span>
                        <h4 class="fw-bold mb-0 mt-1">Rs. <?= number_format($data['RemainingRevenue'] ?? 0, 2); ?></h4>
                    </div>
                </div>
            </div>
            <div class="alert alert-info">
                This dashboard tracks real-time impacts of point redemptions and flat discounts on complete orders.
            </div>
        </div>
    </div>
</div>
<?php include '../../includes/admin/footer.php'; ?>
```

---

### 8. Customer Retention & Repeat Buyer Leaderboard (`customer_retention.php`)
* **Goal**: Lists customers who have ordered more than once to audit customer loyalty and lifetime value.
* **Tables**: `tbluser`, `tbl_order_master`

```php
<?php
// Save as admin/reports/customer_retention.php
session_start();
include('../../config/db.php');
$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

$query = "
    SELECT u.FirstName, u.LastName, u.Email,
           COUNT(m.ID) as CompletedOrders, 
           SUM(m.TotalAmount) as LifetimeSpend
    FROM tbl_order_master m
    JOIN tbluser u ON m.UserId = u.ID
    WHERE m.OrderStatus = 'Completed'
    GROUP BY m.UserId
    HAVING CompletedOrders > 1
    ORDER BY CompletedOrders DESC
";
$res = mysqli_query($conn, $query);
include('../../includes/admin/header.php');
?>
<div class="container-fluid">
    <div class="row">
        <?php include '../../includes/admin/sidebar.php'; ?>
        <div class="col-md-10 p-4">
            <h3 class="fw-bold mb-4">🔄 Repeat Customer Retention Leaderboard</h3>
            <div class="card border-0 shadow-sm">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Customer Name</th>
                            <th>Email Address</th>
                            <th class="text-center">Orders Placed</th>
                            <th class="text-end">Lifetime Revenue (LKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = mysqli_fetch_assoc($res)): ?>
                        <tr>
                            <td><strong><?= htmlspecialchars($row['FirstName'] . ' ' . $row['LastName']); ?></strong></td>
                            <td><?= htmlspecialchars($row['Email']); ?></td>
                            <td class="text-center fw-bold text-primary"><?= $row['CompletedOrders']; ?> orders</td>
                            <td class="text-end text-success fw-bold">Rs. <?= number_format($row['LifetimeSpend'], 2); ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php include '../../includes/admin/footer.php'; ?>
```

---

### 9. Cancelled & Returned Orders Audit Log (`order_cancellations.php`)
* **Goal**: Audit log tracking cancelled orders, showing the lost revenue value to help operations address order drops.
* **Tables**: `tbl_order_master`, `tbluser`

```php
<?php
// Save as admin/reports/order_cancellations.php
session_start();
include('../../config/db.php');
$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

$query = "
    SELECT m.OrderNumber, m.OrderDate, u.FirstName, u.LastName, m.TotalAmount, m.OrderStatus
    FROM tbl_order_master m
    JOIN tbluser u ON m.UserId = u.ID
    WHERE m.OrderStatus IN ('Cancelled', 'Returned')
    ORDER BY m.OrderDate DESC
";
$res = mysqli_query($conn, $query);
include('../../includes/admin/header.php');
?>
<div class="container-fluid">
    <div class="row">
        <?php include '../../includes/admin/sidebar.php'; ?>
        <div class="col-md-10 p-4">
            <h3 class="fw-bold mb-4">❌ Cancelled & Returned Order Audit Ledger</h3>
            <div class="card border-0 shadow-sm">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Order ID</th>
                            <th>Order Date</th>
                            <th>Client Name</th>
                            <th>Lost Transaction Value</th>
                            <th class="text-end">Resolution Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = mysqli_fetch_assoc($res)): ?>
                        <tr>
                            <td><strong>#<?= $row['OrderNumber']; ?></strong></td>
                            <td><?= date('M d, Y', strtotime($row['OrderDate'])); ?></td>
                            <td><?= htmlspecialchars($row['FirstName'] . ' ' . $row['LastName']); ?></td>
                            <td class="text-danger fw-semibold">Rs. <?= number_format($row['TotalAmount'], 2); ?></td>
                            <td class="text-end">
                                <span class="badge bg-opacity-10 <?= ($row['OrderStatus'] == 'Cancelled') ? 'bg-danger text-danger' : 'bg-warning text-dark'; ?>">
                                    <?= $row['OrderStatus']; ?>
                                </span>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php include '../../includes/admin/footer.php'; ?>
```

---

### 10. Device Service & Repair Profitability Analysis (`repair_profitability.php`)
* **Goal**: Calculates the total margin (revenue minus spare parts cost) for repair jobs to identify the most profitable services.
* **Tables**: `tbl_repairs`

```php
<?php
// Save as admin/reports/repair_profitability.php
session_start();
include('../../config/db.php');
$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

$query = "
    SELECT DeviceName, 
           COUNT(ID) as TotalRepairs,
           SUM(Income) as TotalIncome,
           SUM(Cost) as TotalSpareCost,
           SUM(Income - Cost) as TotalNetProfit
    FROM tbl_repairs
    WHERE Status = 'Completed'
    GROUP BY DeviceName
    ORDER BY TotalNetProfit DESC
";
$res = mysqli_query($conn, $query);
include('../../includes/admin/header.php');
?>
<div class="container-fluid">
    <div class="row">
        <?php include '../../includes/admin/sidebar.php'; ?>
        <div class="col-md-10 p-4">
            <h3 class="fw-bold mb-4">🔧 Device Repair & Service Profitability Analysis</h3>
            <div class="card border-0 shadow-sm">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Device / Model Repaired</th>
                            <th class="text-center">Jobs Done</th>
                            <th>Total Charged</th>
                            <th>Spare Parts Cost</th>
                            <th class="text-end">Net Service Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while($row = mysqli_fetch_assoc($res)): ?>
                        <?php 
                        $profit = $row['TotalNetProfit'];
                        ?>
                        <tr>
                            <td><strong><?= htmlspecialchars($row['DeviceName']); ?></strong></td>
                            <td class="text-center"><?= $row['TotalRepairs']; ?> repairs</td>
                            <td class="text-primary">Rs. <?= number_format($row['TotalIncome'], 2); ?></td>
                            <td class="text-danger">Rs. <?= number_format($row['TotalSpareCost'], 2); ?></td>
                            <td class="text-end text-success fw-bold">Rs. <?= number_format($profit, 2); ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php include '../../includes/admin/footer.php'; ?>
```
