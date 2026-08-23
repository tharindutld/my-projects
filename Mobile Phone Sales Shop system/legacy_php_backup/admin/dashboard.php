<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');
include('../includes/admin/auth_admin.php');

// Real DB counts
$brandcount   = $conn->query("SELECT COUNT(*) FROM tblbrand WHERE Status=1")->fetch_row()[0] ?? 0;
$productcount = $conn->query("SELECT COUNT(*) FROM tblproducts WHERE Status=1")->fetch_row()[0] ?? 0;
$totuser      = $conn->query("SELECT COUNT(*) FROM tbluser")->fetch_row()[0] ?? 0;
$staffcount   = $conn->query("SELECT COUNT(*) FROM staff_users WHERE status='Active'")->fetch_row()[0] ?? 0;
$salescount   = $conn->query("SELECT SUM(TotalAmount) FROM tbl_order_master WHERE OrderStatus='Completed'")->fetch_row()[0] ?? 0;
$ordercount   = $conn->query("SELECT COUNT(*) FROM tbl_order_master")->fetch_row()[0] ?? 0;

// Low & Out of stock counts
$low_stock_count = $conn->query("SELECT COUNT(*) FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock <= 5 AND v.Stock > 0 AND p.Status=1")->fetch_row()[0] ?? 0;
$out_stock_count = $conn->query("SELECT COUNT(*) FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock = 0 AND p.Status=1")->fetch_row()[0] ?? 0;

// Technician-specific repair stats
$my_id = (int)$_SESSION['imsaid'];
$tech_pending   = $conn->query("SELECT COUNT(*) FROM tbl_repairs WHERE TechnicianId=$my_id AND Status='Pending'")->fetch_row()[0] ?? 0;
$tech_inprog    = $conn->query("SELECT COUNT(*) FROM tbl_repairs WHERE TechnicianId=$my_id AND Status='In-progress'")->fetch_row()[0] ?? 0;
$tech_completed = $conn->query("SELECT COUNT(*) FROM tbl_repairs WHERE TechnicianId=$my_id AND Status='Completed'")->fetch_row()[0] ?? 0;
$tech_total     = $conn->query("SELECT COUNT(*) FROM tbl_repairs WHERE TechnicianId=$my_id")->fetch_row()[0] ?? 0;

// Chart 1: Monthly Sales Trend (Last 6 Months)
$sales_trend_labels = [];
$sales_trend_data = [];
$trend_q = $conn->query("SELECT MonthLabel, MonthlyRevenue FROM (
                            SELECT DATE_FORMAT(OrderDate, '%b %Y') as MonthLabel, SUM(TotalAmount) as MonthlyRevenue, MAX(OrderDate) as max_date
                            FROM tbl_order_master 
                            WHERE OrderStatus='Completed' 
                            GROUP BY YEAR(OrderDate), MONTH(OrderDate)
                            ORDER BY max_date DESC 
                            LIMIT 6
                         ) sub
                         ORDER BY max_date ASC");
if ($trend_q) {
    while ($trend_row = $trend_q->fetch_assoc()) {
        $sales_trend_labels[] = $trend_row['MonthLabel'];
        $sales_trend_data[] = floatval($trend_row['MonthlyRevenue']);
    }
}

// Chart 2: Brand Distribution
$brand_labels = [];
$brand_data = [];
$brand_q = $conn->query("SELECT BrandName, COUNT(*) as ProductCount 
                         FROM tblproducts 
                         WHERE Status=1 
                         GROUP BY BrandName 
                         ORDER BY ProductCount DESC 
                         LIMIT 5");
if ($brand_q) {
    while ($brand_row = $brand_q->fetch_assoc()) {
        $brand_labels[] = $brand_row['BrandName'];
        $brand_data[] = intval($brand_row['ProductCount']);
    }
}
?>
<?php include('../includes/admin/header.php'); ?>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<style>
.dashboard-shortcut-btn {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    height: auto !important;
    padding: 20px 10px !important;
    border-radius: 8px !important;
    border: 2px solid !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    transition: all 0.2s ease-in-out !important;
}

.shortcut-primary {
    color: #0284c7 !important;
    border-color: rgba(2, 132, 199, 0.2) !important;
    background-color: rgba(2, 132, 199, 0.03) !important;
}
.shortcut-primary:hover {
    color: #ffffff !important;
    background-color: #0284c7 !important;
    border-color: #0284c7 !important;
}

.shortcut-success {
    color: #10b981 !important;
    border-color: rgba(16, 185, 129, 0.2) !important;
    background-color: rgba(16, 185, 129, 0.03) !important;
}
.shortcut-success:hover {
    color: #ffffff !important;
    background-color: #10b981 !important;
    border-color: #10b981 !important;
}

.shortcut-info {
    color: #0ea5e9 !important;
    border-color: rgba(14, 165, 233, 0.2) !important;
    background-color: rgba(14, 165, 233, 0.03) !important;
}
.shortcut-info:hover {
    color: #ffffff !important;
    background-color: #0ea5e9 !important;
    border-color: #0ea5e9 !important;
}

.shortcut-secondary {
    color: #64748b !important;
    border-color: rgba(100, 116, 139, 0.2) !important;
    background-color: rgba(100, 116, 139, 0.03) !important;
}
.shortcut-secondary:hover {
    color: #ffffff !important;
    background-color: #64748b !important;
    border-color: #64748b !important;
}
.card-hover {
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    cursor: pointer;
}
.card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1) !important;
}
</style>

<div class="container-fluid">
    <div class="row">
        <?php include '../includes/admin/sidebar.php'; ?>

        <div class="col-md-10 p-4">
            
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="mb-0 fw-bold text-dark">Management Dashboard</h3>
                    <p class="text-muted small mb-0">Overview of store activity, sales metrics, and stock alerts.</p>
                </div>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0 bg-transparent p-0">
                        <li class="breadcrumb-item"><a href="dashboard.php" class="text-decoration-none">Home</a></li>
                        <li class="breadcrumb-item active">Dashboard</li>
                    </ol>
                </nav>
            </div>



            <!-- Low/Out of Stock Alert Banner -->
            <?php
            $low_stock_q = mysqli_query($conn, "SELECT p.ProductName, v.ID as VariantId, v.Stock, v.Color, v.RAM, v.ROM FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock <= 5 AND p.Status=1 ORDER BY v.Stock ASC");
            $low_count = $low_stock_q ? mysqli_num_rows($low_stock_q) : 0;
            if($low_count > 0 && $_SESSION['admin_role'] !== 'Technician'):
            ?>
                <div class="card border-0 shadow-sm mb-4 overflow-hidden" style="border-left: 4px solid #f59e0b !important; background: #fffdf2;">
                    <div class="card-body p-3">
                        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div class="d-flex align-items-center">
                                <div class="bg-warning bg-opacity-20 p-2 rounded-circle me-3 text-warning">
                                    <i class="bi bi-exclamation-triangle-fill fs-5"></i>
                                </div>
                                <div>
                                    <h6 class="mb-0 fw-bold text-dark">Low Stock Warning</h6>
                                    <small class="text-muted"><strong><?= $low_count; ?></strong> product configuration(s) require restocking (≤ 5 units left).</small>
                                </div>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-warning text-dark fw-semibold" id="btnToggleLowStock" type="button">
                                    <i class="bi bi-list-ul me-1"></i> View Low Stock Items (<?= $low_count; ?>)
                                </button>
                                <a href="inventory.php" class="btn btn-sm btn-warning text-dark fw-semibold">
                                    <i class="bi bi-box-seam me-1"></i> Restock Inventory
                                </a>
                            </div>
                        </div>
                        <div class="mt-3" id="lowStockDetailsCollapse" style="display: none;">
                            <div class="table-responsive bg-white rounded border">
                                <table class="table table-sm table-hover align-middle mb-0">
                                    <thead class="table-light small">
                                        <tr>
                                            <th class="ps-3">Product Name & Variant</th>
                                            <th class="text-center">Stock Level</th>
                                            <th class="text-center">Status</th>
                                            <th class="text-end pe-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody class="small">
                                        <?php while($ls = mysqli_fetch_assoc($low_stock_q)): 
                                            $disp = htmlspecialchars($ls['ProductName']);
                                            if (!empty($ls['Color']) || !empty($ls['ROM'])) {
                                                $disp .= " — " . htmlspecialchars($ls['Color']) . " (" . htmlspecialchars($ls['ROM']) . " / " . htmlspecialchars($ls['RAM']) . ")";
                                            }
                                        ?>
                                        <tr>
                                            <td class="ps-3 fw-semibold text-dark"><?= $disp; ?></td>
                                            <td class="text-center fw-bold <?= ($ls['Stock'] == 0) ? 'text-danger' : 'text-dark'; ?>"><?= $ls['Stock']; ?> units left</td>
                                            <td class="text-center">
                                                <?php if($ls['Stock'] == 0): ?>
                                                    <span class="badge bg-danger bg-opacity-10 text-danger border border-danger px-2">Out of Stock</span>
                                                <?php else: ?>
                                                    <span class="badge bg-warning bg-opacity-20 text-dark border border-warning px-2">Low Stock</span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="text-end pe-3">
                                                <a href="inventory.php?search=<?= urlencode($ls['ProductName']); ?>" class="btn btn-xs btn-outline-primary py-0 px-2 small">Restock</a>
                                            </td>
                                        </tr>
                                        <?php endwhile; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Row 1: Catalog Metrics -->
            <?php if ($admin_role !== 'Technician'): ?>
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <a href="manage-brand.php" class="text-decoration-none text-dark">
                        <div class="card shadow-sm border-0 border-start border-primary border-4 h-100 card-hover">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted small fw-semibold mb-1 text-uppercase">Total Brands</h6>
                                    <h3 class="mb-0 fw-bold" id="kpi-brandcount"><?= $brandcount; ?></h3>
                                </div>
                                <div class="bg-primary bg-opacity-10 p-3 rounded">
                                    <i class="bi bi-tags text-primary fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>

                <div class="col-md-3">
                    <a href="manage-product.php" class="text-decoration-none text-dark">
                        <div class="card shadow-sm border-0 border-start border-success border-4 h-100 card-hover">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted small fw-semibold mb-1 text-uppercase">Products In Catalog</h6>
                                    <h3 class="mb-0 fw-bold" id="kpi-productcount"><?= $productcount; ?></h3>
                                </div>
                                <div class="bg-success bg-opacity-10 p-3 rounded">
                                    <i class="bi bi-box-seam text-success fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>

                <div class="col-md-3">
                    <a href="reg-users.php" class="text-decoration-none text-dark">
                        <div class="card shadow-sm border-0 border-start border-info border-4 h-100 card-hover">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted small fw-semibold mb-1 text-uppercase">Registered Users</h6>
                                    <h3 class="mb-0 fw-bold" id="kpi-totuser"><?= $totuser; ?></h3>
                                </div>
                                <div class="bg-info bg-opacity-10 p-3 rounded">
                                    <i class="bi bi-people text-info fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>

                <div class="col-md-3">
                    <a href="adm_view_staff.php" class="text-decoration-none text-dark">
                        <div class="card shadow-sm border-0 border-start border-warning border-4 h-100 card-hover">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted small fw-semibold mb-1 text-uppercase">Active Staff</h6>
                                    <h3 class="mb-0 fw-bold" id="kpi-staffcount"><?= $staffcount; ?></h3>
                                </div>
                                <div class="bg-warning bg-opacity-10 p-3 rounded">
                                    <i class="bi bi-person-badge text-warning fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
            <?php endif; ?>

            <?php if ($admin_role !== 'Technician'): ?>
            <!-- Row 2: Sales & Stock Warning Metrics -->
            <div class="row g-4 mb-4">
                <?php if ($admin_role === 'Admin'): ?>
                <div class="col-md-4">
                    <a href="reports.php" class="text-decoration-none text-dark">
                        <div class="card shadow-sm border-0 border-start border-danger border-4 h-100 card-hover">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted small fw-semibold mb-1 text-uppercase">Net Revenue</h6>
                                    <h3 class="mb-0 fw-bold text-danger">Rs. <?= number_format($salescount, 2); ?></h3>
                                    <span class="text-muted small">From completed orders</span>
                                </div>
                                <div class="bg-danger bg-opacity-10 p-3 rounded">
                                    <i class="bi bi-cash-stack text-danger fs-3"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
                <?php endif; ?>

                <div class="<?= $admin_role === 'Admin' ? 'col-md-4' : 'col-md-6'; ?>">
                    <a href="orders.php" class="text-decoration-none text-dark">
                        <div class="card shadow-sm border-0 border-start border-primary border-4 h-100 card-hover">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted small fw-semibold mb-1 text-uppercase">Orders Placed</h6>
                                    <h3 class="mb-0 fw-bold text-primary" id="kpi-ordercount"><?= $ordercount; ?></h3>
                                    <span class="text-muted small">All transaction states</span>
                                </div>
                                <div class="bg-primary bg-opacity-10 p-3 rounded">
                                    <i class="bi bi-cart-check text-primary fs-3"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>

                <div class="<?= $admin_role === 'Admin' ? 'col-md-4' : 'col-md-6'; ?>">
                    <a href="inventory.php" class="text-decoration-none text-dark">
                        <div class="card shadow-sm border-0 border-start border-warning border-4 h-100 card-hover">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted small fw-semibold mb-1 text-uppercase">Stock Warning Level</h6>
                                    <h3 class="mb-0 fw-bold text-warning"><?= ($low_stock_count + $out_stock_count); ?> Items</h3>
                                    <span class="text-muted small"><?= $out_stock_count; ?> completely out-of-stock</span>
                                </div>
                                <div class="bg-warning bg-opacity-10 p-3 rounded">
                                    <i class="bi bi-exclamation-triangle text-warning fs-3"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
            <?php endif; // end non-Technician row 2 ?>

            <?php if ($admin_role === 'Technician'): ?>
            <!-- Technician Repair Stats Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <a href="manage-repairs.php" class="text-decoration-none text-dark">
                        <div class="card shadow-sm border-0 border-start border-secondary border-4 h-100 card-hover">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted small fw-semibold mb-1 text-uppercase">Total Assigned</h6>
                                    <h3 class="mb-0 fw-bold" id="kpi-tech-total"><?= $tech_total; ?></h3>
                                </div>
                                <div class="bg-secondary bg-opacity-10 p-3 rounded">
                                    <i class="bi bi-wrench text-secondary fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-md-3">
                    <a href="manage-repairs.php?filter=pending" class="text-decoration-none text-dark">
                        <div class="card shadow-sm border-0 border-start border-warning border-4 h-100 card-hover">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted small fw-semibold mb-1 text-uppercase">Pending</h6>
                                    <h3 class="mb-0 fw-bold text-warning" id="kpi-tech-pending"><?= $tech_pending; ?></h3>
                                </div>
                                <div class="bg-warning bg-opacity-10 p-3 rounded">
                                    <i class="bi bi-clock text-warning fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-md-3">
                    <a href="manage-repairs.php?filter=in-progress" class="text-decoration-none text-dark">
                        <div class="card shadow-sm border-0 border-start border-info border-4 h-100 card-hover">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted small fw-semibold mb-1 text-uppercase">In Progress</h6>
                                    <h3 class="mb-0 fw-bold text-info" id="kpi-tech-inprog"><?= $tech_inprog; ?></h3>
                                </div>
                                <div class="bg-info bg-opacity-10 p-3 rounded">
                                    <i class="bi bi-tools text-info fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-md-3">
                    <a href="manage-repairs.php?filter=completed" class="text-decoration-none text-dark">
                        <div class="card shadow-sm border-0 border-start border-success border-4 h-100 card-hover">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted small fw-semibold mb-1 text-uppercase">Completed</h6>
                                    <h3 class="mb-0 fw-bold text-success" id="kpi-tech-completed"><?= $tech_completed; ?></h3>
                                </div>
                                <div class="bg-success bg-opacity-10 p-3 rounded">
                                    <i class="bi bi-check2-circle text-success fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
            <?php endif; ?>

            <?php if ($admin_role !== 'Technician'): ?>
            <!-- Analytics Charts -->
            <div class="row g-4 mb-4">
                <?php if ($admin_role === 'Admin'): ?>
                <div class="col-lg-8">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white py-3 border-0">
                            <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-graph-up me-2 text-primary"></i>Monthly Revenue Trend</h5>
                        </div>
                        <div class="card-body">
                            <div style="position: relative; height: 300px;">
                                <canvas id="revenueChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                <?php else: ?>
                <div class="col-lg-12">
                <?php endif; ?>
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white py-3 border-0">
                            <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-pie-chart me-2 text-success"></i>Inventory by Brand</h5>
                        </div>
                        <div class="card-body">
                            <div style="position: relative; height: 300px;">
                                <canvas id="brandChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php endif; // end non-Technician charts ?>

            <!-- Quick Action Shortcuts -->
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white py-3 border-0">
                    <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-lightning-charge me-2 text-primary"></i>Quick Actions & Administration Shortcuts</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <?php if ($admin_role === 'Admin'): ?>
                        <div class="col-md-3 col-sm-6">
                            <a href="add-order.php" class="dashboard-shortcut-btn shortcut-primary text-decoration-none">
                                <i class="bi bi-plus-circle-dotted fs-3"></i>
                                <span class="fw-bold">Create In-Store Order</span>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-6">
                            <a href="orders.php" class="dashboard-shortcut-btn shortcut-info text-decoration-none">
                                <i class="bi bi-cart3 fs-3"></i>
                                <span class="fw-bold">View Orders</span>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-6">
                            <a href="add-product.php" class="dashboard-shortcut-btn shortcut-primary text-decoration-none">
                                <i class="bi bi-plus-circle fs-3"></i>
                                <span class="fw-bold">Add Product</span>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-6">
                            <a href="inventory.php" class="dashboard-shortcut-btn shortcut-success text-decoration-none">
                                <i class="bi bi-box-seam fs-3"></i>
                                <span class="fw-bold">Manage Stock</span>
                            </a>
                        </div>
                        <?php elseif ($admin_role === 'Sales person'): ?>
                        <div class="col-md-3 col-sm-6">
                            <a href="add-order.php" class="dashboard-shortcut-btn shortcut-primary text-decoration-none">
                                <i class="bi bi-plus-circle-dotted fs-3"></i>
                                <span class="fw-bold">Create In-Store Order</span>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-6">
                            <a href="orders.php" class="dashboard-shortcut-btn shortcut-info text-decoration-none">
                                <i class="bi bi-cart3 fs-3"></i>
                                <span class="fw-bold">View Orders</span>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-6">
                            <a href="reg-users.php" class="dashboard-shortcut-btn shortcut-primary text-decoration-none">
                                <i class="bi bi-people-fill fs-3"></i>
                                <span class="fw-bold">Manage Customers</span>
                            </a>
                        </div>
                        <div class="col-md-3 col-sm-6">
                            <a href="reports.php" class="dashboard-shortcut-btn shortcut-success text-decoration-none">
                                <i class="bi bi-cash-stack fs-3"></i>
                                <span class="fw-bold">Sales Reports</span>
                            </a>
                        </div>
                        <?php elseif ($admin_role === 'Technician'): ?>
                        <div class="col-md-4 col-sm-6">
                            <a href="manage-repairs.php" class="dashboard-shortcut-btn shortcut-primary text-decoration-none">
                                <i class="bi bi-wrench fs-3"></i>
                                <span class="fw-bold">My Repair Jobs</span>
                            </a>
                        </div>
                        <div class="col-md-4 col-sm-6">
                            <a href="manage-repairs.php?filter=pending" class="dashboard-shortcut-btn shortcut-info text-decoration-none">
                                <i class="bi bi-hourglass-split fs-3"></i>
                                <span class="fw-bold">Pending Jobs</span>
                            </a>
                        </div>
                        <div class="col-md-4 col-sm-6">
                            <a href="manage-repairs.php?filter=completed" class="dashboard-shortcut-btn shortcut-success text-decoration-none">
                                <i class="bi bi-check2-circle fs-3"></i>
                                <span class="fw-bold">Completed Jobs</span>
                            </a>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>

<?php if ($admin_role !== 'Technician'): ?>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
document.addEventListener("DOMContentLoaded", function() {
    // 1. Revenue Line Chart
    const revenueEl = document.getElementById('revenueChart');
    if (revenueEl) {
        const revCtx = revenueEl.getContext('2d');
        const revenueLabels = <?= json_encode($sales_trend_labels); ?>;
        const revenueData = <?= json_encode($sales_trend_data); ?>;
        
        if (revenueData.length === 0) {
            revenueLabels.push('No Sales Yet');
            revenueData.push(0);
        }

        new Chart(revCtx, {
            type: 'line',
            data: {
                labels: revenueLabels,
                datasets: [{
                    label: 'Monthly Revenue (Rs.)',
                    data: revenueData,
                    borderColor: '#0284c7',
                    backgroundColor: 'rgba(2, 132, 199, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#0284c7',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // 2. Brand Doughnut Chart
    const brandEl = document.getElementById('brandChart');
    if (brandEl) {
        const brandCtx = brandEl.getContext('2d');
        const brandLabels = <?= json_encode($brand_labels); ?>;
        const brandData = <?= json_encode($brand_data); ?>;

        new Chart(brandCtx, {
            type: 'doughnut',
            data: {
                labels: brandLabels,
                datasets: [{
                    data: brandData,
                    backgroundColor: [
                        '#0284c7',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#64748b'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 15 }
                    }
                },
                cutout: '65%'
            }
        });
    }
});
</script>
<?php endif; // end non-Technician chart.js ?>

<?php include_once('../includes/components/confirmation.php'); ?>
<script>
$(document).ready(function() {
    var lowCount = <?= (int)($low_count ?? 0); ?>;
    $('#btnToggleLowStock').on('click', function(e) {
        e.preventDefault();
        $('#lowStockDetailsCollapse').stop(true, true).slideToggle(250, function() {
            if ($(this).is(':visible')) {
                $('#btnToggleLowStock').html('<i class="bi bi-chevron-up me-1"></i> Hide Low Stock Items');
            } else {
                $('#btnToggleLowStock').html('<i class="bi bi-list-ul me-1"></i> View Low Stock Items (' + lowCount + ')');
            }
        });
    });
});
</script>

<!-- Dashboard KPI Auto-Refresh (every 60s) -->
<script>
(function() {
    function refreshKPIs() {
        $.getJSON('ajax/dashboard_kpis.php', function(d) {
            if(d.brandcount   !== undefined) $('#kpi-brandcount').text(d.brandcount);
            if(d.productcount !== undefined) $('#kpi-productcount').text(d.productcount);
            if(d.totuser      !== undefined) $('#kpi-totuser').text(d.totuser);
            if(d.staffcount   !== undefined) $('#kpi-staffcount').text(d.staffcount);
            if(d.ordercount   !== undefined) $('#kpi-ordercount').text(d.ordercount);
            // Technician repair stats
            if(d.tech_pending   !== undefined) $('#kpi-tech-pending').text(d.tech_pending);
            if(d.tech_inprog    !== undefined) $('#kpi-tech-inprog').text(d.tech_inprog);
            if(d.tech_completed !== undefined) $('#kpi-tech-completed').text(d.tech_completed);
            if(d.tech_total     !== undefined) $('#kpi-tech-total').text(d.tech_total);
        });
    }

    // Refresh every 60 seconds
    setInterval(refreshKPIs, 60000);
})();
</script>
<?php include '../includes/admin/footer.php'; ?>