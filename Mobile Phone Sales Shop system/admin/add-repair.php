<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

$required_roles = ['Admin', 'Sales person'];
include("../includes/admin/auth_admin.php");

// Fetch active staff users for Technician selection
$technician_q = mysqli_query($conn, "SELECT id, first_name, last_name, role FROM staff_users WHERE status = 'Active' AND role = 'Technician' ORDER BY first_name ASC");

// Fetch Brand List
$brands_q = mysqli_query($conn, "SELECT BrandName FROM tblbrand ORDER BY BrandName ASC");

if(isset($_POST['submit'])) {
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

    // Fallback for device_name if empty
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

    // Server-side validations
    if (!preg_match("/^[a-zA-Z\s]+$/", $customer_name)) {
        $errors[] = "Customer Name can only contain letters and spaces.";
    }
    if (empty($device_name)) {
        $errors[] = "Device Name & Model is required.";
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

        $stmt = $conn->prepare("INSERT INTO tbl_repairs (CustomerName, BrandName, ProductName, IMEINumber, DeviceName, Issue, Cost, Income, TechnicianId, Status, RepairDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssssddiss", $customer_name, $brand_name, $product_name, $imei_number, $device_name, $issue, $cost, $income, $technician_id, $status, $repair_date);

        if ($stmt->execute()) {
            $_SESSION['success_msg'] = "Repair log has been successfully added.";
            header("Location: manage-repairs.php");
            exit();
        } else {
            $errors[] = "Database insertion failed: " . $stmt->error;
        }
        $stmt->close();
    }
    
    if (!empty($errors)) {
        $_SESSION['error_msg'] = implode("<br>", $errors);
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Mobile Mart || Log Repair</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <link rel="stylesheet" href="../assets/css/admin.css">
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f4f6f9; }
        .card-repair { border: none; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .search-results-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 1050;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 0 0 8px 8px;
            max-height: 250px;
            overflow-y: auto;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
        .search-result-item {
            padding: 10px 14px;
            cursor: pointer;
            border-bottom: 1px solid #f1f5f9;
        }
        .search-result-item:hover {
            background-color: #e0f2fe;
        }
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
                    <li class="breadcrumb-item active" aria-current="page">Log Repair</li>
                </ol>
            </nav>

            <div class="card card-repair shadow-sm border-0">
                <div class="card-header bg-primary text-white py-3">
                    <h5 class="mb-0 fw-bold"><i class="bi bi-wrench me-2"></i>Log New Device Repair</h5>
                </div>
                <div class="card-body p-4">

                    <!-- Quick IMEI / Device Search Bar -->
                    <div class="card bg-light border-0 mb-4">
                        <div class="card-body p-3">
                            <label for="quick_repair_search" class="form-label fw-bold text-dark mb-1">
                                <i class="bi bi-search text-primary me-1"></i> Quick Search Device or Store IMEI (Auto-Fill)
                            </label>
                            <div class="position-relative">
                                <input type="text" id="quick_repair_search" class="form-control form-control-lg bg-white" placeholder="Type IMEI number, brand, or model name to auto-fill device details..." autocomplete="off">
                                <div id="quick_search_results" class="search-results-dropdown d-none"></div>
                            </div>
                            <span class="small text-muted mt-1 d-block"><i class="bi bi-info-circle me-1"></i> You can also select the Brand, Product, and IMEI manually from the dropdowns below.</span>
                        </div>
                    </div>

                    <form method="post" class="confirm-submit" data-confirm-message="Please confirm that you wish to log this repair job.">
                        <div class="row g-3">

                            <!-- Customer Name -->
                            <div class="col-md-6">
                                <label for="customer_name" class="form-label fw-semibold">Customer Full Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" name="customer_name" id="customer_name" required pattern="[a-zA-Z\s]+" title="Only letters and spaces are allowed." placeholder="e.g. Ruwan Perera">
                            </div>

                            <!-- Brand Name Selection -->
                            <div class="col-md-6">
                                <label for="brand_name" class="form-label fw-semibold">Brand Name <span class="text-danger">*</span></label>
                                <select class="form-select" name="brand_name" id="brand_name" required>
                                    <option value="" disabled selected>Select Brand...</option>
                                    <?php while($b = mysqli_fetch_assoc($brands_q)): ?>
                                        <option value="<?= htmlspecialchars($b['BrandName']); ?>"><?= htmlspecialchars($b['BrandName']); ?></option>
                                    <?php endwhile; ?>
                                    <option value="Other">Other / Customer Brand</option>
                                </select>
                            </div>

                            <!-- Product Name Selection -->
                            <div class="col-md-6">
                                <label for="product_name" class="form-label fw-semibold">Product / Model Name <span class="text-danger">*</span></label>
                                <select class="form-select" name="product_name_select" id="product_name_select">
                                    <option value="" disabled selected>Select Brand first...</option>
                                </select>
                                <input type="text" class="form-control mt-2 d-none" name="product_name_custom" id="product_name_custom" placeholder="Or type product model manually...">
                                <input type="hidden" name="product_name" id="product_name" required>
                            </div>

                            <!-- IMEI Number Selection -->
                            <div class="col-md-6">
                                <label for="imei_number" class="form-label fw-semibold">IMEI Number (Optional / Searchable)</label>
                                <select class="form-select" name="imei_number" id="imei_number">
                                    <option value="">-- Optional / Select IMEI --</option>
                                </select>
                            </div>

                            <!-- Device Name & Model Summary -->
                            <div class="col-12">
                                <label for="device_name" class="form-label fw-semibold">Device Display Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" name="device_name" id="device_name" required placeholder="e.g. Apple iPhone 15 Pro">
                            </div>

                            <!-- Issue Details -->
                            <div class="col-12">
                                <label for="issue" class="form-label fw-semibold">Issue Details <span class="text-danger">*</span></label>
                                <textarea class="form-control" name="issue" id="issue" rows="3" required placeholder="Describe the fault and work required..."></textarea>
                            </div>

                            <!-- Cost & Income -->
                            <div class="col-md-6">
                                <label for="cost" class="form-label fw-semibold">Estimated / Actual Cost (Rs.) <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" name="cost" id="cost" step="0.01" min="0" required placeholder="e.g. 5000.00">
                            </div>
                            <div class="col-md-6">
                                <label for="income" class="form-label fw-semibold">Income Charged to Customer (Rs.) <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" name="income" id="income" step="0.01" min="0" required placeholder="e.g. 9500.00">
                            </div>

                            <!-- Technician, Status, Date -->
                            <div class="col-md-4">
                                <label for="technician_id" class="form-label fw-semibold">Assigned Technician / Staff <span class="text-danger">*</span></label>
                                <select class="form-select" name="technician_id" id="technician_id" required>
                                    <option value="" disabled selected>Select technician...</option>
                                    <?php while($tech = mysqli_fetch_assoc($technician_q)): ?>
                                        <option value="<?= $tech['id']; ?>"><?= htmlspecialchars($tech['first_name'] . ' ' . $tech['last_name'] . ' (' . $tech['role'] . ')'); ?></option>
                                    <?php endwhile; ?>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="status" class="form-label fw-semibold">Job Status <span class="text-danger">*</span></label>
                                <select class="form-select" name="status" id="status" required>
                                    <option value="Pending" selected>Pending</option>
                                    <option value="In-progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="repair_date" class="form-label fw-semibold">Repair / Log Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" name="repair_date" id="repair_date" value="<?= date('Y-m-d'); ?>" max="<?= date('Y-m-d'); ?>" required>
                            </div>

                        </div>
                        <div class="mt-4 text-end">
                            <a href="manage-repairs.php" class="btn btn-outline-secondary px-4 me-2">Cancel</a>
                            <button type="submit" class="btn btn-primary px-4" name="submit"><i class="bi bi-check-circle me-1"></i> Log Repair</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<?php include_once('../includes/components/confirmation.php'); ?>

<script>
$(document).ready(function() {

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Helper: strip leading brand name if present (case-insensitive)
    function cleanBrandFromProduct(brand, product) {
        if (!product) return '';
        if (!brand) return product.trim();
        let regex = new RegExp('^' + escapeRegExp(brand.trim()) + '\\s*', 'i');
        return product.replace(regex, '').trim();
    }

    // Helper: format clean combined device display name without duplicating brand
    function formatCombinedDeviceName(brand, product) {
        let b = (brand || '').trim();
        let p = (product || '').trim();
        if (!p) return b;
        if (!b) return p;
        let cleanP = cleanBrandFromProduct(b, p);
        return cleanP ? (b + ' ' + cleanP) : b;
    }

    // Helper: update hidden product_name and combined device_name
    function updateDeviceDisplayName() {
        let brand = $('#brand_name').val() || '';
        let prodSelect = $('#product_name_select').val();
        let prodCustom = $('#product_name_custom').val();
        let prod = (prodSelect && prodSelect !== 'custom') ? prodSelect : prodCustom;

        $('#product_name').val(prod);

        let combined = formatCombinedDeviceName(brand, prod);
        $('#device_name').val(combined);
    }

    // Load available store IMEIs for a product ID / Name into the single IMEI dropdown
    function loadImeisForProduct(productId, productName, targetImei) {
        let $imeiSelect = $('#imei_number');
        $imeiSelect.html('<option value="" disabled selected>Loading IMEIs...</option>');

        $.getJSON('ajax/get_product_details.php', { action: 'get_product_imeis', product_id: productId, product_name: productName }, function(data) {
            let html = '<option value="">-- Optional / Select IMEI --</option>';
            let matchFound = false;

            if (data.success && data.imeis.length > 0) {
                data.imeis.forEach(function(item) {
                    let isSel = (targetImei && targetImei === item.imei);
                    if (isSel) matchFound = true;
                    html += `<option value="${item.imei}" ${isSel ? 'selected' : ''}>${item.imei} — ${item.specs} [${item.status}]</option>`;
                });

                if (targetImei && !matchFound) {
                    html += `<option value="${targetImei}" selected>${targetImei} (Searched IMEI)</option>`;
                }
            } else {
                if (targetImei) {
                    html += `<option value="${targetImei}" selected>${targetImei} (Searched IMEI)</option>`;
                } else {
                    html = '<option value="">No registered store IMEIs (Optional)</option>';
                }
            }

            $imeiSelect.html(html);
            if (targetImei) {
                $imeiSelect.val(targetImei);
            }
        });
    }

    // Load products for brand and select matching target product if given
    function loadProductsForBrand(brand, targetProduct, targetImei, callback) {
        let $pSelect = $('#product_name_select');
        let $pCustom = $('#product_name_custom');
        let $imeiSelect = $('#imei_number');

        if (!brand || brand === 'Other') {
            $pSelect.addClass('d-none');
            $pCustom.removeClass('d-none');
            if (targetProduct) {
                $pCustom.val(cleanBrandFromProduct(brand, targetProduct));
            }
            if (targetImei) {
                $imeiSelect.html(`<option value="${targetImei}" selected>${targetImei}</option>`);
            } else {
                $imeiSelect.html('<option value="">-- Optional / Select IMEI --</option>');
            }
            updateDeviceDisplayName();
            if (typeof callback === 'function') callback();
            return;
        }

        $pSelect.removeClass('d-none').html('<option value="" disabled selected>Loading products...</option>');
        $pCustom.addClass('d-none').val('');

        $.getJSON('ajax/get_product_details.php', { action: 'get_brand_products', brand: brand }, function(data) {
            if (data.success && data.products.length > 0) {
                let html = '<option value="" disabled selected>Select Product...</option>';
                let matchedValue = null;
                let targetClean = targetProduct ? cleanBrandFromProduct(brand, targetProduct).toLowerCase() : '';

                data.products.forEach(function(p) {
                    let pClean = cleanBrandFromProduct(brand, p.product_name).toLowerCase();
                    if (targetProduct && (p.product_name.toLowerCase() === targetProduct.toLowerCase() || pClean === targetClean)) {
                        matchedValue = p.product_name;
                    }
                    html += `<option value="${p.product_name}" data-id="${p.id}">${p.product_name}</option>`;
                });
                html += '<option value="custom">+ Type Custom Product Model</option>';
                $pSelect.html(html);

                if (targetProduct) {
                    if (matchedValue) {
                        $pSelect.val(matchedValue);
                        $pCustom.addClass('d-none').val('');
                        let pId = $pSelect.find(':selected').data('id');
                        loadImeisForProduct(pId, matchedValue, targetImei);
                    } else {
                        $pSelect.val('custom');
                        $pCustom.removeClass('d-none').val(cleanBrandFromProduct(brand, targetProduct));
                        if (targetImei) {
                            $imeiSelect.html(`<option value="${targetImei}" selected>${targetImei}</option>`);
                        } else {
                            $imeiSelect.html('<option value="">-- Optional / Select IMEI --</option>');
                        }
                    }
                } else {
                    $imeiSelect.html('<option value="">-- Optional / Select IMEI --</option>');
                }
            } else {
                $pSelect.addClass('d-none');
                $pCustom.removeClass('d-none').val(targetProduct ? cleanBrandFromProduct(brand, targetProduct) : '');
                if (targetImei) {
                    $imeiSelect.html(`<option value="${targetImei}" selected>${targetImei}</option>`);
                } else {
                    $imeiSelect.html('<option value="">-- Optional / Select IMEI --</option>');
                }
            }
            updateDeviceDisplayName();
            if (typeof callback === 'function') callback();
        });
    }

    // 1. When Brand Name dropdown changes -> Load Products for Brand
    $('#brand_name').on('change', function() {
        let brand = $(this).val();
        loadProductsForBrand(brand, null, null);
    });

    // 2. When Product Name dropdown changes -> Load IMEIs for Product
    $('#product_name_select').on('change', function() {
        let val = $(this).val();
        if (val === 'custom') {
            $('#product_name_custom').removeClass('d-none').val('').focus();
            $('#imei_number').html('<option value="">-- Optional / Select IMEI --</option>');
        } else {
            $('#product_name_custom').addClass('d-none');
            let pId = $(this).find(':selected').data('id');
            let pName = val;
            loadImeisForProduct(pId, pName, null);
        }
        updateDeviceDisplayName();
    });

    $('#product_name_custom').on('input', updateDeviceDisplayName);

    // 4. Quick Live Search Bar (IMEI / Product lookup)
    $('#quick_repair_search').on('input', function() {
        let term = $(this).val().trim();
        let $box = $('#quick_search_results');

        if (term.length < 2) {
            $box.addClass('d-none').empty();
            return;
        }

        $.getJSON('ajax/get_product_details.php', { action: 'search', q: term }, function(data) {
            if (data.success && data.results.length > 0) {
                let html = '';
                data.results.forEach(function(item) {
                    let imeiBadge = item.imei ? `<span class="badge bg-primary me-2">IMEI: ${item.imei}</span>` : '';
                    let displayTitle = item.display_name || formatCombinedDeviceName(item.brand, item.product_name);
                    html += `<div class="search-result-item" 
                                  data-brand="${item.brand || ''}" 
                                  data-product="${item.product_name || ''}" 
                                  data-imei="${item.imei || ''}">
                                ${imeiBadge}<strong>${displayTitle}</strong> 
                                <span class="text-muted small">(${item.color || ''} ${item.storage || ''})</span>
                             </div>`;
                });
                $box.html(html).removeClass('d-none');
            } else {
                $box.html('<div class="p-3 text-muted small">No matching device or IMEI found.</div>').removeClass('d-none');
            }
        });
    });

    // Click result item from quick search
    $(document).on('click', '.search-result-item', function() {
        let brand = $(this).data('brand');
        let product = $(this).data('product');
        let imei = $(this).data('imei');

        if (brand) {
            $('#brand_name').val(brand);
        }

        loadProductsForBrand(brand, product, imei, function() {
            // Callback completed
        });

        $('#quick_search_results').addClass('d-none');
        $('#quick_repair_search').val('');
    });

    // Hide search dropdown on click outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#quick_repair_search, #quick_search_results').length) {
            $('#quick_search_results').addClass('d-none');
        }
    });

});
</script>
</body>
</html>
