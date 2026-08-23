<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../../config/db.php');

$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

// 1. Get Date and Brand Filters
$date_from = isset($_GET['date_from']) ? mysqli_real_escape_string($conn, $_GET['date_from']) : '';
$date_to = isset($_GET['date_to']) ? mysqli_real_escape_string($conn, $_GET['date_to']) : '';
$brand_name = isset($_GET['brand_name']) ? mysqli_real_escape_string($conn, $_GET['brand_name']) : '';

$where_clauses = ["m.OrderStatus = 'Completed'"];
if ($date_from !== "") {
    $where_clauses[] = "m.OrderDate >= '$date_from 00:00:00'";
}
if ($date_to !== "") {
    $where_clauses[] = "m.OrderDate <= '$date_to 23:59:59'";
}
if ($brand_name !== "") {
    $where_clauses[] = "p.BrandName = '$brand_name'";
}
$where_sql = implode(" AND ", $where_clauses);

// Count matching brands for pagination
$count_query = "
    SELECT COUNT(DISTINCT p.BrandName) as total
    FROM tbl_order_items oi
    JOIN tblproduct_variants v ON oi.VariantId = v.ID
    JOIN tblproducts p ON v.ProductId = p.ID
    JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
    WHERE $where_sql
";
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
if ($brand_name !== "") $all_params['brand_name'] = $brand_name;

// Fetch all brands matching filters to construct the KPI summaries and Charts
$kpi_query = "
    SELECT p.BrandName, 
           SUM(oi.ProductQty) as UnitsSold, 
           SUM(oi.ProductQty * oi.ProductPrice) as BrandRevenue
    FROM tbl_order_items oi
    JOIN tblproduct_variants v ON oi.VariantId = v.ID
    JOIN tblproducts p ON v.ProductId = p.ID
    JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
    WHERE $where_sql
    GROUP BY p.BrandName
    ORDER BY BrandRevenue DESC
";
$kpi_res = mysqli_query($conn, $kpi_query);

$brands_all = [];
$total_revenue_all = 0;
$total_profit_all = 0;
$total_returns_all = 0;

while ($row = mysqli_fetch_assoc($kpi_res)) {
    $bname = mysqli_real_escape_string($conn, $row['BrandName']);
    
    // Profit query (respecting date filters)
    $cost_q = mysqli_query($conn, "
        SELECT SUM(oi.ProductQty * IFNULL((SELECT CostPrice FROM tbl_stock_batches WHERE VariantId = oi.VariantId LIMIT 1), oi.ProductPrice * 0.75)) as total_cost 
        FROM tbl_order_items oi 
        JOIN tblproduct_variants v ON oi.VariantId = v.ID
        JOIN tblproducts p ON v.ProductId = p.ID 
        JOIN tbl_order_master m ON oi.OrderMasterId = m.ID 
        WHERE p.BrandName = '$bname' AND $where_sql
    ");
    $total_cost = mysqli_fetch_row($cost_q)[0] ?? 0;
    $profit = $row['BrandRevenue'] - $total_cost;
    
    // Returns query
    $return_q = mysqli_query($conn, "
        SELECT COUNT(r.ID) 
        FROM tbl_returns r 
        JOIN tblproduct_variants v ON r.VariantId = v.ID
        JOIN tblproducts p ON v.ProductId = p.ID 
        WHERE p.BrandName = '$bname'
    ");
    $return_count = mysqli_fetch_row($return_q)[0] ?? 0;
    $return_rate = ($row['UnitsSold'] > 0) ? ($return_count / $row['UnitsSold']) * 100 : 0;
    
    $row['brand_profit'] = $profit;
    $row['return_count'] = $return_count;
    $row['return_rate'] = $return_rate;
    
    $total_revenue_all += $row['BrandRevenue'];
    $total_profit_all += $profit;
    $total_returns_all += $return_count;
    
    $brands_all[] = $row;
}

// Fetch paginated brands
$query = "
    SELECT p.BrandName, 
           SUM(oi.ProductQty) as UnitsSold, 
           SUM(oi.ProductQty * oi.ProductPrice) as BrandRevenue
    FROM tbl_order_items oi
    JOIN tblproduct_variants v ON oi.VariantId = v.ID
    JOIN tblproducts p ON v.ProductId = p.ID
    JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
    WHERE $where_sql
    GROUP BY p.BrandName
    ORDER BY BrandRevenue DESC
    LIMIT $limit OFFSET $offset
";
$res = mysqli_query($conn, $query);

$brands = [];
while ($row = mysqli_fetch_assoc($res)) {
    foreach ($brands_all as $b_all) {
        if ($b_all['BrandName'] === $row['BrandName']) {
            $brands[] = $b_all;
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
                    <li class="breadcrumb-item active" aria-current="page">Brand Performance</li>
                </ol>
            </nav>

            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="fw-bold text-dark mb-1"><i class="bi bi-bookmark-star-fill text-warning me-2"></i>Brand Performance Analysis</h3>
                    <p class="text-muted mb-0 small">Overview of brand contributions, units sold, revenue margins, and warranty replacement rates. | Generated: <?= date('M d, Y h:i A'); ?></p>
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
                            <label class="form-label small fw-semibold mb-1">Brand Name</label>
                            <select name="brand_name" class="form-select">
                                <option value="">All Brands</option>
                                <?php
                                $all_brands_q = mysqli_query($conn, "SELECT DISTINCT BrandName FROM tblproducts WHERE Status=1 ORDER BY BrandName ASC");
                                while($ab = mysqli_fetch_assoc($all_brands_q)) {
                                    $selected = ($brand_name === $ab['BrandName']) ? 'selected' : '';
                                    echo "<option value='".htmlspecialchars($ab['BrandName'])."' $selected>".htmlspecialchars($ab['BrandName'])."</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <button type="submit" class="btn btn-primary w-100" style="height: 38px;"><i class="bi bi-funnel"></i> Generate Report</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Supplier Quality Alert -->
            <?php 
                $high_defect_brands = [];
                foreach ($brands as $b) {
                    if ($b['return_rate'] > 5.0) {
                        $high_defect_brands[] = htmlspecialchars($b['BrandName']) . " (" . number_format($b['return_rate'], 1) . "%)";
                    }
                }
            ?>
            <?php if (!empty($high_defect_brands)): ?>
                <div class="alert alert-warning border-warning shadow-sm d-flex align-items-center mb-4 no-print" role="alert">
                    <i class="bi bi-exclamation-triangle-fill fs-4 me-3 text-warning"></i>
                    <div>
                        <strong class="text-dark">Supplier Quality Alert:</strong> The following brands exhibit high return/defect rates: <strong><?= implode(', ', $high_defect_brands); ?></strong>. Consider reviewing supplier warranty terms or batch quality.
                    </div>
                </div>
            <?php else: ?>
                <div class="alert alert-success border-success shadow-sm d-flex align-items-center mb-4 no-print" role="alert">
                    <i class="bi bi-shield-check fs-4 me-3 text-success"></i>
                    <div>
                        <strong class="text-dark">Supplier Quality Status:</strong> All active brands are exhibiting healthy defect rates below 5.0%. Supplier contracts are compliant.
                    </div>
                </div>
            <?php endif; ?>

            <!-- KPI Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-primary border-4">
                        <span class="text-muted small text-uppercase">Total Brands Revenue</span>
                        <h4 class="fw-bold text-primary mb-0 mt-1">Rs. <?= number_format($total_revenue_all, 2); ?></h4>
                        <small class="text-muted">Combined sales across all brands</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-success border-4">
                        <span class="text-muted small text-uppercase">Total Brands Net Profit</span>
                        <h4 class="fw-bold text-success mb-0 mt-1">Rs. <?= number_format($total_profit_all, 2); ?></h4>
                        <small class="text-muted">Billed revenue minus product cost</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-danger border-4">
                        <span class="text-muted small text-uppercase">Warranty Claims Logged</span>
                        <h4 class="fw-bold text-danger mb-0 mt-1"><?= $total_returns_all; ?> claims</h4>
                        <small class="text-muted">Total items sent for return/repair</small>
                    </div>
                </div>
            </div>

            <!-- Visual Analytics Charts Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-7">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-bar-chart-line-fill text-primary me-2"></i>Brand Financial Performance (Revenue vs Profit)
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="brandFinChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-pie-chart-fill text-warning me-2"></i>Brand Share (Units Sold)
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="brandUnitsChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Brand Performance Ledger -->
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white fw-bold py-3">
                    <i class="bi bi-tags-fill text-warning me-2"></i>Brand Profitability & Return Ledger
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3">Brand Name</th>
                                    <th class="text-center">Units Sold</th>
                                    <th>Total Revenue</th>
                                    <th>Estimated Net Profit</th>
                                    <th class="text-center">Defect Count</th>
                                    <th class="text-center">Return / Defect Rate</th>
                                    <th class="text-end pe-3">Performance Index</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (count($brands) > 0): ?>
                                    <?php foreach ($brands as $b): ?>
                                        <tr>
                                            <td class="ps-3 fw-bold text-dark fs-6"><?= htmlspecialchars($b['BrandName']); ?></td>
                                            <td class="text-center"><span class="badge bg-secondary bg-opacity-10 text-dark px-3 py-1.5"><?= $b['UnitsSold']; ?> units</span></td>
                                            <td class="text-primary fw-semibold">Rs. <?= number_format($b['BrandRevenue'], 2); ?></td>
                                            <td class="text-success fw-bold">Rs. <?= number_format($b['brand_profit'], 2); ?></td>
                                            <td class="text-center"><span class="badge bg-danger bg-opacity-10 text-danger px-2.5 py-1.5"><?= $b['return_count']; ?> items</span></td>
                                            <td class="text-center fw-semibold text-danger">
                                                <?= number_format($b['return_rate'], 1); ?>%
                                            </td>
                                            <td class="text-end pe-3">
                                                <?php if($b['return_rate'] > 8): ?>
                                                    <span class="badge bg-danger bg-opacity-10 text-danger px-2.5 py-1.5"><i class="bi bi-hand-thumbs-down-fill me-1"></i> Low Quality Index</span>
                                                <?php elseif($b['brand_profit'] > 100000): ?>
                                                    <span class="badge bg-success bg-opacity-10 text-success px-2.5 py-1.5"><i class="bi bi-star-fill me-1"></i> Top Contributor</span>
                                                <?php else: ?>
                                                    <span class="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1.5">Stable</span>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <tr>
                                        <td colspan="7" class="text-center py-4 text-muted">No brand performance logs found.</td>
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
    $b_names = array_map(function($b){ return $b['BrandName']; }, $brands_all);
    $b_revs = array_map(function($b){ return (float)$b['BrandRevenue']; }, $brands_all);
    $b_profs = array_map(function($b){ return (float)$b['brand_profit']; }, $brands_all);
    $b_units = array_map(function($b){ return (int)$b['UnitsSold']; }, $brands_all);
    ?>

    const labels = <?= json_encode($b_names); ?>;
    const revData = <?= json_encode($b_revs); ?>;
    const profData = <?= json_encode($b_profs); ?>;
    const unitsData = <?= json_encode($b_units); ?>;

    // Financial Bar Chart
    const finCtx = document.getElementById('brandFinChart').getContext('2d');
    new Chart(finCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Revenue (LKR)',
                    data: revData,
                    backgroundColor: '#0284c7',
                    borderRadius: 6
                },
                {
                    label: 'Net Profit (LKR)',
                    data: profData,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Units Share Pie Chart
    const unitsCtx = document.getElementById('brandUnitsChart').getContext('2d');
    new Chart(unitsCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: unitsData,
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#b1ff00', '#ec4899', '#ff5200', '#c45000'],
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
