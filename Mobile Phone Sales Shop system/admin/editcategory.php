<?php
session_start();
error_reporting(0);
include('../config/db.php');

$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");
if (true) {
    if(isset($_POST['submit'])) {
        $eid = intval($_GET['editid']);
        $categoryname = trim($_POST['categoryname']);
        $status = isset($_POST['status']) ? 1 : 0;
        
        // Server-side validation
        if (!preg_match("/^[a-zA-Z0-9\s]+$/", $categoryname)) {
            $error_msg = "Category name cannot contain special characters.";
        } elseif (!preg_match("/[a-zA-Z]/", $categoryname)) {
            $error_msg = "Category name cannot consist of only numbers.";
        } else {
            // Check duplicate category name (excluding the current category ID)
            $stmt = $conn->prepare("SELECT ID FROM tblcategory WHERE LOWER(CategoryName) = LOWER(?) AND ID != ?");
            $stmt->bind_param("si", $categoryname, $eid);
            $stmt->execute();
            $check_res = $stmt->get_result();
            $stmt->close();
            
            if ($check_res->num_rows > 0) {
                $error_msg = "Another category with this name already exists.";
            } else {
                $stmt_update = $conn->prepare("UPDATE tblcategory SET CategoryName=?, Status=? WHERE ID=?");
                $stmt_update->bind_param("sii", $categoryname, $status, $eid);
                if ($stmt_update->execute()) {
                    $_SESSION['success_msg'] = "Category has been updated successfully.";
                    header("Location: editcategory.php?editid=$eid");
                    exit();
                } else {
                    $error_msg = "Something Went Wrong. Please try again";
                }
                $stmt_update->close();
            }
        }
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mobile Mart || Update Category</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
</head>
<body class="bg-light">

<div class="d-flex">
    <?php include_once('../includes/admin/sidebar.php');?>
    
    <div class="flex-grow-1">
        <?php include_once('../includes/admin/header.php');?>
        
        <div class="container-fluid p-4">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="dashboard.php">Home</a></li>
                    <li class="breadcrumb-item"><a href="manage-category.php">Manage Categories</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Update Category</li>
                </ol>
            </nav>

            <div class="card shadow-sm border-0 border-top border-info border-4">
                <div class="card-header bg-white">
                    <h5 class="mb-0"><i class="bi bi-pencil-square me-2"></i>Update Category</h5>
                </div>
                <div class="card-body">
                    <form method="post" class="confirm-submit" data-confirm-message="Are you sure you want to update this category's details?">
                        <?php
                        $eid = intval($_GET['editid']);
                        $ret = mysqli_query($conn, "SELECT * FROM tblcategory WHERE ID='$eid'");
                        while ($row = mysqli_fetch_array($ret)) {
                        ?>
                        <div class="mb-3">
                            <label for="categoryname" class="form-label fw-bold">Category Name</label>
                            <input type="text" class="form-control" name="categoryname" id="categoryname" value="<?php echo htmlspecialchars($row['CategoryName']);?>" required pattern="^(?=.*[a-zA-Z])[a-zA-Z0-9\s]+$" title="Category name must contain letters and cannot contain special characters.">
                        </div>
                        <div class="mb-4 form-check">
                            <input type="checkbox" class="form-check-input" name="status" id="status" value="1" <?php if($row['Status']=="1") echo "checked"; ?>>
                            <label class="form-check-label fw-bold" for="status">Active Status</label>
                        </div>
                        <?php } ?>
                        <button type="submit" class="btn btn-primary px-4" name="submit">Update Category</button>
                        <a href="manage-category.php" class="btn btn-secondary px-4 ms-2">Cancel</a>
                    </form>
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
