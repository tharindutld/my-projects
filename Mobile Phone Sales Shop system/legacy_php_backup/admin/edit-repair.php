<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

$required_roles = ['Admin', 'Sales person', 'Technician'];
include("../includes/admin/auth_admin.php");

// Fetch active staff users for Technician selection
$technician_q = mysqli_query($conn, "SELECT id, first_name, last_name, role FROM staff_users WHERE status = 'Active' AND role = 'Technician' ORDER BY first_name ASC");

// Fetch Brand List
$brands_q = mysqli_query($conn, "SELECT BrandName FROM tblbrand ORDER BY BrandName ASC");

// Verify that a valid repair ID is passed
if (!isset($_GET['id']) || intval($_GET['id']) <= 0) {
    $_SESSION['error_msg'] = "Invalid repair ID.";
    header("Location: manage-repairs.php");
    exit();
}

$repair_id = intval($_GET['id']);

// Fetch existing repair log details
$fetch_stmt = $conn->prepare("SELECT * FROM tbl_repairs WHERE ID = ?");
$fetch_stmt->bind_param("i", $repair_id);
$fetch_stmt->execute();
$repair_res = $fetch_stmt->get_result();
if ($repair_res->num_rows === 0) {
    $_SESSION['error_msg'] = "Repair record not found.";
    $fetch_stmt->close();
    header("Location: manage-repairs.php");
    exit();
}
$repair = $repair_res->fetch_assoc();
$fetch_stmt->close();

// Verify the repair belongs to the Technician if role is Technician
if ($admin_role === 'Technician') {
    if ((int)$repair['TechnicianId'] !== (int)$_SESSION['imsaid']) {
        $_SESSION['error_msg'] = "Access Denied: You can only edit your own assigned repairs.";
        header("Location: manage-repairs.php");
        exit();
    }
}

if (isset($_POST['submit'])) {
    if ($admin_role === 'Technician') {
        // Technician can ONLY update Status, RepairNotes, PartsUsed, LaborTime
        $status       = mysqli_real_escape_string($conn, $_POST['status']);
        $repair_notes = trim($_POST['repair_notes'] ?? '');
        $parts_used   = trim($_POST['parts_used'] ?? '');
        $labor_time   = trim($_POST['labor_time'] ?? '');

        $stmt = $conn->prepare("UPDATE tbl_repairs SET Status=?, RepairNotes=?, PartsUsed=?, LaborTime=? WHERE ID=? AND TechnicianId=?");
        $stmt->bind_param("ssssii", $status, $repair_notes, $parts_used, $labor_time, $repair_id, $_SESSION['imsaid']);
        if ($stmt->execute()) {
            $_SESSION['success_msg'] = "Repair job updated successfully.";
            header("Location: manage-repairs.php");
            exit();
        } else {
            $_SESSION['error_msg'] = "Database update failed: " . $stmt->error;
        }
        $stmt->close();
    } else {
        $customer_name = trim($_POST['customer_name']);
        $brand_name    = trim($_POST['brand_name'] ?? '');
        $product_name  = trim($_POST['product_name'] ?? '');
        $imei_number   = trim($_POST['imei_number'] ?? '');
        $device_name   = trim($_POST['device_name']);
        $issue         = trim($_POST['issue']);
        $cost          = trim($_POST['cost']);
        $income        = trim($_POST['income']);
        $technician_id = intval($_POST['technician_id']);
        $status        = $_POST['status'];
        $repair_date   = $_POST['repair_date'];

        if (empty($device_name)) {
            if (!empty($product_name)) {
                if (!empty($brand_name)) {
                    $clean_prod = preg_replace('/^' . preg_quote($brand_name, '/') . '\s*/i', '', $product_name);
                    $device_name = trim($brand_name . ' ' . $clean_prod);
                } else {
                    $device_name = trim($product_name);
                }
            } elseif (!empty($brand_name)) {
                $device_name = trim($brand_name);
            }
        }

        $errors = [];

        if (!preg_match("/^[a-zA-Z\s]+$/", $customer_name)) {
            $errors[] = "Customer Name can only contain letters and spaces.";
        }
        if (empty($device_name)) {
            $errors[] = "Device Name is required.";
        }
        if (empty($issue)) {
            $errors[] = "Issue description is required.";
        }
        if (!is_numeric($cost) || floatval($cost) < 0) {
            $errors[] = "Cost must be a valid positive number.";
        }
        if (!is_numeric($income) || floatval($income) < 0) {
            $errors[] = "Income must be a valid positive number.";
        }
        if (empty($repair_date)) {
            $errors[] = "Repair Date is required.";
        } elseif ($repair_date > date('Y-m-d')) {
            $errors[] = "Repair Date cannot be in the future.";
        }

        if (empty($errors)) {
            $customer_name = mysqli_real_escape_string($conn, $customer_name);
            $brand_name    = mysqli_real_escape_string($conn, $brand_name);
            $product_name  = mysqli_real_escape_string($conn, $product_name);
            $imei_number   = mysqli_real_escape_string($conn, $imei_number);
            $device_name   = mysqli_real_escape_string($conn, $device_name);
            $issue         = mysqli_real_escape_string($conn, $issue);
            $cost          = floatval($cost);
            $income        = floatval($income);
            $status        = mysqli_real_escape_string($conn, $status);
            $repair_date   = mysqli_real_escape_string($conn, $repair_date);

            $stmt = $conn->prepare("UPDATE tbl_repairs SET CustomerName=?, BrandName=?, ProductName=?, IMEINumber=?, DeviceName=?, Issue=?, Cost=?, Income=?, TechnicianId=?, Status=?, RepairDate=? WHERE ID=?");
            $stmt->bind_param("ssssssddissi", $customer_name, $brand_name, $product_name, $imei_number, $device_name, $issue, $cost, $income, $technician_id, $status, $repair_date, $repair_id);

            if ($stmt->execute()) {
                $_SESSION['success_msg'] = "Repair log updated successfully.";
                header("Location: manage-repairs.php");
                exit();
            } else {
                $errors[] = "Database update failed: " . $stmt->error;
            }
            $stmt->close();
        }

        if (!empty($errors)) {
            $_SESSION['error_msg'] = implode("<br>", $errors);
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Mobile Mart || Edit Repair</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <link rel="stylesheet" href="../assets/css/admin.css">
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f4f6f9; }
        .card-repair { border: none; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    </style>
</head>
<body class="bg-light">

<div class="d-flex">
    <?php include_once('../includes/admin/sidebar.php');?>
    
    <div class="flex-grow-1">
        <?php include_once('../includes/admin/header.php');?>
        
        <div class="container-fluid p-4">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="dashboard.php" class="text-decoration-none">Home</a></li>
                    <li class="breadcrumb-item"><a href="manage-repairs.php" class="text-decoration-none">Manage Repairs</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Edit Repair</li>
                </ol>
            </nav>

            <div class="card card-repair shadow-sm border-0">
                <div class="card-header bg-primary text-white py-3">
                    <h5 class="mb-0 fw-bold"><i class="bi bi-pencil-square me-2"></i>Edit Repair Log</h5>
                </div>
                <div class="card-body p-4">

                    <form method="post" class="confirm-submit" data-confirm-message="Please confirm that you wish to save these changes to the repair log.">
                        <?php if ($admin_role === 'Technician'): ?>
                        <!-- Technician restricted form -->
                        <div class="alert alert-info border-0 py-2 mb-3 small"><i class="bi bi-info-circle me-1"></i> As a Technician, you can update the job status and log technical details only.</div>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Customer Name</label>
                                <input type="text" class="form-control bg-light" value="<?= htmlspecialchars($repair['CustomerName']); ?>" readonly>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Device Name</label>
                                <input type="text" class="form-control bg-light" value="<?= htmlspecialchars($repair['DeviceName']); ?>" readonly>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-semibold">Brand Name</label>
                                <input type="text" class="form-control bg-light" value="<?= htmlspecialchars($repair['BrandName'] ?? 'N/A'); ?>" readonly>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-semibold">Product Name</label>
                                <input type="text" class="form-control bg-light" value="<?= htmlspecialchars($repair['ProductName'] ?? 'N/A'); ?>" readonly>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-semibold">IMEI Number</label>
                                <input type="text" class="form-control bg-light" value="<?= htmlspecialchars($repair['IMEINumber'] ?? 'N/A'); ?>" readonly>
                            </div>
                            <div class="col-12">
                                <label class="form-label fw-semibold">Issue Details</label>
                                <textarea class="form-control bg-light" rows="2" readonly><?= htmlspecialchars($repair['Issue']); ?></textarea>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-semibold">Job Status <span class="text-danger">*</span></label>
                                <select class="form-select" name="status" required>
                                    <option value="Pending" <?= ($repair['Status']==='Pending')?'selected':''; ?>>Pending</option>
                                    <option value="In-progress" <?= ($repair['Status']==='In-progress')?'selected':''; ?>>In Progress</option>
                                    <option value="Completed" <?= ($repair['Status']==='Completed')?'selected':''; ?>>Completed</option>
                                    <option value="Cancelled" <?= ($repair['Status']==='Cancelled')?'selected':''; ?>>Cancelled</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-semibold">Labor Time</label>
                                <input type="text" class="form-control" name="labor_time" value="<?= htmlspecialchars($repair['LaborTime'] ?? ''); ?>" placeholder="e.g. 2h 30m">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-semibold">Parts Used</label>
                                <input type="text" class="form-control" name="parts_used" value="<?= htmlspecialchars($repair['PartsUsed'] ?? ''); ?>" placeholder="e.g. Screen, Battery">
                            </div>
                            <div class="col-12">
                                <label class="form-label fw-semibold">Repair Notes / Technical Log</label>
                                <textarea class="form-control" name="repair_notes" rows="4" placeholder="Detail the work performed, findings, and any follow-up required..."><?= htmlspecialchars($repair['RepairNotes'] ?? ''); ?></textarea>
                            </div>
                        </div>
                        <?php else: ?>
                        <!-- Full form for Admin / Sales person -->
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="customer_name" class="form-label fw-semibold">Customer Full Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" name="customer_name" id="customer_name" value="<?= htmlspecialchars($repair['CustomerName']); ?>" required pattern="[a-zA-Z\s]+" title="Only letters and spaces are allowed." placeholder="e.g. Ruwan Perera">
                            </div>

                            <div class="col-md-6">
                                <label for="brand_name" class="form-label fw-semibold">Brand Name</label>
                                <select class="form-select" name="brand_name" id="brand_name">
                                    <option value="">Select Brand...</option>
                                    <?php 
                                    while($b = mysqli_fetch_assoc($brands_q)): 
                                        $sel = ($repair['BrandName'] === $b['BrandName']) ? 'selected' : '';
                                    ?>
                                        <option value="<?= htmlspecialchars($b['BrandName']); ?>" <?= $sel; ?>><?= htmlspecialchars($b['BrandName']); ?></option>
                                    <?php endwhile; ?>
                                    <option value="Other" <?= ($repair['BrandName'] === 'Other') ? 'selected' : ''; ?>>Other / Customer Brand</option>
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label for="product_name" class="form-label fw-semibold">Product / Model Name</label>
                                <input type="text" class="form-control" name="product_name" id="product_name" value="<?= htmlspecialchars($repair['ProductName'] ?? ''); ?>" placeholder="e.g. iPhone 15 Pro">
                            </div>

                            <div class="col-md-6">
                                <label for="imei_number" class="form-label fw-semibold">IMEI Number</label>
                                <input type="text" class="form-control" name="imei_number" id="imei_number" value="<?= htmlspecialchars($repair['IMEINumber'] ?? ''); ?>" maxlength="18" placeholder="e.g. 358901234567890">
                            </div>

                            <div class="col-12">
                                <label for="device_name" class="form-label fw-semibold">Device Display Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" name="device_name" id="device_name" value="<?= htmlspecialchars($repair['DeviceName']); ?>" required placeholder="e.g. iPhone 15 Pro">
                            </div>

                            <div class="col-12">
                                <label for="issue" class="form-label fw-semibold">Issue Details <span class="text-danger">*</span></label>
                                <textarea class="form-control" name="issue" id="issue" rows="3" required placeholder="Describe the fault and work required..."><?= htmlspecialchars($repair['Issue']); ?></textarea>
                            </div>

                            <div class="col-md-6">
                                <label for="cost" class="form-label fw-semibold">Estimated / Actual Cost (Rs.) <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" name="cost" id="cost" step="0.01" min="0" value="<?= htmlspecialchars($repair['Cost']); ?>" required placeholder="e.g. 5000.00">
                            </div>
                            <div class="col-md-6">
                                <label for="income" class="form-label fw-semibold">Income Charged to Customer (Rs.) <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" name="income" id="income" step="0.01" min="0" value="<?= htmlspecialchars($repair['Income']); ?>" required placeholder="e.g. 9500.00">
                            </div>

                            <div class="col-md-4">
                                <label for="technician_id" class="form-label fw-semibold">Assigned Technician / Staff <span class="text-danger">*</span></label>
                                <select class="form-select" name="technician_id" id="technician_id" required>
                                    <option value="" disabled>Select technician...</option>
                                    <?php 
                                    mysqli_data_seek($technician_q, 0);
                                    while($tech = mysqli_fetch_assoc($technician_q)): 
                                        $selected = ($tech['id'] == $repair['TechnicianId']) ? 'selected' : '';
                                    ?>
                                        <option value="<?= $tech['id']; ?>" <?= $selected; ?>><?= htmlspecialchars($tech['first_name'] . ' ' . $tech['last_name'] . ' (' . $tech['role'] . ')'); ?></option>
                                    <?php endwhile; ?>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="status" class="form-label fw-semibold">Job Status <span class="text-danger">*</span></label>
                                <select class="form-select" name="status" id="status" required>
                                    <option value="Pending" <?= ($repair['Status']==='Pending')?'selected':''; ?>>Pending</option>
                                    <option value="In-progress" <?= ($repair['Status']==='In-progress')?'selected':''; ?>>In Progress</option>
                                    <option value="Completed" <?= ($repair['Status']==='Completed')?'selected':''; ?>>Completed</option>
                                    <option value="Cancelled" <?= ($repair['Status']==='Cancelled')?'selected':''; ?>>Cancelled</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="repair_date" class="form-label fw-semibold">Repair / Log Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" name="repair_date" id="repair_date" value="<?= htmlspecialchars($repair['RepairDate']); ?>" max="<?= date('Y-m-d'); ?>" required>
                            </div>
                        </div>
                        <?php endif; ?>
                        <div class="mt-4 text-end">
                            <a href="manage-repairs.php" class="btn btn-outline-secondary px-4 me-2">Cancel</a>
                            <button type="submit" class="btn btn-primary px-4" name="submit"><i class="bi bi-check-circle me-1"></i> Save Changes</button>
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
