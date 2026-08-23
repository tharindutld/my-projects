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
        
        // Get the CategoryName first
        $stmt_cat = $conn->prepare("SELECT CategoryName FROM tblcategory WHERE ID=?");
        $stmt_cat->bind_param("i", $rid);
        $stmt_cat->execute();
        $cat_res = $stmt_cat->get_result();
        $stmt_cat->close();
        
        if ($cat_res && $cat_row = $cat_res->fetch_assoc()) {
            $categoryname = $cat_row['CategoryName'];
            
            // Count how many products use this category name
            $stmt_prod = $conn->prepare("SELECT COUNT(*) FROM tblproducts WHERE CategoryName=?");
            $stmt_prod->bind_param("s", $categoryname);
            $stmt_prod->execute();
            $prod_res = $stmt_prod->get_result();
            $prod_count = $prod_res->fetch_row()[0];
            $stmt_prod->close();
            
            if ($prod_count > 0) {
                $_SESSION['error_msg'] = "Cannot delete category '$categoryname' because it has $prod_count item(s) in the catalog.";
            } else {
                $stmt_del = $conn->prepare("DELETE FROM tblcategory WHERE ID=?");
                $stmt_del->bind_param("i", $rid);
                if ($stmt_del->execute()) {
                    $_SESSION['success_msg'] = "Category deleted successfully.";
                } else {
                    $_SESSION['error_msg'] = "Failed to delete category. Please try again.";
                }
                $stmt_del->close();
            }
        } else {
            $_SESSION['error_msg'] = "Category not found.";
        }
        header('location:manage-category.php');
        exit();
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mobile Mart || Manage Categories</title>
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
                <h3 class="mb-0">Manage Categories</h3>
                <a href="add-category.php" class="btn btn-info text-white"><i class="bi bi-plus-circle me-1"></i> Add New</a>
            </div>

            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover table-bordered align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th>#</th>
                                    <th>Category Name</th>
                                    <th>Status</th>
                                    <th>Creation Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $total_query = mysqli_query($conn, "SELECT COUNT(*) as total FROM tblcategory");
                                $total_rows = mysqli_fetch_assoc($total_query)['total'] ?? 0;

                                $limit = 10;
                                $page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
                                if ($page < 1) $page = 1;
                                $total_pages = ceil($total_rows / $limit);
                                if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
                                $offset = ($page - 1) * $limit;

                                $ret = mysqli_query($conn, "SELECT * FROM tblcategory ORDER BY ID DESC LIMIT $limit OFFSET $offset");
                                $cnt = $offset + 1;
                                if($total_rows > 0) {
                                    while ($row = mysqli_fetch_array($ret)) {
                                ?>
                                <tr>
                                    <td><?php echo $cnt;?></td>
                                    <td class="fw-bold"><?php echo htmlspecialchars($row['CategoryName']);?></td>
                                    <td>
                                        <?php if($row['Status'] == "1"){ ?>
                                            <span class="badge bg-success">Active</span>
                                        <?php } else { ?>  
                                            <span class="badge bg-danger">Inactive</span>
                                        <?php } ?>
                                    </td>
                                    <td><?php echo date('M d, Y', strtotime($row['CreationDate']));?></td>
                                    <td>
                                        <a href="editcategory.php?editid=<?php echo $row['ID'];?>" class="btn btn-sm btn-primary"><i class="bi bi-pencil"></i> Edit</a>
                                        <a href="manage-category.php?delid=<?php echo $row['ID'];?>" class="btn btn-sm btn-danger confirm-link confirm-delete" data-confirm-message="Are you sure you want to permanently delete this category?"><i class="bi bi-trash"></i> Delete</a>
                                    </td>
                                </tr>
                                <?php $cnt++; }
                                } else { ?>
                                <tr>
                                    <td colspan="5" class="text-center text-muted py-4">No categories found. <a href="add-category.php">Add one now</a>.</td>
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
