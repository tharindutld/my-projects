<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

$required_roles = ['Admin', 'Sales person'];
include("../includes/admin/auth_admin.php");

$admin_id = $_SESSION['imsaid'];
$admin_role = $_SESSION['admin_role'];

// Add ProcessedById filter if Sales role
$processed_filter = "";
$processed_filter_m = "";
if ($admin_role === 'Sales person') {
    $processed_filter = " AND ProcessedById = '$admin_id'";
    $processed_filter_m = " AND m.ProcessedById = '$admin_id'";
}

// ── Fetch Quick Stats for Dashboard Cards ──

// 1. Today's Sales
$today_sales = $conn->query("SELECT SUM(TotalAmount) FROM tbl_order_master WHERE DATE(OrderDate) = CURDATE() AND OrderStatus = 'Completed' $processed_filter")->fetch_row()[0] ?? 0;

// 2. Active Stock (Inventory)
$total_stock = $conn->query("SELECT SUM(v.Stock) FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE p.Status = 1")->fetch_row()[0] ?? 0;

// 3. Average Profit Margin
$avg_margin = $conn->query("SELECT AVG(((SellingPrice - CostPrice) / SellingPrice) * 100) FROM tbl_stock_batches WHERE SellingPrice > 0")->fetch_row()[0] ?? 0;

// 4. Total Customers
$total_customers = $conn->query("SELECT COUNT(*) FROM tbluser")->fetch_row()[0] ?? 0;

// 5. Best Performing Brand
$best_brand_q = $conn->query("SELECT p.BrandName, SUM(oi.ProductQty * oi.ProductPrice) as revenue 
                              FROM tbl_order_items oi 
                              JOIN tblproduct_variants v ON oi.VariantId = v.ID
                              JOIN tblproducts p ON v.ProductId = p.ID 
                              JOIN tbl_order_master m ON oi.OrderMasterId = m.ID
                              WHERE m.OrderStatus = 'Completed' $processed_filter_m
                              GROUP BY p.BrandName 
                              ORDER BY revenue DESC LIMIT 1");
$best_brand_name = "N/A";
if ($best_brand_q && $best_brand_q->num_rows > 0) {
    $best_brand_name = $best_brand_q->fetch_assoc()['BrandName'];
}

// 6. Total Staff Members
$total_staff = $conn->query("SELECT COUNT(*) FROM staff_users WHERE status = 'Active'")->fetch_row()[0] ?? 0;

// 7. This Month's Sales
$month_sales = $conn->query("SELECT SUM(TotalAmount) FROM tbl_order_master WHERE MONTH(OrderDate) = MONTH(CURDATE()) AND YEAR(OrderDate) = YEAR(CURDATE()) AND OrderStatus = 'Completed' $processed_filter")->fetch_row()[0] ?? 0;

// 8. Top Location
$top_location_q = $conn->query("SELECT ShippingPostalCode, COUNT(*) as cnt 
                                FROM tbl_order_master m
                                WHERE 1=1 $processed_filter_m
                                GROUP BY ShippingPostalCode 
                                ORDER BY cnt DESC LIMIT 1");
$top_location = "N/A";
if ($top_location_q && $top_location_q->num_rows > 0) {
    $top_postal = $top_location_q->fetch_assoc()['ShippingPostalCode'];
    if ($top_postal === '00300') $top_location = "Colombo 03";
    elseif ($top_postal === '20400') $top_location = "Kandy";
    elseif ($top_postal === '60000') $top_location = "Kurunegala";
    else $top_location = "Postal: " . $top_postal;
}

// 9. Extra Alert Metrics
$low_stock_count = $conn->query("SELECT COUNT(*) FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock <= 5 AND p.Status = 1")->fetch_row()[0] ?? 0;
$avg_rating = $conn->query("SELECT AVG(Rating) FROM tbl_employee_feedback")->fetch_row()[0] ?? 0;


?>
<?php include('../includes/admin/header.php'); ?>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
    body {
        font-family: 'Outfit', sans-serif;
        background-color: #f4f6f9;
    }
    .report-card {
        border: 2px solid transparent;
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
        background: #ffffff;
    }
    .report-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
    }
    .report-card.card-critical {
        border-color: #ef4444 !important;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.08) !important;
    }
    .report-card.card-optimal {
        border-color: #10b981 !important;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.08) !important;
    }
    .report-card.card-active {
        border-color: #0284c7 !important;
        box-shadow: 0 4px 15px rgba(2, 132, 199, 0.08) !important;
    }
    .icon-container {
        width: 55px;
        height: 55px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }
    .stat-badge {
        font-size: 0.75rem;
        font-weight: 700;
        border-radius: 30px;
        padding: 5px 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
</style>

<div class="container-fluid">
    <div class="row">
        <?php include '../includes/admin/sidebar.php'; ?>
        
        <div class="col-md-10 p-4">
            <!-- Breadcrumbs -->
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="dashboard.php" class="text-decoration-none">Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Reports Dashboard</li>
                </ol>
            </nav>

            <!-- Dashboard Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="mb-1 fw-bold text-dark"><i class="bi bi-pie-chart text-primary me-2"></i>Executive Decision Reports</h2>
                    <p class="text-muted mb-0">Select a report module below to view live data analytics, performance statistics, and print-ready ledgers.</p>
                </div>
            </div>

            <?php
            // Monthly sales data for Executive Summary Chart (Latest 6 Months)
            $dash_monthly_q = $conn->query("
                SELECT month_label, rev FROM (
                    SELECT DATE_FORMAT(OrderDate, '%b %Y') as month_label, SUM(TotalAmount) as rev, MAX(OrderDate) as max_date
                    FROM tbl_order_master
                    WHERE OrderStatus = 'Completed' $processed_filter
                    GROUP BY YEAR(OrderDate), MONTH(OrderDate)
                    ORDER BY max_date DESC
                    LIMIT 6
                ) sub
                ORDER BY max_date ASC
            ");
            $dash_m_labels = [];
            $dash_m_revs = [];
            if ($dash_monthly_q) {
                while($row = $dash_monthly_q->fetch_assoc()) {
                    $dash_m_labels[] = $row['month_label'];
                    $dash_m_revs[] = (float)$row['rev'];
                }
            }
            ?>

            <!-- Executive Overview Chart -->
            <div class="card shadow-sm border-0 mb-4">
                <div class="card-header bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-graph-up-arrow text-primary me-2"></i>Executive Sales Revenue Performance (Monthly Summary)
                    </div>
                    <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-1.5">Live Database Sync</span>
                </div>
                <div class="card-body">
                    <div style="width: 100%; height: 240px;">
                        <canvas id="executiveDashChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Reports Grid -->
            <div class="row g-4">
                
                <!-- 1. Daily Sales Performance -->
                <div class="col-md-6 col-lg-3">
                    <?php
                        $sales_class = ($today_sales > 150000) ? 'card-optimal' : (($today_sales > 0) ? 'card-active' : '');
                        $sales_badge = ($today_sales > 150000) ? 'bg-success text-white' : (($today_sales > 0) ? 'bg-info text-white' : 'bg-secondary text-white');
                        $sales_lbl = ($today_sales > 150000) ? 'High Revenue' : (($today_sales > 0) ? 'Active' : 'No Sales');
                    ?>
                    <div class="card h-100 report-card <?= $sales_class; ?> p-3">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="icon-container bg-primary bg-opacity-10 text-primary">
                                <i class="bi bi-cash-coin"></i>
                            </div>
                            <span class="stat-badge <?= $sales_badge; ?>"><?= $sales_lbl; ?></span>
                        </div>
                        <h5 class="fw-bold text-dark mb-1">Daily Sales</h5>
                        <p class="text-muted small" style="flex-grow: 1;">Sales volume, quantity sold, payment modes, and profit breakdown.</p>
                        <div class="border-top pt-3 mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted small">Today's Sales</span>
                                <span class="fw-bold text-success">Rs. <?= number_format($today_sales, 2); ?></span>
                            </div>
                            <a href="reports/daily_sales.php" class="btn btn-outline-primary btn-sm w-100 rounded-pill py-2">
                                <i class="bi bi-file-earmark-bar-graph me-1"></i> View Report
                            </a>
                        </div>
                    </div>
                </div>

                <?php if ($admin_role === 'Admin'): ?>
                <!-- 2. Inventory Aging -->
                <div class="col-md-6 col-lg-3">
                    <?php
                        $stock_class = ($low_stock_count > 0) ? 'card-critical' : 'card-optimal';
                        $stock_badge = ($low_stock_count > 0) ? 'bg-danger text-white' : 'bg-success text-white';
                        $stock_lbl = ($low_stock_count > 0) ? 'Restock Required' : 'Stable Stock';
                    ?>
                    <div class="card h-100 report-card <?= $stock_class; ?> p-3">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="icon-container bg-danger bg-opacity-10 text-danger">
                                <i class="bi bi-hourglass-split"></i>
                            </div>
                            <span class="stat-badge <?= $stock_badge; ?>"><?= $stock_lbl; ?></span>
                        </div>
                        <h5 class="fw-bold text-dark mb-1">Inventory Aging</h5>
                        <p class="text-muted small" style="flex-grow: 1;">Track days unsold, slow-moving stock, and critical dead-stock inventory.</p>
                        <div class="border-top pt-3 mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted small">Total Units in Stock</span>
                                <span class="fw-bold text-danger"><?= $total_stock; ?> units</span>
                            </div>
                            <a href="reports/inventory_aging.php" class="btn btn-outline-danger btn-sm w-100 rounded-pill py-2">
                                <i class="bi bi-file-earmark-bar-graph me-1"></i> View Report
                            </a>
                        </div>
                    </div>
                </div>

                <!-- 3. Profit Margin Analysis -->
                <div class="col-md-6 col-lg-3">
                    <?php
                        $margin_class = ($avg_margin >= 20) ? 'card-optimal' : 'card-critical';
                        $margin_badge = ($avg_margin >= 20) ? 'bg-success text-white' : 'bg-warning text-dark';
                        $margin_lbl = ($avg_margin >= 20) ? 'Optimal Margin' : 'Low Markup';
                    ?>
                    <div class="card h-100 report-card <?= $margin_class; ?> p-3">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="icon-container bg-success bg-opacity-10 text-success">
                                <i class="bi bi-graph-up-arrow"></i>
                            </div>
                            <span class="stat-badge <?= $margin_badge; ?>"><?= $margin_lbl; ?></span>
                        </div>
                        <h5 class="fw-bold text-dark mb-1">Profit Margins</h5>
                        <p class="text-muted small" style="flex-grow: 1;">Analyze buy vs sell price, unit markup, and identify high-margin assets.</p>
                        <div class="border-top pt-3 mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted small">Avg. Markup</span>
                                <span class="fw-bold text-success"><?= number_format($avg_margin, 1); ?>%</span>
                            </div>
                            <a href="reports/profit_margins.php" class="btn btn-outline-success btn-sm w-100 rounded-pill py-2">
                                <i class="bi bi-file-earmark-bar-graph me-1"></i> View Report
                            </a>
                        </div>
                    </div>
                </div>

                <!-- 4. Customer Behavior -->
                <div class="col-md-6 col-lg-3">
                    <div class="card h-100 report-card p-3">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="icon-container bg-info bg-opacity-10 text-info">
                                <i class="bi bi-people-fill"></i>
                            </div>
                            <span class="stat-badge bg-info text-white">Active Growth</span>
                        </div>
                        <h5 class="fw-bold text-dark mb-1">Customer Behavior</h5>
                        <p class="text-muted small" style="flex-grow: 1;">Leaderboards, average client spending, and brand preferences.</p>
                        <div class="border-top pt-3 mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted small">Total Members</span>
                                <span class="fw-bold text-info"><?= $total_customers; ?> accounts</span>
                            </div>
                            <a href="reports/customer_behavior.php" class="btn btn-outline-info btn-sm w-100 rounded-pill py-2">
                                <i class="bi bi-file-earmark-bar-graph me-1"></i> View Report
                            </a>
                        </div>
                    </div>
                </div>

                <!-- 5. Brand Performance -->
                <div class="col-md-6 col-lg-3">
                    <div class="card h-100 report-card p-3">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="icon-container bg-warning bg-opacity-10 text-warning">
                                <i class="bi bi-bookmark-star-fill"></i>
                            </div>
                            <span class="stat-badge bg-warning text-dark">Top Brand</span>
                        </div>
                        <h5 class="fw-bold text-dark mb-1">Brand Performance</h5>
                        <p class="text-muted small" style="flex-grow: 1;">Units sold, revenue, net profit, and warranty claim rates by brand.</p>
                        <div class="border-top pt-3 mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted small">Top Brand</span>
                                <span class="fw-bold text-warning"><?= htmlspecialchars($best_brand_name); ?></span>
                            </div>
                            <a href="reports/brand_performance.php" class="btn btn-outline-warning btn-sm w-100 rounded-pill py-2">
                                <i class="bi bi-file-earmark-bar-graph me-1"></i> View Report
                            </a>
                        </div>
                    </div>
                </div>

        

                <!-- 6. Employee Performance -->
                <div class="col-md-6 col-lg-3">
                    <?php
                        $staff_class = ($avg_rating >= 4.0) ? 'card-optimal' : 'card-active';
                        $staff_badge = ($avg_rating >= 4.0) ? 'bg-success text-white' : 'bg-primary text-white';
                        $staff_lbl = ($avg_rating >= 4.0) ? 'Excellent Feedback' : 'Stable';
                    ?>
                    <div class="card h-100 report-card <?= $staff_class; ?> p-3">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="icon-container bg-secondary bg-opacity-10 text-secondary">
                                <i class="bi bi-shield-lock-fill"></i>
                            </div>
                            <span class="stat-badge <?= $staff_badge; ?>"><?= $staff_lbl; ?></span>
                        </div>
                        <h5 class="fw-bold text-dark mb-1">Staff Performance</h5>
                        <p class="text-muted small" style="flex-grow: 1;">Sales handled, repairs completed, and average client ratings.</p>
                        <div class="border-top pt-3 mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted small">Active Staff</span>
                                <span class="fw-bold text-secondary"><?= $total_staff; ?> employees</span>
                            </div>
                            <a href="reports/employee_performance.php" class="btn btn-outline-secondary btn-sm w-100 rounded-pill py-2">
                                <i class="bi bi-file-earmark-bar-graph me-1"></i> View Report
                            </a>
                        </div>
                    </div>
                </div>
                <?php endif; ?>

                <!-- 7. Seasonal Sales Trends -->
                <div class="col-md-6 col-lg-3">
                    <?php
                        $growth_badge = ($month_sales > 500000) ? 'bg-success text-white' : 'bg-primary text-white';
                        $growth_lbl = ($month_sales > 500000) ? 'High Growth' : 'Steady Growth';
                    ?>
                    <div class="card h-100 report-card p-3">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="icon-container bg-violet bg-opacity-10 text-dark" style="background-color: rgba(111, 66, 193, 0.1); color: #6f42c1;">
                                <i class="bi bi-calendar-range"></i>
                            </div>
                            <span class="stat-badge <?= $growth_badge; ?>"><?= $growth_lbl; ?></span>
                        </div>
                        <h5 class="fw-bold text-dark mb-1">Seasonal Trends</h5>
                        <p class="text-muted small" style="flex-grow: 1;">Weekly & monthly revenue spikes, peak cycles, and slow periods.</p>
                        <div class="border-top pt-3 mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted small">Month Sales</span>
                                <span class="fw-bold text-dark">Rs. <?= number_format($month_sales, 2); ?></span>
                            </div>
                            <a href="reports/seasonal_trends.php" class="btn btn-sm w-100 rounded-pill py-2" style="border-color: #6f42c1; color: #6f42c1; background: transparent;" onmouseover="this.style.backgroundColor='#6f42c1';this.style.color='#fff';" onmouseout="this.style.backgroundColor='transparent';this.style.color='#6f42c1';">
                                <i class="bi bi-file-earmark-bar-graph me-1"></i> View Report
                            </a>
                        </div>
                    </div>
                </div>

                <!-- 8. Geographic Customer Report -->
                <div class="col-md-6 col-lg-3">
                    <div class="card h-100 report-card p-3">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="icon-container bg-dark bg-opacity-10 text-dark">
                                <i class="bi bi-geo-alt-fill"></i>
                            </div>
                            <span class="stat-badge bg-dark bg-opacity-10 text-dark">Geo Active</span>
                        </div>
                        <h5 class="fw-bold text-dark mb-1">Geographic Areas</h5>
                        <p class="text-muted small" style="flex-grow: 1;">Order locations, sales distribution by cities, and regional demand.</p>
                        <div class="border-top pt-3 mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="text-muted small">High Demand Area</span>
                                <span class="fw-bold text-dark"><?= htmlspecialchars($top_location); ?></span>
                            </div>
                            <a href="reports/geographic_distribution.php" class="btn btn-outline-dark btn-sm w-100 rounded-pill py-2">
                                <i class="bi bi-file-earmark-bar-graph me-1"></i> View Report
                            </a>
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
    const dashCtx = document.getElementById('executiveDashChart').getContext('2d');
    new Chart(dashCtx, {
        type: 'line',
        data: {
            labels: <?= json_encode($dash_m_labels); ?>,
            datasets: [{
                label: 'Monthly Revenue (LKR)',
                data: <?= json_encode($dash_m_revs); ?>,
                borderColor: '#0284c7',
                backgroundColor: 'rgba(2, 132, 199, 0.12)',
                fill: true,
                tension: 0.35,
                borderWidth: 3,
                pointBackgroundColor: '#0284c7',
                pointRadius: 5
            }]
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
});
</script>

<?php include '../includes/admin/footer.php'; ?>
