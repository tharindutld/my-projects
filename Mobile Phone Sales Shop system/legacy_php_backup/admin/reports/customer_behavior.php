<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../../config/db.php');

$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

// 1. Get Filters
$search = isset($_GET['search']) ? mysqli_real_escape_string($conn, $_GET['search']) : '';
if ($search !== "") {
    $search = preg_replace('/[^a-zA-Z\s]/', '', $search);
}

$min_spend = isset($_GET['min_spend']) && is_numeric($_GET['min_spend']) ? abs((float)$_GET['min_spend']) : '';
$min_loyalty = isset($_GET['min_loyalty']) && is_numeric($_GET['min_loyalty']) ? abs((int)$_GET['min_loyalty']) : '';

$where_clauses = ["m.OrderStatus = 'Completed'"];
if ($search !== "") {
    $where_clauses[] = "(u.FirstName LIKE '%$search%' OR u.LastName LIKE '%$search%')";
}
if ($min_loyalty !== "") {
    $where_clauses[] = "u.LoyaltyPoints >= $min_loyalty";
}
$where_sql = implode(" AND ", $where_clauses);

$having_clauses = [];
if ($min_spend !== "") {
    $having_clauses[] = "TotalSpend >= $min_spend";
}
$having_sql = !empty($having_clauses) ? "HAVING " . implode(" AND ", $having_clauses) : "";

// Count matching customers for pagination
if ($min_spend !== "") {
    $count_query = "
        SELECT COUNT(*) as total FROM (
            SELECT m.UserId, SUM(m.TotalAmount) as TotalSpend
            FROM tbl_order_master m
            JOIN tbluser u ON m.UserId = u.ID
            WHERE $where_sql
            GROUP BY m.UserId
            $having_sql
        ) as sub
    ";
} else {
    $count_query = "
        SELECT COUNT(DISTINCT m.UserId) as total
        FROM tbl_order_master m
        JOIN tbluser u ON m.UserId = u.ID
        WHERE $where_sql
    ";
}
$count_res = mysqli_query($conn, $count_query);
$total_rows = mysqli_fetch_assoc($count_res)['total'] ?? 0;

$limit = 10;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$total_pages = ceil($total_rows / $limit);
if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
$offset = ($page - 1) * $limit;

// Keep track of parameters for pagination links
$all_params = [];
if ($search !== "") $all_params['search'] = $search;
if ($min_spend !== "") $all_params['min_spend'] = $min_spend;
if ($min_loyalty !== "") $all_params['min_loyalty'] = $min_loyalty;

// KPI Calculations over all matching records
$kpi_query = "
    SELECT SUM(TotalSpend) as SpendSum, SUM(LoyaltyPoints) as LoyaltySum FROM (
        SELECT u.LoyaltyPoints, SUM(m.TotalAmount) as TotalSpend
        FROM tbl_order_master m
        JOIN tbluser u ON m.UserId = u.ID
        WHERE $where_sql
        GROUP BY m.UserId
        $having_sql
    ) sub
";
$kpi_res = mysqli_query($conn, $kpi_query);
$kpi_row = mysqli_fetch_assoc($kpi_res);
$total_spend_all = $kpi_row['SpendSum'] ?? 0;
$total_loyalty = $kpi_row['LoyaltySum'] ?? 0;

// Fetch paginated customer order stats
$query = "
    SELECT u.ID, u.FirstName, u.LastName, u.Email, u.RegDate, u.LoyaltyPoints,
           COUNT(m.ID) as TotalOrders, SUM(m.TotalAmount) as TotalSpend, AVG(m.TotalAmount) as AvgSpend
    FROM tbl_order_master m
    JOIN tbluser u ON m.UserId = u.ID
    WHERE $where_sql
    GROUP BY m.UserId
    $having_sql
    ORDER BY TotalSpend DESC
    LIMIT $limit OFFSET $offset
";
$res = mysqli_query($conn, $query);

$customers = [];
while ($row = mysqli_fetch_assoc($res)) {
    $uid = $row['ID'];
    
    // Find favorite brand
    $brand_q = mysqli_query($conn, "
        SELECT p.BrandName, COUNT(oi.ID) as BrandCount 
        FROM tbl_order_items oi 
        JOIN tblproduct_variants v ON oi.VariantId = v.ID
        JOIN tblproducts p ON v.ProductId = p.ID 
        JOIN tbl_order_master m ON oi.OrderMasterId = m.ID 
        WHERE m.UserId = '$uid' AND m.OrderStatus = 'Completed'
        GROUP BY p.BrandName 
        ORDER BY BrandCount DESC LIMIT 1
    ");
    $fav_brand = "N/A";
    if ($brand_q && mysqli_num_rows($brand_q) > 0) {
        $fav_brand = mysqli_fetch_assoc($brand_q)['BrandName'];
    }
    
    // Purchase Frequency
    $days_since_reg = floor((time() - strtotime($row['RegDate'])) / (60 * 60 * 24));
    if ($days_since_reg <= 0) $days_since_reg = 1;
    $orders_per_month = ($row['TotalOrders'] / $days_since_reg) * 30;
    
    $row['fav_brand'] = $fav_brand;
    $row['orders_per_month'] = $orders_per_month;
    $row['days_member'] = $days_since_reg;
    
    $customers[] = $row;
}
?>

<?php include('../../includes/admin/header.php'); ?>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">

<style>
    body { font-family: 'Outfit', sans-serif; background-color: #f4f6f9; }
    .card-kpi { border: none; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    @media print {
        .no-print { display: none !important; }
        body { background-color: #fff; }
        .sidebar { display: none !important; }
        .col-md-10 { width: 100% !important; flex: 0 0 100% !important; max-width: 100% !important; }
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
                    <li class="breadcrumb-item active" aria-current="page">Customer Behavior</li>
                </ol>
            </nav>

            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="fw-bold text-dark mb-1"><i class="bi bi-people-fill text-info me-2"></i>Customer Purchase Behavior</h3>
                    <p class="text-muted mb-0 small">Analytics ranking client purchase histories, loyalty points, average order values, and preferences. | Generated: <?= date('M d, Y h:i A'); ?></p>
                </div>
                <div class="d-flex gap-2 no-print">
                    <button onclick="window.print()" class="btn btn-outline-primary rounded-pill px-4"><i class="bi bi-printer me-1"></i> Print Report</button>
                    <a href="../reports.php" class="btn btn-outline-secondary rounded-pill px-3"><i class="bi bi-arrow-left"></i> Back</a>
                </div>
            </div>

            <!-- Form Filter Bar -->
            <div class="card shadow-sm border-0 mb-4 no-print">
                <div class="card-body">
                    <form method="get" class="row g-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small fw-semibold mb-1">Search Customer</label>
                            <input type="text" name="search" class="form-control" placeholder="Search by name..." 
                                pattern="[a-zA-Z\s]+" 
                                title="Only letters and spaces are allowed. Numbers, decimals, minus, and special characters are not permitted."
                                oninput="this.value = this.value.replace(/[^a-zA-Z\s]/g, '')"
                                value="<?= htmlspecialchars($search); ?>">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small fw-semibold mb-1">Min Spend (LKR)</label>
                            <input type="number" min="0" step="1" name="min_spend" class="form-control" placeholder="e.g. 5000" 
                                onkeypress="return event.charCode >= 48 && event.charCode <= 57"
                                oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                                value="<?= htmlspecialchars($min_spend); ?>">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small fw-semibold mb-1">Min Loyalty Points</label>
                            <input type="number" min="0" step="1" name="min_loyalty" class="form-control" placeholder="e.g. 100" 
                                onkeypress="return event.charCode >= 48 && event.charCode <= 57"
                                oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                                value="<?= htmlspecialchars($min_loyalty); ?>">
                        </div>
                        <div class="col-md-3">
                            <button type="submit" class="btn btn-primary w-100" style="height: 38px;"><i class="bi bi-funnel"></i> Generate Report</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- KPI Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-info border-4">
                        <span class="text-muted small text-uppercase">Total Store Revenue</span>
                        <h4 class="fw-bold text-info mb-0 mt-1">Rs. <?= number_format($total_spend_all, 2); ?></h4>
                        <small class="text-muted">Aggregated spend from all customers</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-warning border-4">
                        <span class="text-muted small text-uppercase">Total Loyalty Points</span>
                        <h4 class="fw-bold text-warning mb-0 mt-1"><i class="bi bi-crown text-warning me-1"></i><?= $total_loyalty; ?> points</h4>
                        <small class="text-muted">Total points awarded to clients</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-success border-4">
                        <span class="text-muted small text-uppercase">Avg Spending per Order</span>
                        <?php 
                        $overall_orders = array_sum(array_column($customers, 'TotalOrders'));
                        $overall_avg = ($overall_orders > 0) ? ($total_spend_all / $overall_orders) : 0;
                        ?>
                        <h4 class="fw-bold text-success mb-0 mt-1">Rs. <?= number_format($overall_avg, 2); ?></h4>
                        <small class="text-muted">Average customer basket size</small>
                    </div>
                </div>
            </div>

            <!-- Visual Analytics Charts Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-7">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-bar-chart-line-fill text-info me-2"></i>Top Customers Lifetime Spend (LKR)
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="custSpendChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-pie-chart-fill text-warning me-2"></i>Customer Brand Preference Share
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="custBrandChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Customer Behavior Ledger -->
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white fw-bold py-3">
                    <i class="bi bi-person-lines-fill text-info me-2"></i>Customer Purchase History Leaderboard
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3">Customer Profile</th>
                                    <th>Email</th>
                                    <th class="text-center">Orders Completed</th>
                                    <th>Total Spend</th>
                                    <th>Avg. Order Value</th>
                                    <th class="text-center">Favorite Brand</th>
                                    <th class="text-center">Frequency (Orders/Mo)</th>
                                    <th class="text-end pe-3">Loyalty Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (count($customers) > 0): ?>
                                    <?php foreach ($customers as $c): ?>
                                        <tr>
                                            <td class="ps-3">
                                                <span class="fw-bold text-dark"><?= htmlspecialchars($c['FirstName'] . ' ' . $c['LastName']); ?></span>
                                                <span class="small text-muted d-block">Member for <?= $c['days_member']; ?> days</span>
                                            </td>
                                            <td><?= htmlspecialchars($c['Email']); ?></td>
                                            <td class="text-center fw-bold"><span class="badge bg-secondary bg-opacity-10 text-dark px-3 py-1.5"><?= $c['TotalOrders']; ?></span></td>
                                            <td class="text-success fw-semibold">Rs. <?= number_format($c['TotalSpend'], 2); ?></td>
                                            <td class="text-primary">Rs. <?= number_format($c['AvgSpend'], 2); ?></td>
                                            <td class="text-center">
                                                <span class="badge bg-info bg-opacity-10 text-info px-2.5 py-1.5"><i class="bi bi-tag-fill me-1"></i><?= htmlspecialchars($c['fav_brand']); ?></span>
                                            </td>
                                            <td class="text-center fw-semibold">
                                                <?= number_format($c['orders_per_month'], 2); ?> orders
                                            </td>
                                            <td class="text-end pe-3">
                                                <span class="fw-bold text-warning"><i class="bi bi-star-fill me-1"></i><?= $c['LoyaltyPoints']; ?> pts</span>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <tr>
                                        <td colspan="8" class="text-center py-4 text-muted">No customer behavioral records found.</td>
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
                                <a class="page-link" href="?<?= http_build_query(array_merge($all_params, ['page' => $page - 1])); ?>" aria-label="Previous">
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
                                <a class="page-link" href="?<?= http_build_query(array_merge($all_params, ['page' => 1])); ?>">1</a>
                            </li>
                            <?php if ($start_page > 2): ?>
                                <li class="page-item disabled"><span class="page-link">&dots;</span></li>
                            <?php endif; ?>
                            <?php for($i = $start_page; $i <= $end_page; $i++): ?>
                                <li class="page-item <?= ($page == $i) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?<?= http_build_query(array_merge($all_params, ['page' => $i])); ?>"><?= $i; ?></a>
                                </li>
                            <?php endfor; ?>
                            <?php if ($end_page < $total_pages - 1): ?>
                                <li class="page-item disabled"><span class="page-link">&dots;</span></li>
                            <?php endif; ?>
                            <?php if ($total_pages > 1): ?>
                                <li class="page-item <?= ($page == $total_pages) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?<?= http_build_query(array_merge($all_params, ['page' => $total_pages])); ?>"><?= $total_pages; ?></a>
                                </li>
                            <?php endif; ?>
                            
                            <li class="page-item <?= ($page >= $total_pages) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?<?= http_build_query(array_merge($all_params, ['page' => $page + 1])); ?>" aria-label="Next">
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
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    <?php
    $top_cust = array_slice($customers, 0, 7);
    $c_names = array_map(function($c){ return $c['FirstName'] . ' ' . $c['LastName']; }, $top_cust);
    $c_spends = array_map(function($c){ return (float)$c['TotalSpend']; }, $top_cust);

    $brand_counts = [];
    foreach ($customers as $c) {
        $b = $c['fav_brand'] ?? 'N/A';
        if ($b !== 'N/A') {
            $brand_counts[$b] = ($brand_counts[$b] ?? 0) + 1;
        }
    }
    $b_labels = array_keys($brand_counts);
    $b_vals = array_values($brand_counts);
    ?>

    // Top Spend Bar Chart
    const spendCtx = document.getElementById('custSpendChart').getContext('2d');
    new Chart(spendCtx, {
        type: 'bar',
        data: {
            labels: <?= json_encode($c_names); ?>,
            datasets: [{
                label: 'Total Lifetime Spend (LKR)',
                data: <?= json_encode($c_spends); ?>,
                backgroundColor: '#0284c7',
                borderRadius: 6
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

    // Favorite Brand Pie Chart
    const bCtx = document.getElementById('custBrandChart').getContext('2d');
    new Chart(bCtx, {
        type: 'pie',
        data: {
            labels: <?= json_encode($b_labels); ?>,
            datasets: [{
                data: <?= json_encode($b_vals); ?>,
                backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
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
});
</script>

<?php include '../../includes/admin/footer.php'; ?>
