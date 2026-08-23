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
if ($admin_role === 'Sales person') {
    $processed_filter = " AND ProcessedById = '$admin_id'";
}

// 1. Get Year Filter
$filter_year = isset($_GET['filter_year']) ? mysqli_real_escape_string($conn, $_GET['filter_year']) : date('Y');

$where_clauses = ["OrderStatus = 'Completed'"];
if ($processed_filter !== "") {
    $where_clauses[] = "ProcessedById = '$admin_id'";
}
if ($filter_year !== '') {
    $where_clauses[] = "YEAR(OrderDate) = '$filter_year'";
}
$where_sql = implode(" AND ", $where_clauses);

// 2. Fetch Monthly Sales
$monthly_q = mysqli_query($conn, "
    SELECT YEAR(OrderDate) as SalesYear, MONTH(OrderDate) as SalesMonth, 
           COUNT(ID) as TotalOrders, SUM(TotalAmount) as MonthlyRevenue
    FROM tbl_order_master
    WHERE $where_sql
    GROUP BY YEAR(OrderDate), MONTH(OrderDate)
    ORDER BY SalesYear DESC, SalesMonth DESC
");

$monthly_trends = [];
$revenues = [];
while ($row = mysqli_fetch_assoc($monthly_q)) {
    $row['month_name'] = date('F', mktime(0, 0, 0, $row['SalesMonth'], 10));
    $monthly_trends[] = $row;
    $revenues[] = $row['MonthlyRevenue'];
}

// Peak and Slow months identification
$avg_monthly_rev = count($revenues) > 0 ? array_sum($revenues) / count($revenues) : 0;
$max_rev = count($revenues) > 0 ? max($revenues) : 0;
$min_rev = count($revenues) > 0 ? min($revenues) : 0;

// Count total weeks for pagination
$count_query = "
    SELECT COUNT(DISTINCT WEEK(OrderDate)) as total
    FROM tbl_order_master
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
if ($filter_year !== '') $all_params['filter_year'] = $filter_year;

// 3. Fetch all weekly trends for charts
$weekly_all_q = mysqli_query($conn, "
    SELECT WEEK(OrderDate) as SalesWeek, COUNT(ID) as TotalOrders, SUM(TotalAmount) as WeeklyRevenue
    FROM tbl_order_master
    WHERE $where_sql
    GROUP BY WEEK(OrderDate)
    ORDER BY SalesWeek DESC
");
$weekly_trends_all = [];
while ($row = mysqli_fetch_assoc($weekly_all_q)) {
    $weekly_trends_all[] = $row;
}

// Fetch paginated weekly trends
$weekly_q = mysqli_query($conn, "
    SELECT WEEK(OrderDate) as SalesWeek, COUNT(ID) as TotalOrders, SUM(TotalAmount) as WeeklyRevenue
    FROM tbl_order_master
    WHERE $where_sql
    GROUP BY WEEK(OrderDate)
    ORDER BY SalesWeek DESC
    LIMIT $limit OFFSET $offset
");

$weekly_trends = [];
while ($row = mysqli_fetch_assoc($weekly_q)) {
    $weekly_trends[] = $row;
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
                    <li class="breadcrumb-item active" aria-current="page">Seasonal Trends</li>
                </ol>
            </nav>

            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="fw-bold text-dark mb-1"><i class="bi bi-calendar-range text-dark me-2" style="color:#6f42c1;"></i>Seasonal Sales Trend Report</h3>
                    <p class="text-muted mb-0 small">Monthly and weekly revenue analysis identifying high-demand seasons and slower periods. | Generated: <?= date('M d, Y h:i A'); ?></p>
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
                        <div class="col-md-8">
                            <label class="form-label small fw-semibold mb-1">Filter by Year</label>
                            <select name="filter_year" class="form-select">
                                <option value="">All Years</option>
                                <?php
                                $years_q = mysqli_query($conn, "SELECT DISTINCT YEAR(OrderDate) as Yr FROM tbl_order_master WHERE OrderStatus='Completed' ORDER BY Yr DESC");
                                while ($y = mysqli_fetch_assoc($years_q)) {
                                    $selected = ($filter_year == $y['Yr']) ? 'selected' : '';
                                    echo "<option value='{$y['Yr']}' $selected>{$y['Yr']}</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <button type="submit" class="btn btn-primary w-100" style="height: 38px;"><i class="bi bi-funnel"></i> Generate Report</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- KPI Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-primary border-4">
                        <span class="text-muted small text-uppercase">Monthly Average Revenue</span>
                        <h4 class="fw-bold text-primary mb-0 mt-1">Rs. <?= number_format($avg_monthly_rev, 2); ?></h4>
                        <small class="text-muted">Mean monthly sales volume</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-success border-4">
                        <span class="text-muted small text-uppercase">Peak Season Spike</span>
                        <h4 class="fw-bold text-success mb-0 mt-1">Rs. <?= number_format($max_rev, 2); ?></h4>
                        <small class="text-muted">Highest recorded monthly sales</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-warning border-4">
                        <span class="text-muted small text-uppercase">Slower Period Trough</span>
                        <h4 class="fw-bold text-warning mb-0 mt-1">Rs. <?= number_format($min_rev, 2); ?></h4>
                        <small class="text-muted">Lowest recorded monthly sales</small>
                    </div>
                </div>
            </div>

            <!-- Visual Analytics Charts Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-7">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-graph-up-arrow text-primary me-2"></i>Monthly Revenue & Order Volume Trend
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="monthlyTrendChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-bar-chart-fill text-purple me-2" style="color: #6f42c1;"></i>Weekly Revenue Pattern
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="weeklyTrendChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <ul class="nav nav-tabs no-print mb-4" id="trendTab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active fw-semibold" id="monthly-tab" data-bs-toggle="tab" data-bs-target="#monthly-content" type="button" role="tab"><i class="bi bi-calendar-month me-1"></i> Monthly Trend Ledger</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link fw-semibold" id="weekly-tab" data-bs-toggle="tab" data-bs-target="#weekly-content" type="button" role="tab"><i class="bi bi-calendar-week me-1"></i> Weekly Trend Ledger (Current Year)</button>
                </li>
            </ul>

            <!-- Tab Content -->
            <div class="tab-content" id="trendTabContent">
                
                <!-- Monthly Trend Content -->
                <div class="tab-pane fade show active" id="monthly-content" role="tabpanel">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-graph-up text-primary me-2"></i>Monthly Sales Statistics
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="ps-3">Year / Month</th>
                                            <th class="text-center">Orders Completed</th>
                                            <th>Monthly Total Revenue</th>
                                            <th>Deviation from Avg</th>
                                            <th class="text-end pe-3">Season Classification</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php if (count($monthly_trends) > 0): ?>
                                            <?php foreach ($monthly_trends as $month): ?>
                                                <?php 
                                                $dev = $month['MonthlyRevenue'] - $avg_monthly_rev;
                                                $dev_pct = ($avg_monthly_rev > 0) ? ($dev / $avg_monthly_rev) * 100 : 0;
                                                ?>
                                                <tr>
                                                    <td class="ps-3">
                                                        <span class="fw-bold text-dark fs-6"><?= $month['month_name']; ?></span>
                                                        <span class="small text-muted d-block">Year: <?= $month['SalesYear']; ?></span>
                                                    </td>
                                                    <td class="text-center fw-semibold"><span class="badge bg-secondary bg-opacity-10 text-dark px-3 py-1.5"><?= $month['TotalOrders']; ?></span></td>
                                                    <td class="text-primary fw-bold">Rs. <?= number_format($month['MonthlyRevenue'], 2); ?></td>
                                                    <td class="<?= ($dev >= 0) ? 'text-success' : 'text-danger'; ?> fw-semibold">
                                                        <?= ($dev >= 0) ? '+' : ''; ?><?= number_format($dev_pct, 1); ?>%
                                                    </td>
                                                    <td class="text-end pe-3">
                                                        <?php if ($month['MonthlyRevenue'] == $max_rev): ?>
                                                            <span class="badge bg-success bg-opacity-10 text-success px-2.5 py-1.5"><i class="bi bi-fire me-1"></i> Peak Season (Spike)</span>
                                                        <?php elseif ($month['MonthlyRevenue'] == $min_rev): ?>
                                                            <span class="badge bg-danger bg-opacity-10 text-danger px-2.5 py-1.5"><i class="bi bi-snow me-1"></i> Slow Period (Trough)</span>
                                                        <?php else: ?>
                                                            <span class="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1.5">Standard Cycle</span>
                                                        <?php endif; ?>
                                                    </td>
                                                </tr>
                                            <?php endforeach; ?>
                                        <?php else: ?>
                                            <tr>
                                                <td colspan="5" class="text-center py-4 text-muted">No monthly sales trends recorded.</td>
                                            </tr>
                                        <?php endif; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Weekly Trend Content -->
                <div class="tab-pane fade" id="weekly-content" role="tabpanel">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-bar-chart-fill text-info me-2"></i>Weekly Sales Statistics (Current Year)
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="ps-3">Calendar Week Number</th>
                                            <th class="text-center">Transactions</th>
                                            <th class="text-end pe-3">Weekly Sales Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php if (count($weekly_trends) > 0): ?>
                                            <?php foreach ($weekly_trends as $week): ?>
                                                <tr>
                                                    <td class="ps-3 fw-bold text-dark fs-6">Week #<?= $week['SalesWeek']; ?></td>
                                                    <td class="text-center fw-semibold"><span class="badge bg-secondary bg-opacity-10 text-dark px-3 py-1.5"><?= $week['TotalOrders']; ?> orders</span></td>
                                                    <td class="text-end text-primary fw-bold pe-3">Rs. <?= number_format($week['WeeklyRevenue'], 2); ?></td>
                                                </tr>
                                            <?php endforeach; ?>
                                        <?php else: ?>
                                            <tr>
                                                <td colspan="3" class="text-center py-4 text-muted">No weekly sales records found for this year.</td>
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
                                        <a class="page-link" href="?<?= http_build_query(array_merge($all_params, ['page' => $page - 1])); ?>#weekly-content" aria-label="Previous">
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
                                        <a class="page-link" href="?<?= http_build_query(array_merge($all_params, ['page' => 1])); ?>#weekly-content">1</a>
                                    </li>
                                    <?php if ($start_page > 2): ?>
                                        <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                                    <?php endif; ?>
                                    <?php for($i = $start_page; $i <= $end_page; $i++): ?>
                                        <li class="page-item <?= ($page == $i) ? 'active' : ''; ?>">
                                            <a class="page-link" href="?<?= http_build_query(array_merge($all_params, ['page' => $i])); ?>#weekly-content"><?= $i; ?></a>
                                        </li>
                                    <?php endfor; ?>
                                    <?php if ($end_page < $total_pages - 1): ?>
                                        <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                                    <?php endif; ?>
                                    <?php if ($total_pages > 1): ?>
                                        <li class="page-item <?= ($page == $total_pages) ? 'active' : ''; ?>">
                                            <a class="page-link" href="?<?= http_build_query(array_merge($all_params, ['page' => $total_pages])); ?>#weekly-content"><?= $total_pages; ?></a>
                                        </li>
                                    <?php endif; ?>
                                    
                                    <li class="page-item <?= ($page >= $total_pages) ? 'disabled' : ''; ?>">
                                        <a class="page-link" href="?<?= http_build_query(array_merge($all_params, ['page' => $page + 1])); ?>#weekly-content" aria-label="Next">
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

        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    <?php
    $m_labels = array_map(function($m){ return $m['month_name'] . ' ' . $m['SalesYear']; }, array_reverse($monthly_trends));
    $m_revs = array_map(function($m){ return (float)$m['MonthlyRevenue']; }, array_reverse($monthly_trends));
    $m_orders = array_map(function($m){ return (int)$m['TotalOrders']; }, array_reverse($monthly_trends));

    $w_labels = array_map(function($w){ return 'Week #' . $w['SalesWeek']; }, array_reverse($weekly_trends_all));
    $w_revs = array_map(function($w){ return (float)$w['WeeklyRevenue']; }, array_reverse($weekly_trends_all));
    ?>

    // Monthly Line / Bar Chart
    const mCtx = document.getElementById('monthlyTrendChart').getContext('2d');
    new Chart(mCtx, {
        type: 'line',
        data: {
            labels: <?= json_encode($m_labels); ?>,
            datasets: [
                {
                    label: 'Monthly Revenue (LKR)',
                    data: <?= json_encode($m_revs); ?>,
                    borderColor: '#0284c7',
                    backgroundColor: 'rgba(2, 132, 199, 0.1)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Orders Count',
                    data: <?= json_encode($m_orders); ?>,
                    borderColor: '#10b981',
                    backgroundColor: '#10b981',
                    type: 'bar',
                    borderRadius: 4,
                    yAxisID: 'y1'
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
                y: { type: 'linear', display: true, position: 'left', beginAtZero: true },
                y1: { type: 'linear', display: true, position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }
            }
        }
    });

    // Weekly Bar Chart
    const wCtx = document.getElementById('weeklyTrendChart').getContext('2d');
    new Chart(wCtx, {
        type: 'bar',
        data: {
            labels: <?= json_encode($w_labels); ?>,
            datasets: [{
                label: 'Weekly Revenue (LKR)',
                data: <?= json_encode($w_revs); ?>,
                backgroundColor: '#6f42c1',
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
});
</script>

<?php include '../../includes/admin/footer.php'; ?>
