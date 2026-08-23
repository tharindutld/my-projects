<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');
$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");

// ── 1. Calculate KPI Metrics ───────────────────────────────────────────────────
$total_valuation_q = mysqli_query($conn, "SELECT SUM(v.Stock * v.Price) FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE p.Status=1");
$total_valuation   = mysqli_fetch_row($total_valuation_q)[0] ?? 0.00;

$total_units_q     = mysqli_query($conn, "SELECT SUM(v.Stock) FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE p.Status=1");
$total_units       = mysqli_fetch_row($total_units_q)[0] ?? 0;

$low_stock_q       = mysqli_query($conn, "SELECT COUNT(*) FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock <= 5 AND v.Stock > 0 AND p.Status=1");
$low_stock_count   = mysqli_fetch_row($low_stock_q)[0] ?? 0;

$out_stock_q       = mysqli_query($conn, "SELECT COUNT(*) FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock = 0 AND p.Status=1");
$out_stock_count   = mysqli_fetch_row($out_stock_q)[0] ?? 0;

// ── 2. Filters for Stock Movement Ledger ──────────────────────────────────────
$filter_product  = "";
$filter_type     = "";
$filter_from     = "";
$filter_to       = "";
$where_clauses   = [];

if (isset($_GET['product_id']) && $_GET['product_id'] !== "") {
    $filter_product = (int)$_GET['product_id'];
    $where_clauses[] = "p.ID = '$filter_product'";
}
if (isset($_GET['movement_type']) && $_GET['movement_type'] !== "") {
    $filter_type = mysqli_real_escape_string($conn, $_GET['movement_type']);
    $where_clauses[] = "l.MovementType = '$filter_type'";
}
if (isset($_GET['date_from']) && $_GET['date_from'] !== "") {
    $filter_from = mysqli_real_escape_string($conn, $_GET['date_from']);
    $where_clauses[] = "DATE(l.LogDate) >= '$filter_from'";
}
if (isset($_GET['date_to']) && $_GET['date_to'] !== "") {
    $filter_to = mysqli_real_escape_string($conn, $_GET['date_to']);
    $where_clauses[] = "DATE(l.LogDate) <= '$filter_to'";
}

$where_sql = "";
if (count($where_clauses) > 0) {
    $where_sql = "WHERE " . implode(" AND ", $where_clauses);
}

// Pagination Configuration for Stock Movement Log
$count_query = "SELECT COUNT(*) as total
                FROM tbl_stock_log l
                JOIN tblproduct_variants v ON l.VariantId = v.ID
                JOIN tblproducts p ON v.ProductId = p.ID
                $where_sql";
$count_res = mysqli_query($conn, $count_query);
$total_rows = mysqli_fetch_assoc($count_res)['total'] ?? 0;

$limit = 10;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$total_pages = ceil($total_rows / $limit);
if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
$offset = ($page - 1) * $limit;

// Keep track of filter variables for page link retention
$all_params = [];
if (isset($_GET['product_id']) && $_GET['product_id'] !== "") $all_params['product_id'] = $_GET['product_id'];
if (isset($_GET['movement_type']) && $_GET['movement_type'] !== "") $all_params['movement_type'] = $_GET['movement_type'];
if (isset($_GET['date_from']) && $_GET['date_from'] !== "") $all_params['date_from'] = $_GET['date_from'];
if (isset($_GET['date_to']) && $_GET['date_to'] !== "") $all_params['date_to'] = $_GET['date_to'];

// Fetch paginated movement log
$ledger_query = "SELECT l.ID, l.Quantity, l.MovementType, l.ReferenceInfo, l.LogDate, p.ProductName, p.ModelNumber, v.Color, v.RAM, v.ROM
                 FROM tbl_stock_log l
                 JOIN tblproduct_variants v ON l.VariantId = v.ID
                 JOIN tblproducts p ON v.ProductId = p.ID
                 $where_sql
                 ORDER BY l.LogDate DESC
                 LIMIT $limit OFFSET $offset";

$ledger_res = mysqli_query($conn, $ledger_query);
?>
<?php include('../includes/admin/header.php'); ?>
<style>
    @media print {
        body * { visibility: hidden; }
        .print-area, .print-area * { visibility: visible; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
    }
</style>

<div class="container-fluid print-area">
    <div class="row">
        <?php include '../includes/admin/sidebar.php'; ?>
        
        <div class="col-md-10 p-4">
            
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="mb-0 fw-bold"><i class="bi bi-bar-chart-steps me-2 text-primary"></i>Inventory Valuation & Movement Reports</h3>
                    <p class="text-muted small mb-0">Generated on: <?= date('F d, Y h:i A'); ?></p>
                </div>
                <div class="no-print">
                    <button onclick="window.print()" class="btn btn-outline-primary rounded-pill px-4"><i class="bi bi-printer me-2"></i>Print Report</button>
                </div>
            </div>

            <!-- KPI Row -->
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="card shadow-sm border-0 border-start border-primary border-4 h-100">
                        <div class="card-body">
                            <h6 class="text-muted small mb-1">Total Valuation</h6>
                            <h4 class="fw-bold text-dark">Rs. <?= number_format($total_valuation, 2); ?></h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card shadow-sm border-0 border-start border-success border-4 h-100">
                        <div class="card-body">
                            <h6 class="text-muted small mb-1">Total Stock Quantity</h6>
                            <h4 class="fw-bold text-dark"><?= (int)$total_units; ?> Units</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card shadow-sm border-0 border-start border-warning border-4 h-100">
                        <div class="card-body">
                            <h6 class="text-muted small mb-1">Low Stock Items</h6>
                            <h4 class="fw-bold text-warning"><?= (int)$low_stock_count; ?> Products</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card shadow-sm border-0 border-start border-danger border-4 h-100">
                        <div class="card-body">
                            <h6 class="text-muted small mb-1">Out of Stock Items</h6>
                            <h4 class="fw-bold text-danger"><?= (int)$out_stock_count; ?> Products</h4>
                        </div>
                    </div>
                </div>
            </div>

            <?php
            // Calculate Stock Movement Counts for Pie Chart
            $m_types_q = mysqli_query($conn, "SELECT MovementType, COUNT(*) as cnt FROM tbl_stock_log GROUP BY MovementType");
            $m_counts = ['Restock' => 0, 'Sale' => 0, 'Correction' => 0];
            if ($m_types_q) {
                while($mt = mysqli_fetch_assoc($m_types_q)) {
                    if (isset($m_counts[$mt['MovementType']])) {
                        $m_counts[$mt['MovementType']] = (int)$mt['cnt'];
                    }
                }
            }
            ?>

            <!-- Visual Analytics Charts Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-5">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-pie-chart-fill text-primary me-2"></i>Stock Movement Types Share
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 240px;">
                                <canvas id="invMovementChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-7">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-bar-chart-line-fill text-success me-2"></i>Stock Level Health Overview
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 240px;">
                                <canvas id="invHealthChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filters (No Print) -->
            <div class="card shadow-sm border-0 mb-4 no-print">
                <div class="card-body">
                    <form method="get" action="inventory-reports.php" class="row g-3 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label small fw-semibold">Filter by Product</label>
                            <select name="product_id" class="form-select">
                                <option value="">All Products</option>
                                <?php
                                $prods_q = mysqli_query($conn, "SELECT ID, ProductName, ModelNumber FROM tblproducts ORDER BY ProductName ASC");
                                while($p = mysqli_fetch_assoc($prods_q)) {
                                    $sel = ($filter_product === (int)$p['ID']) ? 'selected' : '';
                                    echo '<option value="' . $p['ID'] . '" ' . $sel . '>' . htmlspecialchars($p['ProductName']) . ' (' . htmlspecialchars($p['ModelNumber']) . ')</option>';
                                }
                                ?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small fw-semibold">Filter by Type</label>
                            <select name="movement_type" class="form-select">
                                <option value="">All Movements</option>
                                <option value="Restock" <?php echo ($filter_type === 'Restock') ? 'selected' : ''; ?>>Restock</option>
                                <option value="Sale" <?php echo ($filter_type === 'Sale') ? 'selected' : ''; ?>>Sale</option>
                                <option value="Correction" <?php echo ($filter_type === 'Correction') ? 'selected' : ''; ?>>Correction</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small fw-semibold">From Date</label>
                            <input type="date" name="date_from" class="form-control" value="<?= htmlspecialchars($filter_from); ?>">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small fw-semibold">To Date</label>
                            <input type="date" name="date_to" class="form-control" value="<?= htmlspecialchars($filter_to); ?>">
                        </div>
                        <div class="col-md-2">
                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-primary w-100"><i class="bi bi-funnel"></i> Filter</button>
                                <?php if($filter_product !== "" || $filter_type !== "" || $filter_from !== "" || $filter_to !== ""): ?>
                                    <a href="inventory-reports.php" class="btn btn-outline-secondary">Clear</a>
                                <?php endif; ?>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Ledger Table -->
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white py-3">
                    <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-clock-history me-2 text-secondary"></i>Stock Movement Log</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-4">Timestamp</th>
                                    <th>Product Name</th>
                                    <th>Model Number</th>
                                    <th class="text-center">Quantity Adjustment</th>
                                    <th class="text-center">Type</th>
                                    <th class="pe-4">Reference Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                if (mysqli_num_rows($ledger_res) > 0) {
                                    while ($row = mysqli_fetch_assoc($ledger_res)) {
                                        $qty = (int)$row['Quantity'];
                                        $type = $row['MovementType'];
                                        $prodDisplay = htmlspecialchars($row['ProductName']);
                                        if (!empty($row['Color']) || !empty($row['ROM'])) {
                                            $prodDisplay .= " - " . htmlspecialchars($row['Color']);
                                            if (!empty($row['ROM'])) {
                                                $prodDisplay .= " (" . htmlspecialchars($row['ROM']) . " / " . htmlspecialchars($row['RAM']) . ")";
                                            }
                                        }
                                ?>
                                <tr>
                                    <td class="ps-4 text-muted small"><?= date('M d, Y h:i A', strtotime($row['LogDate'])); ?></td>
                                    <td class="fw-semibold text-dark"><?= $prodDisplay; ?></td>
                                    <td><span class="text-muted small"><?= htmlspecialchars($row['ModelNumber']); ?></span></td>
                                    <td class="text-center fw-bold">
                                        <?php if ($qty > 0): ?>
                                            <span class="text-success">+<?= $qty; ?></span>
                                        <?php else: ?>
                                            <span class="text-danger"><?= $qty; ?></span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="text-center">
                                        <?php if($type === 'Restock'): ?>
                                            <span class="badge bg-success bg-opacity-10 text-success border border-success-subtle px-3 py-1">Restock</span>
                                        <?php elseif($type === 'Sale'): ?>
                                            <span class="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-3 py-1">Sale</span>
                                        <?php else: ?>
                                            <span class="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle px-3 py-1">Correction</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="pe-4 text-muted small"><?= htmlspecialchars($row['ReferenceInfo'] ?? '-'); ?></td>
                                </tr>
                                <?php
                                    }
                                } else {
                                ?>
                                <tr>
                                    <td colspan="6" class="text-center py-5 text-muted">No stock movements found matching current filters.</td>
                                </tr>
                                <?php } ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination Controls -->
                    <?php if ($total_pages > 1): ?>
                    <nav class="d-flex justify-content-center my-4 no-print">
                        <ul class="pagination pagination-custom gap-1">
                            <!-- Previous Page -->
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
                            
                            // Page 1
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
                            
                            <!-- Next Page -->
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
    // Movement Types Pie Chart
    const mCtx = document.getElementById('invMovementChart').getContext('2d');
    new Chart(mCtx, {
        type: 'pie',
        data: {
            labels: ['Restock Adjustments', 'Sales Deductions', 'Manual Corrections'],
            datasets: [{
                data: [<?= $m_counts['Restock']; ?>, <?= $m_counts['Sale']; ?>, <?= $m_counts['Correction']; ?>],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
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

    // Stock Health Bar Chart
    const hCtx = document.getElementById('invHealthChart').getContext('2d');
    new Chart(hCtx, {
        type: 'bar',
        data: {
            labels: ['Total Units', 'Low Stock Products', 'Out of Stock Products'],
            datasets: [{
                label: 'Count',
                data: [<?= (int)$total_units; ?>, <?= (int)$low_stock_count; ?>, <?= (int)$out_stock_count; ?>],
                backgroundColor: ['#0284c7', '#f59e0b', '#ef4444'],
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

<?php include '../includes/admin/footer.php'; ?>
