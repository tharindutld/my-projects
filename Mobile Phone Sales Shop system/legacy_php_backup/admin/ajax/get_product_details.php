<?php
session_start();
header('Content-Type: application/json');
include(__DIR__ . '/../../config/db.php');

if (empty($_SESSION['imsaid']) && empty($_SESSION['aid'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

if (!function_exists('format_combined_device_name')) {
    function format_combined_device_name($brand, $product) {
        $brand = trim($brand ?? '');
        $product = trim($product ?? '');
        if (empty($product)) return $brand;
        if (empty($brand)) return $product;
        
        $cleanProduct = preg_replace('/^' . preg_quote($brand, '/') . '\s*/i', '', $product);
        return trim($brand . ' ' . $cleanProduct);
    }
}

$action = $_GET['action'] ?? '';

// Action 1: Search products/variants by brand, model, product name or IMEI number
if ($action === 'search') {
    $q = trim($_GET['q'] ?? '');
    if (empty($q)) {
        echo json_encode(['success' => true, 'results' => []]);
        exit();
    }

    $esc_q = mysqli_real_escape_string($conn, $q);
    $like_q = "%$esc_q%";

    $results = [];

    // 1. Search by IMEI Number or Serial Number in tbl_stock_imeis
    $imei_sql = "SELECT i.IMEI, i.SerialNumber, i.Status as ImeiStatus, v.ID as VariantId, v.Color, v.RAM, v.ROM, v.Price, 
                        p.ID as ProductId, p.ProductName, p.BrandName, p.ModelNumber, p.SimType 
                 FROM tbl_stock_imeis i
                 JOIN tbl_stock_batches b ON i.BatchId = b.ID
                 JOIN tblproduct_variants v ON b.VariantId = v.ID
                 JOIN tblproducts p ON v.ProductId = p.ID
                 WHERE i.IMEI LIKE '$like_q' OR i.SerialNumber LIKE '$like_q' LIMIT 10";
    $imei_res = mysqli_query($conn, $imei_sql);
    if ($imei_res) {
        while ($row = mysqli_fetch_assoc($imei_res)) {
            $displayName = format_combined_device_name($row['BrandName'], $row['ProductName']);
            $identifier = !empty($row['IMEI']) ? $row['IMEI'] : $row['SerialNumber'];
            $labelPrefix = !empty($row['IMEI']) ? "IMEI: " : "Serial: ";
            $results[] = [
                'type' => 'imei',
                'label' => $labelPrefix . $identifier . " — " . $displayName . " (" . $row['Color'] . ", " . $row['RAM'] . "/" . $row['ROM'] . ")",
                'variant_id' => $row['VariantId'],
                'product_name' => $row['ProductName'],
                'brand' => $row['BrandName'],
                'display_name' => $displayName,
                'model_number' => $row['ModelNumber'],
                'color' => $row['Color'],
                'ram' => $row['RAM'],
                'storage' => $row['ROM'],
                'sim_type' => $row['SimType'],
                'price' => $row['Price'],
                'imei' => $identifier
            ];
        }
    }

    // 2. Search by Product Name, Brand, or Model Number
    $prod_sql = "SELECT v.ID as VariantId, v.Color, v.RAM, v.ROM, v.Price, 
                        p.ID as ProductId, p.ProductName, p.BrandName, p.ModelNumber, p.SimType 
                 FROM tblproduct_variants v
                 JOIN tblproducts p ON v.ProductId = p.ID
                 WHERE p.ProductName LIKE '$like_q' OR p.BrandName LIKE '$like_q' OR p.ModelNumber LIKE '$like_q' 
                 LIMIT 15";
    $prod_res = mysqli_query($conn, $prod_sql);
    if ($prod_res) {
        while ($row = mysqli_fetch_assoc($prod_res)) {
            $displayName = format_combined_device_name($row['BrandName'], $row['ProductName']);
            $results[] = [
                'type' => 'variant',
                'label' => $displayName . " (Model: " . $row['ModelNumber'] . ", " . $row['Color'] . ", " . $row['RAM'] . "/" . $row['ROM'] . ")",
                'variant_id' => $row['VariantId'],
                'product_name' => $row['ProductName'],
                'brand' => $row['BrandName'],
                'display_name' => $displayName,
                'model_number' => $row['ModelNumber'],
                'color' => $row['Color'],
                'ram' => $row['RAM'],
                'storage' => $row['ROM'],
                'sim_type' => $row['SimType'],
                'price' => $row['Price'],
                'imei' => ''
            ];
        }
    }

    echo json_encode(['success' => true, 'results' => $results]);
    exit();
}

// Action 2: Get specific variant details by variant_id
if ($action === 'get_variant') {
    $vid = (int)($_GET['variant_id'] ?? 0);
    if ($vid <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid Variant ID']);
        exit();
    }

    $sql = "SELECT v.ID as VariantId, v.Color, v.RAM, v.ROM, v.Price, 
                   p.ID as ProductId, p.ProductName, p.BrandName, p.ModelNumber, p.SimType 
            FROM tblproduct_variants v
            JOIN tblproducts p ON v.ProductId = p.ID
            WHERE v.ID = $vid";
    $res = mysqli_query($conn, $sql);
    if ($res && $row = mysqli_fetch_assoc($res)) {
        // Fetch registered IMEIs/Serials for this variant
        $imeis = [];
        $imei_q = mysqli_query($conn, "SELECT i.IMEI, i.SerialNumber, i.Status FROM tbl_stock_imeis i JOIN tbl_stock_batches b ON i.BatchId = b.ID WHERE b.VariantId = $vid LIMIT 20");
        if ($imei_q) {
            while ($im = mysqli_fetch_assoc($imei_q)) {
                $imeis[] = !empty($im['IMEI']) ? $im['IMEI'] : $im['SerialNumber'];
            }
        }

        echo json_encode([
            'success' => true,
            'variant_id' => $row['VariantId'],
            'product_name' => $row['ProductName'],
            'brand' => $row['BrandName'],
            'model_number' => $row['ModelNumber'],
            'color' => $row['Color'],
            'ram' => $row['RAM'],
            'storage' => $row['ROM'],
            'sim_type' => $row['SimType'],
            'price' => $row['Price'],
            'available_imeis' => $imeis
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Variant not found']);
    }
    exit();
}

// Action 3: Get products by brand name
if ($action === 'get_brand_products') {
    $brand = trim($_GET['brand'] ?? '');
    if (empty($brand)) {
        echo json_encode(['success' => true, 'products' => []]);
        exit();
    }
    $esc_brand = mysqli_real_escape_string($conn, $brand);
    $res = mysqli_query($conn, "SELECT ID, ProductName, ModelNumber FROM tblproducts WHERE BrandName = '$esc_brand' ORDER BY ProductName ASC");
    $products = [];
    while ($row = mysqli_fetch_assoc($res)) {
        $products[] = [
            'id' => $row['ID'],
            'product_name' => $row['ProductName'],
            'model_number' => $row['ModelNumber']
        ];
    }
    echo json_encode(['success' => true, 'products' => $products]);
    exit();
}

// Action 4: Get IMEIs for a product
if ($action === 'get_product_imeis') {
    $product_id = intval($_GET['product_id'] ?? 0);
    $product_name = trim($_GET['product_name'] ?? '');
    
    $where = "";
    if ($product_id > 0) {
        $where = "p.ID = $product_id";
    } elseif (!empty($product_name)) {
        $esc_name = mysqli_real_escape_string($conn, $product_name);
        $where = "p.ProductName = '$esc_name'";
    }
    
    if (empty($where)) {
        echo json_encode(['success' => true, 'imeis' => []]);
        exit();
    }
    
    $sql = "SELECT DISTINCT i.IMEI, i.SerialNumber, i.Status, v.Color, v.RAM, v.ROM 
            FROM tbl_stock_imeis i 
            JOIN tbl_stock_batches b ON i.BatchId = b.ID 
            JOIN tblproduct_variants v ON b.VariantId = v.ID 
            JOIN tblproducts p ON v.ProductId = p.ID 
            WHERE $where 
            ORDER BY i.ID DESC LIMIT 50";
    $res = mysqli_query($conn, $sql);
    $imeis = [];
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $identifier = !empty($row['IMEI']) ? $row['IMEI'] : $row['SerialNumber'];
            $imeis[] = [
                'imei' => $identifier,
                'status' => $row['Status'],
                'specs' => $row['Color'] . ' (' . $row['ROM'] . ' / ' . $row['RAM'] . ')'
            ];
        }
    }
    echo json_encode(['success' => true, 'imeis' => $imeis]);
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
