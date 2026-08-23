<?php
session_start();
include('../../config/db.php');
$required_roles = ['Admin', 'Sales person', 'Technician'];
include('../../includes/admin/auth_admin.php');
$admin_role = $_SESSION['admin_role'];

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

$repair_id = isset($_POST['repair_id']) ? (int)$_POST['repair_id'] : 0;
$status    = isset($_POST['status']) ? trim($_POST['status']) : '';

$allowed_statuses = ['Pending', 'In-progress', 'Completed', 'Cancelled'];
if ($repair_id <= 0 || !in_array($status, $allowed_statuses)) {
    echo json_encode(['success' => false, 'message' => 'Invalid data.']);
    exit();
}

// Fetch repair to check ownership for Technician
$fetch = $conn->prepare("SELECT TechnicianId FROM tbl_repairs WHERE ID = ?");
$fetch->bind_param("i", $repair_id);
$fetch->execute();
$row = $fetch->get_result()->fetch_assoc();
$fetch->close();

if (!$row) {
    echo json_encode(['success' => false, 'message' => 'Repair not found.']);
    exit();
}

// Technician can only update their own jobs
if ($admin_role === 'Technician' && (int)$row['TechnicianId'] !== (int)$_SESSION['imsaid']) {
    echo json_encode(['success' => false, 'message' => 'Access denied.']);
    exit();
}

$stmt = $conn->prepare("UPDATE tbl_repairs SET Status = ? WHERE ID = ?");
$stmt->bind_param("si", $status, $repair_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'status' => $status]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database update failed.']);
}
$stmt->close();
