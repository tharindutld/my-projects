<?php
session_start();
header('Content-Type: application/json');

include(__DIR__ . '/../../config/db.php');

if (empty($_SESSION['imsaid']) && empty($_SESSION['aid'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized session. Please log in again.']);
    exit();
}

$admin_role = $_SESSION['admin_role'] ?? '';
if ($admin_role !== 'Admin') {
    echo json_encode(['success' => false, 'message' => 'Access Denied: Only Admins can manually adjust stock levels.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

$vid   = isset($_POST['variant_id'])    ? (int)$_POST['variant_id']   : 0;
$qty   = isset($_POST['qty_adjust'])    ? (int)$_POST['qty_adjust']   : 0;
$mtype = isset($_POST['movement_type']) ? trim($_POST['movement_type']) : '';
$notes = isset($_POST['notes'])         ? trim($_POST['notes'])         : '';

if ($vid <= 0 || $qty === 0 || empty($mtype)) {
    echo json_encode(['success' => false, 'message' => 'Invalid input data.']);
    exit();
}

$esc_vid = (int)$vid;
$var_q = mysqli_query($conn, "SELECT p.ProductName, v.Color, v.RAM, v.ROM, v.Stock FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.ID='$esc_vid'");
$var_row = mysqli_fetch_assoc($var_q);

if (!$var_row) {
    echo json_encode(['success' => false, 'message' => 'Variant not found.']);
    exit();
}

$new_stock = $var_row['Stock'] + $qty;
if ($new_stock < 0) {
    $qty = -(int)$var_row['Stock'];
    $new_stock = 0;
}

$upd = mysqli_query($conn, "UPDATE tblproduct_variants SET Stock='$new_stock' WHERE ID='$esc_vid'");
if ($upd) {
    $notes_escaped = mysqli_real_escape_string($conn, $notes);
    $mtype_escaped = mysqli_real_escape_string($conn, $mtype);
    mysqli_query($conn, "INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES ('$esc_vid', '$qty', '$mtype_escaped', '$notes_escaped')");
    
    $desc = $var_row['ProductName'] . " - " . $var_row['Color'] . " (" . $var_row['ROM'] . " / " . $var_row['RAM'] . ")";
    echo json_encode([
        'success'   => true,
        'new_stock' => $new_stock,
        'message'   => 'Stock for ' . $desc . ' updated to ' . $new_stock . ' units.'
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database update failed: ' . mysqli_error($conn)]);
}
