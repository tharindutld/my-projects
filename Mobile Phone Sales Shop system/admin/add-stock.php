<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

$required_roles = ['Admin', 'Technician'];
include("../includes/admin/auth_admin.php");

$errors = [];
$success_msg = "";

// Ensure tblsuppliers table exists
mysqli_query($conn, "CREATE TABLE IF NOT EXISTS tblsuppliers (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    SupplierName VARCHAR(255) NOT NULL UNIQUE,
    CreationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Fetch brands dynamically
$brand_q = mysqli_query($conn, "SELECT BrandName, Status FROM tblbrand ORDER BY BrandName ASC");

// Function to auto-generate unique batch number (e.g., BAT-20260729-A1B2)
function generateUniqueBatchNumber($conn) {
    do {
        $dateStr = date('Ymd');
        $randomStr = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4));
        $batchNo = "BAT-" . $dateStr . "-" . $randomStr;
        $check = mysqli_query($conn, "SELECT ID FROM tbl_stock_batches WHERE BatchNumber = '" . mysqli_real_escape_string($conn, $batchNo) . "'");
    } while ($check && mysqli_num_rows($check) > 0);
    return $batchNo;
}

$default_batch_number = generateUniqueBatchNumber($conn);

// Fetch catalog variants for standard dropdown selection
$catalog_variants_q = mysqli_query($conn, "
    SELECT v.ID as VariantId, v.Color, v.RAM, v.ROM, v.Price, p.ProductName, p.BrandName, p.ModelNumber, p.SimType, p.CategoryName
    FROM tblproduct_variants v
    JOIN tblproducts p ON v.ProductId = p.ID
    ORDER BY p.BrandName ASC, p.ProductName ASC, v.Color ASC
");

if (isset($_POST['submit'])) {
    $brand = mysqli_real_escape_string($conn, $_POST['brand']);
    $model_name = mysqli_real_escape_string($conn, $_POST['model_name']);
    $color = mysqli_real_escape_string($conn, $_POST['color']);
    $ram = mysqli_real_escape_string($conn, $_POST['ram']);
    $storage = mysqli_real_escape_string($conn, $_POST['storage']);
    $screen_size = !empty($_POST['screen_size']) ? (float)$_POST['screen_size'] : null;
    $network = mysqli_real_escape_string($conn, $_POST['network'] ?? '5G');
    $simtype = mysqli_real_escape_string($conn, $_POST['simtype'] ?? 'Single SIM');
    $batch_number = mysqli_real_escape_string($conn, $_POST['batch_number']);
    $dealer = mysqli_real_escape_string($conn, $_POST['dealer']);
    $purchase_date = mysqli_real_escape_string($conn, $_POST['purchase_date']);
    $cost_price = (float)$_POST['cost_price'];
    $selling_price = (float)$_POST['selling_price'];
    $quantity = (int)$_POST['quantity'];
    
    // Detect category: if product exists in catalog, fetch CategoryName.
    $cname = 'Smartphone';
    $prod_check_cat = mysqli_query($conn, "SELECT CategoryName FROM tblproducts WHERE LOWER(BrandName) = LOWER('$brand') AND LOWER(ProductName) = LOWER('$model_name')");
    if ($prod_check_cat && mysqli_num_rows($prod_check_cat) > 0) {
        $prod_row_cat = mysqli_fetch_assoc($prod_check_cat);
        $cname = $prod_row_cat['CategoryName'];
    } elseif (isset($_POST['product_category'])) {
        $cname = $_POST['product_category'];
    }

    // Extract submitted Serial Numbers and IMEIs
    $raw_serials = $_POST['serial_nos'] ?? [];
    $serial_nos = [];
    foreach ($raw_serials as $s) {
        $trimmed = trim($s);
        if ($trimmed !== '') {
            $serial_nos[] = $trimmed;
        }
    }

    $raw_imeis = $_POST['imeis'] ?? [];
    $imeis = [];
    foreach ($raw_imeis as $item) {
        $trimmed = trim($item);
        if ($trimmed !== '') {
            $imeis[] = $trimmed;
        }
    }

    // ── Validation ──────────────────────────────────────────────────────────
    
    // Model Name & Color Validation
    if (empty($model_name)) {
        $errors[] = "Model Name is required.";
    } elseif (!preg_match("/^[a-zA-Z0-9\s\/]+$/", $model_name)) {
        $errors[] = "Model Name cannot contain special characters, plus, minus, or decimals.";
    } elseif (!preg_match("/[a-zA-Z]/", $model_name)) {
        $errors[] = "Model Name must contain at least one letter.";
    }

    if (empty($color)) {
        $errors[] = "Color is required.";
    } elseif (!preg_match("/^[a-zA-Z\s\-\/]+$/", $color)) {
        $errors[] = "Color cannot contain numbers, minus numbers, or special characters.";
    }

    // 1. Batch Number Unique Check
    $batch_check = mysqli_query($conn, "SELECT ID FROM tbl_stock_batches WHERE BatchNumber = '$batch_number'");
    if ($batch_check && mysqli_num_rows($batch_check) > 0) {
        $errors[] = "The batch number '<strong>$batch_number</strong>' already exists. Batch numbers must be unique.";
    }

    // 2. Pricing Validation
    if ($cost_price <= 0) {
        $errors[] = "Cost price must be a positive number greater than 0.";
    }
    if ($selling_price <= 0) {
        $errors[] = "Selling price cannot be negative or zero.";
    } elseif ($selling_price < 10000) {
        $errors[] = "Selling price must be at least 10,000 LKR.";
    } elseif ($selling_price <= $cost_price) {
        $errors[] = "Selling price (LKR " . number_format($selling_price, 2) . ") must be greater than Cost price (LKR " . number_format($cost_price, 2) . ").";
    }

    // 3. Stock Quantity Validation
    if ($quantity <= 0) {
        $errors[] = "Stock quantity must be at least 1.";
    }

    // 4. SIM Type & IMEI/Serial Count Validation Logic
    if ($cname === 'Tablet') {
        if (count($serial_nos) !== $quantity) {
            $errors[] = "For Tablet with quantity $quantity, exactly $quantity Serial Numbers are required. You provided " . count($serial_nos) . ".";
        }
        if (count(array_unique($serial_nos)) !== count($serial_nos)) {
            $errors[] = "Duplicate Serial Numbers detected within your entered list. All Serial Numbers must be unique.";
        }
        foreach ($serial_nos as $idx => $sn) {
            $esc_sn = mysqli_real_escape_string($conn, $sn);
            $sn_chk1 = mysqli_query($conn, "SELECT ID FROM tbl_stock_imeis WHERE SerialNumber = '$esc_sn'");
            $sn_chk2 = mysqli_query($conn, "SELECT ID FROM tbl_stock_imeis WHERE IMEI = '$esc_sn'");
            if (($sn_chk1 && mysqli_num_rows($sn_chk1) > 0) || ($sn_chk2 && mysqli_num_rows($sn_chk2) > 0)) {
                $errors[] = "Serial Number '<strong>" . htmlspecialchars($sn) . "</strong>' is already registered in the system.";
            }
        }

        if ($simtype !== 'None') {
            $is_dual_sim = (strpos(strtolower($simtype), 'dual') !== false);
            $imeis_per_unit = $is_dual_sim ? 2 : 1;
            $expected_total_imeis = $quantity * $imeis_per_unit;
            if (count($imeis) !== $expected_total_imeis) {
                $errors[] = "For Tablet with SIM Support ($simtype) and quantity $quantity, exactly $expected_total_imeis IMEIs are required. You provided " . count($imeis) . ".";
            }
            if (count(array_unique($imeis)) !== count($imeis)) {
                $errors[] = "Duplicate IMEI numbers detected within your entered list. All IMEIs must be unique.";
            }
            foreach ($imeis as $idx => $imei) {
                if (!preg_match('/^[0-9]{15}$/', $imei)) {
                    $errors[] = "IMEI #" . ($idx + 1) . " ('<strong>" . htmlspecialchars($imei) . "</strong>') is invalid. IMEIs must be exactly 15 numeric digits.";
                } else {
                    $esc_im = mysqli_real_escape_string($conn, $imei);
                    $imei_dup_check = mysqli_query($conn, "SELECT ID FROM tbl_stock_imeis WHERE IMEI = '$esc_im' OR SerialNumber = '$esc_im'");
                    if ($imei_dup_check && mysqli_num_rows($imei_dup_check) > 0) {
                        $errors[] = "IMEI '<strong>" . htmlspecialchars($imei) . "</strong>' is already registered in the system.";
                    }
                }
            }
        }
    } else {
        // Smartphone
        $is_dual_sim = (strpos(strtolower($simtype), 'dual') !== false);
        $imeis_per_unit = $is_dual_sim ? 2 : 1;
        $expected_total_imeis = $quantity * $imeis_per_unit;
        if (count($imeis) !== $expected_total_imeis) {
            $errors[] = "For Smartphone ($simtype) with quantity $quantity, exactly $expected_total_imeis IMEI number(s) are required. You provided " . count($imeis) . ".";
        }
        if (count(array_unique($imeis)) !== count($imeis)) {
            $errors[] = "Duplicate IMEI numbers detected within your entered list. All IMEIs must be unique.";
        }
        foreach ($imeis as $idx => $imei) {
            if (!preg_match('/^[0-9]{15}$/', $imei)) {
                $errors[] = "IMEI #" . ($idx + 1) . " ('<strong>" . htmlspecialchars($imei) . "</strong>') is invalid. IMEIs must be exactly 15 numeric digits.";
            } else {
                $esc_im = mysqli_real_escape_string($conn, $imei);
                $imei_dup_check = mysqli_query($conn, "SELECT ID FROM tbl_stock_imeis WHERE IMEI = '$esc_im' OR SerialNumber = '$esc_im'");
                if ($imei_dup_check && mysqli_num_rows($imei_dup_check) > 0) {
                    $errors[] = "IMEI '<strong>" . htmlspecialchars($imei) . "</strong>' is already registered in the system.";
                }
            }
        }
    }

    // ── Insertion Logic (Transaction Safe) ──────────────────────────
    if (empty($errors)) {
        mysqli_begin_transaction($conn);
        try {
            // Check parent product matching Brand & Model Name
            $prod_check = mysqli_query($conn, "SELECT ID FROM tblproducts WHERE LOWER(BrandName) = LOWER('$brand') AND LOWER(ProductName) = LOWER('$model_name')");
            
            if ($prod_check && mysqli_num_rows($prod_check) > 0) {
                $existing_prod = mysqli_fetch_assoc($prod_check);
                $product_id = $existing_prod['ID'];
            } else {
                $model_code = "MOD-" . strtoupper(substr($brand, 0, 3)) . "-" . rand(100, 999);
                $display_str = $screen_size ? $screen_size . "\"Display\"" : "Unspecified";
                
                $ins_q = "INSERT INTO tblproducts (ProductName, BrandName, CategoryName, ModelNumber, SimType, Display, Status) 
                          VALUES ('$model_name', '$brand', '$cname', '$model_code', '$simtype', '$display_str', 1)";
                
                if (!mysqli_query($conn, $ins_q)) {
                    throw new Exception("Failed to create parent product record: " . mysqli_error($conn));
                }
                $product_id = mysqli_insert_id($conn);
            }

            // Check variant matching Color, RAM, ROM
            $var_check = mysqli_query($conn, "SELECT ID, Stock FROM tblproduct_variants WHERE ProductId = '$product_id' AND LOWER(Color) = LOWER('$color') AND LOWER(RAM) = LOWER('$ram') AND LOWER(ROM) = LOWER('$storage')");
            
            if ($var_check && mysqli_num_rows($var_check) > 0) {
                $existing_var = mysqli_fetch_assoc($var_check);
                $variant_id = $existing_var['ID'];
                $new_stock = $existing_var['Stock'] + $quantity;
                
                $upd_v = "UPDATE tblproduct_variants SET Stock='$new_stock', Price='$selling_price' WHERE ID='$variant_id'";
                if (!mysqli_query($conn, $upd_v)) {
                    throw new Exception("Failed to update variant stock: " . mysqli_error($conn));
                }
            } else {
                $ins_v = "INSERT INTO tblproduct_variants (ProductId, Color, RAM, ROM, Price, Stock) 
                          VALUES ('$product_id', '$color', '$ram', '$storage', '$selling_price', '$quantity')";
                if (!mysqli_query($conn, $ins_v)) {
                    throw new Exception("Failed to create variant record: " . mysqli_error($conn));
                }
                $variant_id = mysqli_insert_id($conn);
            }

            // Insert Batch Record
            $ins_batch = "INSERT INTO tbl_stock_batches (VariantId, BatchNumber, Dealer, PurchaseDate, CostPrice, SellingPrice, InitialQuantity, CurrentQuantity) 
                          VALUES ('$variant_id', '$batch_number', '$dealer', '$purchase_date', '$cost_price', '$selling_price', '$quantity', '$quantity')";
            
            if (!mysqli_query($conn, $ins_batch)) {
                throw new Exception("Failed to create stock batch: " . mysqli_error($conn));
            }
            $batch_id = mysqli_insert_id($conn);

            // Insert IMEIs / Serial Numbers
            if ($cname === 'Tablet') {
                if ($simtype !== 'None') {
                    $is_dual_sim = (strpos(strtolower($simtype), 'dual') !== false);
                    $imei_idx = 0;
                    for ($u = 0; $u < $quantity; $u++) {
                        $esc_serial = mysqli_real_escape_string($conn, $serial_nos[$u]);
                        $esc_imei1 = mysqli_real_escape_string($conn, $imeis[$imei_idx++]);
                        $ins_imei1 = "INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES ('$batch_id', '$esc_imei1', '$esc_serial', 'Available')";
                        if (!mysqli_query($conn, $ins_imei1)) {
                            throw new Exception("Failed to insert IMEI: " . mysqli_error($conn));
                        }
                        if ($is_dual_sim) {
                            $esc_imei2 = mysqli_real_escape_string($conn, $imeis[$imei_idx++]);
                            $ins_imei2 = "INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES ('$batch_id', '$esc_imei2', '$esc_serial', 'Available')";
                            if (!mysqli_query($conn, $ins_imei2)) {
                                throw new Exception("Failed to insert IMEI: " . mysqli_error($conn));
                            }
                        }
                    }
                } else {
                    // Wi-Fi only Tablet
                    for ($u = 0; $u < $quantity; $u++) {
                        $esc_serial = mysqli_real_escape_string($conn, $serial_nos[$u]);
                        $ins_serial = "INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES ('$batch_id', NULL, '$esc_serial', 'Available')";
                        if (!mysqli_query($conn, $ins_serial)) {
                            throw new Exception("Failed to insert Serial Number: " . mysqli_error($conn));
                        }
                    }
                }
            } else {
                // Smartphone
                foreach ($imeis as $imei) {
                    $esc_i = mysqli_real_escape_string($conn, $imei);
                    $ins_imei = "INSERT INTO tbl_stock_imeis (BatchId, IMEI, Status) VALUES ('$batch_id', '$esc_i', 'Available')";
                    if (!mysqli_query($conn, $ins_imei)) {
                        throw new Exception("Failed to insert IMEI $imei: " . mysqli_error($conn));
                    }
                }
            }

            // Insert Stock Log
            $log_ref = "Batch " . $batch_number;
            $ins_log = "INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES ('$variant_id', '$quantity', 'Restock', '$log_ref')";
            if (!mysqli_query($conn, $ins_log)) {
                throw new Exception("Failed to write stock log: " . mysqli_error($conn));
            }

            mysqli_commit($conn);
            
            $_SESSION['success_msg'] = "Batch <strong>$batch_number</strong> received successfully! Added $quantity units into inventory.";
            header("Location: stock-list.php");
            exit();

        } catch (Exception $e) {
            mysqli_rollback($conn);
            $errors[] = "Database Transaction Failed: " . $e->getMessage();
        }
    }    if (!empty($errors)) {
        $_SESSION['error_msg'] = implode('<br>', $errors);
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mobile Mart || Receive Stock Batch</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    
    <style>
        :root {
            --primary: #0d6efd;
            --primary-focus: #0b5ed7;
            --surface: #ffffff;
            --text-dark: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --radius: 12px;
        }

        body {
            background-color: #f8fafc;
            color: var(--text-dark);
        }

        .stock-header-card {
            background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
            color: white;
            border-radius: var(--radius);
            padding: 1.5rem 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 10px 20px -5px rgba(13, 110, 253, 0.3);
        }

        .stock-section-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.75rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
            transition: box-shadow 0.2s ease;
        }

        .stock-section-card:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }

        .section-title {
            font-size: 1rem;
            font-weight: 700;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1.25rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #f1f5f9;
        }

        .section-title i {
            color: var(--primary);
            font-size: 1.2rem;
        }

        .form-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #334155;
            margin-bottom: 0.35rem;
        }

        .form-control, .form-select {
            border-color: var(--border);
            padding: 0.6rem 0.85rem;
            font-size: 0.95rem;
            border-radius: 8px;
        }

        .form-control:focus, .form-select:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
        }

        .required-asterisk {
            color: #ef4444;
        }

        .imei-register-table {
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
        }

        .imei-register-table th {
            background-color: #f1f5f9;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
            padding: 0.75rem 1rem;
        }

        .imei-register-table td {
            padding: 0.75rem 1rem;
            vertical-align: middle;
        }
    </style>
</head>
<body>

<div class="d-flex">
    <?php include_once('../includes/admin/sidebar.php');?>
    
    <div class="flex-grow-1">
        <?php include_once('../includes/admin/header.php');?>
        
        <div class="container-fluid p-4">
            
            <!-- Stock Header Banner -->
            <div class="stock-header-card d-flex justify-content-between align-items-center">
                <div>
                    <h3 class="fw-bold mb-1"><i class="bi bi-box-seam me-2"></i>Receive New Stock Batch</h3>
                    <p class="mb-0 opacity-75">Goods Received Note — Register incoming inventory batches &amp; device serial IMEIs.</p>
                </div>
                <div>
                    <a href="stock-list.php" class="btn btn-light text-primary fw-bold rounded-pill px-4"><i class="bi bi-list-ul me-1"></i>Stock List</a>
                </div>
            </div>

            <?php if (!empty($_SESSION['error_msg'])): ?>
                <div class="alert alert-danger alert-dismissible fade show rounded-3 mb-4" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i><?php echo $_SESSION['error_msg']; unset($_SESSION['error_msg']); ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>

            <form method="POST" class="confirm-submit" data-confirm-message="Are you sure you want to record and save this stock batch into inventory?">
                
                <!-- SECTION 1: BATCH & SUPPLIER INFO -->
                <div class="stock-section-card">
                    <div class="section-title">
                        <i class="bi bi-receipt"></i>1. Batch &amp; Supplier Information
                    </div>
                    <div class="row g-3">
                        <div class="col-md-5">
                            <label class="form-label">Dealer / Supplier <span class="required-asterisk">*</span></label>
                            <div class="d-flex gap-2">
                                <select name="dealer" id="dealer-select" class="form-select rounded-3" required>
                                    <option value="" disabled selected>Select Registered Supplier...</option>
                                    <?php 
                                    $sup_q = mysqli_query($conn, "SELECT SupplierName FROM tblsuppliers ORDER BY SupplierName ASC");
                                    if ($sup_q) {
                                        while($sup = mysqli_fetch_assoc($sup_q)): 
                                    ?>
                                            <option value="<?php echo htmlspecialchars($sup['SupplierName']); ?>" <?php echo (isset($_POST['dealer']) && $_POST['dealer'] == $sup['SupplierName']) ? 'selected' : ''; ?>>
                                                <?php echo htmlspecialchars($sup['SupplierName']); ?>
                                            </option>
                                    <?php 
                                        endwhile;
                                    }
                                    ?>
                                </select>
                                <button type="button" class="btn btn-outline-success btn-sm text-nowrap rounded-3 px-3" id="btn-add-supplier" title="Add New Supplier"><i class="bi bi-plus-lg me-1"></i>Add</button>
                                <button type="button" class="btn btn-outline-danger btn-sm text-nowrap rounded-3 px-3" id="btn-remove-supplier" title="Remove Selected Supplier"><i class="bi bi-trash me-1"></i>Remove</button>
                            </div>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Purchase Date <span class="required-asterisk">*</span></label>
                            <input type="date" name="purchase_date" class="form-control rounded-3" max="<?php echo date('Y-m-d'); ?>" value="<?php echo isset($_POST['purchase_date']) ? htmlspecialchars($_POST['purchase_date']) : date('Y-m-d'); ?>" required>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Batch Number (Auto-Generated Unique) <span class="required-asterisk">*</span></label>
                            <!-- Distinct Visual Gap between Batch Number and Regen Button -->
                            <div class="d-flex gap-2">
                                <input type="text" name="batch_number" id="batch-number" class="form-control font-monospace fw-bold bg-light rounded-3" value="<?php echo isset($_POST['batch_number']) ? htmlspecialchars($_POST['batch_number']) : htmlspecialchars($default_batch_number); ?>" required readonly>
                                <button type="button" class="btn btn-outline-secondary rounded-3 text-nowrap px-3" id="btn-regen-batch" title="Generate New Unique Code"><i class="bi bi-arrow-clockwise me-1"></i>Regen</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 2: PRODUCT & SPECIFICATION SELECTION -->
                <div class="stock-section-card">
                    <div class="section-title justify-content-between">
                        <div><i class="bi bi-phone"></i>2. Product &amp; Specification Catalog</div>
                        <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill" id="autofill-badge"><i class="bi bi-search me-1"></i>Catalog Select</span>
                    </div>

                    <!-- Catalog Selection Dropdown -->
                    <div class="mb-4 bg-light p-3 rounded-3 border">
                        <input type="hidden" name="product_category" id="product-category" value="<?php echo isset($_POST['product_category']) ? htmlspecialchars($_POST['product_category']) : 'Smartphone'; ?>">
                        <label class="form-label text-primary fw-bold"><i class="bi bi-journal-bookmark me-1"></i>Quick Select Existing Product from Catalog</label>
                        <select id="catalog-product-select" class="form-select border-primary shadow-sm">
                            <option value="">-- Choose Existing Product Variant from Catalog (Auto-Fills Details Below) --</option>
                            <?php 
                            if ($catalog_variants_q && mysqli_num_rows($catalog_variants_q) > 0) {
                                mysqli_data_seek($catalog_variants_q, 0);
                                while ($cv = mysqli_fetch_assoc($catalog_variants_q)) {
                                    $label = htmlspecialchars($cv['BrandName'] . " " . $cv['ProductName'] . " (" . $cv['Color'] . ", " . $cv['RAM'] . "/" . $cv['ROM'] . " — " . $cv['SimType'] . ")");
                                    $json_data = htmlspecialchars(json_encode([
                                        'brand' => $cv['BrandName'],
                                        'model' => $cv['ProductName'],
                                        'color' => $cv['Color'],
                                        'ram' => $cv['RAM'],
                                        'storage' => $cv['ROM'],
                                        'sim' => $cv['SimType'],
                                        'price' => round((float)$cv['Price']),
                                        'category' => $cv['CategoryName']
                                    ]), ENT_QUOTES, 'UTF-8');
                                    echo "<option value='{$cv['VariantId']}' data-spec='{$json_data}'>{$label}</option>";
                                }
                            }
                            ?>
                        </select>
                    </div>

                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Brand <span class="required-asterisk">*</span></label>
                            <select name="brand" id="brand" class="form-select" required>
                                <option value="" disabled selected>Select Brand...</option>
                                <?php 
                                mysqli_data_seek($brand_q, 0);
                                while($row = mysqli_fetch_assoc($brand_q)): 
                                    $status_label = ($row['Status'] == '0' || $row['Status'] === 0) ? ' (Inactive)' : '';
                                ?>
                                    <option value="<?php echo htmlspecialchars($row['BrandName']); ?>" <?php echo (isset($_POST['brand']) && $_POST['brand'] == $row['BrandName']) ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($row['BrandName']) . $status_label; ?>
                                    </option>
                                <?php endwhile; ?>
                            </select>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Model Name <span class="required-asterisk">*</span></label>
                            <input type="text" name="model_name" id="model-name" class="form-control" 
                                   placeholder="e.g., Galaxy S26 / iPhone 17" 
                                   pattern="^(?![0-9]+$)[a-zA-Z0-9\s\/]+$" 
                                   title="Only alphanumeric characters, spaces, and slashes are allowed. Must contain at least one letter and cannot contain plus, minus, decimals, or special characters."
                                   value="<?php echo isset($_POST['model_name']) ? htmlspecialchars($_POST['model_name']) : ''; ?>" required>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Color <span class="required-asterisk">*</span></label>
                            <input type="text" name="color" id="color" class="form-control" 
                                   placeholder="e.g., Titanium Gray" 
                                   pattern="^[a-zA-Z\s\-\/]+$" 
                                   title="Only letters, spaces, hyphens, and forward slashes are allowed. Numbers, negative values, and special characters are not permitted."
                                   value="<?php echo isset($_POST['color']) ? htmlspecialchars($_POST['color']) : ''; ?>" required>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">RAM <span class="required-asterisk">*</span></label>
                            <select name="ram" id="ram" class="form-select" required>
                                <option value="" disabled selected>Select RAM...</option>
                                <?php foreach (['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'] as $r): ?>
                                    <option value="<?php echo $r; ?>" <?php echo (isset($_POST['ram']) && $_POST['ram'] == $r) ? 'selected' : ''; ?>><?php echo $r; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Storage Capacity <span class="required-asterisk">*</span></label>
                            <select name="storage" id="storage" class="form-select" required>
                                <option value="" disabled selected>Select Storage...</option>
                                <?php foreach (['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'] as $ro): ?>
                                    <option value="<?php echo $ro; ?>" <?php echo (isset($_POST['storage']) && $_POST['storage'] == $ro) ? 'selected' : ''; ?>><?php echo $ro; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">SIM Support Type <span class="required-asterisk">*</span></label>
                            <select name="simtype" id="simtype" class="form-select" required>
                                <option value="" disabled <?php echo !isset($_POST['simtype']) ? 'selected' : ''; ?>>Select SIM Support...</option>
                                <?php
                                $sim_options = ['Single SIM', 'Dual SIM', 'eSIM', 'Dual SIM (Nano-SIM + eSIM)', 'None'];
                                $posted_sim = $_POST['simtype'] ?? '';
                                foreach ($sim_options as $s_opt):
                                ?>
                                    <option value="<?php echo htmlspecialchars($s_opt); ?>" <?php echo ($posted_sim === $s_opt) ? 'selected' : ''; ?>><?php echo htmlspecialchars($s_opt); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Network Type <span class="required-asterisk">*</span></label>
                            <select name="network" id="network" class="form-select" required>
                                <option value="" disabled <?php echo !isset($_POST['network']) ? 'selected' : ''; ?>>Select Network Type...</option>
                                <option value="5G" <?php echo (isset($_POST['network']) && $_POST['network'] == '5G') ? 'selected' : ''; ?>>5G Supported</option>
                                <option value="4G" <?php echo (isset($_POST['network']) && $_POST['network'] == '4G') ? 'selected' : ''; ?>>4G LTE Only</option>
                                <option value="None" <?php echo (isset($_POST['network']) && $_POST['network'] == 'None') ? 'selected' : ''; ?>>None (Wi-Fi Only)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- SECTION 3: PRICING & QUANTITY -->
                <div class="stock-section-card">
                    <div class="section-title">
                        <i class="bi bi-cash-stack"></i>3. Costing, Pricing &amp; Batch Quantity
                    </div>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Cost Price (Per Unit LKR) <span class="required-asterisk">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-light">LKR</span>
                                <input type="number" name="cost_price" id="cost-price" class="form-control" step="1" min="1" placeholder="0" value="<?php echo isset($_POST['cost_price']) ? htmlspecialchars($_POST['cost_price']) : ''; ?>" required>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Retail Selling Price (LKR) <span class="required-asterisk">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text bg-light">LKR</span>
                                <input type="number" name="selling_price" id="selling-price" class="form-control" step="1" min="10000" placeholder="0" value="<?php echo isset($_POST['selling_price']) ? htmlspecialchars($_POST['selling_price']) : ''; ?>" required>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Received Stock Quantity (Units) <span class="required-asterisk">*</span></label>
                            <input type="number" name="quantity" id="quantity" class="form-control fw-bold text-primary" min="1" value="<?php echo isset($_POST['quantity']) ? (int)$_POST['quantity'] : 1; ?>" required>
                        </div>
                    </div>
                </div>

                <!-- SECTION 4: SERIAL / IMEI REGISTER TABLE -->
                <div class="stock-section-card">
                    <div class="section-title justify-content-between">
                        <div><i class="bi bi-upc-scan"></i>4. Serial Number / IMEI Register (Individual Unit Entry)</div>
                        <span class="badge bg-secondary bg-opacity-10 text-secondary px-3 py-1 rounded-pill" id="imei-summary-badge">1 Unit = 1 IMEI</span>
                    </div>

                    <div id="stock-imei-register-container" class="mb-3">
                        <!-- Dynamic serial IMEI register table rendered via JS -->
                    </div>

                    <div class="d-flex justify-content-between align-items-center">
                        <button type="button" class="btn btn-outline-primary rounded-pill btn-sm fw-semibold" id="btn-add-unit">
                            <i class="bi bi-plus-circle me-1"></i>Add Device Unit (+1 Quantity)
                        </button>
                        <small class="text-muted"><i class="bi bi-shield-check me-1"></i>All IMEIs undergo 15-digit numeric and duplicate verification.</small>
                    </div>
                </div>

                <!-- FORM ACTIONS -->
                <div class="d-flex justify-content-end gap-3 mt-4 mb-5">
                    <button type="reset" class="btn btn-outline-secondary rounded-pill px-4" id="btn-reset-form">Clear Form</button>
                    <button type="submit" name="submit" class="btn btn-primary rounded-pill px-5 fw-bold"><i class="bi bi-check-lg me-1"></i>Receive &amp; Save Batch</button>
                </div>

            </form>

        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<?php include_once('../includes/components/confirmation.php'); ?>
<script>
document.addEventListener('DOMContentLoaded', function () {
    const regenBtn = document.getElementById('btn-regen-batch');
    const batchInput = document.getElementById('batch-number');
    
    if (regenBtn && batchInput) {
        regenBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let randomStr = '';
            for (let i = 0; i < 4; i++) {
                randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            batchInput.value = `BAT-${yyyy}${mm}${dd}-${randomStr}`;
        });
    }

    // ── Inline Add & Remove Supplier Controls (Powered by SweetAlert2) ────────
    const dealerSelect = document.getElementById('dealer-select');
    const addSupplierBtn = document.getElementById('btn-add-supplier');
    const removeSupplierBtn = document.getElementById('btn-remove-supplier');

    if (addSupplierBtn && dealerSelect) {
        addSupplierBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Add New Supplier',
                    input: 'text',
                    inputLabel: 'Supplier / Dealer Name',
                    inputPlaceholder: 'Enter supplier name...',
                    showCancelButton: true,
                    confirmButtonText: '<i class="bi bi-plus-lg"></i> Add Supplier',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#198754',
                    inputValidator: (value) => {
                        if (!value || !value.trim()) {
                            return 'Please enter a valid supplier name!';
                        }
                        const pattern = /^[a-zA-Z\s]+$/;
                        if (!pattern.test(value.trim())) {
                            return 'Supplier name can only contain letters and spaces (no numbers, minus, decimals, or special characters).';
                        }
                    }
                }).then((result) => {
                    if (result.isConfirmed && result.value) {
                        const newName = result.value.trim();
                        const formData = new FormData();
                        formData.append('action', 'add');
                        formData.append('name', newName);

                        fetch('ajax/manage_supplier.php', {
                            method: 'POST',
                            body: formData
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                const opt = document.createElement('option');
                                opt.value = data.name;
                                opt.textContent = data.name;
                                opt.selected = true;
                                dealerSelect.appendChild(opt);
                                Swal.fire({ icon: 'success', title: 'Added!', text: "Supplier '" + data.name + "' added successfully.", confirmButtonColor: '#0d6efd' });
                            } else {
                                Swal.fire({ icon: 'error', title: 'Error', text: data.message, confirmButtonColor: '#d33' });
                            }
                        })
                        .catch(err => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add supplier.', confirmButtonColor: '#d33' }));
                    }
                });
            } else {
                const newName = prompt("Enter new supplier/dealer name:");
                if (newName && newName.trim() !== '') {
                    const trimmed = newName.trim();
                    const pattern = /^[a-zA-Z\s]+$/;
                    if (!pattern.test(trimmed)) {
                        alert("Supplier name can only contain letters and spaces (no numbers, minus, decimals, or special characters).");
                        return;
                    }
                    const formData = new FormData();
                    formData.append('action', 'add');
                    formData.append('name', trimmed);

                    fetch('ajax/manage_supplier.php', { method: 'POST', body: formData })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            const opt = document.createElement('option');
                            opt.value = data.name;
                            opt.textContent = data.name;
                            opt.selected = true;
                            dealerSelect.appendChild(opt);
                        } else {
                            alert("Error: " + data.message);
                        }
                    });
                }
            }
        });
    }

    if (removeSupplierBtn && dealerSelect) {
        removeSupplierBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            const selectedVal = dealerSelect.value;
            if (!selectedVal) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'warning', title: 'No Selection', text: 'Please select a supplier from the dropdown to remove.', confirmButtonColor: '#f39c12' });
                } else {
                    alert("Please select a supplier from the dropdown to remove.");
                }
                return;
            }

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Remove Supplier?',
                    html: `Are you sure you want to remove <strong>${selectedVal}</strong>?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: '<i class="bi bi-trash"></i> Yes, Remove'
                }).then((result) => {
                    if (result.isConfirmed) {
                        const formData = new FormData();
                        formData.append('action', 'remove');
                        formData.append('name', selectedVal);

                        fetch('ajax/manage_supplier.php', {
                            method: 'POST',
                            body: formData
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                for (let i = 0; i < dealerSelect.options.length; i++) {
                                    if (dealerSelect.options[i].value === selectedVal) {
                                        dealerSelect.remove(i);
                                        break;
                                    }
                                }
                                dealerSelect.value = "";
                                Swal.fire({ icon: 'success', title: 'Removed!', text: 'Supplier removed successfully.', confirmButtonColor: '#0d6efd' });
                            } else {
                                Swal.fire({ icon: 'error', title: 'Error', text: data.message, confirmButtonColor: '#d33' });
                            }
                        })
                        .catch(err => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to remove supplier.', confirmButtonColor: '#d33' }));
                    }
                });
            } else {
                if (confirm("Are you sure you want to remove supplier '" + selectedVal + "'?")) {
                    const formData = new FormData();
                    formData.append('action', 'remove');
                    formData.append('name', selectedVal);

                    fetch('ajax/manage_supplier.php', { method: 'POST', body: formData })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            for (let i = 0; i < dealerSelect.options.length; i++) {
                                if (dealerSelect.options[i].value === selectedVal) {
                                    dealerSelect.remove(i);
                                    break;
                                }
                            }
                            dealerSelect.value = "";
                        } else {
                            alert("Error: " + data.message);
                        }
                    });
                }
            }
        });
    }

    const catalogSelect = document.getElementById('catalog-product-select');
    if (catalogSelect) {
        catalogSelect.addEventListener('change', function () {
            const selectedOpt = this.options[this.selectedIndex];
            const rawSpec = selectedOpt.getAttribute('data-spec');
            if (!rawSpec) return;

            try {
                const spec = JSON.parse(rawSpec);
                if (spec.brand) {
                    const brandSel = document.getElementById('brand');
                    for (let opt of brandSel.options) {
                        if (opt.value.toLowerCase() === spec.brand.toLowerCase()) { opt.selected = true; break; }
                    }
                }
                if (spec.model) document.getElementById('model-name').value = spec.model;
                if (spec.color) document.getElementById('color').value = spec.color;
                if (spec.ram) {
                    const ramSel = document.getElementById('ram');
                    for (let opt of ramSel.options) {
                        if (opt.value.toLowerCase() === spec.ram.toLowerCase()) { opt.selected = true; break; }
                    }
                }
                if (spec.storage) {
                    const stSel = document.getElementById('storage');
                    for (let opt of stSel.options) {
                        if (opt.value.toLowerCase() === spec.storage.toLowerCase()) { opt.selected = true; break; }
                    }
                }
                if (spec.sim) {
                    const simSel = document.getElementById('simtype');
                    for (let opt of simSel.options) {
                        if (opt.value.toLowerCase() === spec.sim.toLowerCase()) { opt.selected = true; break; }
                    }
                }
                if (spec.price) {
                    document.getElementById('selling-price').value = Math.round(spec.price);
                }
                if (spec.category) {
                    document.getElementById('product-category').value = spec.category;
                } else {
                    document.getElementById('product-category').value = 'Smartphone';
                }

                const netSel = document.getElementById('network');
                if (netSel) {
                    if (spec.sim && spec.sim.toLowerCase() === 'none') {
                        netSel.value = 'None';
                        netSel.disabled = true;
                    } else {
                        netSel.disabled = false;
                        const modelLower = spec.model ? spec.model.toLowerCase() : '';
                        if (modelLower.includes('5g')) {
                            netSel.value = '5G';
                        } else if (modelLower.includes('4g') || modelLower.includes('lte')) {
                            netSel.value = '4G';
                        } else {
                            netSel.value = '5G';
                        }
                    }
                }
                renderImeiRegisterTable();
            } catch (e) {
                console.error(e);
            }
        });
    }

    const simTypeSelect = document.getElementById('simtype');
    const qtyInput = document.getElementById('quantity');
    const imeiContainer = document.getElementById('stock-imei-register-container');
    const addUnitBtn = document.getElementById('btn-add-unit');
    const summaryBadge = document.getElementById('imei-summary-badge');

    function validateDuplicateImeis() {
        if (!imeiContainer) return true;
        const imeiFields = imeiContainer.querySelectorAll('.imei-input-field');
        const values = [];
        let hasDuplicate = false;
        
        imeiFields.forEach(input => {
            input.setCustomValidity('');
        });

        imeiFields.forEach(input => {
            const val = input.value.trim();
            if (val !== '' && val.length === 15) {
                if (values.includes(val)) {
                    input.setCustomValidity('Duplicate IMEI number detected. All IMEIs must be unique.');
                    hasDuplicate = true;
                } else {
                    values.push(val);
                }
            }
        });
        
        return !hasDuplicate;
    }

    function validateDuplicateSerials() {
        if (!imeiContainer) return true;
        const serialFields = imeiContainer.querySelectorAll('.serial-input-field');
        const values = [];
        let hasDuplicate = false;
        
        serialFields.forEach(input => {
            input.setCustomValidity('');
        });

        serialFields.forEach(input => {
            const val = input.value.trim().toLowerCase();
            if (val !== '') {
                if (values.includes(val)) {
                    input.setCustomValidity('Duplicate Serial Number detected. All serial numbers must be unique.');
                    hasDuplicate = true;
                } else {
                    values.push(val);
                }
            }
        });
        
        return !hasDuplicate;
    }

    if (imeiContainer) {
        imeiContainer.addEventListener('input', function(e) {
            if (e.target && e.target.classList.contains('imei-input-field')) {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                validateDuplicateImeis();
            }
            if (e.target && e.target.classList.contains('serial-input-field')) {
                validateDuplicateSerials();
            }
        });
    }

    function renderImeiRegisterTable() {
        if (!simTypeSelect || !qtyInput || !imeiContainer) return;

        if (!simTypeSelect.value) {
            imeiContainer.innerHTML = '<div class="alert alert-info text-center py-2"><i class="bi bi-info-circle me-2"></i>Please select SIM Support Type to enter Serial / IMEI details.</div>';
            if (summaryBadge) summaryBadge.textContent = 'Waiting for SIM Type selection...';
            return;
        }

        let qty = parseInt(qtyInput.value) || 1;
        if (qty < 1) { qty = 1; qtyInput.value = 1; }

        const simVal = simTypeSelect.value.toLowerCase();
        const isDual = simVal.includes('dual');
        const perUnit = isDual ? 2 : 1;
        const totalImeis = qty * perUnit;

        const categoryVal = document.getElementById('product-category') ? document.getElementById('product-category').value : 'Smartphone';
        const isTablet = (categoryVal === 'Tablet');
        const hasSim = (simVal !== 'none' && simVal !== '');

        const netSel = document.getElementById('network');
        if (netSel) {
            if (simVal === 'none') {
                netSel.value = 'None';
                netSel.disabled = true;
            } else {
                netSel.disabled = false;
                if (netSel.value === 'None' || netSel.value === '') {
                    netSel.value = '5G';
                }
            }
        }

        const existingSerialInputs = imeiContainer.querySelectorAll('input.serial-input-field');
        const existingSerialVals = Array.from(existingSerialInputs).map(i => i.value);

        const existingImeiInputs = imeiContainer.querySelectorAll('input.imei-input-field');
        const existingImeiVals = Array.from(existingImeiInputs).map(i => i.value);

        let html = `
            <div class="table-responsive">
                <table class="table table-bordered align-middle imei-register-table mb-0">
                    <thead>
                        <tr>
                            <th style="width: 10%;">Unit #</th>
                            ${isTablet ? '<th style="width: 40%;">Serial Number *</th>' : ''}
                            ${!isTablet || hasSim ? `<th style="width: ${isTablet && hasSim ? '30%' : '40%'};">Primary IMEI ${isDual ? '(IMEI 1)' : ''} *</th>` : ''}
                            ${isDual ? `<th style="width: ${isTablet ? '30%' : '40%'};">Secondary IMEI (IMEI 2) *</th>` : ''}
                            <th style="width: 10%; text-align: center;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let serialIndex = 0;
        let imeiIndex = 0;

        for (let u = 1; u <= qty; u++) {
            html += `<tr>`;
            html += `<td><span class="badge bg-primary bg-opacity-10 text-primary fw-bold">Unit #${u}</span></td>`;

            if (isTablet) {
                const sVal = existingSerialVals[serialIndex] || '';
                serialIndex++;
                html += `<td>
                    <input type="text" class="form-control serial-input-field" name="serial_nos[]" placeholder="Enter Serial Number" value="${sVal}" required>
                </td>`;
            }

            if (!isTablet || hasSim) {
                const v1 = existingImeiVals[imeiIndex] || '';
                imeiIndex++;
                html += `<td>
                    <input type="text" class="form-control font-monospace imei-input-field" name="imeis[]" maxlength="15" pattern="[0-9]{15}" title="Exactly 15 numeric digits required" placeholder="Enter 15-Digit IMEI 1" value="${v1}" required>
                </td>`;

                if (isDual) {
                    const v2 = existingImeiVals[imeiIndex] || '';
                    imeiIndex++;
                    html += `<td>
                        <input type="text" class="form-control font-monospace imei-input-field" name="imeis[]" maxlength="15" pattern="[0-9]{15}" title="Exactly 15 numeric digits required" placeholder="Enter 15-Digit IMEI 2" value="${v2}" required>
                    </td>`;
                }
            }

            html += `<td class="text-center">`;
            if (qty > 1) {
                html += `<button type="button" class="btn btn-outline-danger btn-sm rounded-circle remove-unit-btn" data-unit="${u}" title="Remove Unit"><i class="bi bi-trash"></i></button>`;
            } else {
                html += `<span class="text-muted small">—</span>`;
            }
            html += `</td>`;
            html += `</tr>`;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;

        imeiContainer.innerHTML = html;

        if (summaryBadge) {
            let desc = `${qty} Unit(s)`;
            if (isTablet) desc += ` × 1 Serial Number`;
            if (!isTablet || hasSim) desc += ` & ${qty * perUnit} IMEI(s)`;
            summaryBadge.textContent = desc;
        }

        // Apply duplicate checks to newly rendered inputs
        validateDuplicateImeis();
        validateDuplicateSerials();

        imeiContainer.querySelectorAll('.remove-unit-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                let currentQty = parseInt(qtyInput.value) || 1;
                if (currentQty > 1) {
                    qtyInput.value = currentQty - 1;
                    renderImeiRegisterTable();
                }
            });
        });
    }

    if (simTypeSelect) simTypeSelect.addEventListener('change', renderImeiRegisterTable);
    if (qtyInput) qtyInput.addEventListener('input', renderImeiRegisterTable);
    
    if (addUnitBtn) {
        addUnitBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            let currentQty = parseInt(qtyInput.value) || 0;
            qtyInput.value = currentQty + 1;
            renderImeiRegisterTable();
        });
    }

    renderImeiRegisterTable();
});
</script>
</body>
</html>
