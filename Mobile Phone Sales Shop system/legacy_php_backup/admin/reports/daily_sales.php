<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../../config/db.php');

$required_roles = ['Admin', 'Sales person'];
include("../../includes/admin/auth_admin.php");

$admin_id = $_SESSION['imsaid'];
$admin_role = $_SESSION['admin_role'];

// Add ProcessedById filter if Sales role
$processed_filter = "";
$processed_filter_m = "";
if ($admin_role === 'Sales person') {
    $processed_filter = " AND ProcessedById = '$admin_id'";
    $processed_filter_m = " AND m.ProcessedById = '$admin_id'";
}

// 1. Get Date Filter
$filter_date = date('Y-m-d');
if (isset($_GET['filter_date']) && $_GET['filter_date'] !== "") {
    $filter_date = mysqli_real_escape_string($conn, $_GET['filter_date']);
}

// 2. Fetch Sales Metrics
$total_sales_q = mysqli_query($conn, "SELECT SUM(TotalAmount), COUNT(ID) FROM tbl_order_master WHERE DATE(OrderDate) = '$filter_date' AND OrderStatus = 'Completed' $processed_filter");
$sales_row = mysqli_fetch_row($total_sales_q);
$total_sales = $sales_row[0] ?? 0;
$order_count = $sales_row[1] ?? 0;

// 3. Phones Sold
$phones_sold_q = mysqli_query($conn, "SELECT SUM(oi.ProductQty) 
                                      FROM tbl_order_items oi 
                                      JOIN tblproduct_variants v ON oi.VariantId = v.ID
                                      JOIN tblproducts p ON v.ProductId = p.ID 
                                      JOIN tbl_order_master m ON oi.OrderMasterId = m.ID 
                                      WHERE DATE(m.OrderDate) = '$filter_date' AND m.OrderStatus = 'Completed' AND p.CategoryName = 'Smartphone' $processed_filter_m");
$phones_sold = mysqli_fetch_row($phones_sold_q)[0] ?? 0;

// 4. Accessories Sold
$accessories_sold_q = mysqli_query($conn, "SELECT SUM(oi.ProductQty) 
                                           FROM tbl_order_items oi 
                                           JOIN tblproduct_variants v ON oi.VariantId = v.ID
                                           JOIN tblproducts p ON v.ProductId = p.ID 
                                           JOIN tbl_order_master m ON oi.OrderMasterId = m.ID 
                                           WHERE DATE(m.OrderDate) = '$filter_date' AND m.OrderStatus = 'Completed' AND p.CategoryName = 'Accessories' $processed_filter_m");
$accessories_sold = mysqli_fetch_row($accessories_sold_q)[0] ?? 0;

// 5. Repair Income
$repair_income_q = mysqli_query($conn, "SELECT SUM(Income), SUM(Cost) FROM tbl_repairs WHERE RepairDate = '$filter_date' AND Status = 'Completed'");
$repair_row = mysqli_fetch_row($repair_income_q);
$repair_income = $repair_row[0] ?? 0;
$repair_cost = $repair_row[1] ?? 0;
$repair_profit = $repair_income - $repair_cost;

// 6. Payment Methods Breakdown
$cod_sales_q = mysqli_query($conn, "SELECT SUM(TotalAmount), COUNT(ID) FROM tbl_order_master WHERE DATE(OrderDate) = '$filter_date' AND OrderStatus = 'Completed' AND PaymentMethod = 'COD' $processed_filter");
$cod_row = mysqli_fetch_row($cod_sales_q);
$cod_sales = $cod_row[0] ?? 0;
$cod_count = $cod_row[1] ?? 0;

$card_sales_q = mysqli_query($conn, "SELECT SUM(TotalAmount), COUNT(ID) FROM tbl_order_master WHERE DATE(OrderDate) = '$filter_date' AND OrderStatus = 'Completed' AND PaymentMethod = 'Card' $processed_filter");
$card_row = mysqli_fetch_row($card_sales_q);
$card_sales = $card_row[0] ?? 0;
$card_count = $card_row[1] ?? 0;

$other_sales = $total_sales - $cod_sales - $card_sales;

// 7. Sales Profits Calculation (Buy vs Sell Price)
$sales_profit = 0;
$sales_items_q = mysqli_query($conn, "
    SELECT oi.ProductQty, oi.ProductPrice, 
           IFNULL((SELECT CostPrice FROM tbl_stock_batches WHERE VariantId = oi.VariantId LIMIT 1), oi.ProductPrice * 0.75) as cost_price 
    FROM tbl_order_items oi 
    JOIN tbl_order_master m ON oi.OrderMasterId = m.ID 
    WHERE DATE(m.OrderDate) = '$filter_date' AND m.OrderStatus = 'Completed' $processed_filter_m
");

while ($item = mysqli_fetch_assoc($sales_items_q)) {
    $item_profit = ($item['ProductPrice'] - $item['cost_price']) * $item['ProductQty'];
    $sales_profit += $item_profit;
}

$total_profit = $sales_profit + $repair_profit;

// 8. Order Item Listing with Pagination
$count_query = "
    SELECT COUNT(oi.ID) as total
    FROM tbl_order_items oi
    JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
    JOIN tblproduct_variants v ON oi.VariantId = v.ID
    JOIN tblproducts p ON v.ProductId = p.ID
    WHERE DATE(m.OrderDate) = '$filter_date' AND m.OrderStatus = 'Completed' $processed_filter_m
";
$count_res = mysqli_query($conn, $count_query);
$total_rows = mysqli_fetch_assoc($count_res)['total'] ?? 0;

$limit = 10;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int) $_GET['page'] : 1;
if ($page < 1)
    $page = 1;
$total_pages = ceil($total_rows / $limit);
if ($page > $total_pages && $total_pages > 0)
    $page = $total_pages;
$offset = ($page - 1) * $limit;

$ledger_q = mysqli_query($conn, "
    SELECT m.OrderNumber, m.PaymentMethod, oi.ProductQty, oi.ProductPrice, p.ProductName, p.CategoryName, v.Color, v.RAM, v.ROM
    FROM tbl_order_items oi
    JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
    JOIN tblproduct_variants v ON oi.VariantId = v.ID
    JOIN tblproducts p ON v.ProductId = p.ID
    WHERE DATE(m.OrderDate) = '$filter_date' AND m.OrderStatus = 'Completed' $processed_filter_m
    LIMIT $limit OFFSET $offset
");

$all_params = ['filter_date' => $filter_date];
?>
<?php include('../../includes/admin/header.php'); ?>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">

<style>
    body {
        font-family: 'Outfit', sans-serif;
        background-color: #f4f6f9;
    }

    .card-kpi {
        border: none;
        border-radius: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }

    @media print {
        .no-print {
            display: none !important;
        }

        body {
            background-color: #fff;
        }

        .sidebar {
            display: none !important;
        }

        .col-md-10 {
            width: 100% !important;
            flex: 0 0 100% !important;
            max-width: 100% !important;
        }
    }
</style>

<div class="container-fluid">
    <div class="row">
        <!-- Sidebar -->
        <?php include '../../includes/admin/sidebar.php'; ?>

        <!-- Main Content -->
        <div class="col-md-10 p-4">

            <!-- Breadcrumbs -->
            <nav aria-label="breadcrumb" class="no-print">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="../dashboard.php" class="text-decoration-none">Home</a></li>
                    <li class="breadcrumb-item"><a href="../reports.php" class="text-decoration-none">Reports</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Daily Sales</li>
                </ol>
            </nav>

            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="fw-bold text-dark mb-1"><i class="bi bi-calendar3 text-primary me-2"></i>Daily Sales
                        Performance</h3>
                    <p class="text-muted mb-0 small">Generated Date:
                        <strong><?= date('M d, Y', strtotime($filter_date)); ?></strong> | Created:
                        <?= date('M d, Y h:i A'); ?></p>
                </div>
                <div class="d-flex gap-2 no-print">
                    <button onclick="window.print()" class="btn btn-outline-primary rounded-pill px-4"><i
                            class="bi bi-printer me-1"></i> Print Report</button>
                    <a href="../reports.php" class="btn btn-outline-secondary rounded-pill px-3"><i
                            class="bi bi-arrow-left"></i> Back</a>
                </div>
            </div>

            <!-- Date Filter Bar -->
            <div class="card shadow-sm border-0 mb-4 no-print">
                <div class="card-body">
                    <form method="get" class="d-flex align-items-end gap-3 flex-wrap">
                        <div style="min-width: 250px;">
                            <label class="form-label small fw-semibold mb-1">Choose Report Date</label>
                            <input type="date" name="filter_date" class="form-control"
                                value="<?= htmlspecialchars($filter_date); ?>" required>
                        </div>
                        <div>
                            <button type="submit" class="btn btn-primary px-4" style="height: 38px;"><i
                                    class="bi bi-funnel"></i> Generate Report</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Sales Volume Target Alert -->
            <?php if ($total_sales >= 150000): ?>
                <div class="alert alert-success border-success shadow-sm d-flex align-items-center mb-4 no-print"
                    role="alert">
                    <i class="bi bi-check-circle-fill fs-4 me-3 text-success"></i>
                    <div>
                        <strong class="text-dark">Daily Sales Target Met:</strong> Today's completed order volume (Rs.
                        <?= number_format($total_sales, 2); ?>) has exceeded the daily operational target of Rs. 150,000.00!
                        Excellent performance.
                    </div>
                </div>
            <?php else: ?>
                <div class="alert alert-warning border-warning shadow-sm d-flex align-items-center mb-4 no-print"
                    role="alert">
                    <i class="bi bi-exclamation-triangle-fill fs-4 me-3 text-warning"></i>
                    <div>
                        <strong class="text-dark">Daily Sales Target Pending:</strong> Today's revenue of Rs.
                        <?= number_format($total_sales, 2); ?> is below the daily target threshold of Rs. 150,000.00.
                        Consider promotional marketing actions.
                    </div>
                </div>
            <?php endif; ?>

            <!-- KPI Row -->
            <div class="row g-3 mb-4">
                <div class="col-xl col-md-6 col-sm-12">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-primary border-4">
                        <span class="text-muted small text-uppercase">Total Sales</span>
                        <h4 class="fw-bold text-primary mb-0 mt-1">Rs. <?= number_format($total_sales, 2); ?></h4>
                        <small class="text-muted"><?= $order_count; ?> Orders Completed</small>
                    </div>
                </div>
                <div class="col-xl col-md-6 col-sm-12">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-success border-4">
                        <span class="text-muted small text-uppercase">Net Profit</span>
                        <h4 class="fw-bold text-success mb-0 mt-1">Rs. <?= number_format($total_profit, 2); ?></h4>
                        <small class="text-muted">Sales + Repair Margin</small>
                    </div>
                </div>
                <div class="col-xl col-md-6 col-sm-12">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-info border-4">
                        <span class="text-muted small text-uppercase">Phones Sold</span>
                        <h4 class="fw-bold text-info mb-0 mt-1"><?= $phones_sold; ?> units</h4>
                        <small class="text-muted">Smartphones Category</small>
                    </div>
                </div>
                <div class="col-xl col-md-6 col-sm-12">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-warning border-4">
                        <span class="text-muted small text-uppercase">Accessories Sold</span>
                        <h4 class="fw-bold text-warning mb-0 mt-1"><?= $accessories_sold; ?> units</h4>
                        <small class="text-muted">Peripherals & Cases</small>
                    </div>
                </div>
                <div class="col-xl col-md-6 col-sm-12">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-secondary border-4">
                        <span class="text-muted small text-uppercase">Repair Income</span>
                        <h4 class="fw-bold text-secondary mb-0 mt-1">Rs. <?= number_format($repair_income, 2); ?></h4>
                        <small class="text-muted">Profit: Rs. <?= number_format($repair_profit, 2); ?></small>
                    </div>
                </div>
            </div>

            <!-- Visual Analytics Charts Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-6">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-pie-chart-fill text-primary me-2"></i>Payment Channel Distribution
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="paymentChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-bar-chart-line-fill text-success me-2"></i>Daily Financial Performance
                            Breakdown
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="financialChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Content Row -->
            <div class="row g-4 mb-4">
                <!-- Payment Channels breakdown -->
                <div class="col-md-4">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-wallet2 text-primary me-2"></i>Payment Breakdown
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                                    <div>
                                        <i class="bi bi-cash-stack text-success me-2"></i> Cash on Delivery (COD)
                                        <div class="small text-muted ps-4"><?= $cod_count; ?> transactions</div>
                                    </div>
                                    <span class="fw-bold">Rs. <?= number_format($cod_sales, 2); ?></span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                                    <div>
                                        <i class="bi bi-credit-card text-primary me-2"></i> Credit/Debit Card
                                        <div class="small text-muted ps-4"><?= $card_count; ?> transactions</div>
                                    </div>
                                    <span class="fw-bold">Rs. <?= number_format($card_sales, 2); ?></span>
                                </li>
                                <?php if ($other_sales > 0): ?>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                                        <div>
                                            <i class="bi bi-question-circle text-muted me-2"></i> Other Modes
                                        </div>
                                        <span class="fw-bold">Rs. <?= number_format($other_sales, 2); ?></span>
                                    </li>
                                <?php endif; ?>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Products Sold Ledger -->
                <div class="col-md-8">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-file-text text-success me-2"></i>Daily Order Itemization
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="ps-3">Order No.</th>
                                            <th>Product Name</th>
                                            <th>Category</th>
                                            <th class="text-center">Qty</th>
                                            <th>Payment</th>
                                            <th class="text-end pe-3">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php if (mysqli_num_rows($ledger_q) > 0): ?>
                                            <?php while ($row = mysqli_fetch_assoc($ledger_q)):
                                                $displayName = htmlspecialchars($row['ProductName']);
                                                if (!empty($row['Color']) || !empty($row['ROM'])) {
                                                    $displayName .= " - " . htmlspecialchars($row['Color']) . " (" . htmlspecialchars($row['ROM']) . " / " . htmlspecialchars($row['RAM']) . ")";
                                                }
                                                ?>
                                                <tr>
                                                    <td class="ps-3 fw-bold"><?= htmlspecialchars($row['OrderNumber']); ?></td>
                                                    <td class="fw-semibold text-dark"><?= $displayName; ?></td>
                                                    <td><?= htmlspecialchars($row['CategoryName']); ?></td>
                                                    <td class="text-center"><span
                                                            class="badge bg-secondary bg-opacity-10 text-dark px-2.5 py-1.5"><?= $row['ProductQty']; ?></span>
                                                    </td>
                                                    <td><span
                                                            class="badge bg-light text-dark border"><?= htmlspecialchars($row['PaymentMethod']); ?></span>
                                                    </td>
                                                    <td class="text-end fw-bold text-primary pe-3">Rs.
                                                        <?= number_format($row['ProductPrice'] * $row['ProductQty'], 2); ?></td>
                                                </tr>
                                            <?php endwhile; ?>
                                        <?php else: ?>
                                            <tr>
                                                <td colspan="6" class="text-center py-4 text-muted">No products were sold on
                                                    this day.</td>
                                            </tr>
                                        <?php endif; ?>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Pagination Controls -->
                            <?php if ($total_pages > 1): ?>
                                <nav class="d-flex justify-content-center my-3 no-print">
                                    <ul class="pagination pagination-custom gap-1">
                                        <li class="page-item <?= ($page <= 1) ? 'disabled' : ''; ?>">
                                            <a class="page-link"
                                                href="?<?= http_build_query(array_merge($all_params, ['page' => $page - 1])); ?>"
                                                aria-label="Previous">
                                                <span aria-hidden="true">&laquo;</span>
                                            </a>
                                        </li>

                                        <?php
                                        $range = 2;
                                        $start_page = $page - $range;
                                        $end_page = $page + $range;
                                        if ($start_page <= 2) {
                                            $end_page += (3 - $start_page);
                                            $start_page = 2;
                                        }
                                        if ($end_page >= $total_pages - 1) {
                                            $start_page -= ($end_page - ($total_pages - 2));
                                            $end_page = $total_pages - 1;
                                        }
                                        $start_page = max(2, $start_page);
                                        $end_page = min($total_pages - 1, $end_page);
                                        ?>
                                        <li class="page-item <?= ($page == 1) ? 'active' : ''; ?>">
                                            <a class="page-link"
                                                href="?<?= http_build_query(array_merge($all_params, ['page' => 1])); ?>">1</a>
                                        </li>
                                        <?php if ($start_page > 2): ?>
                                            <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                                        <?php endif; ?>
                                        <?php for ($i = $start_page; $i <= $end_page; $i++): ?>
                                            <li class="page-item <?= ($page == $i) ? 'active' : ''; ?>">
                                                <a class="page-link"
                                                    href="?<?= http_build_query(array_merge($all_params, ['page' => $i])); ?>"><?= $i; ?></a>
                                            </li>
                                        <?php endfor; ?>
                                        <?php if ($end_page < $total_pages - 1): ?>
                                            <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                                        <?php endif; ?>
                                        <?php if ($total_pages > 1): ?>
                                            <li class="page-item <?= ($page == $total_pages) ? 'active' : ''; ?>">
                                                <a class="page-link"
                                                    href="?<?= http_build_query(array_merge($all_params, ['page' => $total_pages])); ?>"><?= $total_pages; ?></a>
                                            </li>
                                        <?php endif; ?>

                                        <li class="page-item <?= ($page >= $total_pages) ? 'disabled' : ''; ?>">
                                            <a class="page-link"
                                                href="?<?= http_build_query(array_merge($all_params, ['page' => $page + 1])); ?>"
                                                aria-label="Next">
                                                <span aria-hidden="true">&raquo;</span>
                                            </a>
                                        </li>
                                    </ul>
                                </nav>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Repairs Ledger -->
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white fw-bold py-3">
                    <i class="bi bi-tools text-secondary me-2"></i>Completed Repairs Log
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3">Client Name</th>
                                    <th>Device Name</th>
                                    <th>Issue Repaired</th>
                                    <th>Cost of Parts</th>
                                    <th>Total Charged</th>
                                    <th class="text-end pe-3">Net Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $repairs_log_q = mysqli_query($conn, "
                                    SELECT CustomerName, DeviceName, Issue, Cost, Income
                                    FROM tbl_repairs
                                    WHERE RepairDate = '$filter_date' AND Status = 'Completed'
                                ");
                                if (mysqli_num_rows($repairs_log_q) > 0):
                                    while ($rep = mysqli_fetch_assoc($repairs_log_q)):
                                        ?>
                                        <tr>
                                            <td class="ps-3 fw-bold"><?= htmlspecialchars($rep['CustomerName']); ?></td>
                                            <td><?= htmlspecialchars($rep['DeviceName']); ?></td>
                                            <td><?= htmlspecialchars($rep['Issue']); ?></td>
                                            <td class="text-danger">Rs. <?= number_format($rep['Cost'], 2); ?></td>
                                            <td class="text-success fw-semibold">Rs. <?= number_format($rep['Income'], 2); ?>
                                            </td>
                                            <td class="text-end fw-bold text-primary pe-3">Rs.
                                                <?= number_format($rep['Income'] - $rep['Cost'], 2); ?></td>
                                        </tr>
                                    <?php
                                    endwhile;
                                else:
                                    ?>
                                    <tr>
                                        <td colspan="6" class="text-center py-4 text-muted">No repair work completed on this
                                            day.</td>
                                    </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function () {
        const payCtx = document.getElementById('paymentChart').getContext('2d');
        new Chart(payCtx, {
            type: 'doughnut',
            data: {
                labels: ['Cash on Delivery (COD)', 'Credit/Debit Card', 'Other Modes'],
                datasets: [{
                    data: [<?= (float) $cod_sales; ?>, <?= (float) $card_sales; ?>, <?= (float) $other_sales; ?>],
                    backgroundColor: ['#10b981', '#0284c7', '#6b7280'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        const finCtx = document.getElementById('financialChart').getContext('2d');
        new Chart(finCtx, {
            type: 'bar',
            data: {
                labels: ['Total Sales', 'Net Profit', 'Repair Income', 'Repair Profit'],
                datasets: [{
                    label: 'Amount (LKR)',
                    data: [<?= (float) $total_sales; ?>, <?= (float) $total_profit; ?>, <?= (float) $repair_income; ?>, <?= (float) $repair_profit; ?>],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    });
</script>

<?php include '../../includes/admin/footer.php'; ?>