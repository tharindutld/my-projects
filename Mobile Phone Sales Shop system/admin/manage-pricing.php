<?php
session_start();
error_reporting(0);
include('../config/db.php');
include('../includes/components/pricing_helper.php');

$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");
if (true) {
    // Handle individual product discount update (base price is preserved from product catalog)
    if (isset($_POST['update_pricing'])) {
        $pid = intval($_POST['product_id']);
        $discount_percent = floatval($_POST['discount_percent']);
        $discount_start = !empty($_POST['discount_start']) ? mysqli_real_escape_string($conn, $_POST['discount_start']) : null;
        $discount_end = !empty($_POST['discount_end']) ? mysqli_real_escape_string($conn, $_POST['discount_end']) : null;

        // Validation
        if ($discount_percent < 0 || $discount_percent > 100) {
            $_SESSION['error_msg'] = "Discount percentage must be between 0% and 100%.";
        } elseif (!empty($discount_start) && !empty($discount_end) && $discount_end < $discount_start) {
            $_SESSION['error_msg'] = "Discount End Date cannot be before the Start Date.";
        } else {
            $start_sql = $discount_start ? "'$discount_start'" : "NULL";
            $end_sql = $discount_end ? "'$discount_end'" : "NULL";

            $query = mysqli_query($conn, "UPDATE tblproducts SET DiscountPercent='$discount_percent', DiscountStartDate=$start_sql, DiscountEndDate=$end_sql WHERE ID='$pid'");

            if ($query) {
                $_SESSION['success_msg'] = "Discount & promotional pricing updated successfully for product #$pid.";
            } else {
                $_SESSION['error_msg'] = "Failed to update pricing. " . $conn->error;
            }
        }
        header("Location: manage-pricing.php");
        exit();
    }

    // Handle bulk discount apply
    if (isset($_POST['bulk_discount'])) {
        $bulk_ids = $_POST['bulk_ids'] ?? [];
        $bulk_discount = floatval($_POST['bulk_discount_percent']);
        $bulk_start = !empty($_POST['bulk_start']) ? mysqli_real_escape_string($conn, $_POST['bulk_start']) : null;
        $bulk_end = !empty($_POST['bulk_end']) ? mysqli_real_escape_string($conn, $_POST['bulk_end']) : null;

        if (empty($bulk_ids)) {
            $_SESSION['error_msg'] = "Please select at least one product from the table to apply bulk discount.";
        } elseif ($bulk_discount < 0 || $bulk_discount > 100) {
            $_SESSION['error_msg'] = "Discount must be between 0% and 100%.";
        } elseif (!empty($bulk_start) && !empty($bulk_end) && $bulk_end < $bulk_start) {
            $_SESSION['error_msg'] = "Discount End Date cannot be before the Start Date.";
        } else {
            $start_sql = $bulk_start ? "'$bulk_start'" : "NULL";
            $end_sql = $bulk_end ? "'$bulk_end'" : "NULL";

            $ids_str = implode(',', array_map('intval', $bulk_ids));
            $query = mysqli_query($conn, "UPDATE tblproducts SET DiscountPercent='$bulk_discount', DiscountStartDate=$start_sql, DiscountEndDate=$end_sql WHERE ID IN ($ids_str)");

            if ($query) {
                $count = mysqli_affected_rows($conn);
                $_SESSION['success_msg'] = "Bulk discount of {$bulk_discount}% applied to {$count} product(s) successfully.";
            } else {
                $_SESSION['error_msg'] = "Failed to apply bulk discount.";
            }
        }
        header("Location: manage-pricing.php");
        exit();
    }

    // Handle remove all discounts
    if (isset($_POST['remove_all_discounts'])) {
        $query = mysqli_query($conn, "UPDATE tblproducts SET DiscountPercent=0, DiscountStartDate=NULL, DiscountEndDate=NULL");
        if ($query) {
            $_SESSION['success_msg'] = "All discounts have been removed.";
        }
        header("Location: manage-pricing.php");
        exit();
    }

    // Fetch products with variant base price fallback
    $filter = '';
    $filter_discount = '';
    if (isset($_GET['discount_only']) && $_GET['discount_only'] == '1') {
        $filter = "WHERE tblproducts.DiscountPercent > 0";
        $filter_discount = '1';
    }


    // $filter_category = '';
    // $where_clauses = [];

    // // Check if a product filter is selected
    // if (isset($_GET['product']) && !empty($_GET['product'])) {
    //     $filter_category = mysqli_real_escape_string($conn, $_GET['product']);
    //     $where_clauses[] = "tblproducts.ProductName = '$filter_category'";
    // }

    // $filter = '';
    // if (!empty($where_clauses)) {
    //     $filter = "WHERE " . implode(" AND ", $where_clauses);
    // }


    $query_pricing = "SELECT tblproducts.*, 
                             IFNULL(NULLIF(tblproducts.Price, 0), (SELECT MIN(v.Price) FROM tblproduct_variants v WHERE v.ProductId = tblproducts.ID)) AS Price 
                      FROM tblproducts 
                      $filter 
                      ORDER BY tblproducts.CreationDate DESC";
    $ret = mysqli_query($conn, $query_pricing);
    $total = mysqli_num_rows($ret);

    // 10-rows Pagination
    $limit = 10;
    $page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int) $_GET['page'] : 1;
    if ($page < 1)
        $page = 1;
    $total_pages = ceil($total / $limit);
    if ($page > $total_pages && $total_pages > 0)
        $page = $total_pages;
    $offset = ($page - 1) * $limit;

    $query_pricing_paginated = $query_pricing . " LIMIT $limit OFFSET $offset";
    $ret_paginated = mysqli_query($conn, $query_pricing_paginated);
    ?>



    <!DOCTYPE html>
    <html lang="en">

    <head>
        <title>Mobile Mart || Manage Pricing & Discounts</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
        <style>
            .discount-badge {
                font-size: 0.8rem;
            }

            .price-original {
                text-decoration: line-through;
                color: #999;
                font-size: 0.85rem;
            }

            .price-discounted {
                color: #dc3545;
                font-weight: 700;
            }

            .pricing-row:hover {
                background-color: #f8f9fa;
            }

            .discount-active {
                border-left: 4px solid #28a745 !important;
            }

            .discount-expired {
                border-left: 4px solid #dc3545 !important;
            }

            .discount-scheduled {
                border-left: 4px solid #ffc107 !important;
            }

            .quick-stats .stat-card {
                border: none;
                border-radius: 12px;
                padding: 20px;
                transition: transform 0.2s;
            }

            .quick-stats .stat-card:hover {
                transform: translateY(-2px);
            }

            .stat-icon {
                font-size: 2rem;
                opacity: 0.7;
            }

            .modal-pricing .form-control,
            .modal-pricing .form-select {
                border-radius: 8px;
            }

            .modal-pricing .input-group {
                border-radius: 8px;
                overflow: hidden;
            }
        </style>
    </head>

    <body class="bg-light">

        <div class="d-flex">
            <?php include_once('../includes/admin/sidebar.php'); ?>

            <div class="flex-grow-1">
                <?php include_once('../includes/admin/header.php'); ?>

                <div class="container-fluid p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h3 class="mb-0"><i class="bi bi-tag-fill me-2 text-primary"></i>Manage Pricing & Discounts</h3>
                            <small class="text-muted">Set prices, apply discounts, and manage promotional offers</small>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#bulkDiscountModal">
                                <i class="bi bi-percent me-1"></i> Bulk Discount
                            </button>
                            <form method="post" class="d-inline confirm-submit"
                                data-confirm-message="Are you sure you want to remove ALL discounts from all products?">
                                <button type="submit" name="remove_all_discounts" class="btn btn-outline-danger">
                                    <i class="bi bi-x-circle me-1"></i> Clear All Discounts
                                </button>
                            </form>
                        </div>
                    </div>



                    <!-- Quick Stats -->
                    <?php
                    $stats_total = mysqli_fetch_array(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM tblproducts"));
                    $stats_discounted = mysqli_fetch_array(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM tblproducts WHERE DiscountPercent > 0"));
                    $stats_active_discount = mysqli_fetch_array(mysqli_query($conn, "SELECT COUNT(*) as cnt FROM tblproducts WHERE DiscountPercent > 0 AND (DiscountStartDate IS NULL OR DiscountStartDate <= CURDATE()) AND (DiscountEndDate IS NULL OR DiscountEndDate >= CURDATE())"));
                    $stats_avg_discount = mysqli_fetch_array(mysqli_query($conn, "SELECT IFNULL(AVG(DiscountPercent),0) as avg_d FROM tblproducts WHERE DiscountPercent > 0"));
                    ?>
                    <div class="row quick-stats g-3 mb-4">
                        <div class="col-md-3">
                            <div class="stat-card shadow-sm bg-white">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div class="text-muted small fw-bold">Total Products</div>
                                        <h3 class="mb-0 fw-bold"><?php echo $stats_total['cnt']; ?></h3>
                                    </div>
                                    <i class="bi bi-box stat-icon text-primary"></i>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card shadow-sm bg-white">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div class="text-muted small fw-bold">Discounted Products</div>
                                        <h3 class="mb-0 fw-bold text-success"><?php echo $stats_discounted['cnt']; ?></h3>
                                    </div>
                                    <i class="bi bi-percent stat-icon text-success"></i>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card shadow-sm bg-white">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div class="text-muted small fw-bold">Active Discounts</div>
                                        <h3 class="mb-0 fw-bold text-info"><?php echo $stats_active_discount['cnt']; ?></h3>
                                    </div>
                                    <i class="bi bi-lightning stat-icon text-info"></i>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card shadow-sm bg-white">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div class="text-muted small fw-bold">Avg. Discount</div>
                                        <h3 class="mb-0 fw-bold text-warning">
                                            <?php echo number_format($stats_avg_discount['avg_d'], 1); ?>%
                                        </h3>
                                    </div>
                                    <i class="bi bi-graph-down stat-icon text-warning"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Filter Toggle -->
                    <div class="mb-3">
                        <a href="manage-pricing.php"
                            class="btn btn-sm <?php echo empty($filter_discount) ? 'btn-dark' : 'btn-outline-dark'; ?>">All
                            Products</a>
                        <a href="manage-pricing.php?discount_only=1"
                            class="btn btn-sm <?php echo $filter_discount == '1' ? 'btn-dark' : 'btn-outline-dark'; ?>">
                            <i class="bi bi-percent me-1"></i>Discounted Only
                        </a>
                    </div>

                    <!-- <form method="get" action="manage-pricing.php" id="filterForm">
                        <div class="col-md-2">
                            <label class="form-label small text-muted fw-bold mb-1">Product</label>
                            <select class="form-select" name="product">
                                <option value="">All Products</option>
                                <?php
                                $cats = mysqli_query($conn, "SELECT * FROM tblproducts ORDER BY ProductName ASC");
                                while ($c = mysqli_fetch_array($cats)) {
                                    $sel = ($filter_category == $c['ProductName']) ? 'selected' : '';
                                    $status_label = ($c['Status'] == '0' || $c['Status'] === 0) ? ' (Inactive)' : '';
                                    echo "<option value=\"{$c['ProductName']}\" $sel>{$c['ProductName']}{$status_label}</option>";
                                }
                                ?>
                            </select>
                        </div>


                        <div class="col-md-2 d-flex gap-1">
                            <button type="submit" class="btn btn-dark flex-grow-1"><i class="bi bi-funnel me-1"></i>
                                Filter</button>
                            <a href="manage-pricing.php" class="btn btn-outline-secondary" title="Clear Filters"><i
                                    class="bi bi-x-lg"></i></a>
                        </div>

                    </form> -->

                    <!-- Pricing Table -->
                    <div class="card shadow-sm border-0">
                        <div class="card-body p-0">
                            <form method="post" id="bulkSelectForm">
                                <div class="table-responsive">
                                    <table class="table table-hover align-middle mb-0">
                                        <thead class="table-dark">
                                            <tr>
                                                <th style="width:40px;"><input type="checkbox" class="form-check-input"
                                                        id="selectAll" onclick="toggleAll(this)"></th>
                                                <th>#</th>
                                                <th>Product</th>
                                                <th>Brand</th>
                                                <th>Original Price</th>
                                                <th>Discount %</th>
                                                <th>Final Price</th>
                                                <th>Discount Period</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php
                                            if ($total > 0) {
                                                $cnt = $offset + 1;
                                                while ($row = mysqli_fetch_array($ret_paginated)) {
                                                    $discount_active = isDiscountActive($row);
                                                    $final_price = getDiscountedPrice($row);
                                                    $savings = getDiscountSavings($row);

                                                    // Determine status class
                                                    $row_class = '';
                                                    $discount_pct = floatval($row['DiscountPercent']);
                                                    if ($discount_pct > 0) {
                                                        $today = date('Y-m-d');
                                                        if (!empty($row['DiscountEndDate']) && $today > $row['DiscountEndDate']) {
                                                            $row_class = 'discount-expired';
                                                        } elseif (!empty($row['DiscountStartDate']) && $today < $row['DiscountStartDate']) {
                                                            $row_class = 'discount-scheduled';
                                                        } else {
                                                            $row_class = 'discount-active';
                                                        }
                                                    }
                                                    ?>
                                                    <tr class="pricing-row <?php echo $row_class; ?>">
                                                        <td><input type="checkbox" class="form-check-input bulk-check"
                                                                name="bulk_ids[]" value="<?php echo $row['ID']; ?>"></td>
                                                        <td><?php echo $cnt; ?></td>
                                                        <td class="fw-bold"><?php echo htmlspecialchars($row['ProductName']); ?>
                                                        </td>
                                                        <td><span
                                                                class="badge bg-secondary"><?php echo htmlspecialchars($row['BrandName']); ?></span>
                                                        </td>
                                                        <td>Rs. <?php echo number_format($row['Price'], 2); ?></td>
                                                        <td>
                                                            <?php if ($discount_pct > 0): ?>
                                                                <span
                                                                    class="badge bg-danger discount-badge"><?php echo number_format($discount_pct, 0); ?>%
                                                                    OFF</span>
                                                            <?php else: ?>
                                                                <span class="text-muted">—</span>
                                                            <?php endif; ?>
                                                        </td>
                                                        <td>
                                                            <?php if ($discount_active): ?>
                                                                <span class="price-discounted">Rs.
                                                                    <?php echo number_format($final_price, 2); ?></span>
                                                                <br><small class="text-success">Save Rs.
                                                                    <?php echo number_format($savings, 2); ?></small>
                                                            <?php else: ?>
                                                                Rs. <?php echo number_format($row['Price'], 2); ?>
                                                            <?php endif; ?>
                                                        </td>
                                                        <td>
                                                            <?php if ($discount_pct > 0): ?>
                                                                <?php if (empty($row['DiscountStartDate']) && empty($row['DiscountEndDate'])): ?>
                                                                    <span
                                                                        class="badge bg-success bg-opacity-10 text-success">Permanent</span>
                                                                <?php else: ?>
                                                                    <small class="d-block text-muted">
                                                                        <?php echo $row['DiscountStartDate'] ? date('M d', strtotime($row['DiscountStartDate'])) : 'Start'; ?>
                                                                        →
                                                                        <?php echo $row['DiscountEndDate'] ? date('M d, Y', strtotime($row['DiscountEndDate'])) : 'No End'; ?>
                                                                    </small>
                                                                    <?php
                                                                    $today = date('Y-m-d');
                                                                    if (!empty($row['DiscountEndDate']) && $today > $row['DiscountEndDate']): ?>
                                                                        <span class="badge bg-danger bg-opacity-10 text-danger">Expired</span>
                                                                    <?php elseif (!empty($row['DiscountStartDate']) && $today < $row['DiscountStartDate']): ?>
                                                                        <span
                                                                            class="badge bg-warning bg-opacity-10 text-warning">Scheduled</span>
                                                                    <?php else: ?>
                                                                        <span class="badge bg-success bg-opacity-10 text-success">Active</span>
                                                                    <?php endif; ?>
                                                                <?php endif; ?>
                                                            <?php else: ?>
                                                                <span class="text-muted">—</span>
                                                            <?php endif; ?>
                                                        </td>
                                                        <td>
                                                            <?php if ($row['Status'] == 1): ?>
                                                                <span class="badge bg-success">Active</span>
                                                            <?php else: ?>
                                                                <span class="badge bg-danger">Inactive</span>
                                                            <?php endif; ?>
                                                        </td>
                                                        <td>
                                                            <button type="button" class="btn btn-sm btn-primary"
                                                                onclick="openPricingModal(<?php echo $row['ID']; ?>, '<?php echo addslashes($row['ProductName']); ?>', <?php echo $row['Price']; ?>, <?php echo $row['DiscountPercent']; ?>, '<?php echo $row['DiscountStartDate'] ?? ''; ?>', '<?php echo $row['DiscountEndDate'] ?? ''; ?>')">
                                                                <i class="bi bi-pencil-square"></i> Edit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    <?php $cnt++;
                                                }
                                            } else { ?>
                                                <tr>
                                                    <td colspan="10" class="text-center text-muted py-4">
                                                        No products found. <a href="add-product.php">Add products first</a>.
                                                    </td>
                                                </tr>
                                            <?php } ?>
                                        </tbody>
                                    </table>
                                </div>
                            </form>

                            <!-- Pagination Controls -->
                            <?php if ($total_pages > 1): ?>
                                <nav class="d-flex justify-content-center py-3">
                                    <ul class="pagination pagination-custom gap-1 mb-0">
                                        <?php $query_params = !empty($filter_discount) ? ['discount_only' => 1] : []; ?>
                                        <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
                                            <a class="page-link"
                                                href="?<?php echo http_build_query(array_merge($query_params, ['page' => $page - 1])); ?>">&laquo;</a>
                                        </li>
                                        <?php for ($i = 1; $i <= $total_pages; $i++): ?>
                                            <li class="page-item <?php echo ($page == $i) ? 'active' : ''; ?>">
                                                <a class="page-link"
                                                    href="?<?php echo http_build_query(array_merge($query_params, ['page' => $i])); ?>"><?php echo $i; ?></a>
                                            </li>
                                        <?php endfor; ?>
                                        <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
                                            <a class="page-link"
                                                href="?<?php echo http_build_query(array_merge($query_params, ['page' => $page + 1])); ?>">&raquo;</a>
                                        </li>
                                    </ul>
                                </nav>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Individual Pricing Edit Modal -->
        <div class="modal fade modal-pricing" id="pricingModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <form method="post">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="bi bi-tag-fill me-2"></i>Update Pricing</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <input type="hidden" name="product_id" id="modal_product_id">
                            <p class="fw-bold text-center mb-3" id="modal_product_name"></p>

                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Original Base Price <small
                                            class="text-muted">(Catalog)</small></label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-light text-muted">Rs.</span>
                                        <input type="number" class="form-control bg-light text-dark fw-bold"
                                            id="modal_price" step="0.01" readonly tabindex="-1"
                                            title="Base price set during product creation">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold text-danger">Discount %</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control fw-bold border-danger rounded me-2"
                                            name="discount_percent" id="modal_discount" step="0.5" min="0" max="100"
                                            value="0" placeholder="0" oninput="calculatePreview()" required autofocus>
                                        <span class="input-group-text bg-danger text-white fw-bold rounded">% OFF</span>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Start Date <small
                                            class="text-muted">(optional)</small></label>
                                    <input type="date" class="form-control" name="discount_start" id="modal_start">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">End Date <small
                                            class="text-muted">(optional)</small></label>
                                    <input type="date" class="form-control" name="discount_end" id="modal_end">
                                </div>
                            </div>

                            <!-- Live Preview -->
                            <div class="mt-4 p-3 bg-light rounded-3 text-center" id="pricePreview">
                                <small class="text-muted d-block mb-1">Customer will see:</small>
                                <div id="previewContent">
                                    <h4 class="text-primary fw-bold mb-0" id="preview_final">Rs. 0.00</h4>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" name="update_pricing" class="btn btn-primary">
                                <i class="bi bi-save me-1"></i> Save Pricing
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Bulk Discount Modal -->
        <div class="modal fade modal-pricing" id="bulkDiscountModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <form method="post" id="bulkDiscountForm">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title"><i class="bi bi-percent me-2"></i>Apply Bulk Discount</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info py-2">
                                <i class="bi bi-info-circle me-1"></i> Select products from the table first, then set
                                discount details here.
                            </div>
                            <p class="fw-bold mb-3">Selected Products: <span id="selectedCount"
                                    class="badge bg-primary">0</span></p>

                            <!-- Hidden inputs for selected IDs will be injected by JS -->
                            <div id="bulkHiddenIds"></div>

                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label fw-bold">Discount Percentage</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control form-control-lg"
                                            name="bulk_discount_percent" step="0.5" min="0" max="100" value="10" required>
                                        <span class="input-group-text">%</span>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Start Date <small
                                            class="text-muted">(optional)</small></label>
                                    <input type="date" class="form-control" name="bulk_start" id="bulk_start">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">End Date <small
                                            class="text-muted">(optional)</small></label>
                                    <input type="date" class="form-control" name="bulk_end" id="bulk_end">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" name="bulk_discount" class="btn btn-success">
                                <i class="bi bi-check-lg me-1"></i> Apply to Selected
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        <?php include_once('../includes/components/confirmation.php'); ?>

        <script>
            // Open individual pricing modal
            function openPricingModal(id, name, price, discount, start, end) {
                const todayStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');

                document.getElementById('modal_product_id').value = id;
                document.getElementById('modal_product_name').textContent = name;
                document.getElementById('modal_price').value = price;
                document.getElementById('modal_discount').value = discount;

                const modalStart = document.getElementById('modal_start');
                const modalEnd = document.getElementById('modal_end');

                modalStart.value = start || '';
                modalEnd.value = end || '';

                modalStart.removeAttribute('max');
                modalEnd.removeAttribute('min');

                if (start) {
                    modalEnd.min = start;
                } else {
                    modalEnd.min = todayStr;
                }

                if (end) {
                    modalStart.max = end;
                }

                if (!start || start >= todayStr) {
                    modalStart.min = todayStr;
                } else {
                    modalStart.removeAttribute('min');
                }

                calculatePreview();
                new bootstrap.Modal(document.getElementById('pricingModal')).show();
            }

            // Live price preview
            function calculatePreview() {
                const price = parseFloat(document.getElementById('modal_price').value) || 0;
                const discount = parseFloat(document.getElementById('modal_discount').value) || 0;
                const final_price = price * (1 - discount / 100);
                const savings = price - final_price;

                let html = '';
                if (discount > 0) {
                    html = `<span class="text-decoration-line-through text-muted me-2">Rs. ${price.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                    <span class="badge bg-danger">${discount}% OFF</span>
                    <h4 class="text-danger fw-bold mt-2 mb-0">Rs. ${final_price.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</h4>
                    <small class="text-success">Customer saves Rs. ${savings.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</small>`;
                } else {
                    html = `<h4 class="text-primary fw-bold mb-0">Rs. ${price.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</h4>`;
                }
                document.getElementById('previewContent').innerHTML = html;
            }

            // Select all toggle
            function toggleAll(source) {
                document.querySelectorAll('.bulk-check').forEach(cb => cb.checked = source.checked);
                updateSelectedCount();
            }

            // Update selected count
            function updateSelectedCount() {
                const count = document.querySelectorAll('.bulk-check:checked').length;
                document.getElementById('selectedCount').textContent = count;
            }

            // Track checkbox changes
            document.addEventListener('DOMContentLoaded', function () {
                document.querySelectorAll('.bulk-check').forEach(cb => {
                    cb.addEventListener('change', updateSelectedCount);
                });

                const todayStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');

                // For individual modal
                const modalStart = document.getElementById('modal_start');
                const modalEnd = document.getElementById('modal_end');
                if (modalStart && modalEnd) {
                    modalStart.addEventListener('change', function () {
                        if (this.value) {
                            modalEnd.min = this.value;
                        } else {
                            modalEnd.min = todayStr;
                        }
                    });
                    modalEnd.addEventListener('change', function () {
                        if (this.value) {
                            modalStart.max = this.value;
                        } else {
                            modalStart.removeAttribute('max');
                        }
                    });
                }

                // For bulk modal
                const bulkStart = document.getElementById('bulk_start');
                const bulkEnd = document.getElementById('bulk_end');
                if (bulkStart && bulkEnd) {
                    bulkStart.min = todayStr;
                    bulkEnd.min = todayStr;
                    bulkStart.addEventListener('change', function () {
                        if (this.value) {
                            bulkEnd.min = this.value;
                        } else {
                            bulkEnd.min = todayStr;
                        }
                    });
                    bulkEnd.addEventListener('change', function () {
                        if (this.value) {
                            bulkStart.max = this.value;
                        } else {
                            bulkStart.removeAttribute('max');
                        }
                    });
                }
            });

            // Before submitting bulk form, copy selected IDs
            document.getElementById('bulkDiscountForm').addEventListener('submit', function (e) {
                const container = document.getElementById('bulkHiddenIds');
                container.innerHTML = '';
                const checked = document.querySelectorAll('.bulk-check:checked');
                if (checked.length === 0) {
                    e.preventDefault();
                    Swal.fire({
                        icon: 'warning',
                        title: 'Selection Required',
                        text: 'Please select at least one product from the table to apply bulk discount.',
                        confirmButtonColor: '#0d6efd'
                    });
                    return false;
                }
                checked.forEach(cb => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'bulk_ids[]';
                    input.value = cb.value;
                    container.appendChild(input);
                });
            });
        </script>
    </body>

    </html>
<?php } ?>