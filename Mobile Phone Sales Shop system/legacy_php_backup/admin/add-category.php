<?php
session_start();
error_reporting(0);
include('../config/db.php');

$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");
if (true) {
    if(isset($_POST['submit'])) {
        $categoryname = trim($_POST['categoryname']);
        $status = isset($_POST['status']) ? 1 : 0;
        
        // Server-side validation
        if (!preg_match("/^[a-zA-Z0-9\s]+$/", $categoryname)) {
            $error_msg = "Category name cannot contain special characters.";
        } elseif (!preg_match("/[a-zA-Z]/", $categoryname)) {
            $error_msg = "Category name cannot consist of only numbers.";
        } else {
            // Check for duplicate
            $stmt = $conn->prepare("SELECT ID FROM tblcategory WHERE LOWER(CategoryName) = LOWER(?)");
            $stmt->bind_param("s", $categoryname);
            $stmt->execute();
            $check_res = $stmt->get_result();
            $stmt->close();
            
            if ($check_res->num_rows > 0) {
                $error_msg = "A category with this name already exists.";
            } else {
                $stmt_insert = $conn->prepare("INSERT INTO tblcategory (CategoryName, Status) VALUES (?, ?)");
                $stmt_insert->bind_param("si", $categoryname, $status);
                if ($stmt_insert->execute()) {
                    $_SESSION['success_msg'] = "Category has been created successfully.";
                    header("Location: add-category.php");
                    exit();
                } else {
                    $error_msg = "Something Went Wrong. Please try again";
                }
                $stmt_insert->close();
            }
        }
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mobile Mart || Add Category</title>
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
                    <li class="breadcrumb-item active" aria-current="page">Add Category</li>
                </ol>
            </nav>

            <div class="card shadow-sm">
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0"><i class="bi bi-grid me-2"></i>Add New Category</h5>
                </div>
                <div class="card-body">
                    <form method="post" class="confirm-submit" data-confirm-message="Please confirm that you wish to add this new category to the system.">
                        <div class="mb-3">
                            <label for="categoryname" class="form-label fw-bold">Category Name</label>
                            <input type="text" class="form-control" name="categoryname" id="categoryname" required pattern="^(?=.*[a-zA-Z])[a-zA-Z0-9\s]+$" title="Category name must contain letters and cannot contain special characters." placeholder="e.g. Smartphone, Tablet, Accessories">
                        </div>
                        <div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" name="status" id="status" value="1" checked>
                            <label class="form-check-label fw-bold" for="status">Active Status</label>
                        </div>
                        <button type="submit" class="btn btn-success" name="submit"><i class="bi bi-check-circle me-1"></i> Add Category</button>
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
