<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

$required_roles = ['Admin', 'Sales person'];
include("../includes/admin/auth_admin.php");

// ── Handle Delete Batch — Admin only ──────────────────────────────────────────
if (isset($_GET['delete_batch'])) {
    if ($admin_role !== 'Admin') {
        $_SESSION['error_msg'] = "Access Denied: Only Admins can delete stock batches.";
        header("Location: stock-list.php"); exit();
    }
    $batch_id = (int)$_GET['delete_batch'];
    $bq = mysqli_query($conn, "SELECT VariantId, CurrentQuantity, BatchNumber FROM tbl_stock_batches WHERE ID='$batch_id'");
    $batch = mysqli_fetch_assoc($bq);
    if ($batch) {
        $vid = $batch['VariantId']; $qty = $batch['CurrentQuantity']; $batch_num = $batch['BatchNumber'];
        mysqli_begin_transaction($conn);
        try {
            $var_q = mysqli_query($conn, "SELECT Stock FROM tblproduct_variants WHERE ID='$vid'");
            $var_row = mysqli_fetch_assoc($var_q);
            if ($var_row) { $new_stock = max(0, $var_row['Stock'] - $qty); mysqli_query($conn, "UPDATE tblproduct_variants SET Stock='$new_stock' WHERE ID='$vid'"); }
            mysqli_query($conn, "DELETE FROM tbl_stock_batches WHERE ID='$batch_id'");
            $ref = "Deleted batch " . $batch_num; $adj = -$qty;
            mysqli_query($conn, "INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES ('$vid', '$adj', 'Correction', '$ref')");
            mysqli_commit($conn);
            $_SESSION['success_msg'] = "Batch <strong>$batch_num</strong> has been deleted and variant stock levels corrected.";
        } catch (Exception $e) { mysqli_rollback($conn); $_SESSION['error_msg'] = "Failed to delete batch: " . $e->getMessage(); }
    }
    header("Location: stock-list.php"); exit();
}

// ── Handle Edit Batch — Admin only ──────────────────────────────────────────
if (isset($_POST['edit_batch'])) {
    if ($admin_role !== 'Admin') {
        $_SESSION['error_msg'] = "Access Denied: Only Admins can edit batch pricing.";
        header("Location: stock-list.php"); exit();
    }
    $batch_id = (int)$_POST['batch_id'];
    $cost = (float)$_POST['cost_price'];
    $selling = (float)$_POST['selling_price'];
    $dealer = mysqli_real_escape_string($conn, $_POST['dealer']);
    if ($cost <= 0) {
        $_SESSION['error_msg'] = "Cost price must be a positive number greater than 0.";
    } elseif ($selling <= 0) {
        $_SESSION['error_msg'] = "Selling price cannot be negative or zero.";
    } elseif ($selling < 10000) {
        $_SESSION['error_msg'] = "Selling price must be at least 10,000 LKR.";
    } elseif ($selling <= $cost) {
        $_SESSION['error_msg'] = "Selling price must be greater than cost price.";
    } else {
        mysqli_begin_transaction($conn);
        try {
            $bq = mysqli_query($conn, "SELECT VariantId, BatchNumber FROM tbl_stock_batches WHERE ID='$batch_id'");
            $batch = mysqli_fetch_assoc($bq);
            if ($batch) {
                $vid = $batch['VariantId'];
                mysqli_query($conn, "UPDATE tbl_stock_batches SET CostPrice='$cost', SellingPrice='$selling', Dealer='$dealer' WHERE ID='$batch_id'");
                mysqli_query($conn, "UPDATE tblproduct_variants SET Price='$selling' WHERE ID='$vid'");
                mysqli_commit($conn);
                $_SESSION['success_msg'] = "Batch <strong>" . htmlspecialchars($batch['BatchNumber']) . "</strong> updated successfully.";
            }
        } catch (Exception $e) { mysqli_rollback($conn); $_SESSION['error_msg'] = "Failed to update batch details: " . $e->getMessage(); }
    }
    header("Location: stock-list.php"); exit();
}

// ── Search & Filter Logic ───────────────────────────────────────────────────
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$brand_filter = isset($_GET['brand']) ? trim($_GET['brand']) : '';
$status_filter = isset($_GET['status']) ? trim($_GET['status']) : '';

// Pagination settings
$limit = 10;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$offset = ($page - 1) * $limit;

$where_clauses = ["1=1"];
$params = [];
$types = "";

if (!empty($search)) {
    // Search in Product Name, Brand, Model, ROM, RAM, Batch, IMEI, or Serial numbers
    $where_clauses[] = "(p.ProductName LIKE ? OR p.BrandName LIKE ? OR p.ModelNumber LIKE ? OR b.BatchNumber LIKE ? OR i.IMEI LIKE ? OR i.SerialNumber LIKE ?)";
    $search_term = "%$search%";
    $params[] = $search_term;
    $params[] = $search_term;
    $params[] = $search_term;
    $params[] = $search_term;
    $params[] = $search_term;
    $params[] = $search_term;
    $types .= "ssssss";
}

if (!empty($brand_filter)) {
    $where_clauses[] = "p.BrandName = ?";
    $params[] = $brand_filter;
    $types .= "s";
}

if ($status_filter === 'in-stock') {
    $where_clauses[] = "b.CurrentQuantity > 5";
} elseif ($status_filter === 'low') {
    $where_clauses[] = "b.CurrentQuantity > 0 AND b.CurrentQuantity <= 5";
} elseif ($status_filter === 'out') {
    $where_clauses[] = "b.CurrentQuantity = 0";
}

$where_str = implode(" AND ", $where_clauses);

// Count Total Matches
$count_query = "SELECT COUNT(DISTINCT b.ID) as total 
                FROM tbl_stock_batches b
                JOIN tblproduct_variants v ON b.VariantId = v.ID
                JOIN tblproducts p ON v.ProductId = p.ID
                LEFT JOIN tbl_stock_imeis i ON b.ID = i.BatchId
                WHERE $where_str";

$stmt_cnt = $conn->prepare($count_query);
if (!empty($params)) {
    $stmt_cnt->bind_param($types, ...$params);
}
$stmt_cnt->execute();
$total_rows = $stmt_cnt->get_result()->fetch_assoc()['total'];
$total_pages = ceil($total_rows / $limit);
$stmt_cnt->close();

// Fetch Data with Batch IMEIs
$data_query = "SELECT b.ID, b.VariantId, b.BatchNumber, b.Dealer, b.PurchaseDate, b.CostPrice, b.SellingPrice, b.InitialQuantity, b.CurrentQuantity,
                      p.ProductName, p.BrandName, p.ModelNumber, p.SimType, p.CategoryName, v.RAM, v.ROM, v.Color,
                      GROUP_CONCAT(CONCAT(COALESCE(i.IMEI, i.SerialNumber, ''), ':', i.Status, ':', COALESCE(i.SerialNumber, '')) SEPARATOR ',') as batch_imeis
               FROM tbl_stock_batches b
               JOIN tblproduct_variants v ON b.VariantId = v.ID
               JOIN tblproducts p ON v.ProductId = p.ID
               LEFT JOIN tbl_stock_imeis i ON b.ID = i.BatchId
               WHERE $where_str
               GROUP BY b.ID
               ORDER BY b.ID DESC
               LIMIT ? OFFSET ?";

$params_limit = array_merge($params, [$limit, $offset]);
$types_limit = $types . "ii";

$stmt_data = $conn->prepare($data_query);
$stmt_data->bind_param($types_limit, ...$params_limit);
$stmt_data->execute();
$result_set = $stmt_data->get_result();
$stmt_data->close();

// Fetch summary metrics for KPI cards
$kpi_total_batches = mysqli_fetch_row(mysqli_query($conn, "SELECT COUNT(*) FROM tbl_stock_batches"))[0] ?? 0;
$kpi_total_units = mysqli_fetch_row(mysqli_query($conn, "SELECT COALESCE(SUM(CurrentQuantity), 0) FROM tbl_stock_batches"))[0] ?? 0;
$kpi_low_stock = mysqli_fetch_row(mysqli_query($conn, "SELECT COUNT(*) FROM tbl_stock_batches WHERE CurrentQuantity <= 5 AND CurrentQuantity > 0"))[0] ?? 0;
$kpi_total_imeis = mysqli_fetch_row(mysqli_query($conn, "SELECT COUNT(*) FROM tbl_stock_imeis WHERE Status='Available'"))[0] ?? 0;

// Fetch brands for dropdown filter
$all_brands_q = mysqli_query($conn, "SELECT BrandName, Status FROM tblbrand ORDER BY BrandName ASC");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mobile Mart || Inventory Batch Stock List</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <link rel="stylesheet" href="../assets/css/admin.css">
    
    <style>
        :root {
            --primary: #0d6efd;
            --primary-gradient: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
            --background: #f8fafc;
            --surface: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
        }

        body {
            background-color: var(--background);
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }

        .dashboard-container {
            background: var(--surface);
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
            padding: 1.75rem;
            width: 100%;
        }

        .kpi-card {
            background: #ffffff;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.25rem;
            transition: all 0.2s ease;
        }

        .kpi-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        }

        .search-hero-box {
            background: #f1f5f9;
            border-radius: 12px;
            padding: 1rem;
            border: 1px solid #cbd5e1;
        }

        .table-custom th {
            color: #475569;
            font-weight: 700;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            background-color: #f8fafc;
            border-bottom: 2px solid var(--border);
            padding: 1rem;
        }

        .table-custom td {
            padding: 1rem;
            vertical-align: middle;
            border-bottom: 1px solid #f1f5f9;
        }

        .table-custom tbody tr:hover {
            background-color: #f8fafc;
        }

        .status-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.88rem;
            font-weight: 700;
            padding: 0.55rem 1rem;
            border-radius: 50rem;
            line-height: 1.2;
            white-space: nowrap;
            letter-spacing: 0.02em;
        }

        .status-pill i {
            font-size: 1rem;
            line-height: 1;
        }

        .status-pill-in {
            background-color: #10b981;
            color: #ffffff;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
        }

        .status-pill-low {
            background-color: #f59e0b;
            color: #ffffff;
            box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
        }

        .status-pill-out {
            background-color: #ef4444;
            color: #ffffff;
            box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
        }

        .imei-badge-pill {
            font-family: monospace;
            font-size: 0.75rem;
            background: #e2e8f0;
            color: #334155;
            padding: 2px 8px;
            border-radius: 4px;
            margin: 2px;
            display: inline-block;
        }
    </style>
</head>
<body class="bg-light">

<div class="d-flex">
    <?php include_once('../includes/admin/sidebar.php');?>
    
    <div class="flex-grow-1">
        <?php include_once('../includes/admin/header.php');?>
        
        <div class="container-fluid p-4">
            
            <!-- Title Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="mb-0 fw-bold text-dark"><i class="bi bi-boxes text-primary me-2"></i>Inventory Batch Stock List</h3>
                    <p class="text-muted small mb-0">High-performance batch tracking with dynamic 15-digit IMEI lookup &amp; auto-fill capability.</p>
                </div>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0 bg-transparent p-0">
                        <li class="breadcrumb-item"><a href="dashboard.php" class="text-decoration-none">Dashboard</a></li>
                        <li class="breadcrumb-item"><a href="inventory.php" class="text-decoration-none">Inventory</a></li>
                        <li class="breadcrumb-item active">Batch Stock List</li>
                    </ol>
                </nav>
            </div>

            <!-- KPI Metric Summary Cards -->
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="kpi-card d-flex align-items-center justify-content-between">
                        <div>
                            <div class="text-muted small fw-bold text-uppercase">Total Batches</div>
                            <div class="fs-4 fw-bold text-dark mt-1"><?php echo number_format($kpi_total_batches); ?></div>
                        </div>
                        <div class="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                            <i class="bi bi-box-seam fs-4"></i>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="kpi-card d-flex align-items-center justify-content-between">
                        <div>
                            <div class="text-muted small fw-bold text-uppercase">Total Units in Stock</div>
                            <div class="fs-4 fw-bold text-success mt-1"><?php echo number_format($kpi_total_units); ?> <small class="fs-6 fw-normal text-muted">units</small></div>
                        </div>
                        <div class="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                            <i class="bi bi-phone fs-4"></i>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="kpi-card d-flex align-items-center justify-content-between">
                        <div>
                            <div class="text-muted small fw-bold text-uppercase">Low Stock Alert</div>
                            <div class="fs-4 fw-bold text-warning mt-1"><?php echo number_format($kpi_low_stock); ?> <small class="fs-6 fw-normal text-muted">batches</small></div>
                        </div>
                        <div class="p-3 bg-warning bg-opacity-10 text-warning rounded-circle">
                            <i class="bi bi-exclamation-triangle fs-4"></i>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="kpi-card d-flex align-items-center justify-content-between">
                        <div>
                            <div class="text-muted small fw-bold text-uppercase">Active Available IMEIs</div>
                            <div class="fs-4 fw-bold text-info mt-1"><?php echo number_format($kpi_total_imeis); ?></div>
                        </div>
                        <div class="p-3 bg-info bg-opacity-10 text-info rounded-circle">
                            <i class="bi bi-upc-scan fs-4"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Batch List Card Container -->
            <div class="dashboard-container">
                
                <!-- Action Header -->
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <div>
                        <h5 class="fw-bold text-dark mb-0">Registered Inventory Batches</h5>
                        <p class="text-muted small mb-0">Search IMEI numbers or filter by brand to locate product details.</p>
                    </div>
                    <div class="d-flex gap-2">
                        <a href="inventory.php" class="btn btn-outline-secondary btn-sm rounded-pill px-3"><i class="bi bi-grid-3x3-gap me-1"></i> Catalog View</a>
                        <a href="add-stock.php" class="btn btn-primary btn-sm rounded-pill px-4 shadow-sm"><i class="bi bi-plus-circle me-1"></i> Receive New Batch Stock</a>
                    </div>
                </div>

                <!-- IMEI Dedicated Search Bar & Filters -->
                <form method="GET" action="stock-list.php" class="search-hero-box mb-4">
                    <div class="row g-2 align-items-center">
                        <div class="col-md-6">
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0 text-primary"><i class="bi bi-search"></i></span>
                                <input type="text" name="search" class="form-control border-start-0 font-monospace" placeholder="🔍 Search 15-Digit IMEI, Brand, Model, or Batch #..." value="<?php echo htmlspecialchars($search); ?>">
                            </div>
                        </div>

                        <div class="col-md-3">
                            <select name="brand" class="form-select" onchange="this.form.submit()">
                                <option value="">All Brands</option>
                                <?php while($b = mysqli_fetch_assoc($all_brands_q)): 
                                    $status_label = ($b['Status'] == '0' || $b['Status'] === 0) ? ' (Inactive)' : '';
                                ?>
                                    <option value="<?php echo htmlspecialchars($b['BrandName']); ?>" <?php echo ($brand_filter == $b['BrandName']) ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($b['BrandName']) . $status_label; ?>
                                    </option>
                                <?php endwhile; ?>
                            </select>
                        </div>

                        <div class="col-md-2">
                            <select name="status" class="form-select" onchange="this.form.submit()">
                                <option value="">Stock Status</option>
                                <option value="in-stock" <?php echo ($status_filter == 'in-stock') ? 'selected' : ''; ?>>In Stock (>5)</option>
                                <option value="low" <?php echo ($status_filter == 'low') ? 'selected' : ''; ?>>Low Stock (1-5)</option>
                                <option value="out" <?php echo ($status_filter == 'out') ? 'selected' : ''; ?>>Out of Stock (0)</option>
                            </select>
                        </div>

                        <div class="col-md-1 text-end">
                            <?php if (!empty($search) || !empty($brand_filter) || !empty($status_filter)): ?>
                                <a href="stock-list.php" class="btn btn-light w-100 border text-muted" title="Reset Filters"><i class="bi bi-x-circle"></i></a>
                            <?php else: ?>
                                <button type="submit" class="btn btn-primary w-100"><i class="bi bi-arrow-right-short fs-5"></i></button>
                            <?php endif; ?>
                        </div>
                    </div>
                </form>

                <!-- Data Table -->
                <div class="table-responsive">
                    <table class="table table-custom align-middle">
                        <thead>
                            <tr>
                                <th>Device Specifications</th>
                                <th>Batch &amp; Supplier</th>
                                <?php if ($admin_role === 'Admin'): ?>
                                <th>Cost Price</th>
                                <?php endif; ?>
                                <th>Selling Price</th>
                                <th class="text-center">Current Qty</th>
                                <th class="text-center">Registered IMEIs</th>
                                <th class="text-center">Status</th>
                                <th class="text-end pe-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (mysqli_num_rows($result_set) > 0): ?>
                                <?php while ($row = mysqli_fetch_assoc($result_set)): 
                                    $remaining = $row['CurrentQuantity'];
                                    
                                    if ($remaining > 5) {
                                        $status_badge = '<span class="badge bg-success badge-fixed">In Stock</span>';
                                    } elseif ($remaining > 0) {
                                        $status_badge = '<span class="badge bg-warning badge-fixed">Low Stock</span>';
                                    } else {
                                        $status_badge = '<span class="badge bg-danger badge-fixed">Out of Stock</span>';
                                    }

                                    // Parse Batch IMEIs
                                    $imei_list_str = $row['batch_imeis'] ?? '';
                                    $imei_items = !empty($imei_list_str) ? explode(',', $imei_list_str) : [];
                                    $imei_count = count($imei_items);
                                ?>
                                <tr>
                                    <td>
                                        <div class="fw-bold text-dark"><?php echo htmlspecialchars($row['ProductName']); ?></div>
                                        <div class="text-muted small">
                                            <span class="badge bg-secondary bg-opacity-10 text-secondary border me-1"><?php echo htmlspecialchars($row['BrandName']); ?></span>
                                            <?php echo htmlspecialchars($row['Color']); ?> • 
                                            <?php echo htmlspecialchars($row['ROM']); ?> / <?php echo htmlspecialchars($row['RAM']); ?> RAM
                                            <span class="text-primary fw-semibold ms-1">(<?php echo htmlspecialchars($row['SimType']); ?>)</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="fw-bold text-primary font-monospace"><?php echo htmlspecialchars($row['BatchNumber']); ?></div>
                                        <div class="text-muted small"><i class="bi bi-truck me-1"></i><?php echo htmlspecialchars($row['Dealer']); ?></div>
                                        <div class="text-muted text-xs small" style="font-size: 0.72rem;"><?php echo date('M d, Y', strtotime($row['PurchaseDate'])); ?></div>
                                    </td>
                                    <?php if ($admin_role === 'Admin'): ?>
                                    <td class="fw-semibold text-secondary">LKR <?php echo number_format($row['CostPrice'], 2); ?></td>
                                    <?php endif; ?>
                                    <td class="fw-bold text-dark">LKR <?php echo number_format($row['SellingPrice'], 2); ?></td>
                                    <td class="text-center">
                                        <span class="badge bg-light text-dark border fs-6 px-3 py-2 fw-bold"><?php echo $remaining; ?> / <?php echo $row['InitialQuantity']; ?></span>
                                    </td>
                                    <td class="text-center">
                                        <?php if ($imei_count > 0): ?>
                                            <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 text-nowrap d-inline-flex align-items-center justify-content-center gap-1 btn-view-imeis" 
                                                    data-batch="<?php echo htmlspecialchars($row['BatchNumber']); ?>" 
                                                    data-product="<?php echo htmlspecialchars($row['ProductName'] . ' - ' . $row['Color']); ?>"
                                                    data-imeis='<?php echo htmlspecialchars(json_encode($imei_items), ENT_QUOTES, 'UTF-8'); ?>'>
                                                <i class="bi bi-upc-scan"></i>
                                                <span>View <?php echo ($row['CategoryName'] === 'Tablet') ? 'Serials' : 'IMEIs'; ?> (<?php echo $imei_count; ?>)</span>
                                            </button>
                                        <?php else: ?>
                                            <span class="text-muted small fst-italic">No <?php echo ($row['CategoryName'] === 'Tablet') ? 'Serials' : 'IMEIs'; ?> registered</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="text-center"><?php echo $status_badge; ?></td>
                                    <td class="text-end pe-3">
                                        <div class="btn-group btn-group-sm">
                                            <?php if ($admin_role === 'Admin'): ?>
                                            <button type="button" class="btn btn-outline-primary btn-edit-batch" 
                                                    data-id="<?php echo $row['ID']; ?>" 
                                                    data-batch="<?php echo htmlspecialchars($row['BatchNumber']); ?>" 
                                                    data-cost="<?php echo $row['CostPrice']; ?>" 
                                                    data-selling="<?php echo $row['SellingPrice']; ?>" 
                                                    data-dealer="<?php echo htmlspecialchars($row['Dealer']); ?>"
                                                    title="Edit Batch Prices">
                                                <i class="bi bi-pencil-square"></i>
                                            </button>
                                            <a href="stock-list.php?delete_batch=<?php echo $row['ID']; ?>" 
                                               class="btn btn-outline-danger confirm-link confirm-delete delete" 
                                               data-confirm-message="Are you sure you want to delete batch <?php echo htmlspecialchars($row['BatchNumber']); ?>? This will subtract its remaining stock (<?php echo $remaining; ?> units) from the product count."
                                               title="Delete Batch">
                                                <i class="bi bi-trash"></i>
                                            </a>
                                            <?php else: ?>
                                            <span class="text-muted small">View only</span>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                                <?php endwhile; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="8" class="text-center py-5">
                                        <div class="text-muted fs-5 mb-2"><i class="bi bi-search fs-1"></i></div>
                                        <div class="fw-semibold text-dark">No matching stock batches found</div>
                                        <p class="text-muted small">Try searching for a different IMEI number, product model, or clear the active filter.</p>
                                    </td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination Controls -->
                <?php if ($total_pages > 1): ?>
                <nav class="d-flex justify-content-center mt-4">
                    <ul class="pagination pagination-custom gap-1">
                        <!-- Previous Page -->
                        <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
                            <a class="page-link" href="stock-list.php?page=<?php echo $page - 1; ?>&search=<?php echo urlencode($search); ?>&brand=<?php echo urlencode($brand_filter); ?>&status=<?php echo urlencode($status_filter); ?>" aria-label="Previous">
                                <span aria-hidden="true">&laquo;</span>
                            </a>
                        </li>
                        
                        <!-- Page Numbers -->
                        <?php for ($p = 1; $p <= $total_pages; $p++): ?>
                            <li class="page-item <?php echo ($p === $page) ? 'active' : ''; ?>">
                                <a class="page-link" href="stock-list.php?page=<?php echo $p; ?>&search=<?php echo urlencode($search); ?>&brand=<?php echo urlencode($brand_filter); ?>&status=<?php echo urlencode($status_filter); ?>">
                                    <?php echo $p; ?>
                                </a>
                            </li>
                        <?php endfor; ?>
                        
                        <!-- Next Page -->
                        <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
                            <a class="page-link" href="stock-list.php?page=<?php echo $page + 1; ?>&search=<?php echo urlencode($search); ?>&brand=<?php echo urlencode($brand_filter); ?>&status=<?php echo urlencode($status_filter); ?>" aria-label="Next">
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

<!-- Edit Batch Modal -->
<div class="modal fade" id="editBatchModal" tabindex="-1" aria-labelledby="editBatchModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <form method="post" action="stock-list.php" class="modal-content confirm-submit" data-confirm-message="Are you sure you want to update these batch details?">
            <div class="modal-header">
                <h5 class="modal-title fw-bold" id="editBatchModalLabel"><i class="bi bi-pencil-square text-primary me-2"></i>Edit Stock Batch Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <input type="hidden" name="batch_id" id="edit_batch_id">
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Batch Code</label>
                    <input type="text" id="edit_batch_number" class="form-control bg-light font-monospace fw-bold" readonly>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Cost Price (Per Unit LKR)</label>
                    <input type="number" name="cost_price" id="edit_cost_price" class="form-control" step="1" min="1" required>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Selling Price (LKR)</label>
                    <input type="number" name="selling_price" id="edit_selling_price" class="form-control" step="1" min="10000" required>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Dealer / Supplier</label>
                    <select name="dealer" id="edit_dealer" class="form-select" required>
                        <option value="Apex Mobiles Ltd">Apex Mobiles Ltd</option>
                        <option value="Vertex Distribution">Vertex Distribution</option>
                        <option value="Global Cellular Wholesalers">Global Cellular Wholesalers</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" name="edit_batch" class="btn btn-primary rounded-pill px-4">Save Changes</button>
            </div>
        </form>
    </div>
</div>

<!-- View IMEIs Modal -->
<div class="modal fade" id="viewImeiModal" tabindex="-1" aria-labelledby="viewImeiModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title fw-bold" id="viewImeiModalLabel"><i class="bi bi-upc-scan text-primary me-2"></i>Registered Device IMEIs</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h6 id="imei-modal-product" class="fw-bold text-dark mb-0"></h6>
                        <span id="imei-modal-batch" class="badge bg-primary bg-opacity-10 text-primary font-monospace mt-1"></span>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-bordered align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>#</th>
                                <th>15-Digit IMEI Number</th>
                                <th class="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody id="imei-modal-table-body">
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<?php include_once('../includes/components/confirmation.php'); ?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const editModal = new bootstrap.Modal(document.getElementById('editBatchModal'));
    const imeiModal = new bootstrap.Modal(document.getElementById('viewImeiModal'));
    
    document.querySelectorAll('.btn-edit-batch').forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('edit_batch_id').value = this.dataset.id;
            document.getElementById('edit_batch_number').value = this.dataset.batch;
            document.getElementById('edit_cost_price').value = this.dataset.cost;
            document.getElementById('edit_selling_price').value = this.dataset.selling;
            document.getElementById('edit_dealer').value = this.dataset.dealer;
            editModal.show();
        });
    });

    document.querySelectorAll('.btn-view-imeis').forEach(button => {
        button.addEventListener('click', function() {
            const batch = this.dataset.batch;
            const product = this.dataset.product;
            const imeisRaw = JSON.parse(this.dataset.imeis || '[]');

            document.getElementById('imei-modal-batch').textContent = 'Batch: ' + batch;
            document.getElementById('imei-modal-product').textContent = product;

            const tbody = document.getElementById('imei-modal-table-body');
            tbody.innerHTML = '';

            if (imeisRaw.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No IMEI numbers registered for this batch.</td></tr>';
            } else {
                let hasSerials = false;
                imeisRaw.forEach(item => {
                    const parts = item.split(':');
                    if (parts[2] && parts[2].trim() !== '') {
                        hasSerials = true;
                    }
                });

                const modalTitleHeader = document.querySelector('#viewImeiModal th:nth-child(2)');
                if (modalTitleHeader) {
                    modalTitleHeader.textContent = hasSerials ? 'IMEI / Serial Number' : '15-Digit IMEI Number';
                }

                imeisRaw.forEach((item, index) => {
                    const parts = item.split(':');
                    const primary = parts[0] || 'N/A';
                    const imeiStatus = parts[1] || 'Available';
                    const serial = parts[2] || '';

                    let displayId = '';
                    if (serial !== '' && primary !== serial) {
                        displayId = `<div><span class="text-muted small">S/N:</span> <strong class="font-monospace">${serial}</strong></div>
                                     <div><span class="text-muted small">IMEI:</span> <strong class="font-monospace">${primary}</strong></div>`;
                    } else {
                        displayId = `<strong class="font-monospace">${primary}</strong>`;
                    }

                    let badgeHtml = '';
                    if (imeiStatus === 'Available') {
                        badgeHtml = '<span class="badge bg-success text-white px-3 py-1 rounded-pill fw-bold"><i class="bi bi-check-circle-fill me-1"></i>Available</span>';
                    } else if (imeiStatus === 'Sold') {
                        badgeHtml = '<span class="badge bg-primary text-white px-3 py-1 rounded-pill fw-bold"><i class="bi bi-bag-check-fill me-1"></i>Sold</span>';
                    } else {
                        badgeHtml = `<span class="badge bg-secondary text-white px-3 py-1 rounded-pill fw-bold">${imeiStatus}</span>`;
                    }

                    const row = `<tr>
                        <td class="fw-bold text-center text-muted">${index + 1}</td>
                        <td class="text-dark fs-6">${displayId}</td>
                        <td class="text-center">${badgeHtml}</td>
                    </tr>`;
                    tbody.innerHTML += row;
                });
            }

            imeiModal.show();
        });
    });
});
</script>
</body>
</html>
