<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");

$errors = [];
$success_msg = "";
$eid = intval($_GET['editid']);

// ── 1. Handle Parent Product Update ──────────────────────────────────────
if(isset($_POST['submit']) && isset($_POST['pname'])) {
    $pname = trim($_POST['pname']);
    $bname = trim($_POST['bname']);
    $cname = trim($_POST['cname']);
    $modelno = trim($_POST['modelno']);
    $fcamera = trim($_POST['fcamera']);
    $processor = trim($_POST['processor']);
    $display = trim($_POST['display']);
    $simtype = trim($_POST['simtype'] ?? '');
    $kfeatures = trim($_POST['kfeatures']);
    $specification = trim($_POST['specification']);
    $status = isset($_POST['status']) ? 1 : 0;
    
    if ($cname !== 'Tablet' && ($simtype === 'None' || empty($simtype))) {
        $errors[] = "Please select a valid SIM Support type for Smartphone.";
    }
    
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
        $errors[] = "Front Camera details cannot contain special characters, plus, minus, or decimals.";
    }

    if (!preg_match($pattern, $processor)) {
        $errors[] = "Processor details cannot contain special characters, plus, minus, or decimals.";
    }

    if (!preg_match($pattern, $display)) {
        $errors[] = "Display details cannot contain special characters, plus, minus, or decimals.";
    }

    if (empty($errors)) {
        $esc_pname = mysqli_real_escape_string($conn, $pname);
        $esc_bname = mysqli_real_escape_string($conn, $bname);
        $esc_cname = mysqli_real_escape_string($conn, $cname);
        $esc_modelno = mysqli_real_escape_string($conn, $modelno);
        $esc_fcamera = mysqli_real_escape_string($conn, $fcamera);
        $esc_kfeatures = mysqli_real_escape_string($conn, $kfeatures);
        $esc_specification = mysqli_real_escape_string($conn, $specification);
        $esc_processor = mysqli_real_escape_string($conn, $processor);
        $esc_display = mysqli_real_escape_string($conn, $display);
        $esc_simtype = mysqli_real_escape_string($conn, $simtype);

        $query = mysqli_query($conn, "UPDATE tblproducts SET ProductName='$esc_pname', BrandName='$esc_bname', CategoryName='$esc_cname', ModelNumber='$esc_modelno', Status='$status', FrontCamera='$esc_fcamera', KeyFeature='$esc_kfeatures', Specification='$esc_specification', Processor='$esc_processor', Display='$esc_display', SimType='$esc_simtype' WHERE ID='$eid'");
        
        if ($query) {
            $_SESSION['success_msg'] = "Product details updated successfully.";
            header("Location: editproducts.php?editid=$eid");
            exit();
        } else {
            $errors[] = "Something Went Wrong. Please try again: " . mysqli_error($conn);
        }
    }
}

// ── 2. Handle Adding Variant ─────────────────────────────────────────────
if (isset($_POST['v_color'])) {
    $v_color = trim($_POST['v_color']);
    $v_ram = trim($_POST['v_ram']);
    $v_rom = trim($_POST['v_rom']);
    $v_price = floatval($_POST['v_price']);
    $v_stock = intval($_POST['v_stock']);

    if (!preg_match("/^[a-zA-Z\s\-\/]+$/", $v_color)) {
        $errors[] = "Variant Color cannot contain numbers, minus numbers, or special characters.";
    }
    if ($v_price < 10000) {
        $errors[] = "Variant Price must be at least 10000 LKR.";
    }
    // Check if variant with same Color, RAM, ROM already exists
    $esc_color = mysqli_real_escape_string($conn, $v_color);
    $esc_ram = mysqli_real_escape_string($conn, $v_ram);
    $esc_rom = mysqli_real_escape_string($conn, $v_rom);

    $chk_dup = mysqli_query($conn, "SELECT ID FROM tblproduct_variants WHERE ProductId = '$eid' AND LOWER(Color) = LOWER('$esc_color') AND LOWER(RAM) = LOWER('$esc_ram') AND LOWER(ROM) = LOWER('$esc_rom')");
    if (mysqli_num_rows($chk_dup) > 0) {
        $errors[] = "Cannot add the same color ('<strong>" . htmlspecialchars($v_color) . "</strong>') for this product variant.";
    }

    if (empty($errors)) {
        
        $ins = mysqli_query($conn, "INSERT INTO tblproduct_variants (ProductId, Color, RAM, ROM, Price, Stock) VALUES ('$eid', '$esc_color', '$esc_ram', '$esc_rom', '$v_price', '$v_stock')");
        if ($ins) {
            $new_vid = mysqli_insert_id($conn);
            if ($v_stock > 0) {
                mysqli_query($conn, "INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES ('$new_vid', '$v_stock', 'Restock', 'Added via Edit Product Page')");
            }
            $_SESSION['success_msg'] = "New variant added successfully.";
            header("Location: editproducts.php?editid=$eid");
            exit();
        } else {
            $errors[] = "Failed to add variant: " . mysqli_error($conn);
        }
    }
}

// ── 3. Handle Updating Variant Inline ────────────────────────────────────
if (isset($_POST['var_id'])) {
    $var_id = intval($_POST['var_id']);
    $v_price = floatval($_POST['v_price']);
    $v_stock = intval($_POST['v_stock']);

    if ($v_price < 10000) {
        $errors[] = "Price must be at least 10000 LKR.";
    }
    if ($v_stock < 0) {
        $errors[] = "Stock cannot be negative.";
    }

    if (empty($errors)) {
        // Get current stock of variant
        $cur_q = mysqli_query($conn, "SELECT Stock FROM tblproduct_variants WHERE ID='$var_id'");
        $cur_stock = 0;
        if ($cur_q && $cur_row = mysqli_fetch_assoc($cur_q)) {
            $cur_stock = intval($cur_row['Stock']);
        }

        $upd = mysqli_query($conn, "UPDATE tblproduct_variants SET Price='$v_price', Stock='$v_stock' WHERE ID='$var_id'");
        if ($upd) {
            if ($v_stock != $cur_stock) {
                $diff = $v_stock - $cur_stock;
                mysqli_query($conn, "INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES ('$var_id', '$diff', 'Correction', 'Manual Adjustment from Edit Page')");
            }
            $_SESSION['success_msg'] = "Variant updated successfully.";
            header("Location: editproducts.php?editid=$eid");
            exit();
        } else {
            $errors[] = "Failed to update variant: " . mysqli_error($conn);
        }
    }
}

// ── 4. Handle Deleting Variant ───────────────────────────────────────────
if (isset($_GET['delete_variant'])) {
    $del_vid = intval($_GET['delete_variant']);
    
    // Check if variant has stock
    $check_stock_q = mysqli_query($conn, "SELECT Stock FROM tblproduct_variants WHERE ID='$del_vid' AND ProductId='$eid'");
    if ($check_stock_q && $check_row = mysqli_fetch_assoc($check_stock_q)) {
        if (intval($check_row['Stock']) > 0) {
            $_SESSION['error_msg'] = "Cannot delete variant. This variant currently has active stock ({$check_row['Stock']} units) in inventory. Set stock to 0 first.";
            header("Location: editproducts.php?editid=$eid");
            exit();
        }
    }
    
    $del = mysqli_query($conn, "DELETE FROM tblproduct_variants WHERE ID='$del_vid' AND ProductId='$eid'");
    if ($del) {
        $_SESSION['success_msg'] = "Variant deleted successfully.";
        header("Location: editproducts.php?editid=$eid");
        exit();
    } else {
        $errors[] = "Failed to delete variant: " . mysqli_error($conn);
    }
}
if (!empty($errors)) {
    $_SESSION['error_msg'] = implode('<br>', $errors);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mobile Mart || Update Product</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <style>
        .section-header {
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-weight: 700;
        }
        .variant-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 15px;
            padding: 15px;
        }
    </style>
</head>
<body class="bg-light">

<div class="d-flex">
    <?php include_once('../includes/admin/sidebar.php');?>
    
    <div class="flex-grow-1">
        <?php include_once('../includes/admin/header.php');?>
        
        <div class="container-fluid p-4">



            <div class="card shadow-sm mb-4">
                <div class="card-header bg-dark text-white">
                    <h5 class="mb-0"><i class="bi bi-pencil-square me-2"></i>Update Product Information</h5>
                </div>
                <div class="card-body p-4">
                    <form method="post" class="confirm-submit" data-confirm-message="Are you sure you want to save these changes to the product?">
                        <?php
                        $ret = mysqli_query($conn, "SELECT * FROM tblproducts WHERE ID='$eid'");
                        while ($row = mysqli_fetch_array($ret)) {
                             $val_pname = isset($_POST['pname']) ? htmlspecialchars($_POST['pname']) : $row['ProductName'];
                             $val_bname = isset($_POST['bname']) ? $_POST['bname'] : $row['BrandName'];
                             $val_cname = isset($_POST['cname']) ? $_POST['cname'] : $row['CategoryName'];
                             $val_modelno = isset($_POST['modelno']) ? htmlspecialchars($_POST['modelno']) : $row['ModelNumber'];
                            $val_fcamera = isset($_POST['fcamera']) ? htmlspecialchars($_POST['fcamera']) : $row['FrontCamera'];
                            $val_processor = isset($_POST['processor']) ? htmlspecialchars($_POST['processor']) : $row['Processor'];
                             $val_display = isset($_POST['display']) ? htmlspecialchars($_POST['display']) : $row['Display'];
                             $val_simtype = isset($_POST['simtype']) ? $_POST['simtype'] : ($row['SimType'] ?? '');
                            $val_kfeatures = isset($_POST['kfeatures']) ? htmlspecialchars($_POST['kfeatures']) : $row['KeyFeature'];
                            $val_specification = isset($_POST['specification']) ? htmlspecialchars($_POST['specification']) : $row['Specification'];
                            $val_status = isset($_POST['status']) ? 1 : (isset($_POST['pname']) ? 0 : intval($row['Status']));
                        ?>
                        
                        <h6 class="section-header text-primary"><i class="bi bi-info-circle-fill me-2"></i>Product General Details</h6>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label fw-bold">Product Name</label>
                                <input type="text" class="form-control" name="pname" 
                                       pattern="^(?![0-9]+$)[a-zA-Z0-9\s\/]+$" 
                                       title="Only alphanumeric characters, spaces, and slashes are allowed. Must contain at least one letter and cannot contain plus, minus, decimals, or special characters." 
                                       value="<?php echo $val_pname;?>" required>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label fw-bold">Brand Name</label>
                                <select class="form-select" name="bname" required>
                                    <option value="">Select Brand</option>
                                    <?php 
                                    $query1 = mysqli_query($conn, "SELECT * FROM tblbrand ORDER BY BrandName ASC");
                                    while($row1 = mysqli_fetch_array($query1)) {
                                        $selected = ($val_bname == $row1['BrandName']) ? 'selected' : '';
                                        $status_label = ($row1['Status'] == '0' || $row1['Status'] === 0) ? ' (Inactive)' : '';
                                        echo '<option value="'.htmlspecialchars($row1['BrandName']).'" '.$selected.'>'.htmlspecialchars($row1['BrandName']).$status_label.'</option>';
                                    } 
                                    ?>
                                </select>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label fw-bold">Category</label>
                                <select class="form-select" name="cname" required>
                                    <option value="">Select Category</option>
                                    <?php 
                                    $query_cat = mysqli_query($conn, "SELECT * FROM tblcategory ORDER BY CategoryName ASC");
                                    while($row_cat = mysqli_fetch_array($query_cat)) {
                                        $selected = ($val_cname == $row_cat['CategoryName']) ? 'selected' : '';
                                        $status_label = ($row_cat['Status'] == '0' || $row_cat['Status'] === 0) ? ' (Inactive)' : '';
                                        echo '<option value="'.htmlspecialchars($row_cat['CategoryName']).'" '.$selected.'>'.htmlspecialchars($row_cat['CategoryName']).$status_label.'</option>';
                                    } 
                                    ?>
                                </select>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-12 mb-3">
                                <label class="form-label fw-bold">Model Number</label>
                                <input type="text" class="form-control" name="modelno" 
                                       pattern="^[a-zA-Z0-9\s\/]+$" 
                                       title="Only alphanumeric characters, spaces, and slashes are allowed. Cannot contain plus, minus, decimals, or special characters." 
                                       value="<?php echo $val_modelno;?>" required>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <label class="form-label fw-bold">Front Camera</label>
                                <input type="text" class="form-control" name="fcamera" 
                                       pattern="^[a-zA-Z0-9\s\/]+$" 
                                       title="Only alphanumeric characters, spaces, and slashes are allowed. Cannot contain plus, minus, decimals, or special characters." 
                                       value="<?php echo $val_fcamera;?>" required>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label fw-bold">Processor</label>
                                <input type="text" class="form-control" name="processor" 
                                       pattern="^[a-zA-Z0-9\s\/]+$" 
                                       title="Only alphanumeric characters, spaces, and slashes are allowed. Cannot contain plus, minus, decimals, or special characters." 
                                       value="<?php echo $val_processor;?>" required>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label fw-bold">Display</label>
                                <input type="text" class="form-control" name="display" 
                                       pattern="^[a-zA-Z0-9\s\/]+$" 
                                       title="Only alphanumeric characters, spaces, and slashes are allowed. Cannot contain plus, minus, decimals, or special characters." 
                                       value="<?php echo $val_display;?>" required>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label fw-bold">SIM Support</label>
                                <select class="form-select" name="simtype" required>
                                    <option value="">Select SIM Support Type...</option>
                                    <?php 
                                    $sim_opts = ['Single SIM', 'Dual SIM', 'eSIM', 'Dual SIM (Nano-SIM + eSIM)', 'None'];
                                    foreach ($sim_opts as $so) {
                                        $sel = ($val_simtype == $so) ? 'selected' : '';
                                        echo '<option value="' . htmlspecialchars($so) . '" ' . $sel . '>' . htmlspecialchars($so) . '</option>';
                                    }
                                    ?>
                                </select>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Key Features</label>
                            <textarea class="form-control" name="kfeatures" rows="3" required><?php echo $val_kfeatures;?></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label fw-bold">Specification</label>
                            <textarea class="form-control" name="specification" rows="3" required><?php echo $val_specification;?></textarea>
                        </div>

                        <div class="row mb-4 border p-3 rounded bg-white mx-0">
                            <div class="col-md-4 text-center">
                                <h6>Image 1</h6>
                                <img src="../uploads/products/<?php echo $row['Image1'];?>" class="img-thumbnail mb-2" style="max-height: 120px;">
                                <br><a href="changeimage1.php?editid=<?php echo $row['ID'];?>" class="btn btn-sm btn-outline-primary">Change Image 1</a>
                            </div>
                            <div class="col-md-4 text-center">
                                <h6>Image 2</h6>
                                <img src="../uploads/products/<?php echo $row['Image2'];?>" class="img-thumbnail mb-2" style="max-height: 120px;">
                                <br><a href="changeimage2.php?editid=<?php echo $row['ID'];?>" class="btn btn-sm btn-outline-primary">Change Image 2</a>
                            </div>
                            <div class="col-md-4 text-center">
                                <h6>Image 3</h6>
                                <img src="../uploads/products/<?php echo $row['Image3'];?>" class="img-thumbnail mb-2" style="max-height: 120px;">
                                <br><a href="changeimage3.php?editid=<?php echo $row['ID'];?>" class="btn btn-sm btn-outline-primary">Change Image 3</a>
                            </div>
                        </div>

                        <div class="mb-4 form-check">
                            <input type="checkbox" class="form-check-input" name="status" value="1" <?php if($val_status==1) echo "checked"; ?>>
                            <label class="form-check-label fw-bold">Active Status (Visible on Storefront)</label>
                        </div>
                        
                        <div class="d-flex mb-4">
                            <button type="submit" class="btn btn-primary px-5" name="submit"><i class="bi bi-save me-2"></i>Save General Info</button>
                            <a href="manage-product.php" class="btn btn-secondary px-5 ms-2">Back to Catalog</a>
                        </div>
                        <?php } ?>
                    </form>
                </div>
            </div>

            <!-- ── Variants Management Section ── -->
            <div class="card shadow-sm">
                <div class="card-header bg-dark text-white d-flex align-items-center justify-content-between">
                    <h5 class="mb-0"><i class="bi bi-tags me-2"></i>Product Variants Management</h5>
                    <button class="btn btn-sm btn-primary rounded-pill px-3" data-bs-toggle="collapse" data-bs-target="#addVariantCollapse"><i class="bi bi-plus-lg me-1"></i>Add New Variant</button>
                </div>
                <div class="card-body p-4">
                    
                    <!-- Collapse Add Variant Form -->
                    <div class="collapse mb-4 <?php echo (!empty($errors) && isset($_POST['v_color'])) ? 'show' : ''; ?>" id="addVariantCollapse">
                        <div class="card card-body border-primary">
                            <h6 class="fw-bold mb-3"><i class="bi bi-plus-circle me-2 text-primary"></i>Add a New Specification Combination</h6>
                            <form method="post" class="confirm-submit row align-items-end" data-confirm-message="Are you sure you want to add this new variant combination?">
                                <div class="col-md-2 mb-3">
                                    <label class="form-label fw-bold small">Color</label>
                                    <input type="text" class="form-control form-control-sm" name="v_color" 
                                           pattern="^[a-zA-Z\s\-\/]+$" 
                                           title="Only letters, spaces, hyphens, and forward slashes are allowed. Numbers, negative values, and special characters are not permitted." 
                                           placeholder="e.g. Space Gray" value="<?php echo isset($_POST['v_color']) ? htmlspecialchars($_POST['v_color']) : ''; ?>" required>
                                </div>
                                <div class="col-md-2 mb-3">
                                    <label class="form-label fw-bold small">RAM</label>
                                    <select class="form-select form-select-sm" name="v_ram" required>
                                        <option value="None">None</option>
                                        <?php 
                                        $rams = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'];
                                        foreach($rams as $r) {
                                            $sel = (isset($_POST['v_ram']) && $_POST['v_ram'] == $r) ? 'selected' : '';
                                            echo "<option value='$r' $sel>$r</option>";
                                        }
                                        ?>
                                    </select>
                                </div>
                                <div class="col-md-2 mb-3">
                                    <label class="form-label fw-bold small">Storage (ROM)</label>
                                    <select class="form-select form-select-sm" name="v_rom" required>
                                        <option value="None">None</option>
                                        <?php 
                                        $roms = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
                                        foreach($roms as $ro) {
                                            $sel = (isset($_POST['v_rom']) && $_POST['v_rom'] == $ro) ? 'selected' : '';
                                            echo "<option value='$ro' $sel>$ro</option>";
                                        }
                                        ?>
                                    </select>
                                </div>
                                <div class="col-md-2 mb-3">
                                    <label class="form-label fw-bold small">Price (LKR)</label>
                                    <input type="number" min="10000" class="form-control form-control-sm" name="v_price" placeholder="0" value="<?php echo isset($_POST['v_price']) ? htmlspecialchars($_POST['v_price']) : ''; ?>" required>
                                </div>
                                <div class="col-md-2 mb-3">
                                    <label class="form-label fw-bold small">Initial Stock</label>
                                    <input type="number" min="0" class="form-control form-control-sm" name="v_stock" value="<?php echo isset($_POST['v_stock']) ? htmlspecialchars($_POST['v_stock']) : '0'; ?>" required>
                                </div>
                                <div class="col-md-2 mb-3">
                                    <button type="submit" name="add_variant" class="btn btn-sm btn-success w-100"><i class="bi bi-check-circle"></i> Save Variant</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- List Current Variants -->
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th>Color</th>
                                    <th>RAM</th>
                                    <th>Storage (ROM)</th>
                                    <th>Price (LKR)</th>
                                    <th>Stock</th>
                                    <th class="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php 
                                $v_query = mysqli_query($conn, "SELECT * FROM tblproduct_variants WHERE ProductId='$eid' ORDER BY ID ASC");
                                if (mysqli_num_rows($v_query) == 0) {
                                    echo "<tr><td colspan='6' class='text-center text-muted'>No variants registered yet. Add at least one variant above.</td></tr>";
                                } else {
                                    while($v_row = mysqli_fetch_assoc($v_query)):
                                ?>
                                <tr>
                                    <!-- Inline Edit Form per row -->
                                    <form method="post" class="confirm-submit" data-confirm-message="Are you sure you want to update this variant?">
                                        <input type="hidden" name="var_id" value="<?php echo $v_row['ID']; ?>">
                                        <td><strong><?php echo htmlspecialchars($v_row['Color']); ?></strong></td>
                                        <td><span class="badge bg-secondary"><?php echo htmlspecialchars($v_row['RAM']); ?></span></td>
                                        <td><span class="badge bg-dark"><?php echo htmlspecialchars($v_row['ROM']); ?></span></td>
                                        <td>
                                            <input type="number" min="10000" class="form-control form-control-sm w-75 d-inline-block" name="v_price" value="<?php echo intval($v_row['Price']); ?>" required>
                                        </td>
                                        <td>
                                            <input type="number" min="0" class="form-control form-control-sm w-50 d-inline-block" name="v_stock" value="<?php echo intval($v_row['Stock']); ?>" required>
                                        </td>
                                        <td class="text-center">
                                            <button type="submit" name="update_variant" class="btn btn-sm btn-success me-1" title="Save Row Changes"><i class="bi bi-save"></i> Save</button>
                                            <a href="editproducts.php?editid=<?php echo $eid; ?>&delete_variant=<?php echo $v_row['ID']; ?>" class="btn btn-sm btn-danger confirm-link confirm-delete" data-confirm-message="Are you sure you want to delete this variant? This will remove all associated stock metrics!" title="Delete Variant"><i class="bi bi-trash"></i> Delete</a>
                                        </td>
                                    </form>
                                </tr>
                                <?php 
                                    endwhile;
                                }
                                ?>
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>

        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<?php include_once('../includes/components/confirmation.php'); ?>
<script>
    document.addEventListener('DOMContentLoaded', function () {
        const cnameSelect = document.querySelector('select[name="cname"]');
        const simSelect = document.querySelector('select[name="simtype"]');

        function updateSimOptions() {
            if (!cnameSelect || !simSelect) return;
            const category = cnameSelect.value;
            const noneOption = simSelect.querySelector('option[value="None"]');
            
            if (category !== 'Tablet') {
                if (noneOption) {
                    if (simSelect.value === 'None') {
                        simSelect.value = '';
                    }
                    noneOption.style.display = 'none';
                }
            } else {
                if (noneOption) {
                    noneOption.style.display = 'block';
                }
            }
        }

        if (cnameSelect && simSelect) {
            cnameSelect.addEventListener('change', updateSimOptions);
            updateSimOptions();
        }
    });
</script>
</body>
</html>