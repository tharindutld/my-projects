<?php
session_start();
header('Content-Type: application/json');
include(__DIR__ . '/../../config/db.php');

if (empty($_SESSION['imsaid']) && empty($_SESSION['aid'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'add') {
    $name = trim($_POST['name'] ?? '');
    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Supplier name cannot be empty.']);
        exit();
    }

    if (!preg_match("/^[a-zA-Z\s]+$/", $name)) {
        echo json_encode(['success' => false, 'message' => 'Supplier name can only contain letters and spaces (no numbers, minus, decimals, or special characters).']);
        exit();
    }

    $esc_name = mysqli_real_escape_string($conn, $name);
    
    // Check if supplier already exists
    $check = mysqli_query($conn, "SELECT ID FROM tblsuppliers WHERE LOWER(SupplierName) = LOWER('$esc_name')");
    if ($check && mysqli_num_rows($check) > 0) {
        echo json_encode(['success' => false, 'message' => 'Supplier already exists.']);
        exit();
    }

    $ins = mysqli_query($conn, "INSERT INTO tblsuppliers (SupplierName) VALUES ('$esc_name')");
    if ($ins) {
        echo json_encode(['success' => true, 'message' => 'Supplier added successfully.', 'name' => $name]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add supplier: ' . mysqli_error($conn)]);
    }
    exit();
}

if ($action === 'remove') {
    $name = trim($_POST['name'] ?? '');
    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Supplier name cannot be empty.']);
        exit();
    }

    $esc_name = mysqli_real_escape_string($conn, $name);
    $del = mysqli_query($conn, "DELETE FROM tblsuppliers WHERE LOWER(SupplierName) = LOWER('$esc_name')");
    if ($del) {
        echo json_encode(['success' => true, 'message' => 'Supplier removed successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to remove supplier: ' . mysqli_error($conn)]);
    }
    exit();
}

if ($action === 'get') {
    $suppliers = [];
    $res = mysqli_query($conn, "SELECT SupplierName FROM tblsuppliers ORDER BY SupplierName ASC");
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $suppliers[] = $row['SupplierName'];
        }
    }
    echo json_encode(['success' => true, 'suppliers' => $suppliers]);
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
