<?php
session_start();
include('../../config/db.php');
$required_roles = ['Admin', 'Sales person'];
include('../../includes/admin/auth_admin.php');

header('Content-Type: application/json');

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if (strlen($q) < 1) {
    echo json_encode([]);
    exit();
}

$like = "%$q%";
$stmt = $conn->prepare(
    "SELECT v.ID as VariantId, p.ProductName, p.ModelNumber, p.BrandName, v.Color, v.RAM, v.ROM, v.Price, v.Stock
     FROM tblproduct_variants v
     JOIN tblproducts p ON v.ProductId = p.ID
     WHERE p.Status = 1 AND v.Stock > 0
       AND (p.ProductName LIKE ? OR p.BrandName LIKE ? OR p.ModelNumber LIKE ? OR v.Color LIKE ?)
     ORDER BY p.ProductName ASC
     LIMIT 20"
);
$stmt->bind_param("ssss", $like, $like, $like, $like);
$stmt->execute();
$result = $stmt->get_result();

$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = [
        'id'    => (int)$row['VariantId'],
        'name'  => $row['ProductName'] . ' - ' . $row['Color'] . ' (' . $row['ROM'] . ' / ' . $row['RAM'] . ' RAM)',
        'model' => $row['ModelNumber'],
        'brand' => $row['BrandName'],
        'price' => (float)$row['Price'],
        'stock' => (int)$row['Stock']
    ];
}
$stmt->close();

echo json_encode($products);
