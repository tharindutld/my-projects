<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../../config/db.php');

$required_roles = ['Admin'];
include("../../includes/admin/auth_admin.php");

// 1. Get Filters
$date_from = isset($_GET['date_from']) ? mysqli_real_escape_string($conn, $_GET['date_from']) : '';
$date_to = isset($_GET['date_to']) ? mysqli_real_escape_string($conn, $_GET['date_to']) : '';
$role_filter = isset($_GET['role_filter']) ? mysqli_real_escape_string($conn, $_GET['role_filter']) : '';

$where_clauses = ["status = 'Active'"];
if ($role_filter !== "") {
    $where_clauses[] = "role = '$role_filter'";
}
$where_sql = implode(" AND ", $where_clauses);

// Count matching staff for pagination
$count_query = "SELECT COUNT(*) as total FROM staff_users WHERE $where_sql";
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

// Keep track of parameters for pagination links
$all_params = [];
if ($date_from !== "")
    $all_params['date_from'] = $date_from;
if ($date_to !== "")
    $all_params['date_to'] = $date_to;
if ($role_filter !== "")
    $all_params['role_filter'] = $role_filter;

// Fetch all staff users for KPIs and summaries
$staff_all_q = mysqli_query($conn, "SELECT id, first_name, last_name, role, email FROM staff_users WHERE $where_sql");

$staff_performance_all = [];
$total_revenue_staff = 0;
$total_repairs_staff = 0;

while ($row = mysqli_fetch_assoc($staff_all_q)) {
    $staff_id = $row['id'];

    // Sales processed by staff in date range
    $sales_where = ["ProcessedById = '$staff_id'", "OrderStatus = 'Completed'"];
    if ($date_from !== "")
        $sales_where[] = "OrderDate >= '$date_from 00:00:00'";
    if ($date_to !== "")
        $sales_where[] = "OrderDate <= '$date_to 23:59:59'";
    $sales_where_sql = implode(" AND ", $sales_where);

    $sales_q = mysqli_query($conn, "
        SELECT COUNT(ID) as sales_count, IFNULL(SUM(TotalAmount), 0) as sales_revenue 
        FROM tbl_order_master 
        WHERE $sales_where_sql
    ");
    $sales_res = mysqli_fetch_assoc($sales_q);
    $sales_count = $sales_res['sales_count'];
    $sales_revenue = $sales_res['sales_revenue'];

    // Repairs completed by staff in date range
    $repairs_where = ["TechnicianId = '$staff_id'", "Status = 'Completed'"];
    if ($date_from !== "")
        $repairs_where[] = "RepairDate >= '$date_from'";
    if ($date_to !== "")
        $repairs_where[] = "RepairDate <= '$date_to'";
    $repairs_where_sql = implode(" AND ", $repairs_where);

    $repairs_q = mysqli_query($conn, "
        SELECT COUNT(ID) as repairs_count, IFNULL(SUM(Income), 0) as repair_revenue, IFNULL(SUM(Income - Cost), 0) as repair_profit 
        FROM tbl_repairs 
        WHERE $repairs_where_sql
    ");
    $repairs_res = mysqli_fetch_assoc($repairs_q);
    $repairs_count = $repairs_res['repairs_count'];
    $repair_revenue = $repairs_res['repair_revenue'];
    $repair_profit = $repairs_res['repair_profit'];

    // Customer Ratings
    $rating_q = mysqli_query($conn, "
        SELECT AVG(Rating) as avg_rating, COUNT(ID) as feedback_count 
        FROM tbl_employee_feedback 
        WHERE EmployeeId = '$staff_id'
    ");
    $rating_res = mysqli_fetch_assoc($rating_q);
    $avg_rating = $rating_res['avg_rating'] ?? 0;
    $feedback_count = $rating_res['feedback_count'];

    $row['sales_count'] = $sales_count;
    $row['sales_revenue'] = $sales_revenue;
    $row['repairs_count'] = $repairs_count;
    $row['repair_revenue'] = $repair_revenue;
    $row['repair_profit'] = $repair_profit;
    $row['avg_rating'] = $avg_rating;
    $row['feedback_count'] = $feedback_count;
    $row['total_revenue'] = $sales_revenue + $repair_revenue;

    $total_revenue_staff += $sales_revenue + $repair_revenue;
    $total_repairs_staff += $repairs_count;

    $staff_performance_all[] = $row;
}

// Fetch paginated staff
$staff_q = mysqli_query($conn, "SELECT id, first_name, last_name, role, email FROM staff_users WHERE $where_sql LIMIT $limit OFFSET $offset");
$staff_performance = [];
while ($row = mysqli_fetch_assoc($staff_q)) {
    foreach ($staff_performance_all as $sp_all) {
        if ($sp_all['id'] === $row['id']) {
            $staff_performance[] = $sp_all;
            break;
        }
    }
}
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
                    <li class="breadcrumb-item active" aria-current="page">Staff Performance</li>
                </ol>
            </nav>

            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="fw-bold text-dark mb-1"><i
                            class="bi bi-shield-lock-fill text-secondary me-2"></i>Employee Performance Analytics</h3>
                    <p class="text-muted mb-0 small">Tracks sales closed, repairs completed, customer feedback levels,
                        and total financial contributions. | Generated: <?= date('M d, Y h:i A'); ?></p>
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
                        <div class="col-md-3">
                            <label class="form-label small fw-semibold mb-1">Date From</label>
                            <input type="date" name="date_from" class="form-control"
                                value="<?= htmlspecialchars($date_from); ?>">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small fw-semibold mb-1">Date To</label>
                            <input type="date" name="date_to" class="form-control"
                                value="<?= htmlspecialchars($date_to); ?>">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small fw-semibold mb-1">Role / Department</label>
                            <select name="role_filter" class="form-select">
                                <option value="">All Roles</option>
                                <option value="Admin" <?= ($role_filter === 'Admin') ? 'selected' : ''; ?>>Admin</option>
                                <option value="Sales person" <?= ($role_filter === 'Sales person') ? 'selected' : ''; ?>>
                                    Sales person</option>
                                <option value="Technician" <?= ($role_filter === 'Technician') ? 'selected' : ''; ?>>
                                    Technician</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <button type="submit" class="btn btn-primary w-100" style="height: 38px;"><i
                                    class="bi bi-funnel"></i> Generate Report</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Employee Performance Alert -->
            <?php
            $star_performer = null;
            $max_rev = -1;
            $low_rating_staff = [];
            foreach ($staff_performance as $staff) {
                if ($staff['total_revenue'] > $max_rev) {
                    $max_rev = $staff['total_revenue'];
                    $star_performer = $staff['first_name'] . ' ' . $staff['last_name'];
                }
                if ($staff['feedback_count'] > 0 && $staff['avg_rating'] < 4.0) {
                    $low_rating_staff[] = htmlspecialchars($staff['first_name'] . ' ' . $staff['last_name']) . " (" . number_format($staff['avg_rating'], 1) . "★)";
                }
            }
            ?>
            <?php if ($star_performer || !empty($low_rating_staff)): ?>
                <div class="alert alert-info border-info shadow-sm d-flex flex-column gap-1 mb-4 no-print" role="alert">
                    <div class="d-flex align-items-start">
                        <i class="bi bi-info-circle-fill fs-4 me-3 text-info"></i>
                        <div>
                            <?php if ($star_performer): ?>
                                <strong class="text-dark">HR Performance Highlight:</strong> 🏆
                                <strong><?= htmlspecialchars($star_performer); ?></strong> is this month's top financial
                                contributor (generating Rs. <?= number_format($max_rev, 2); ?>).
                            <?php endif; ?>
                            <?php if (!empty($low_rating_staff)): ?>
                                <div class="mt-1">
                                    <strong class="text-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i>Training
                                        recommendation:</strong> Review feedback logs for
                                    <strong><?= implode(', ', $low_rating_staff); ?></strong> due to average customer ratings
                                    below 4.0★.
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

            <!-- KPI Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-6">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-secondary border-4">
                        <span class="text-muted small text-uppercase">Aggregated Staff Revenue Contribution</span>
                        <h4 class="fw-bold text-secondary mb-0 mt-1">Rs. <?= number_format($total_revenue_staff, 2); ?>
                        </h4>
                        <small class="text-muted">Combined sales + repair income processed by employees</small>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card card-kpi p-3 bg-white h-100 border-start border-primary border-4">
                        <span class="text-muted small text-uppercase">Total Service Repairs Completed</span>
                        <h4 class="fw-bold text-primary mb-0 mt-1"><?= $total_repairs_staff; ?> jobs</h4>
                        <small class="text-muted">Service tasks completed successfully</small>
                    </div>
                </div>
            </div>

            <!-- Visual Analytics Charts Row -->
            <div class="row g-4 mb-4">
                <div class="col-md-7">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-bar-chart-line-fill text-secondary me-2"></i>Staff Revenue Generation (Sales
                            vs Repairs)
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="staffRevChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold py-3">
                            <i class="bi bi-pie-chart-fill text-primary me-2"></i>Total Workload Distribution
                        </div>
                        <div class="card-body d-flex justify-content-center align-items-center">
                            <div style="width: 100%; height: 260px;">
                                <canvas id="staffWorkloadChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Employee Ledger -->
            <div class="card shadow-sm border-0">
                <div class="card-header bg-white fw-bold py-3">
                    <i class="bi bi-people-fill text-secondary me-2"></i>Employee Service & Sales Performance Ledger
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-3">Employee Name</th>
                                    <th>Role / Department</th>
                                    <th class="text-center">Sales Completed</th>
                                    <th>Sales Revenue</th>
                                    <th class="text-center">Repairs Completed</th>
                                    <th>Total Revenue Generated</th>
                                    <th class="text-center">Average Rating</th>
                                    <th class="text-end pe-3">Performance Class</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (count($staff_performance) > 0): ?>
                                    <?php foreach ($staff_performance as $staff): ?>
                                        <tr>
                                            <td class="ps-3">
                                                <span
                                                    class="fw-bold text-dark"><?= htmlspecialchars($staff['first_name'] . ' ' . $staff['last_name']); ?></span>
                                                <span
                                                    class="small text-muted d-block"><?= htmlspecialchars($staff['email']); ?></span>
                                            </td>
                                            <td>
                                                <span
                                                    class="badge bg-light text-dark border"><?= htmlspecialchars($staff['role']); ?></span>
                                            </td>
                                            <td class="text-center fw-semibold"><?= $staff['sales_count']; ?></td>
                                            <td class="text-primary">Rs. <?= number_format($staff['sales_revenue'], 2); ?></td>
                                            <td class="text-center fw-semibold"><?= $staff['repairs_count']; ?></td>
                                            <td class="text-success fw-bold">Rs.
                                                <?= number_format($staff['total_revenue'], 2); ?></td>
                                            <td class="text-center">
                                                <?php if ($staff['feedback_count'] > 0): ?>
                                                    <span class="fw-bold text-warning"><i
                                                            class="bi bi-star-fill me-1"></i><?= number_format($staff['avg_rating'], 1); ?></span>
                                                    <span class="small text-muted d-block">(<?= $staff['feedback_count']; ?>
                                                        ratings)</span>
                                                <?php else: ?>
                                                    <span class="text-muted small">No ratings</span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="text-end pe-3">
                                                <?php if ($staff['avg_rating'] >= 4.5 && $staff['total_revenue'] > 50000): ?>
                                                    <span class="badge bg-success bg-opacity-10 text-success px-2.5 py-1.5"><i
                                                            class="bi bi-award-fill me-1"></i> Outstanding</span>
                                                <?php elseif ($staff['total_revenue'] > 0): ?>
                                                    <span
                                                        class="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1.5">Proficient</span>
                                                <?php else: ?>
                                                    <span class="badge bg-secondary bg-opacity-10 text-muted px-2.5 py-1.5">No
                                                        Activity</span>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php else: ?>
                                    <tr>
                                        <td colspan="8" class="text-center py-4 text-muted">No staff performance logs
                                            available.</td>
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
        $s_names = array_map(function ($s) {
            return $s['first_name'] . ' ' . $s['last_name']; }, $staff_performance);
        $s_sales_rev = array_map(function ($s) {
            return (float) $s['sales_revenue']; }, $staff_performance);
        $s_rep_rev = array_map(function ($s) {
            return (float) $s['repair_revenue']; }, $staff_performance);
        $tot_sales_cnt = array_sum(array_column($staff_performance, 'sales_count'));
        $tot_rep_cnt = array_sum(array_column($staff_performance, 'repairs_count'));
        ?>

        const names = <?= json_encode($s_names); ?>;
        const salesRev = <?= json_encode($s_sales_rev); ?>;
        const repRev = <?= json_encode($s_rep_rev); ?>;

        // Staff Revenue Bar Chart
        const revCtx = document.getElementById('staffRevChart').getContext('2d');
        new Chart(revCtx, {
            type: 'bar',
            data: {
                labels: names,
                datasets: [
                    {
                        label: 'Sales Revenue (LKR)',
                        data: salesRev,
                        backgroundColor: '#0284c7',
                        borderRadius: 6
                    },
                    {
                        label: 'Repair Service Revenue (LKR)',
                        data: repRev,
                        backgroundColor: '#f59e0b',
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

        // Workload Doughnut Chart
        const wlCtx = document.getElementById('staffWorkloadChart').getContext('2d');
        new Chart(wlCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed Orders (Sales)', 'Completed Repairs (Service)'],
                datasets: [{
                    data: [<?= (int) $tot_sales_cnt; ?>, <?= (int) $tot_rep_cnt; ?>],
                    backgroundColor: ['#10b981', '#6f42c1'],
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