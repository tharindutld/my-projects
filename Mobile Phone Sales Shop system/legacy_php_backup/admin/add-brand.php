<?php
session_start();
error_reporting(0);
include('../config/db.php');

$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");
if (true) {
    if (isset($_POST['submit'])) {
        $brandname = trim($_POST['brandname']);
        $status = isset($_POST['status']) ? 1 : 0; // Checkbox logic

        // Server-side validation
        if (!preg_match("/^[a-zA-Z0-9\s]+$/", $brandname)) {
            $error_msg = "Brand name cannot contain special characters.";
        } elseif (!preg_match("/[a-zA-Z]/", $brandname)) {
            $error_msg = "Brand name cannot consist of only numbers.";
        } else {
            $stmt = $conn->prepare("SELECT ID FROM tblbrand WHERE LOWER(BrandName) = LOWER(?)");
            $stmt->bind_param("s", $brandname);
            $stmt->execute();
            $check_res = $stmt->get_result();
            $stmt->close();

            if ($check_res->num_rows > 0) {
                $error_msg = "A brand with this name already exists.";
            } else {
                $stmt_insert = $conn->prepare("INSERT INTO tblbrand (BrandName, Status) VALUES (?, ?)");
                $stmt_insert->bind_param("si", $brandname, $status);
                if ($stmt_insert->execute()) {
                    $_SESSION['success_msg'] = "Brand has been created.";
                    header("Location: add-brand.php");
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
        <title>Mobile Mart || Add Brand</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    </head>

    <body class="bg-light">

        <div class="d-flex">
            <?php include_once('../includes/admin/sidebar.php'); ?>

            <div class="flex-grow-1">
                <?php include_once('../includes/admin/header.php'); ?>

                <div class="container-fluid p-4">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="dashboard.php">Home</a></li>
                            <li class="breadcrumb-item active" aria-current="page">Add Brand</li>
                    </nav>

                    <div class="card shadow-sm">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0"><i class="bi bi-tag me-2"></i>Add New Brand</h5>
                        </div>
                        <div class="card-body">
                            <form method="post" class="confirm-submit"
                                data-confirm-message="Please confirm that you wish to add this new brand to the system.">
                                <div class="mb-3">
                                    <label for="brandname" class="form-label fw-bold">Brand Name</label>
                                    <input type="text" class="form-control" name="brandname" id="brandname" required
                                        pattern="^(?=.*[a-zA-Z])[a-zA-Z0-9\s]+$"
                                        title="Brand name must contain letters and cannot contain special characters.">
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" name="status" id="status" value="1"
                                        checked>
                                    <label class="form-check-label fw-bold" for="status">Active Status</label>
                                </div>
                                <button type="submit" class="btn btn-success" name="submit"><i
                                        class="bi bi-check-circle me-1"></i> Add Brand</button>
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