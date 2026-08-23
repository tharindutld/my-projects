<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");

$errors = [];
$success_msg = "";

// Fetch existing dealers for dropdown list
$dealer_query = mysqli_query($conn, "SELECT DISTINCT Dealer FROM tbl_stock_batches WHERE Dealer IS NOT NULL AND Dealer != '' ORDER BY Dealer ASC");
$existing_dealers = [];
if ($dealer_query) {
    while ($dr = mysqli_fetch_assoc($dealer_query)) {
        $existing_dealers[] = $dr['Dealer'];
    }
}
function generateProductBatchNumber($conn) {
    do {
        $dateStr = date('Ymd');
        $randomStr = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4));
        $batchNo = "BAT-" . $dateStr . "-" . $randomStr;
        $check = mysqli_query($conn, "SELECT ID FROM tbl_stock_batches WHERE BatchNumber = '" . mysqli_real_escape_string($conn, $batchNo) . "'");
    } while ($check && mysqli_num_rows($check) > 0);
    return $batchNo;
}

if (isset($_POST['submit'])) {
    $pname = trim($_POST['pname']);
    $bname = trim($_POST['bname']);
    $cname = trim($_POST['cname']);
    $modelno = trim($_POST['modelno']);
    $price = floatval($_POST['price']);
    $status = isset($_POST['status']) ? 1 : 0;

    $color = trim($_POST['color'] ?? '');
    $RAM = trim($_POST['RAM']);
    $ROM = trim($_POST['ROM']);
    $fcamera = trim($_POST['fcamera']);
    $kfeatures = trim($_POST['kfeatures']);
    $specification = trim($_POST['specification']);
    $processor = trim($_POST['processor']);
    $display = trim($_POST['display']);
    $simtype = trim($_POST['simtype'] ?? '');
    $serial_no = trim($_POST['serial_no'] ?? '');

    // Client & Server input validations (No special characters, plus, minus, or decimals allowed)
    $pattern = "/^[a-zA-Z0-9\s\/]+$/";

    if (!preg_match($pattern, $pname)) {
        $errors[] = "Product Name cannot contain special characters, plus, minus, or decimals.";
    } elseif (!preg_match("/[a-zA-Z]/", $pname)) {
        $errors[] = "Product Name must contain at least one letter.";
    }

    if (!preg_match($pattern, $modelno)) {
        $errors[] = "Model Number cannot contain special characters, plus, minus, or decimals.";
    }

    if (!preg_match($pattern, $fcamera)) {
        $errors[] = "Front Camera cannot contain special characters, plus, minus, or decimals.";
    }

    if (!preg_match($pattern, $processor)) {
        $errors[] = "Processor cannot contain special characters, plus, minus, or decimals.";
    }

    if (!preg_match($pattern, $display)) {
        $errors[] = "Display cannot contain special characters, plus, minus, or decimals.";
    }

    if (empty($color)) {
        $errors[] = "Please provide product color.";
    } elseif (!preg_match("/^[a-zA-Z\s\-\/]+$/", $color)) {
        $errors[] = "Color cannot contain numbers, minus numbers, or special characters.";
    }

    $rams = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'];
    $roms = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];

    if (!in_array($RAM, $rams)) {
        $errors[] = "Please select a valid RAM option from the dropdown.";
    }
    if (!in_array($ROM, $roms)) {
        $errors[] = "Please select a valid ROM option from the dropdown.";
    }

    if ($price < 10000) {
        $errors[] = "Selling Price must be at least 10000 LKR.";
    }

    // Serial Number is required only for Tablet
    if ($cname === 'Tablet') {
        if (empty($serial_no)) {
            $errors[] = "Serial Number is required for Tablet devices.";
        } else {
            // Check uniqueness of Serial Number in SerialNumber and IMEI columns
            $chk_sn1 = mysqli_query($conn, "SELECT ID FROM tbl_stock_imeis WHERE SerialNumber = '" . mysqli_real_escape_string($conn, $serial_no) . "'");
            $chk_sn2 = mysqli_query($conn, "SELECT ID FROM tbl_stock_imeis WHERE IMEI = '" . mysqli_real_escape_string($conn, $serial_no) . "'");
            if (($chk_sn1 && mysqli_num_rows($chk_sn1) > 0) || ($chk_sn2 && mysqli_num_rows($chk_sn2) > 0)) {
                $errors[] = "Serial Number '<strong>" . htmlspecialchars($serial_no) . "</strong>' is already registered in the database.";
            }
        }
    }

    // SIM is required for Smartphone. For Tablet, it is required only if the tablet_has_sim checkbox is selected (indicated by a non-empty simtype).
    $sim_required = ($cname !== 'Tablet') || ($cname === 'Tablet' && isset($_POST['tablet_has_sim']));

    if ($sim_required) {
        if (empty($simtype)) {
            $errors[] = "Please select SIM Support type.";
        }

        // IMEI Validations based on SIM Support
        $imei1 = trim($_POST['imei1'] ?? '');
        $imei2 = trim($_POST['imei2'] ?? '');
        $is_dual_sim = (strpos(strtolower($simtype), 'dual') !== false);

        if (empty($imei1)) {
            $errors[] = "IMEI 1 number is required.";
        } elseif (!preg_match('/^[0-9]{15}$/', $imei1)) {
            $errors[] = "IMEI 1 must be exactly 15 numeric digits.";
        } else {
            $chk1 = mysqli_query($conn, "SELECT ID FROM tbl_stock_imeis WHERE IMEI = '" . mysqli_real_escape_string($conn, $imei1) . "' OR SerialNumber = '" . mysqli_real_escape_string($conn, $imei1) . "'");
            if ($chk1 && mysqli_num_rows($chk1) > 0) {
                $errors[] = "IMEI '<strong>" . htmlspecialchars($imei1) . "</strong>' is already registered in the database.";
            }
        }

        if ($is_dual_sim) {
            if (empty($imei2)) {
                $errors[] = "IMEI 2 number is required for Dual SIM devices.";
            } elseif (!preg_match('/^[0-9]{15}$/', $imei2)) {
                $errors[] = "IMEI 2 must be exactly 15 numeric digits.";
            } elseif ($imei1 === $imei2) {
                $errors[] = "IMEI 1 and IMEI 2 cannot be identical.";
            } else {
                $chk2 = mysqli_query($conn, "SELECT ID FROM tbl_stock_imeis WHERE IMEI = '" . mysqli_real_escape_string($conn, $imei2) . "' OR SerialNumber = '" . mysqli_real_escape_string($conn, $imei2) . "'");
                if ($chk2 && mysqli_num_rows($chk2) > 0) {
                    $errors[] = "IMEI '<strong>" . htmlspecialchars($imei2) . "</strong>' is already registered in the database.";
                }
            }
        }
    } else {
        $simtype = 'None';
    }

    // Strict Image Handling (Rejects PDF, TXT, DOC files)
    $allowed_extensions = array("jpg", "jpeg", "png", "gif");
    $allowed_mimes = array("image/jpeg", "image/jpg", "image/png", "image/gif", "image/pjpeg", "image/x-png");

    $file_inputs = ['image1' => 'Image 1 (Main)', 'image2' => 'Image 2', 'image3' => 'Image 3'];
    $uploaded_exts = [];

    foreach ($file_inputs as $key => $label) {
        if (!isset($_FILES[$key]) || $_FILES[$key]['error'] === UPLOAD_ERR_NO_FILE) {
            $errors[] = "$label is required.";
        } else {
            $fname = $_FILES[$key]['name'];
            $tmp_name = $_FILES[$key]['tmp_name'];
            $ext = strtolower(pathinfo($fname, PATHINFO_EXTENSION));
            $uploaded_exts[$key] = '.' . $ext;

            if (!in_array($ext, $allowed_extensions)) {
                $errors[] = "<strong>$label</strong>: Document file (." . htmlspecialchars($ext) . ") is prohibited! Only image files (JPG, PNG, GIF) are allowed.";
            } else {
                $img_info = @getimagesize($tmp_name);
                if ($img_info === false || !in_array($img_info['mime'], $allowed_mimes)) {
                    $errors[] = "<strong>$label</strong> is not a valid image file. PDF, TXT, and document files cannot be uploaded as product images.";
                }
            }
        }
    }

    // If no validation errors, proceed with DB transaction
    if (empty($errors)) {
        $pic1 = $_FILES["image1"]["name"];
        $pic2 = $_FILES["image2"]["name"];
        $pic3 = $_FILES["image3"]["name"];

        $propic1 = md5($pic1) . time() . $uploaded_exts['image1'];
        $propic2 = md5($pic2) . time() . $uploaded_exts['image2'];
        $propic3 = md5($pic3) . time() . $uploaded_exts['image3'];

        if (!is_dir('../uploads/products/')) {
            mkdir('../uploads/products/', 0777, true);
        }

        move_uploaded_file($_FILES["image1"]["tmp_name"], "../uploads/products/" . $propic1);
        move_uploaded_file($_FILES["image2"]["tmp_name"], "../uploads/products/" . $propic2);
        move_uploaded_file($_FILES["image3"]["tmp_name"], "../uploads/products/" . $propic3);

        // Start Transaction
        mysqli_begin_transaction($conn);
        try {
            $esc_pname = mysqli_real_escape_string($conn, $pname);
            $esc_bname = mysqli_real_escape_string($conn, $bname);
            $esc_cname = mysqli_real_escape_string($conn, $cname);
            $esc_modelno = mysqli_real_escape_string($conn, $modelno);
            $esc_RAM = mysqli_real_escape_string($conn, $RAM);
            $esc_ROM = mysqli_real_escape_string($conn, $ROM);
            $esc_fcamera = mysqli_real_escape_string($conn, $fcamera);
            $esc_kfeatures = mysqli_real_escape_string($conn, $kfeatures);
            $esc_specification = mysqli_real_escape_string($conn, $specification);
            $esc_processor = mysqli_real_escape_string($conn, $processor);
            $esc_display = mysqli_real_escape_string($conn, $display);
            $esc_simtype = mysqli_real_escape_string($conn, $simtype);

            // Insert parent product
            $query = mysqli_query($conn, "INSERT INTO tblproducts(ProductName,BrandName,CategoryName,ModelNumber,SimType,Status,ExpandableUpto,FrontCamera,KeyFeature,Specification,Processor,Display,Image1,Image2,Image3) VALUES ('$esc_pname','$esc_bname','$esc_cname','$esc_modelno','$esc_simtype','$status',NULL,'$esc_fcamera','$esc_kfeatures','$esc_specification','$esc_processor','$esc_display','$propic1','$propic2','$propic3')");

            if (!$query) {
                throw new Exception("Failed to insert product record: " . mysqli_error($conn));
            }

            $new_pid = mysqli_insert_id($conn);

            // Insert single color variant with Stock = 1
            $esc_col = mysqli_real_escape_string($conn, $color);
            $ins_var = mysqli_query($conn, "INSERT INTO tblproduct_variants (ProductId, Color, RAM, ROM, Price, Stock) VALUES ('$new_pid', '$esc_col', '$esc_RAM', '$esc_ROM', '$price', 1)");
            if (!$ins_var) {
                throw new Exception("Failed to insert variant '$color': " . mysqli_error($conn));
            }
            $variant_id = mysqli_insert_id($conn);

            // Auto-generate Stock Batch Number and insert batch
            $batch_number = generateProductBatchNumber($conn);
            $esc_batch = mysqli_real_escape_string($conn, $batch_number);
            $cost_price = floatval($price * 0.8);
            $ins_batch = mysqli_query($conn, "INSERT INTO tbl_stock_batches (VariantId, BatchNumber, Dealer, PurchaseDate, CostPrice, SellingPrice, InitialQuantity, CurrentQuantity) VALUES ('$variant_id', '$esc_batch', 'Initial Product Registration', CURDATE(), '$cost_price', '$price', 1, 1)");
            if (!$ins_batch) {
                throw new Exception("Failed to create initial stock batch: " . mysqli_error($conn));
            }
            $batch_id = mysqli_insert_id($conn);

            // Insert IMEI / Serial Number into tbl_stock_imeis
            if ($esc_cname === 'Tablet') {
                $esc_serial = mysqli_real_escape_string($conn, $serial_no);
                if ($sim_required) {
                    $esc_imei1 = mysqli_real_escape_string($conn, $imei1);
                    $ins_imei1 = mysqli_query($conn, "INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES ('$batch_id', '$esc_imei1', '$esc_serial', 'Available')");
                    if (!$ins_imei1) {
                        throw new Exception("Failed to save IMEI 1 '$imei1': " . mysqli_error($conn));
                    }
                    if ($is_dual_sim) {
                        $esc_imei2 = mysqli_real_escape_string($conn, $imei2);
                        $ins_imei2 = mysqli_query($conn, "INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES ('$batch_id', '$esc_imei2', '$esc_serial', 'Available')");
                        if (!$ins_imei2) {
                            throw new Exception("Failed to save IMEI 2 '$imei2': " . mysqli_error($conn));
                        }
                    }
                } else {
                    // Wi-Fi Only Tablet: IMEI is NULL, SerialNumber is set
                    $ins_serial = mysqli_query($conn, "INSERT INTO tbl_stock_imeis (BatchId, IMEI, SerialNumber, Status) VALUES ('$batch_id', NULL, '$esc_serial', 'Available')");
                    if (!$ins_serial) {
                        throw new Exception("Failed to save Serial Number '$serial_no': " . mysqli_error($conn));
                    }
                }
            } else {
                // Smartphone
                $esc_imei1 = mysqli_real_escape_string($conn, $imei1);
                $ins_imei1 = mysqli_query($conn, "INSERT INTO tbl_stock_imeis (BatchId, IMEI, Status) VALUES ('$batch_id', '$esc_imei1', 'Available')");
                if (!$ins_imei1) {
                    throw new Exception("Failed to save IMEI 1 '$imei1': " . mysqli_error($conn));
                }
                if ($is_dual_sim) {
                    $esc_imei2 = mysqli_real_escape_string($conn, $imei2);
                    $ins_imei2 = mysqli_query($conn, "INSERT INTO tbl_stock_imeis (BatchId, IMEI, Status) VALUES ('$batch_id', '$esc_imei2', 'Available')");
                    if (!$ins_imei2) {
                        throw new Exception("Failed to save IMEI 2 '$imei2': " . mysqli_error($conn));
                    }
                }
            }

            // Write stock movement log
            mysqli_query($conn, "INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES ('$variant_id', 1, 'Initial', 'Batch $batch_number')");

            mysqli_commit($conn);
            $_SESSION['success_msg'] = "Product <strong>" . htmlspecialchars($pname) . "</strong> created successfully.";
            header("Location: add-product.php");
            exit();

        } catch (Exception $e) {
            mysqli_rollback($conn);
            $errors[] = "Something Went Wrong: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <title>Mobile Mart || Add Product</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <style>
        .color-input-group,
        .imei-input-group {
            animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(8px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .custom-card-container {
            border: 1px solid #e9ecef;
            background: #ffffff;
            transition: all 0.25s ease;
        }

        .custom-card-container:hover {
            border-color: #cbd5e1;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .color-indicator {
            transition: color 0.3s ease, border-color 0.3s ease;
        }

        .input-group-pill {
            border: 1px solid #d1d5db;
            border-radius: 50px;
            overflow: hidden;
            background-color: #fff;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-group-pill:focus-within {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .input-group-pill .form-control {
            border: 0 !important;
            box-shadow: none !important;
        }

        .input-group-pill .input-group-text {
            border: 0 !important;
            background-color: transparent !important;
        }

        .input-group-pill .btn {
            border: 0 !important;
        }
    </style>
</head>

<body class="bg-light">

    <div class="d-flex">
        <?php include_once('../includes/admin/sidebar.php'); ?>

        <div class="flex-grow-1">
            <?php include_once('../includes/admin/header.php'); ?>

            <div class="container-fluid p-4">



                <div class="card shadow-sm">
                    <div class="card-header bg-dark text-white d-flex align-items-center justify-content-between">
                        <h5 class="mb-0"><i class="bi bi-box me-2"></i>Add New Product</h5>
                    </div>
                    <div class="card-body p-4">
                        <form method="post" enctype="multipart/form-data" class="confirm-submit"
                            data-confirm-message="Please confirm that you wish to add this new product to the system.">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">Product Name</label>
                                    <input type="text" class="form-control" name="pname"
                                        pattern="^(?![0-9]+$)[a-zA-Z0-9\s\/]+$"
                                        title="Only alphanumeric characters, spaces, and slashes are allowed. Must contain at least one letter and cannot contain plus, minus, decimals, or special characters."
                                        value="<?php echo isset($_POST['pname']) ? htmlspecialchars($_POST['pname']) : ''; ?>"
                                        required>
                                    <div class="invalid-feedback">Please enter the product name. Only alphanumeric, space, and slash allowed. No decimals, minus, or plus signs.</div>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label class="form-label fw-bold">Brand</label>
                                    <select class="form-select" name="bname" required>
                                        <option value="">Select Brand</option>
                                        <?php
                                        $query1 = mysqli_query($conn, "SELECT * FROM tblbrand ORDER BY BrandName ASC");
                                        while ($row1 = mysqli_fetch_array($query1)) {
                                            $selected = (isset($_POST['bname']) && $_POST['bname'] == $row1['BrandName']) ? 'selected' : '';
                                            $status_label = ($row1['Status'] == '0' || $row1['Status'] === 0) ? ' (Inactive)' : '';
                                            echo '<option value="' . htmlspecialchars($row1['BrandName']) . '" ' . $selected . '>' . htmlspecialchars($row1['BrandName']) . $status_label . '</option>';
                                        }
                                        ?>
                                    </select>
                                    <div class="invalid-feedback">Please select a brand.</div>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label class="form-label fw-bold">Category</label>
                                    <select class="form-select" name="cname" required>
                                        <option value="">Select Category</option>
                                        <?php
                                        $query_cat = mysqli_query($conn, "SELECT * FROM tblcategory ORDER BY CategoryName ASC");
                                        while ($row_cat = mysqli_fetch_array($query_cat)) {
                                            $selected = (isset($_POST['cname']) && $_POST['cname'] == $row_cat['CategoryName']) ? 'selected' : '';
                                            $status_label = ($row_cat['Status'] == '0' || $row_cat['Status'] === 0) ? ' (Inactive)' : '';
                                            echo '<option value="' . htmlspecialchars($row_cat['CategoryName']) . '" ' . $selected . '>' . htmlspecialchars($row_cat['CategoryName']) . $status_label . '</option>';
                                        }
                                        ?>
                                    </select>
                                    <div class="invalid-feedback">Please select a category.</div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label class="form-label fw-bold">Model Number</label>
                                    <input type="text" class="form-control" name="modelno"
                                        pattern="^[a-zA-Z0-9\s\/]+$"
                                        title="Only alphanumeric characters, spaces, and slashes are allowed. Cannot contain plus, minus, decimals, or special characters."
                                        value="<?php echo isset($_POST['modelno']) ? htmlspecialchars($_POST['modelno']) : ''; ?>"
                                        required>
                                    <div class="invalid-feedback">Please enter the model number. Only alphanumeric, space, and slash allowed. No decimals, minus, or plus signs.</div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold">Price (LKR)</label>
                                    <input type="number" step="1" min="10000" class="form-control" name="price"
                                        value="<?php echo isset($_POST['price']) ? htmlspecialchars($_POST['price']) : ''; ?>"
                                        required>
                                    <div class="invalid-feedback">Please enter a valid price (minimum 10000 LKR).</div>
                                </div>
                            </div>

                             <!-- Single Product Color Field -->
                             <div class="row">
                                 <div class="col-md-12 mb-3">
                                     <label class="form-label fw-bold">Product Color</label>
                                     <div class="input-group">
                                         <span class="input-group-text"><i class="bi bi-palette text-primary"></i></span>
                                         <input type="text" class="form-control" name="color"
                                             pattern="^[a-zA-Z\s\-\/]+$"
                                             title="Only letters, spaces, hyphens, and forward slashes are allowed. Numbers, negative values, and special characters are not permitted."
                                             placeholder="e.g. Titanium Black / Phantom Silver"
                                             value="<?php echo isset($_POST['color']) ? htmlspecialchars($_POST['color']) : ''; ?>" required>
                                     </div>
                                     <div class="form-text small text-muted">Enter the primary color for this product model.</div>
                                 </div>
                             </div>

                             <div class="row">
                                 <div class="col-md-6 mb-3">
                                     <label class="form-label fw-bold">RAM</label>
                                     <select class="form-select" name="RAM" required>
                                         <option value="">Select RAM</option>
                                         <?php
                                         $rams = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'];
                                         foreach ($rams as $r) {
                                             $selected = (isset($_POST['RAM']) && $_POST['RAM'] == $r) ? 'selected' : '';
                                             echo '<option value="' . $r . '" ' . $selected . '>' . $r . '</option>';
                                         }
                                         ?>
                                     </select>
                                     <div class="invalid-feedback">Please select the RAM.</div>
                                 </div>
                                 <div class="col-md-6 mb-3">
                                     <label class="form-label fw-bold">ROM</label>
                                     <select class="form-select" name="ROM" required>
                                         <option value="">Select ROM</option>
                                         <?php
                                         $roms = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
                                         foreach ($roms as $ro) {
                                             $selected = (isset($_POST['ROM']) && $_POST['ROM'] == $ro) ? 'selected' : '';
                                             echo '<option value="' . $ro . '" ' . $selected . '>' . $ro . '</option>';
                                         }
                                         ?>
                                     </select>
                                     <div class="invalid-feedback">Please select the ROM.</div>
                                 </div>
                             </div>
                              <div class="row">
                                   <div class="col-md-3 mb-3">
                                       <label class="form-label fw-bold">Front Camera</label>
                                       <input type="text" class="form-control" name="fcamera"
                                           pattern="^[a-zA-Z0-9\s\/]+$"
                                           title="Only alphanumeric characters, spaces, and slashes are allowed. Cannot contain plus, minus, decimals, or special characters."
                                           value="<?php echo isset($_POST['fcamera']) ? htmlspecialchars($_POST['fcamera']) : ''; ?>"
                                           required>
                                       <div class="invalid-feedback">Please enter the front camera details. Only alphanumeric, space, and slash allowed. No decimals, minus, or plus signs.</div>
                                   </div>
                                   <div class="col-md-3 mb-3">
                                       <label class="form-label fw-bold">Processor</label>
                                       <input type="text" class="form-control" name="processor"
                                           pattern="^[a-zA-Z0-9\s\/]+$"
                                           title="Only alphanumeric characters, spaces, and slashes are allowed. Cannot contain plus, minus, decimals, or special characters."
                                           value="<?php echo isset($_POST['processor']) ? htmlspecialchars($_POST['processor']) : ''; ?>"
                                           required>
                                       <div class="invalid-feedback">Please enter the processor details. Only alphanumeric, space, and slash allowed. No decimals, minus, or plus signs.</div>
                                   </div>
                                   <div class="col-md-3 mb-3">
                                       <label class="form-label fw-bold">Display</label>
                                       <input type="text" class="form-control" name="display"
                                           pattern="^[a-zA-Z0-9\s\/]+$"
                                           title="Only alphanumeric characters, spaces, and slashes are allowed. Cannot contain plus, minus, decimals, or special characters."
                                           value="<?php echo isset($_POST['display']) ? htmlspecialchars($_POST['display']) : ''; ?>"
                                           required>
                                       <div class="invalid-feedback">Please enter the display details. Only alphanumeric, space, and slash allowed. No decimals, minus, or plus signs.</div>
                                   </div>
                                  <div class="col-md-3 mb-3" id="simtype-wrapper">
                                      <label class="form-label fw-bold">SIM Support</label>
                                      <select class="form-select" name="simtype" required>
                                          <option value="">Select SIM Support Type...</option>
                                          <?php
                                          $sim_options = ['Single SIM', 'Dual SIM', 'eSIM', 'Dual SIM (Nano-SIM + eSIM)'];
                                          foreach ($sim_options as $opt) {
                                              $selected = (isset($_POST['simtype']) && $_POST['simtype'] === $opt) ? 'selected' : '';
                                              echo '<option value="' . htmlspecialchars($opt) . '" ' . $selected . '>' . htmlspecialchars($opt) . '</option>';
                                          }
                                          ?>
                                      </select>
                                      <div class="invalid-feedback">Please select the SIM Support type.</div>
                                      
                                  </div>
                               </div>

                               <!-- Tablet Specific Dynamic Fields -->
                               <div class="row g-3" id="serial-number-wrapper" style="display: none; margin-bottom: 1rem;">
                                   <div class="col-md-12">
                                       <label class="form-label fw-bold text-primary">Serial Number <span class="text-danger">*</span></label>
                                       <div class="input-group">
                                           <span class="input-group-text"><i class="bi bi-hash text-primary"></i></span>
                                           <input type="text" class="form-control" name="serial_no" id="serial_no"
                                               placeholder="Enter device serial number (e.g. S/N...)"
                                               value="<?php echo isset($_POST['serial_no']) ? htmlspecialchars($_POST['serial_no']) : ''; ?>">
                                       </div>
                                       <div class="form-text small text-muted">A unique serial number for the tablet.</div>
                                   </div>
                               </div>

                               <div class="mb-3 form-check" id="tablet-sim-toggle-wrapper" style="display: none;">
                                   <input class="form-check-input" type="checkbox" id="tablet_has_sim" name="tablet_has_sim" value="1" <?php echo isset($_POST['tablet_has_sim']) ? 'checked' : ''; ?>>
                                   <label class="form-check-label fw-bold" for="tablet_has_sim">
                                       This Tablet has SIM / Cellular Support
                                   </label>
                               </div>

                              <div class="mb-3">
                                  <label class="form-label fw-bold">Key Features</label>
                                 <textarea class="form-control" name="kfeatures" rows="3"
                                     required><?php echo isset($_POST['kfeatures']) ? htmlspecialchars($_POST['kfeatures']) : ''; ?></textarea>
                                 <div class="invalid-feedback">Please enter key features.</div>
                             </div>
                             <div class="mb-3">
                                 <label class="form-label fw-bold">Specification</label>
                                 <textarea class="form-control" name="specification" rows="3"
                                     required><?php echo isset($_POST['specification']) ? htmlspecialchars($_POST['specification']) : ''; ?></textarea>
                                 <div class="invalid-feedback">Please enter specifications.</div>
                             </div>

                             <div class="row">
                                 <div class="col-md-4 mb-3">
                                     <label class="form-label fw-bold">Image 1 (Main)</label>
                                     <input type="file" class="form-control" name="image1" accept=".jpg,.jpeg,.png,.gif"
                                         required>
                                     <div class="invalid-feedback">Please select a valid main image.</div>
                                 </div>
                                 <div class="col-md-4 mb-3">
                                     <label class="form-label fw-bold">Image 2</label>
                                     <input type="file" class="form-control" name="image2" accept=".jpg,.jpeg,.png,.gif"
                                         required>
                                     <div class="invalid-feedback">Please select a valid second image.</div>
                                 </div>
                                 <div class="col-md-4 mb-3">
                                     <label class="form-label fw-bold">Image 3</label>
                                     <input type="file" class="form-control" name="image3" accept=".jpg,.jpeg,.png,.gif"
                                         required>
                                     <div class="invalid-feedback">Please select a valid third image.</div>
                                 </div>
                             </div>

                            
                            <!-- IMEI Registration Section -->
                            <div class="border p-4 rounded-4 mb-4 bg-white shadow-sm">
                                <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                                    <h6 class="fw-bold text-dark mb-0"><i class="bi bi-upc-scan me-2 text-primary"></i>IMEI Registration</h6>
                                    <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill" id="sim-type-badge">SIM Support</span>
                                </div>
                                <div id="product-imei-fields-container">
                                    <!-- Dynamic IMEI inputs (1 for Single SIM, 2 for Dual SIM) rendered via JS -->
                                </div>
                            </div>

                            <div class="mb-4 form-check">
                                <input type="checkbox" class="form-check-input" name="status" value="1" <?php echo (!isset($_POST['submit']) || isset($_POST['status'])) ? 'checked' : ''; ?>>
                                <label class="form-check-label fw-bold">Publish to Store</label>
                            </div>

                            <button type="submit" class="btn btn-primary px-5" name="submit">Add Product</button>
                            <button type="reset" class="btn btn-secondary px-5 ms-2">Clear</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <?php include_once('../includes/components/confirmation.php'); ?>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            // Strict Client-Side Image File Type Validation (Rejects PDF, TXT, DOC)
            document.querySelectorAll('input[type="file"]').forEach(function (input) {
                input.addEventListener('change', function () {
                    const file = this.files[0];
                    if (file) {
                        const fileName = file.name;
                        const ext = fileName.split('.').pop().toLowerCase();
                        const allowedExts = ['jpg', 'jpeg', 'png', 'gif'];
                        
                        if (!allowedExts.includes(ext) || (file.type && !file.type.startsWith('image/'))) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Invalid File Format',
                                text: '"' + fileName + '" is not a valid image file. PDF, TXT, and document files cannot be uploaded as product images. Please select a valid image file (JPG, PNG, GIF).',
                                confirmButtonColor: '#d33'
                            });
                            this.value = '';
                            this.classList.add('is-invalid');
                        } else {
                            this.classList.remove('is-invalid');
                        }
                    }
                });
            });

            // SIM Type & Dynamic IMEI Field Renderer
            const simSelect = document.querySelector('select[name="simtype"]');
            const imeiContainer = document.getElementById('product-imei-fields-container');
            const simBadge = document.getElementById('sim-type-badge');

            function renderProductImeiFields() {
                if (!simSelect || !imeiContainer) return;
                const val = simSelect.value;
                if (!val || val === 'None') {
                    if (simBadge) simBadge.textContent = 'SIM Support';
                    imeiContainer.innerHTML = '<div class="text-muted small p-2 bg-light rounded border"><i class="bi bi-info-circle me-1"></i>Please select SIM Support type above to enter IMEI numbers.</div>';
                    return;
                }

                if (simBadge) simBadge.textContent = val;
                const isDual = val.toLowerCase().includes('dual');

                if (isDual) {
                    imeiContainer.innerHTML = `
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label fw-bold small text-primary">IMEI 1 (Primary SIM) <span class="text-danger">*</span></label>
                                <input type="text" class="form-control font-monospace" name="imei1" id="imei1" maxlength="15" pattern="^[0-9]{15}$" title="15-digit numeric IMEI required" placeholder="Enter 15-digit IMEI 1" required>
                                <div class="form-text small text-muted">Exactly 15 numeric digits</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold small text-primary">IMEI 2 (Secondary SIM) <span class="text-danger">*</span></label>
                                <input type="text" class="form-control font-monospace" name="imei2" id="imei2" maxlength="15" pattern="^[0-9]{15}$" title="15-digit numeric IMEI required" placeholder="Enter 15-digit IMEI 2" required>
                                <div class="form-text small text-muted">Exactly 15 numeric digits</div>
                            </div>
                        </div>
                    `;
                } else {
                    imeiContainer.innerHTML = `
                        <div class="row g-3">
                            <div class="col-md-12">
                                <label class="form-label fw-bold small text-primary">IMEI Number (Single SIM) <span class="text-danger">*</span></label>
                                <input type="text" class="form-control font-monospace" name="imei1" id="imei1" maxlength="15" pattern="^[0-9]{15}$" title="15-digit numeric IMEI required" placeholder="Enter 15-digit IMEI Number" required>
                                <div class="form-text small text-muted">Exactly 15 numeric digits</div>
                            </div>
                        </div>
                    `;
                }
            }

            if (simSelect) {
                simSelect.addEventListener('change', renderProductImeiFields);
                renderProductImeiFields();
            }

            // Category & SIM Checkbox Visibility Toggles
            const cnameSelect = document.querySelector('select[name="cname"]');
            const simtypeWrapper = document.getElementById('simtype-wrapper');
            const serialWrapper = document.getElementById('serial-number-wrapper');
            const serialInput = document.getElementById('serial_no');
            const tabletSimToggleWrapper = document.getElementById('tablet-sim-toggle-wrapper');
            const tabletSimCheckbox = document.getElementById('tablet_has_sim');
            const imeiSection = document.querySelector('.border.p-4.rounded-4.mb-4.bg-white.shadow-sm'); // IMEI container

            function toggleCategoryFields() {
                if (!cnameSelect) return;
                const category = cnameSelect.value;
                if (category === 'Tablet') {
                    // Show Serial Number
                    if (serialWrapper) serialWrapper.style.display = 'flex';
                    if (serialInput) serialInput.required = true;
                    
                    // Show Tablet SIM toggle
                    if (tabletSimToggleWrapper) tabletSimToggleWrapper.style.display = 'block';
                    
                    // Toggle SIM type & IMEI based on checkbox
                    if (tabletSimCheckbox && tabletSimCheckbox.checked) {
                        if (simtypeWrapper) simtypeWrapper.style.display = 'block';
                        if (simSelect) simSelect.required = true;
                        if (imeiSection) imeiSection.style.display = 'block';
                        renderProductImeiFields();
                    } else {
                        if (simtypeWrapper) simtypeWrapper.style.display = 'none';
                        if (simSelect) {
                            simSelect.required = false;
                            simSelect.value = '';
                        }
                        if (imeiSection) {
                            imeiSection.style.display = 'none';
                            const imeiInputs = imeiSection.querySelectorAll('input');
                            imeiInputs.forEach(input => input.required = false);
                        }
                    }
                } else {
                    // Smartphone/other
                    if (serialWrapper) {
                        serialWrapper.style.display = 'none';
                        if (serialInput) {
                            serialInput.required = false;
                            serialInput.value = '';
                        }
                    }
                    if (tabletSimToggleWrapper) tabletSimToggleWrapper.style.display = 'none';
                    if (simtypeWrapper) simtypeWrapper.style.display = 'block';
                    if (simSelect) simSelect.required = true;
                    if (imeiSection) imeiSection.style.display = 'block';
                    renderProductImeiFields();
                }
            }

            if (cnameSelect) {
                cnameSelect.addEventListener('change', toggleCategoryFields);
            }
            if (tabletSimCheckbox) {
                tabletSimCheckbox.addEventListener('change', toggleCategoryFields);
            }
            
            // Trigger toggle on load
            toggleCategoryFields();

            // Popular phone color name translation helper
            function getCssColor(name) {
                const trimmed = name.trim().toLowerCase();
                const phoneColors = {
                    'titanium': '#8e8e93',
                    'natural titanium': '#a8a7a0',
                    'blue titanium': '#2f4452',
                    'white titanium': '#f2f1ed',
                    'black titanium': '#3c3d3a',
                    'titanium gray': '#70706e',
                    'titanium grey': '#70706e',
                    'space gray': '#555559',
                    'space grey': '#555559',
                    'space black': '#1c1c1e',
                    'silver': '#e3e4e5',
                    'gold': '#fad7a0',
                    'rose gold': '#fadbd8',
                    'midnight': '#191f28',
                    'starlight': '#f0eae3',
                    'flowy emerald': '#5f8575',
                    'mint': '#dfffed',
                    'bora purple': '#8e82a0',
                    'bay blue': '#4f94cd',
                    'awesome violet': '#b19cd9',
                    'mint green': '#a2e8dd'
                };
                return phoneColors[trimmed] || trimmed;
            }

            // Update the color dot preview
            function updateColorIndicator(inputField) {
                const group = inputField.closest('.color-input-group');
                if (!group) return;
                const indicator = group.querySelector('.color-indicator');
                const colorVal = getCssColor(inputField.value);

                // Test color validity
                const s = new Option().style;
                s.color = colorVal;
                if (s.color !== '') {
                    indicator.style.color = colorVal;
                    indicator.classList.remove('text-secondary');
                } else {
                    indicator.style.color = '';
                    indicator.classList.add('text-secondary');
                }
            }

            // Set preview on existing colors on load
            document.querySelectorAll('.color-input-field').forEach(updateColorIndicator);

            // Color indicator event listener
            document.addEventListener('input', function (e) {
                if (e.target && e.target.classList.contains('color-input-field')) {
                    updateColorIndicator(e.target);
                }
            });

            // 3. Dynamic Color row input builder & Duplicate Check
            function validateDuplicateColors() {
                const colorFields = document.querySelectorAll('.color-input-field');
                const values = [];
                let hasDuplicate = false;
                colorFields.forEach(input => {
                    input.setCustomValidity('');
                    const val = input.value.trim().toLowerCase();
                    if (val !== '') {
                        if (values.includes(val)) {
                            input.setCustomValidity('Cannot add the same color.');
                            hasDuplicate = true;
                        } else {
                            values.push(val);
                        }
                    }
                });
                return !hasDuplicate;
            }

            document.addEventListener('input', function (e) {
                if (e.target && e.target.classList.contains('color-input-field')) {
                    validateDuplicateColors();
                }
            });

            function addColorInputRow(value = '') {
                const col = document.createElement('div');
                col.className = 'col-md-4 color-input-group mb-2';
                col.innerHTML = `
            <div class="input-group input-group-pill">
                <span class="input-group-text"><i class="bi bi-circle-fill text-secondary color-indicator" style="font-size: 1.1rem;"></i></span>
                <input type="text" class="form-control color-input-field" name="colors[]" pattern="^[a-zA-Z0-9\\s\\.\\-\\/&()]+$" title="Cannot add the same color twice." placeholder="e.g. Titanium Black" value="${value}" required>
                <button type="button" class="btn btn-link text-danger remove-color-btn"><i class="bi bi-trash"></i></button>
            </div>
        `;
                colorContainer.appendChild(col);
                validateDuplicateColors();
            }

            document.addEventListener('click', function (e) {
                const addColorBtn = e.target.classList.contains('add-color-btn') ? e.target : e.target.closest('.add-color-btn');
                if (addColorBtn) {
                    addColorInputRow();
                }

                const removeColorBtn = e.target.classList.contains('remove-color-btn') ? e.target : e.target.closest('.remove-color-btn');
                if (removeColorBtn) {
                    removeColorBtn.closest('.color-input-group').remove();
                    validateDuplicateColors();
                }
            });
        });
    </script>
</body>

</html>