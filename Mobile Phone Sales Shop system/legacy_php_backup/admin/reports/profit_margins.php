<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../../config/db.php');

$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

// 1. Get Filters
$margin_tier = isset($_GET['margin_tier']) ? mysqli_real_escape_string($conn, $_GET['margin_tier']) : '';
$min_margin = isset($_GET['min_margin']) && is_numeric($_GET['min_margin']) ? (float)$_GET['min_margin'] : '';

// Fetch variants with their buying price from batches
$query = "
    SELECT v.ID as VariantId, p.ProductName, p.BrandName, p.ModelNumber, v.Color, v.RAM, v.ROM, v.Price,
           IFNULL((SELECT CostPrice FROM tbl_stock_batches WHERE VariantId = v.ID LIMIT 1), v.Price * 0.75) as CostPrice,
           IF((SELECT COUNT(*) FROM tbl_stock_batches WHERE VariantId = v.ID) > 0, 'Batched Cost', 'Estimated') as CostType
    FROM tblproduct_variants v
    JOIN tblproducts p ON v.ProductId = p.ID
    WHERE p.Status = 1
";
$res = mysqli_query($conn, $query);

$margin_items_all = [];
$total_cost = 0;
$total_retail = 0;
$high_margin_cnt = 0;
$low_profit_cnt = 0;

$high_margin_cnt_plot = 0;
$low_margin_cnt_plot = 0;
$std_cnt_plot = 0;

while ($row = mysqli_fetch_assoc($res)) {
    $cost = $row['CostPrice'];
    $retail = $row['Price'];
    
    $profit = $retail - $cost;
    $margin_pct = ($retail > 0) ? ($profit / $retail) * 100 : 0;
    
    $row['unit_profit'] = $profit;
    $row['margin_pct'] = $margin_pct;
    
    if ($margin_pct >= 25) {
        $tier = "High Margin";
        $high_margin_cnt++;
    } elseif ($margin_pct < 15) {
        $tier = "Low Profit";
        $low_profit_cnt++;
    } else {
        $tier = "Standard";
    }
    
    $row['margin_tier'] = $tier;
    
    // Filter matching
    $matches_tier = ($margin_tier === '' || $tier === $margin_tier);
    $matches_min = ($min_margin === '' || $margin_pct >= $min_margin);
    
    if ($matches_tier && $matches_min) {
        $margin_items_all[] = $row;
        $total_cost += $cost;
        $total_retail += $retail;
        
        if ($tier === "High Margin") {
            $high_margin_cnt_plot++;
        } elseif ($tier === "Low Profit") {
            $low_margin_cnt_plot++;
        } else {
            $std_cnt_plot++;
        }
    }
}

// Sort items by profit margin descending
usort($margin_items_all, function($a, $b) {
    return $b['margin_pct'] <=> $a['margin_pct'];
});

// Implement array pagination
$total_rows = count($margin_items_all);
$limit = 10;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$total_pages = ceil($total_rows / $limit);
if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
$offset = ($page - 1) * $limit;

$margin_items = array_slice($margin_items_all, $offset, $limit);

$all_params = [];
if ($margin_tier !== "") $all_params['margin_tier'] = $margin_tier;
if ($min_margin !== "") $all_params['min_margin'] = $min_margin;
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
                    <li class="breadcrumb-item active" aria-current="page">Profit Margins</li>
                </ol>
            </nav>

            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="fw-bold text-dark mb-1"><i class="bi bi-graph-up-arrow text-success me-2"></i>Profit Margin Analysis</h3>
                    <p class="text-muted mb-0 small">Margin tier tracking showing buying price vs retail price, unit profit, and percentages. | Generated: <?= date('M d, Y h:i A'); ?></p>
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
                        <div class="col-md-4">
                            <label class="form-label small fw-semibold mb-1">Margin Tier</label>
                            <select name="margin_tier" class="form-select">
                                <option value="">All Tiers</option>
                                <option value="High Margin" <?= ($margin_tier === 'High Margin') ? 'selected' : ''; ?>>High Margin (&ge; 25%)</option>
                                <option value="Standard" <?= ($margin_tier === 'Standard') ? 'selected' : ''; ?>>Standard (15-24%)</option>
                                <option value="Low Profit" <?= ($margin_tier === 'Low Profit') ? 'selected' : ''; ?>>Low Profit (< 15%)</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small fw-semibold mb-1">Min Margin (%)</label>
                            <input type="number" name="min_margin" class="form-control" placeholder="e.g. 20" value="<?= htmlspecialchars($min_margin); ?>">
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
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-success border-4">
                        <span class="text-muted small text-uppercase">High Margin Products</span>
                        <h4 class="fw-bold text-success mb-0 mt-1"><?= $high_margin_cnt; ?> products</h4>
                        <small class="text-muted">Markup is 25% or greater</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-warning border-4">
                        <span class="text-muted small text-uppercase">Low Margin Products</span>
                        <h4 class="fw-bold text-warning mb-0 mt-1"><?= $low_profit_cnt; ?> products</h4>
                        <small class="text-muted">Markup is under 15%</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-primary border-4">
                        <span class="text-muted small text-uppercase">Total Catalog Inspected</span>
                        <h4 class="fw-bold text-primary mb-0 mt-1"><?= count($margin_items); ?> products</h4>
                        <small class="text-muted">Active items checked in database</small>
                    </div>
                </div>
            </div>

            <!-- Visual Analytics Charts Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-5">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-pie-chart-fill text-success me-2"></i>Margin Tier Distribution
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="marginTierChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-7">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-bar-chart-line-fill text-primary me-2"></i>Top Product Profit Margins (%)
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="topMarginChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Profit Margins Ledger -->
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white fw-bold py-3">
                    <i class="bi bi-list-columns-reverse text-success me-2"></i>Product Profitability Margins (Ranked by % Margin)
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3">Brand & Product Name</th>
                                    <th>Model Number</th>
                                    <th>Buying Cost</th>
                                    <th>Retail Price</th>
                                    <th>Unit Profit</th>
                                    <th class="text-center">Cost Source</th>
                                    <th class="text-center">Profit Margin %</th>
                                    <th class="text-end pe-3">Margin Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (count($margin_items) > 0): ?>
                                    <?php foreach ($margin_items as $item): 
                                        $displayName = htmlspecialchars($item['ProductName']);
                                        if (!empty($item['Color']) || !empty($item['ROM'])) {
                                            $displayName .= " - " . htmlspecialchars($item['Color']) . " (" . htmlspecialchars($item['ROM']) . " / " . htmlspecialchars($item['RAM']) . ")";
                                        }
                                    ?>
                                        <tr>
                                            <td class="ps-3">
                                                <span class="text-muted small d-block"><?= htmlspecialchars($item['BrandName']); ?></span>
                                                <span class="fw-bold text-dark"><?= $displayName; ?></span>
                                            </td>
                                            <td class="fw-semibold"><?= htmlspecialchars($item['ModelNumber']); ?></td>
                                            <td class="text-danger">Rs. <?= number_format($item['CostPrice'], 2); ?></td>
                                            <td class="text-success fw-semibold">Rs. <?= number_format($item['Price'], 2); ?></td>
                                            <td class="fw-bold text-primary">Rs. <?= number_format($item['unit_profit'], 2); ?></td>
                                            <td class="text-center">
                                                <span class="badge bg-light text-dark border"><?= $item['CostType']; ?></span>
                                            </td>
                                            <td class="text-center fw-bold fs-6">
                                                <?= number_format($item['margin_pct'], 1); ?>%
                                            </td>
                                            <td class="text-end pe-3">
                                                <?php if($item['margin_tier'] === 'High Margin'): ?>
                                                    <span class="badge bg-success bg-opacity-10 text-success px-2.5 py-1.5"><i class="bi bi-arrow-up-circle-fill me-1"></i> High Margin</span>
                                                <?php elseif($item['margin_tier'] === 'Low Profit'): ?>
                                                    <span class="badge bg-warning bg-opacity-10 text-warning px-2.5 py-1.5"><i class="bi bi-arrow-down-circle-fill me-1"></i> Low Margin</span>
                                                <?php else: ?>
                                                    <span class="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1.5">Standard</span>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <tr>
                                        <td colspan="8" class="text-center py-4 text-muted">No product margin logs found.</td>
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
    $std_cnt = $std_cnt_plot;
    $high_margin_cnt = $high_margin_cnt_plot;
    $low_profit_cnt = $low_margin_cnt_plot;

    $top_items = array_slice($margin_items, 0, 7);
    $top_names = array_map(function($i){ return $i['ProductName'] . ' (' . $i['ModelNumber'] . ')'; }, $top_items);
    $top_pcts = array_map(function($i){ return (float)number_format($i['margin_pct'], 1); }, $top_items);
    ?>

    // Tier Doughnut Chart
    const tierCtx = document.getElementById('marginTierChart').getContext('2d');
    new Chart(tierCtx, {
        type: 'doughnut',
        data: {
            labels: ['High Margin (≥25%)', 'Standard (15-24%)', 'Low Margin (<15%)'],
            datasets: [{
                data: [<?= (int)$high_margin_cnt; ?>, <?= (int)$std_cnt; ?>, <?= (int)$low_profit_cnt; ?>],
                backgroundColor: ['#10b981', '#0284c7', '#f59e0b'],
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

    // Top Margins Bar Chart
    const topCtx = document.getElementById('topMarginChart').getContext('2d');
    new Chart(topCtx, {
        type: 'bar',
        data: {
            labels: <?= json_encode($top_names); ?>,
            datasets: [{
                label: 'Profit Margin (%)',
                data: <?= json_encode($top_pcts); ?>,
                backgroundColor: '#10b981',
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
                y: { beginAtZero: true, ticks: { callback: function(val){ return val + '%'; } } }
            }
        }
    });
});
</script>

<?php include '../../includes/admin/footer.php'; ?>
