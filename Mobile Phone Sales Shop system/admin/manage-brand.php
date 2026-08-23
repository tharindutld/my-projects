<?php
session_start();
error_reporting(0);
include('../config/db.php');

$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");
if (true) {
    // Delete Logic
    if(isset($_GET['delid'])) {
        $rid = intval($_GET['delid']);
        
        // Get the BrandName first
        $stmt_brand = $conn->prepare("SELECT BrandName FROM tblbrand WHERE ID=?");
        $stmt_brand->bind_param("i", $rid);
        $stmt_brand->execute();
        $brand_res = $stmt_brand->get_result();
        $stmt_brand->close();
        
        if ($brand_res && $brand_row = $brand_res->fetch_assoc()) {
            $brandname = $brand_row['BrandName'];
            
            // Count how many products use this brand name
            $stmt_prod = $conn->prepare("SELECT COUNT(*) FROM tblproducts WHERE BrandName=?");
            $stmt_prod->bind_param("s", $brandname);
            $stmt_prod->execute();
            $prod_res = $stmt_prod->get_result();
            $prod_count = $prod_res->fetch_row()[0];
            $stmt_prod->close();
            
            if ($prod_count > 0) {
                $_SESSION['error_msg'] = "Cannot delete brand '$brandname' because it has $prod_count item(s) in the catalog.";
            } else {
                $stmt_del = $conn->prepare("DELETE FROM tblbrand WHERE ID=?");
                $stmt_del->bind_param("i", $rid);
                if ($stmt_del->execute()) {
                    $_SESSION['success_msg'] = "Brand deleted successfully.";
                } else {
                    $_SESSION['error_msg'] = "Failed to delete brand. Please try again.";
                }
                $stmt_del->close();
            }
        } else {
            $_SESSION['error_msg'] = "Brand not found.";
        }
        header('location:manage-brand.php');
        exit();
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mobile Mart || Manage Brands</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
</head>
<body class="bg-light">

<div class="d-flex">
    <?php include_once('../includes/admin/sidebar.php');?>
    
    <div class="flex-grow-1">
        <?php include_once('../includes/admin/header.php');?>
        
        <div class="container-fluid p-4">
            <h3 class="mb-4">Manage Brands</h3>

            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover table-bordered align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th>#</th>
                                    <th>Brand Name</th>
                                    <th>Status</th>
                                    <th>Creation Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $total_query = mysqli_query($conn, "SELECT COUNT(*) as total FROM tblbrand");
                                $total_rows = mysqli_fetch_assoc($total_query)['total'] ?? 0;

                                $limit = 10;
                                $page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
                                if ($page < 1) $page = 1;
                                $total_pages = ceil($total_rows / $limit);
                                if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
                                $offset = ($page - 1) * $limit;

                                $ret = mysqli_query($conn, "SELECT * FROM tblbrand ORDER BY ID DESC LIMIT $limit OFFSET $offset");
                                $cnt = $offset + 1;
                                if ($total_rows > 0) {
                                    while ($row = mysqli_fetch_array($ret)) {
                                ?>
                                <tr>
                                    <td><?php echo $cnt;?></td>
                                    <td class="fw-bold"><?php echo htmlspecialchars($row['BrandName']);?></td>
                                    <td>
                                        <?php if($row['Status'] == "1"){ ?>
                                            <span class="badge bg-success">Active</span>
                                        <?php } else { ?>  
                                            <span class="badge bg-danger">Inactive</span>
                                        <?php } ?>
                                    </td>
                                    <td><?php echo date('M d, Y', strtotime($row['CreationDate']));?></td>
                                    <td>
                                        <a href="editbrand.php?editid=<?php echo $row['ID'];?>" class="btn btn-sm btn-primary"><i class="bi bi-pencil"></i> Edit</a>
                                        <a href="manage-brand.php?delid=<?php echo $row['ID'];?>" class="btn btn-sm btn-danger confirm-link confirm-delete" data-confirm-message="Are you sure you want to permanently delete this brand?"><i class="bi bi-trash"></i> Delete</a>
                                    </td>
                                </tr>
                                <?php $cnt++; }
                                } else { ?>
                                <tr>
                                    <td colspan="5" class="text-center text-muted py-4">No brands found. <a href="add-brand.php">Add one now</a>.</td>
                                </tr>
                                <?php } ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination Controls -->
                    <?php if ($total_pages > 1): ?>
                    <nav class="d-flex justify-content-center py-3">
                        <ul class="pagination pagination-custom gap-1 mb-0">
                            <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?page=<?php echo $page - 1; ?>">&laquo;</a>
                            </li>
                            <?php for($i = 1; $i <= $total_pages; $i++): ?>
                                <li class="page-item <?php echo ($page == $i) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?page=<?php echo $i; ?>"><?php echo $i; ?></a>
                                </li>
                            <?php endfor; ?>
                            <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?page=<?php echo $page + 1; ?>">&raquo;</a>
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