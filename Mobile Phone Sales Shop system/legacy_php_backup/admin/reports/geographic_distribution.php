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

// 1. Get Filters
$date_from = isset($_GET['date_from']) ? mysqli_real_escape_string($conn, $_GET['date_from']) : '';
$date_to = isset($_GET['date_to']) ? mysqli_real_escape_string($conn, $_GET['date_to']) : '';
$postal_code = isset($_GET['postal_code']) ? mysqli_real_escape_string($conn, $_GET['postal_code']) : '';

$where_clauses = ["OrderStatus = 'Completed'"];
if ($date_from !== "") {
    $where_clauses[] = "OrderDate >= '$date_from 00:00:00'";
}
if ($date_to !== "") {
    $where_clauses[] = "OrderDate <= '$date_to 23:59:59'";
}
if ($postal_code !== "") {
    $where_clauses[] = "ShippingPostalCode = '$postal_code'";
}
if ($processed_filter !== "") {
    $where_clauses[] = "ProcessedById = '$admin_id'";
}
$where_sql = implode(" AND ", $where_clauses);

// Count matching regions for pagination
$count_query = "SELECT COUNT(DISTINCT ShippingPostalCode) as total FROM tbl_order_master WHERE $where_sql";
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
if ($date_from !== "") $all_params['date_from'] = $date_from;
if ($date_to !== "") $all_params['date_to'] = $date_to;
if ($postal_code !== "") $all_params['postal_code'] = $postal_code;

// Fetch all regions matching filters to construct the KPI summaries and Charts
$geo_all_q = mysqli_query($conn, "
    SELECT ShippingPostalCode, COUNT(ID) as OrderCount, SUM(TotalAmount) as TotalRevenue, AVG(TotalAmount) as AvgOrderValue
    FROM tbl_order_master
    WHERE $where_sql
    GROUP BY ShippingPostalCode
    ORDER BY TotalRevenue DESC
");

$geo_data_all = [];
$total_orders = 0;
$total_rev = 0;

while ($row = mysqli_fetch_assoc($geo_all_q)) {
    $postal = $row['ShippingPostalCode'];
    
    // Map postal codes to clear areas/cities in Sri Lanka
    if ($postal === '00300') {
        $city = "Colombo 03";
        $province = "Western Province";
    } elseif ($postal === '20400') {
        $city = "Peradeniya";
        $province = "Central Province";
    } elseif ($postal === '60000') {
        $city = "Kurunegala";
        $province = "North Western Province";
    } else {
        $fallback_q = mysqli_query($conn, "SELECT ShippingAddress FROM tbl_order_master WHERE ShippingPostalCode='$postal' LIMIT 1");
        $fallback_address = mysqli_fetch_row($fallback_q)[0] ?? '';
        $addr_parts = explode(',', $fallback_address);
        $city = trim(end($addr_parts));
        if (empty($city)) {
            $city = "Postal Code: " . $postal;
        }
        $province = "Other Region";
    }
    
    $row['city'] = $city;
    $row['province'] = $province;
    
    $total_orders += $row['OrderCount'];
    $total_rev += $row['TotalRevenue'];
    $geo_data_all[] = $row;
}

// Fetch paginated regions
$geo_q = mysqli_query($conn, "
    SELECT ShippingPostalCode, COUNT(ID) as OrderCount, SUM(TotalAmount) as TotalRevenue, AVG(TotalAmount) as AvgOrderValue
    FROM tbl_order_master
    WHERE $where_sql
    GROUP BY ShippingPostalCode
    ORDER BY TotalRevenue DESC
    LIMIT $limit OFFSET $offset
");

$geo_data = [];
while ($row = mysqli_fetch_assoc($geo_q)) {
    foreach ($geo_data_all as $g_all) {
        if ($g_all['ShippingPostalCode'] === $row['ShippingPostalCode']) {
            $geo_data[] = $g_all;
            break;
        }
    }
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
                    <li class="breadcrumb-item active" aria-current="page">Geographic Customer</li>
                </ol>
            </nav>

            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="fw-bold text-dark mb-1"><i class="bi bi-geo-alt-fill text-dark me-2"></i>Geographic Customer Distribution</h3>
                    <p class="text-muted mb-0 small">Order sales volume and revenue contributions ranked by destination cities. | Generated: <?= date('M d, Y h:i A'); ?></p>
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
                            <label class="form-label small fw-semibold mb-1">Date From</label>
                            <input type="date" name="date_from" class="form-control" value="<?= htmlspecialchars($date_from); ?>">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small fw-semibold mb-1">Date To</label>
                            <input type="date" name="date_to" class="form-control" value="<?= htmlspecialchars($date_to); ?>">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small fw-semibold mb-1">Postal Code</label>
                            <input type="text" name="postal_code" class="form-control" placeholder="e.g. 00300" value="<?= htmlspecialchars($postal_code); ?>">
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
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-primary border-4">
                        <span class="text-muted small text-uppercase">Total Fulfilled Orders</span>
                        <h4 class="fw-bold text-primary mb-0 mt-1"><?= $total_orders; ?> orders</h4>
                        <small class="text-muted">Total shipped sales transactions</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-success border-4">
                        <span class="text-muted small text-uppercase">Total Geographical Revenue</span>
                        <h4 class="fw-bold text-success mb-0 mt-1">Rs. <?= number_format($total_rev, 2); ?></h4>
                        <small class="text-muted">Total income across regions</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-info border-4">
                        <span class="text-muted small text-uppercase">Key High Demand Region</span>
                        <?php 
                        $top_city = count($geo_data) > 0 ? $geo_data[0]['city'] : 'N/A';
                        ?>
                        <h4 class="fw-bold text-info mb-0 mt-1"><?= htmlspecialchars($top_city); ?></h4>
                        <small class="text-muted">Highest sales contribution area</small>
                    </div>
                </div>
            </div>

            <!-- Visual Analytics Charts Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-7">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-bar-chart-line-fill text-dark me-2"></i>Regional Revenue Contribution (LKR)
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="geoRevChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-pie-chart-fill text-primary me-2"></i>Regional Market Share (%)
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="geoShareChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Geographic Ledger -->
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white fw-bold py-3">
                    <i class="bi bi-map-fill text-dark me-2"></i>Regional Demand & Revenue Ledger
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3">Target City / Area</th>
                                    <th>State / Province</th>
                                    <th class="text-center">Postal Code</th>
                                    <th class="text-center">Orders Placed</th>
                                    <th>Total Sales Revenue</th>
                                    <th>Average Ticket Value</th>
                                    <th class="text-end pe-3">Regional Share %</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (count($geo_data) > 0): ?>
                                    <?php foreach ($geo_data as $geo): ?>
                                        <?php 
                                        $share_pct = ($total_rev > 0) ? ($geo['TotalRevenue'] / $total_rev) * 100 : 0;
                                        ?>
                                        <tr>
                                            <td class="ps-3 fw-bold text-dark fs-6"><?= htmlspecialchars($geo['city']); ?></td>
                                            <td><span class="text-muted small"><?= htmlspecialchars($geo['province']); ?></span></td>
                                            <td class="text-center"><span class="badge bg-light text-dark border"><?= htmlspecialchars($geo['ShippingPostalCode']); ?></span></td>
                                            <td class="text-center fw-semibold"><?= $geo['OrderCount']; ?> orders</td>
                                            <td class="text-primary fw-bold">Rs. <?= number_format($geo['TotalRevenue'], 2); ?></td>
                                            <td class="text-success fw-semibold">Rs. <?= number_format($geo['AvgOrderValue'], 2); ?></td>
                                            <td class="text-end fw-bold text-dark pe-3">
                                                <?= number_format($share_pct, 1); ?>%
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <tr>
                                        <td colspan="7" class="text-center py-4 text-muted">No regional sales transactions found.</td>
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
                                <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                            <?php endif; ?>
                            <?php for($i = $start_page; $i <= $end_page; $i++): ?>
                                <li class="page-item <?= ($page == $i) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?<?= http_build_query(array_merge($all_params, ['page' => $i])); ?>"><?= $i; ?></a>
                                </li>
                            <?php endfor; ?>
                            <?php if ($end_page < $total_pages - 1): ?>
                                <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
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
    $g_cities = array_map(function($g){ return $g['city']; }, $geo_data_all);
    $g_revs = array_map(function($g){ return (float)$g['TotalRevenue']; }, $geo_data_all);
    $g_orders = array_map(function($g){ return (int)$g['OrderCount']; }, $geo_data_all);
    ?>

    const cities = <?= json_encode($g_cities); ?>;
    const revs = <?= json_encode($g_revs); ?>;

    // Revenue Bar Chart
    const revCtx = document.getElementById('geoRevChart').getContext('2d');
    new Chart(revCtx, {
        type: 'bar',
        data: {
            labels: cities,
            datasets: [{
                label: 'Total Regional Revenue (LKR)',
                data: revs,
                backgroundColor: '#468499',
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

    // Market Share Doughnut Chart
    const shareCtx = document.getElementById('geoShareChart').getContext('2d');
    new Chart(shareCtx, {
        type: 'doughnut',
        data: {
            labels: cities,
            datasets: [{
                data: revs,
                backgroundColor: ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ff5200', '#008080', '#9f6400'],
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
