<?php
session_start();
header('Content-Type: application/json');

include('../../config/db.php');

$required_roles = ['Admin', 'Sales person', 'Technician'];
if (!isset($_SESSION['admin_role']) || !in_array($_SESSION['admin_role'], $required_roles)) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

$action = $_GET['action'] ?? $_POST['action'] ?? 'get';

if ($action === 'search') {
    $term = trim($_GET['term'] ?? '');
    if (strlen($term) < 2) {
        echo json_encode(['success' => true, 'results' => []]);
        exit();
    }

    $term_esc = "%$term%";
    $stmt = $conn->prepare("SELECT i.IMEI, i.SerialNumber, i.Status, p.ProductName, p.BrandName, b.BatchNumber, v.Color, v.RAM, v.ROM 
                            FROM tbl_stock_imeis i
                            JOIN tbl_stock_batches b ON i.BatchId = b.ID
                            JOIN tblproduct_variants v ON b.VariantId = v.ID
                            JOIN tblproducts p ON v.ProductId = p.ID
                            WHERE i.IMEI LIKE ? OR i.SerialNumber LIKE ? OR p.ProductName LIKE ? OR b.BatchNumber LIKE ?
                            ORDER BY i.ID DESC LIMIT 15");
    $stmt->bind_param("ssss", $term_esc, $term_esc, $term_esc, $term_esc);
    $stmt->execute();
    $res = $stmt->get_result();

    $results = [];
    while ($row = $res->fetch_assoc()) {
        $identifier = !empty($row['IMEI']) ? $row['IMEI'] : $row['SerialNumber'];
        $results[] = [
            'imei' => $identifier,
            'serial_no' => $row['SerialNumber'],
            'status' => $row['Status'],
            'product_name' => $row['ProductName'],
            'brand_name' => $row['BrandName'],
            'batch_number' => $row['BatchNumber'],
            'specs' => $row['Color'] . ' (' . $row['ROM'] . ' / ' . $row['RAM'] . ' RAM)',
            'label' => $identifier . ' — ' . $row['ProductName'] . ' (' . $row['Color'] . ') [' . $row['Status'] . ']'
        ];
    }
    $stmt->close();

    echo json_encode(['success' => true, 'results' => $results]);
    exit();
}

// Default action = 'get' (Fetch full details for single IMEI/SerialNumber)
$imei = trim($_GET['imei'] ?? $_POST['imei'] ?? '');

if (empty($imei)) {
    echo json_encode(['success' => false, 'message' => 'Please provide an IMEI or Serial number to search.']);
    exit();
}

$query = "SELECT i.ID as ImeiId, i.IMEI, i.SerialNumber, i.Status as ImeiStatus, 
                 b.ID as BatchId, b.BatchNumber, b.Dealer, b.PurchaseDate, b.CostPrice, b.SellingPrice,
                 v.ID as VariantId, v.Color, v.RAM, v.ROM,
                 p.ID as ProductId, p.ProductName, p.BrandName, p.ModelNumber, p.Display, p.SimType,
                 om.OrderNumber, om.OrderDate
          FROM tbl_stock_imeis i
          JOIN tbl_stock_batches b ON i.BatchId = b.ID
          JOIN tblproduct_variants v ON b.VariantId = v.ID
          JOIN tblproducts p ON v.ProductId = p.ID
          LEFT JOIN tbl_order_items oi ON (oi.IMEINumber = i.IMEI OR oi.IMEINumber = i.SerialNumber)
          LEFT JOIN tbl_order_master om ON oi.OrderMasterId = om.ID
          WHERE i.IMEI = ? OR i.SerialNumber = ?
          LIMIT 1";

$stmt = $conn->prepare($query);
$stmt->bind_param("ss", $imei, $imei);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $data = [
        'imei' => $row['IMEI'],
        'serial_no' => $row['SerialNumber'],
        'status' => $row['ImeiStatus'],
        'product_name' => $row['ProductName'],
        'brand_name' => $row['BrandName'],
        'model_number' => $row['ModelNumber'],
        'display' => $row['Display'] ?? 'N/A',
        'sim_type' => $row['SimType'] ?? 'N/A',
        'color' => $row['Color'],
        'ram' => $row['RAM'],
        'rom' => $row['ROM'],
        'batch_number' => $row['BatchNumber'],
        'dealer' => $row['Dealer'] ?: 'Not Specified',
        'purchase_date' => $row['PurchaseDate'] ? date('d M Y', strtotime($row['PurchaseDate'])) : 'N/A',
        'cost_price' => number_format($row['CostPrice'], 2),
        'selling_price' => number_format($row['SellingPrice'], 2),
        'order_number' => $row['OrderNumber'] ?: null,
        'order_date' => $row['OrderDate'] ? date('d M Y', strtotime($row['OrderDate'])) : null
    ];
    echo json_encode(['success' => true, 'data' => $data]);
} else {
    echo json_encode(['success' => false, 'message' => "No device record found for IMEI/Serial '<strong>" . htmlspecialchars($imei) . "</strong>'."]);
}

$stmt->close();
