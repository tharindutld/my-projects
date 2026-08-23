<?php
session_start();
error_reporting(0);
include('../config/db.php');

$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");
if (true) {
    if(isset($_POST['submit'])) {
        $eid = intval($_GET['editid']);
        $brandname = trim($_POST['brandname']);
        $status = isset($_POST['status']) ? 1 : 0;
        
        // Server-side validation
        if (!preg_match("/^[a-zA-Z0-9\s]+$/", $brandname)) {
            $error_msg = "Brand name cannot contain special characters.";
        } elseif (!preg_match("/[a-zA-Z]/", $brandname)) {
            $error_msg = "Brand name cannot consist of only numbers.";
        } else {
            // Check duplicate brand name (excluding the current brand ID)
            $stmt = $conn->prepare("SELECT ID FROM tblbrand WHERE LOWER(BrandName) = LOWER(?) AND ID != ?");
            $stmt->bind_param("si", $brandname, $eid);
            $stmt->execute();
            $check_res = $stmt->get_result();
            $stmt->close();
            
            if ($check_res->num_rows > 0) {
                $error_msg = "Another brand with this name already exists.";
            } else {
                $stmt_update = $conn->prepare("UPDATE tblbrand SET BrandName=?, Status=? WHERE ID=?");
                $stmt_update->bind_param("sii", $brandname, $status, $eid);
                if ($stmt_update->execute()) {
                    $_SESSION['success_msg'] = "Brand name has been updated.";
                    header("Location: editbrand.php?editid=$eid");
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
    <title>Mobile Mart || Update Brand</title>
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
                    <li class="breadcrumb-item"><a href="manage-brand.php">Manage Brands</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Update Brand</li>
                </ol>
            </nav>

            <div class="card shadow-sm border-0 border-top border-primary border-4">
                <div class="card-header bg-white">
                    <h5 class="mb-0"><i class="bi bi-pencil-square me-2"></i>Update Brand</h5>
                </div>
                <div class="card-body">
                    <form method="post" class="confirm-submit" data-confirm-message="Are you sure you want to update this brand's details?">
                        <?php
                        $eid = intval($_GET['editid']);
                        $ret = mysqli_query($conn, "SELECT * FROM tblbrand WHERE ID='$eid'");
                        while ($row = mysqli_fetch_array($ret)) {
                        ?>
                        <div class="mb-3">
                            <label for="brandname" class="form-label fw-bold">Brand Name</label>
                            <input type="text" class="form-control" name="brandname" id="brandname" value="<?php echo $row['BrandName'];?>" required pattern="^(?=.*[a-zA-Z])[a-zA-Z0-9\s]+$" title="Brand name must contain letters and cannot contain special characters.">
                        </div>
                        <div class="mb-4 form-check">
                            <input type="checkbox" class="form-check-input" name="status" id="status" value="1" <?php if($row['Status']=="1") echo "checked"; ?>>
                            <label class="form-check-label fw-bold" for="status">Active Status</label>
                        </div>
                        <?php } ?>
                        <button type="submit" class="btn btn-primary px-4" name="submit">Update Brand</button>
                        <a href="manage-brand.php" class="btn btn-secondary px-4 ms-2">Cancel</a>
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