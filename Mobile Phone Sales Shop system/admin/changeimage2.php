<?php
session_start();
error_reporting(0);
include('../config/db.php');

$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");
if (true) {
    if(isset($_POST['submit'])) {
        $eid = intval($_GET['editid']);
        $images = $_FILES["images"]["name"];
        $extension = strtolower(substr($images, strrpos($images, '.')));
        $allowed_extensions = array(".jpg", ".jpeg", ".png", ".gif");
        
        if(!in_array($extension, $allowed_extensions)) {
            $error_msg = "Invalid format. Only jpg / jpeg / png / gif allowed.";
        } else {
            $images = md5($images).time().$extension;
            move_uploaded_file($_FILES["images"]["tmp_name"], "../uploads/products/".$images);
            
            $query = mysqli_query($conn, "UPDATE tblproducts SET Image2='$images' WHERE ID='$eid'");
            
            if ($query) {
                $_SESSION['success_msg'] = "Product Image 2 has been updated successfully.";
                header("Location: editproducts.php?editid=$eid");
                exit();
            } else {
                $error_msg = "Something Went Wrong. Please try again.";
            }
        }
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mobile Mart || Update Image 1</title>
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
                    <li class="breadcrumb-item"><a href="manage-product.php">Products</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Update Image</li>
                </ol>
            </nav>

            <div class="card shadow-sm" style="max-width: 600px;">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="bi bi-image me-2"></i>Update Product Image 1</h5>
                </div>
                <div class="card-body">
                    <form method="post" enctype="multipart/form-data" class="confirm-submit" data-confirm-message="Are you sure you want to change this image?">
                        <?php
                        $eid = intval($_GET['editid']);
                        $ret = mysqli_query($conn, "SELECT * FROM tblproducts WHERE ID='$eid'");
                        while ($row = mysqli_fetch_array($ret)) {
                        ?>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Product Name</label>
                            <input type="text" class="form-control bg-light" value="<?php echo $row['ProductName'];?>" readonly>
                        </div>
                        
                        <div class="mb-4 text-center border p-3 rounded">
                            <label class="form-label fw-bold d-block text-muted">Current Image</label>
                            <img src="../uploads/products/<?php echo $row['Image2'];?>" class="img-fluid rounded shadow-sm" style="max-height: 200px;">
                        </div>
                        
                        <div class="mb-4">
                            <label class="form-label fw-bold">Upload New Image</label>
                            <input type="file" class="form-control form-control-lg" name="images" accept=".jpg,.jpeg,.png,.gif" required>
                            <div class="invalid-feedback">Please select a valid image file.</div>
                        </div>
                        
                        <?php } ?>
                        <div class="d-flex gap-2">
                            <button type="submit" class="btn btn-success px-4" name="submit"><i class="bi bi-upload me-2"></i>Upload</button>
                            <a href="editproducts.php?editid=<?php echo $_GET['editid']; ?>" class="btn btn-outline-secondary">Cancel</a>
                        </div>
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