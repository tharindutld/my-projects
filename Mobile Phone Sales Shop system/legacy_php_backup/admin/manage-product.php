<?php
session_start();
error_reporting(0);
include('../config/db.php');

$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");

if (true) {
    // Delete product logic
    if(isset($_GET['delid'])) {
        $rid = intval($_GET['delid']);
        
        // Check if there is active stock in any variants
        $stock_check_q = mysqli_query($conn, "SELECT SUM(Stock) as TotalStock FROM tblproduct_variants WHERE ProductId=$rid");
        if($stock_check_q && $check_row = mysqli_fetch_assoc($stock_check_q)) {
            if (intval($check_row['TotalStock']) > 0) {
                $_SESSION['error_msg'] = "Cannot delete product. This product currently has active stock ({$check_row['TotalStock']} units) remaining across its variants. Set stock to 0 first.";
                header('location:manage-product.php');
                exit();
            }
        }
        
        $sql = mysqli_query($conn, "DELETE FROM tblproducts WHERE ID=$rid");
        $_SESSION['success_msg'] = "Product deleted successfully.";
        header('location:manage-product.php');
        exit();
    }

    // --- Build dynamic query based on filters ---
    $where_clauses = [];
    $search_term = '';
    $filter_brand = '';
    $filter_category = '';
    $filter_status = '';

    if(isset($_GET['search']) && !empty(trim($_GET['search']))) {
        $search_term = mysqli_real_escape_string($conn, trim($_GET['search']));
        $where_clauses[] = "(p.ProductName LIKE '%$search_term%' OR p.ModelNumber LIKE '%$search_term%' OR p.BrandName LIKE '%$search_term%')";
    }

    if(isset($_GET['brand']) && !empty($_GET['brand'])) {
        $filter_brand = mysqli_real_escape_string($conn, $_GET['brand']);
        $where_clauses[] = "p.BrandName='$filter_brand'";
    }

    if(isset($_GET['category']) && !empty($_GET['category'])) {
        $filter_category = mysqli_real_escape_string($conn, $_GET['category']);
        $where_clauses[] = "p.CategoryName='$filter_category'";
    }

    if(isset($_GET['status']) && $_GET['status'] !== '') {
        $filter_status = intval($_GET['status']);
        $where_clauses[] = "p.Status='$filter_status'";
    }

    $where_sql = '';
    if(!empty($where_clauses)) {
        $where_sql = "WHERE " . implode(' AND ', $where_clauses);
    }

    $product_query = "SELECT p.ID FROM tblproducts p $where_sql";
    $ret = mysqli_query($conn, $product_query);
    $total_results = $ret ? mysqli_num_rows($ret) : 0;

    // Save filter parameters
    $all_params = [];
    if(!empty($search_term)) $all_params['search'] = $search_term;
    if(!empty($filter_brand)) $all_params['brand'] = $filter_brand;
    if(!empty($filter_category)) $all_params['category'] = $filter_category;
    if($filter_status !== '') $all_params['status'] = $filter_status;

    // Pagination
    $limit = 10;
    $page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
    if ($page < 1) $page = 1;
    $total_pages = ceil($total_results / $limit);
    if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
    $offset = ($page - 1) * $limit;

    $paginated_query = "
        SELECT 
            p.*, 
            MIN(v.Price) as MinPrice, 
            MAX(v.Price) as MaxPrice, 
            SUM(v.Stock) as TotalStock,
            COUNT(v.ID) as VariantCount
        FROM tblproducts p
        LEFT JOIN tblproduct_variants v ON p.ID = v.ProductId
        $where_sql
        GROUP BY p.ID
        ORDER BY p.CreationDate DESC 
        LIMIT $limit OFFSET $offset";
    $ret_paginated = mysqli_query($conn, $paginated_query);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mobile Mart || Manage Products</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
</head>
<body class="bg-light">

<div class="d-flex">
    <?php include_once('../includes/admin/sidebar.php');?>
    
    <div class="flex-grow-1">
        <?php include_once('../includes/admin/header.php');?>
        
        <div class="container-fluid p-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="mb-0">Manage Products</h3>
                <a href="add-product.php" class="btn btn-primary"><i class="bi bi-plus-circle me-1"></i> Add New Product</a>
            </div>

            <!-- Search & Filter Toolbar -->
            <div class="card shadow-sm mb-3 border-0">
                <div class="card-body py-3">
                    <form method="get" action="manage-product.php" id="filterForm">
                        <div class="row g-2 align-items-end">
                            <div class="col-md-4">
                                <label class="form-label small text-muted fw-bold mb-1">Search</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                                    <input type="text" class="form-control" name="search" placeholder="Search by name, model, brand..." value="<?php echo htmlspecialchars($search_term); ?>">
                                </div>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small text-muted fw-bold mb-1">Brand</label>
                                <select class="form-select" name="brand">
                                    <option value="">All Brands</option>
                                    <?php
                                    $brands = mysqli_query($conn, "SELECT * FROM tblbrand ORDER BY BrandName ASC");
                                    while($b = mysqli_fetch_array($brands)) {
                                        $sel = ($filter_brand == $b['BrandName']) ? 'selected' : '';
                                        $status_label = ($b['Status'] == '0' || $b['Status'] === 0) ? ' (Inactive)' : '';
                                        echo "<option value=\"{$b['BrandName']}\" $sel>{$b['BrandName']}{$status_label}</option>";
                                    }
                                    ?>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small text-muted fw-bold mb-1">Category</label>
                                <select class="form-select" name="category">
                                    <option value="">All Categories</option>
                                    <?php
                                    $cats = mysqli_query($conn, "SELECT * FROM tblcategory ORDER BY CategoryName ASC");
                                    while($c = mysqli_fetch_array($cats)) {
                                        $sel = ($filter_category == $c['CategoryName']) ? 'selected' : '';
                                        $status_label = ($c['Status'] == '0' || $c['Status'] === 0) ? ' (Inactive)' : '';
                                        echo "<option value=\"{$c['CategoryName']}\" $sel>{$c['CategoryName']}{$status_label}</option>";
                                    }
                                    ?>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small text-muted fw-bold mb-1">Status</label>
                                <select class="form-select" name="status">
                                    <option value="">All Status</option>
                                    <option value="1" <?php echo $filter_status === 1 ? 'selected' : ''; ?>>Active</option>
                                    <option value="0" <?php echo $filter_status === 0 && $filter_status !== '' ? 'selected' : ''; ?>>Inactive</option>
                                </select>
                            </div>
                            <div class="col-md-2 d-flex gap-1">
                                <button type="submit" class="btn btn-dark flex-grow-1"><i class="bi bi-funnel me-1"></i> Filter</button>
                                <a href="manage-product.php" class="btn btn-outline-secondary" title="Clear Filters"><i class="bi bi-x-lg"></i></a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Results Count -->
            <p class="text-muted small mb-2">
                <i class="bi bi-list-ul me-1"></i> Showing <strong><?php echo $total_results; ?></strong> product<?php echo $total_results != 1 ? 's' : ''; ?>
                <?php if(!empty($where_clauses)): ?> (filtered)<?php endif; ?>
            </p>

            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover table-striped align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th>#</th>
                                    <th>Product Name</th>
                                    <th>Brand</th>
                                    <th>Category</th>
                                    <th>Model No.</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Date Added</th>
                                    <th>Action</th>
                                    
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                if($total_results > 0) {
                                    $cnt = $offset + 1;
                                    while ($row = mysqli_fetch_array($ret_paginated)) {
                                ?>
                                <tr>
                                    <td><?php echo $cnt;?></td>
                                    <td class="fw-bold"><?php echo htmlspecialchars($row['ProductName']);?></td>
                                    <td><?php echo htmlspecialchars($row['BrandName']);?></td>
                                    <td>
                                        <?php if(!empty($row['CategoryName'])): ?>
                                            <span class="badge bg-info bg-opacity-10 text-info"><?php echo htmlspecialchars($row['CategoryName']);?></span>
                                        <?php else: ?>
                                            <span class="text-muted">—</span>
                                        <?php endif; ?>
                                    </td>
                                    <td><?php echo htmlspecialchars($row['ModelNumber']);?></td>
                                     <td>
                                         <?php 
                                         if ($row['VariantCount'] == 0) {
                                             echo '<span class="text-muted">No variants</span>';
                                         } elseif ($row['MinPrice'] == $row['MaxPrice']) {
                                             echo 'Rs. ' . number_format($row['MinPrice'], 2);
                                         } else {
                                             echo 'Rs. ' . number_format($row['MinPrice'], 2) . ' - ' . number_format($row['MaxPrice'], 2);
                                         }
                                         ?>
                                     </td>
                                     <td>
                                         <span class="badge bg-secondary"><?php echo intval($row['TotalStock']);?></span>
                                         <br><small class="text-muted"><?php echo $row['VariantCount'];?> variant<?php echo $row['VariantCount'] != 1 ? 's' : '';?></small>
                                     </td>
                                    <td>
                                        <?php if($row['Status'] == "1"){ echo '<span class="badge bg-success">Active</span>'; } else { echo '<span class="badge bg-danger">Inactive</span>'; } ?>
                                    </td>
                                    <td><?php echo date('M d, Y', strtotime($row['CreationDate']));?></td>
                                    <td>
                                        <a href="editproducts.php?editid=<?php echo $row['ID'];?>" class="btn btn-sm btn-primary" title="Edit"><i class="bi bi-pencil"></i> Edit</a>
                                        <a href="manage-product.php?delid=<?php echo $row['ID'];?>" class="btn btn-sm btn-danger confirm-link confirm-delete" data-confirm-message="Are you sure you want to permanently delete this product?" title="Delete"><i class="bi bi-trash"></i> Delete</a>
                                    </td>
                                </tr>
                                <?php $cnt++; }
                                } else { ?>
                                <tr>
                                    <td colspan="10" class="text-center text-muted py-4">
                                        <i class="bi bi-search me-2"></i>No products found matching your criteria.
                                        <?php if(!empty($where_clauses)): ?>
                                            <br><a href="manage-product.php" class="mt-2 d-inline-block">Clear all filters</a>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <?php } ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination Controls -->
                    <?php if ($total_pages > 1): ?>
                    <nav class="d-flex justify-content-center mt-4">
                        <ul class="pagination pagination-custom gap-1">
                            <!-- Previous Page -->
                            <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?<?php echo http_build_query(array_merge($all_params, ['page' => $page - 1])); ?>" aria-label="Previous">
                                    <span aria-hidden="true">&laquo;</span>
                                </a>
                            </li>
                            
                            <!-- Page Numbers -->
                            <?php for($i = 1; $i <= $total_pages; $i++): ?>
                                <li class="page-item <?php echo ($page == $i) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?<?php echo http_build_query(array_merge($all_params, ['page' => $i])); ?>">
                                        <?php echo $i; ?>
                                    </a>
                                </li>
                            <?php endfor; ?>
                            
                            <!-- Next Page -->
                            <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?<?php echo http_build_query(array_merge($all_params, ['page' => $page + 1])); ?>" aria-label="Next">
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

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<?php include_once('../includes/components/confirmation.php'); ?>
</body>
</html>
<?php } ?>