<?php
session_start();
include('../../config/db.php');
include('../../includes/admin/auth_admin.php');
$admin_role = $_SESSION['admin_role'];
$my_id = (int)$_SESSION['imsaid'];

header('Content-Type: application/json');

$data = [];

if ($admin_role === 'Technician') {
    $data['tech_pending']   = $conn->query("SELECT COUNT(*) FROM tbl_repairs WHERE TechnicianId=$my_id AND Status='Pending'")->fetch_row()[0] ?? 0;
    $data['tech_inprog']    = $conn->query("SELECT COUNT(*) FROM tbl_repairs WHERE TechnicianId=$my_id AND Status='In-progress'")->fetch_row()[0] ?? 0;
    $data['tech_completed'] = $conn->query("SELECT COUNT(*) FROM tbl_repairs WHERE TechnicianId=$my_id AND Status='Completed'")->fetch_row()[0] ?? 0;
    $data['tech_total']     = $conn->query("SELECT COUNT(*) FROM tbl_repairs WHERE TechnicianId=$my_id")->fetch_row()[0] ?? 0;
} else {
    $data['brandcount']     = $conn->query("SELECT COUNT(*) FROM tblbrand WHERE Status=1")->fetch_row()[0] ?? 0;
    $data['productcount']   = $conn->query("SELECT COUNT(*) FROM tblproducts WHERE Status=1")->fetch_row()[0] ?? 0;
    $data['totuser']        = $conn->query("SELECT COUNT(*) FROM tbluser")->fetch_row()[0] ?? 0;
    $data['staffcount']     = $conn->query("SELECT COUNT(*) FROM staff_users WHERE status='Active'")->fetch_row()[0] ?? 0;
    $data['ordercount']     = $conn->query("SELECT COUNT(*) FROM tbl_order_master")->fetch_row()[0] ?? 0;
    $data['low_stock_count'] = $conn->query("SELECT COUNT(*) FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock <= 5 AND v.Stock > 0 AND p.Status=1")->fetch_row()[0] ?? 0;
    $data['out_stock_count'] = $conn->query("SELECT COUNT(*) FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock = 0 AND p.Status=1")->fetch_row()[0] ?? 0;
    if ($admin_role === 'Admin') {
        $data['salescount'] = $conn->query("SELECT SUM(TotalAmount) FROM tbl_order_master WHERE OrderStatus='Completed'")->fetch_row()[0] ?? 0;
    }
}

echo json_encode($data);
