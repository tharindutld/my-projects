<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../../config/db.php');

$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

// 1. Get Filters
$aging_status = isset($_GET['aging_status']) ? mysqli_real_escape_string($conn, $_GET['aging_status']) : '';
$min_days = isset($_GET['min_days']) && is_numeric($_GET['min_days']) ? (int) $_GET['min_days'] : '';

// Fetch all active stock items (variants) to compute KPIs and charts
$stock_query = "
    SELECT v.ID as VariantId, p.ProductName, p.BrandName, p.ModelNumber, v.Stock, v.CreationDate, v.Price, v.Color, v.RAM, v.ROM,
           (SELECT MAX(m.OrderDate) 
            FROM tbl_order_items oi 
            JOIN tbl_order_master m ON oi.OrderMasterId = m.ID 
            WHERE oi.VariantId = v.ID AND m.OrderStatus = 'Completed') as LastSaleDate
    FROM tblproduct_variants v
    JOIN tblproducts p ON v.ProductId = p.ID
    WHERE v.Stock > 0 AND p.Status = 1
    ORDER BY v.Stock DESC
";
$stock_res = mysqli_query($conn, $stock_query);

$aging_items_all = [];
$dead_stock_cnt = 0;
$slow_moving_cnt = 0;
$healthy_cnt = 0;
$dead_stock_val = 0;

while ($row = mysqli_fetch_assoc($stock_res)) {
    $last_activity = $row['LastSaleDate'] ?? $row['CreationDate'];
    $days_unsold = floor((time() - strtotime($last_activity)) / (60 * 60 * 24));

    // Status classification
    if ($days_unsold >= 90) {
        $status = "Dead Stock";
        $dead_stock_cnt++;
        $dead_stock_val += $row['Stock'] * $row['Price'];
    } elseif ($days_unsold >= 30) {
        $status = "Slow Moving";
        $slow_moving_cnt++;
    } else {
        $status = "Healthy";
        $healthy_cnt++;
    }

    $row['days_unsold'] = $days_unsold;
    $row['basis'] = $row['LastSaleDate'] ? "Last Sale" : "Stock Addition";
    $row['aging_status'] = $status;

    // Filter matching
    $matches_status = ($aging_status === '' || $status === $aging_status);
    $matches_days = ($min_days === '' || $days_unsold >= $min_days);

    if ($matches_status && $matches_days) {
        $aging_items_all[] = $row;
    }
}

// Implement array pagination
$total_rows = count($aging_items_all);
$limit = 10;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int) $_GET['page'] : 1;
if ($page < 1)
    $page = 1;
$total_pages = ceil($total_rows / $limit);
if ($page > $total_pages && $total_pages > 0)
    $page = $total_pages;
$offset = ($page - 1) * $limit;

$aging_items = array_slice($aging_items_all, $offset, $limit);

$all_params = [];
if ($aging_status !== "")
    $all_params['aging_status'] = $aging_status;
if ($min_days !== "")
    $all_params['min_days'] = $min_days;
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
                    <li class="breadcrumb-item active" aria-current="page">Inventory Aging</li>
                </ol>
            </nav>

            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="fw-bold text-dark mb-1"><i class="bi bi-hourglass-split text-danger me-2"></i>Inventory
                        Aging & Dead Stock</h3>
                    <p class="text-muted mb-0 small">Overview of active products based on days since last transaction. |
                        Generated: <?= date('M d, Y h:i A'); ?></p>
                </div>
                <div class="d-flex gap-2 no-print">
                    <button onclick="window.print()" class="btn btn-outline-primary rounded-pill px-4"><i
                            class="bi bi-printer me-1"></i> Print Report</button>
                    <a href="../reports.php" class="btn btn-outline-secondary rounded-pill px-3"><i
                            class="bi bi-arrow-left"></i> Back</a>
                </div>
            </div>

            <!-- Form Filter Bar -->
            <div class="card shadow-sm border-0 mb-4 no-print">
                <div class="card-body">
                    <form method="get" class="row g-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label small fw-semibold mb-1">Aging Status</label>
                            <select name="aging_status" class="form-select">
                                <option value="">All Statuses</option>
                                <option value="Healthy" <?= ($aging_status === 'Healthy') ? 'selected' : ''; ?>>Healthy (<
                                        30 days)</option>
                                <option value="Slow Moving" <?= ($aging_status === 'Slow Moving') ? 'selected' : ''; ?>>
                                    Slow Moving (30-89 days)</option>
                                <option value="Dead Stock" <?= ($aging_status === 'Dead Stock') ? 'selected' : ''; ?>>Dead
                                    Stock (&ge; 90 days)</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small fw-semibold mb-1">Min Days Unsold</label>
                            <input type="number" name="min_days" class="form-control" placeholder="e.g. 90"
                                value="<?= htmlspecialchars($min_days); ?>">
                        </div>
                        <div class="col-md-4">
                            <button type="submit" class="btn btn-primary w-100" style="height: 38px;"><i
                                    class="bi bi-funnel"></i> Generate Report</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Inventory Dead Stock Alert -->
            <?php if ($dead_stock_cnt > 0): ?>
                <div class="alert alert-danger border-danger shadow-sm d-flex align-items-center mb-4 no-print"
                    role="alert">
                    <i class="bi bi-exclamation-octagon-fill fs-4 me-3 text-danger"></i>
                    <div>
                        <strong class="text-dark">Inventory Alert:</strong> You have <span
                            class="fw-bold text-danger"><?= $dead_stock_cnt; ?> products classified as Dead Stock</span>
                        (unsold for 90+ days) representing <strong>Rs. <?= number_format($dead_stock_val, 2); ?></strong> in
                        locked capital. Immediate clearance promotions are recommended.
                    </div>
                </div>
            <?php else: ?>
                <div class="alert alert-success border-success shadow-sm d-flex align-items-center mb-4 no-print"
                    role="alert">
                    <i class="bi bi-check-circle-fill fs-4 me-3 text-success"></i>
                    <div>
                        <strong class="text-dark">Inventory Turnover Optimal:</strong> No active products are currently
                        classified as dead stock. All active inventory is moving within standard parameters.
                    </div>
                </div>
            <?php endif; ?>

            <!-- KPI Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-danger border-4">
                        <span class="text-muted small text-uppercase">Dead Stock Items</span>
                        <h4 class="fw-bold text-danger mb-0 mt-1"><?= $dead_stock_cnt; ?> products</h4>
                        <small class="text-muted">Unsold for 90+ days</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-warning border-4">
                        <span class="text-muted small text-uppercase">Slow Moving Items</span>
                        <h4 class="fw-bold text-warning mb-0 mt-1"><?= $slow_moving_cnt; ?> products</h4>
                        <small class="text-muted">Unsold for 30+ days</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-success border-4">
                        <span class="text-muted small text-uppercase">Healthy Stock</span>
                        <h4 class="fw-bold text-success mb-0 mt-1"><?= $healthy_cnt; ?> products</h4>
                        <small class="text-muted">Recent sales activity</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-primary border-4">
                        <span class="text-muted small text-uppercase">Dead Stock Valuation</span>
                        <h4 class="fw-bold text-primary mb-0 mt-1">Rs. <?= number_format($dead_stock_val, 2); ?></h4>
                        <small class="text-muted">Capital locked in dead stock</small>
                    </div>
                </div>
            </div>

            <!-- Visual Analytics Charts Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-5">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-pie-chart-fill text-danger me-2"></i>Inventory Health Share
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="agingHealthChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-7">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-bar-chart-line-fill text-warning me-2"></i>Unsold Products Days Spectrum
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="agingDaysChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Aging Grid -->
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white fw-bold py-3">
                    <i class="bi bi-list-stars text-danger me-2"></i>Inventory Aging Ledger (Active Products in Stock)
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3">Brand & Product Name</th>
                                    <th>Model Number</th>
                                    <th class="text-center">Stock Quantity</th>
                                    <th>Retail Price</th>
                                    <th>Last Activity Date</th>
                                    <th>Basis</th>
                                    <th class="text-center">Days Unsold</th>
                                    <th class="text-end pe-3">Aging Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (count($aging_items) > 0): ?>
                                    <?php foreach ($aging_items as $item):
                                        $displayName = htmlspecialchars($item['ProductName']);
                                        if (!empty($item['Color']) || !empty($item['ROM'])) {
                                            $displayName .= " - " . htmlspecialchars($item['Color']) . " (" . htmlspecialchars($item['ROM']) . " / " . htmlspecialchars($item['RAM']) . ")";
                                        }
                                        ?>
                                        <tr>
                                            <td class="ps-3">
                                                <span
                                                    class="text-muted small d-block"><?= htmlspecialchars($item['BrandName']); ?></span>
                                                <span class="fw-bold text-dark"><?= $displayName; ?></span>
                                            </td>
                                            <td class="fw-semibold"><?= htmlspecialchars($item['ModelNumber']); ?></td>
                                            <td class="text-center"><span
                                                    class="badge bg-secondary bg-opacity-10 text-dark px-3 py-1.5"><?= $item['Stock']; ?>
                                                    units</span></td>
                                            <td>Rs. <?= number_format($item['Price'], 2); ?></td>
                                            <td>
                                                <?= $item['LastSaleDate'] ? date('M d, Y', strtotime($item['LastSaleDate'])) : date('M d, Y', strtotime($item['CreationDate'])); ?>
                                            </td>
                                            <td>
                                                <span class="small text-muted"><?= $item['basis']; ?></span>
                                            </td>
                                            <td class="text-center fw-bold">
                                                <?= $item['days_unsold']; ?> days
                                            </td>
                                            <td class="text-end pe-3">
                                                <?php if ($item['aging_status'] === 'Dead Stock'): ?>
                                                    <span class="badge bg-danger text-white px-2.5 py-1.5"><i
                                                            class="bi bi-exclamation-triangle-fill me-1"></i> Dead Stock</span>
                                                <?php elseif ($item['aging_status'] === 'Slow Moving'): ?>
                                                    <span class="badge bg-warning text-dark px-2.5 py-1.5"><i
                                                            class="bi bi-clock-history me-1"></i> Slow Moving</span>
                                                <?php else: ?>
                                                    <span class="badge bg-success text-white px-2.5 py-1.5"><i
                                                            class="bi bi-check-circle-fill me-1"></i> Healthy</span>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <tr>
                                        <td colspan="8" class="text-center py-4 text-muted">No active stock items found.
                                        </td>
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
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function () {
        <?php
        $top_aging = array_slice($aging_items, 0, 7);
        $a_names = array_map(function ($i) {
            return $i['ProductName'] . ' (' . $i['ModelNumber'] . ')'; }, $top_aging);
        $a_days = array_map(function ($i) {
            return (int) $i['days_unsold']; }, $top_aging);
        ?>

        // Health Doughnut Chart
        const hCtx = document.getElementById('agingHealthChart').getContext('2d');
        new Chart(hCtx, {
            type: 'doughnut',
            data: {
                labels: ['Healthy (<30 days)', 'Slow Moving (30-89 days)', 'Dead Stock (90+ days)'],
                datasets: [{
                    data: [<?= (int) $healthy_cnt; ?>, <?= (int) $slow_moving_cnt; ?>, <?= (int) $dead_stock_cnt; ?>],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
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

        // Unsold Days Spectrum Bar Chart
        const dCtx = document.getElementById('agingDaysChart').getContext('2d');
        new Chart(dCtx, {
            type: 'bar',
            data: {
                labels: <?= json_encode($a_names); ?>,
                datasets: [{
                    label: 'Days Unsold',
                    data: <?= json_encode($a_days); ?>,
                    backgroundColor: '#ef4444',
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