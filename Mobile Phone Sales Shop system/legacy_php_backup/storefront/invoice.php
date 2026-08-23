<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

$is_admin = isset($_SESSION['imsaid']) && !empty($_SESSION['imsaid']);
$is_customer = isset($_SESSION['msmsuid']) && !empty($_SESSION['msmsuid']);

if (!$is_admin && !$is_customer) {
    header("Location: login.php");
    exit();
}

if (!isset($_GET['oid']) || empty($_GET['oid'])) {
    die("Invalid Order ID.");
}

$oid = (int)$_GET['oid'];
$userid = isset($_SESSION['msmsuid']) ? $_SESSION['msmsuid'] : 0;

// Fetch order master
$order_query = mysqli_query($conn,
    "SELECT m.ID, m.OrderNumber, m.TotalAmount, m.PaymentMethod, m.TransactionDetails, m.OrderStatus, m.OrderDate, m.UserId,
            m.ShippingName, m.ShippingPhone, m.ShippingCountry, m.ShippingAddress, m.ShippingPostalCode,
            m.BillingName, m.BillingPhone, m.BillingCountry, m.BillingAddress, m.BillingPostalCode,
            u.FirstName, u.LastName, u.Email, u.MobileNumber
     FROM tbl_order_master m
     JOIN tbluser u ON m.UserId = u.ID
     WHERE m.ID = '$oid'"
);

if (mysqli_num_rows($order_query) == 0) {
    die("Order not found.");
}

$order = mysqli_fetch_assoc($order_query);

// Authorization check for customer
if (!$is_admin && $order['UserId'] != $userid) {
    die("Unauthorized access to this invoice.");
}

// Fetch order items with original variant catalog price
$items_query = mysqli_query($conn,
    "SELECT oi.ProductQty, oi.ProductPrice, v.Price as OriginalPrice, v.Color, v.RAM, v.ROM, p.ProductName, p.BrandName, p.ModelNumber
     FROM tbl_order_items oi
     JOIN tblproduct_variants v ON oi.VariantId = v.ID
     JOIN tblproducts p ON v.ProductId = p.ID
     WHERE oi.OrderMasterId = '$oid'"
);

$items = [];
$catalog_subtotal = 0;
$items_subtotal = 0;
$product_discount = 0;

while($row = mysqli_fetch_assoc($items_query)) {
    $items[] = $row;
    $orig_unit = (float)($row['OriginalPrice'] ?? $row['ProductPrice']);
    $sold_unit = (float)$row['ProductPrice'];
    $qty = (int)$row['ProductQty'];
    
    $catalog_subtotal += ($orig_unit * $qty);
    $items_subtotal += ($sold_unit * $qty);
}

if ($catalog_subtotal > $items_subtotal) {
    $product_discount = $catalog_subtotal - $items_subtotal;
}

// Parse Loyalty Points Redemption discount from TransactionDetails
$loyalty_discount = 0;
$loyalty_points_redeemed = 0;
if (!empty($order['TransactionDetails'])) {
    if (preg_match('/Redeemed\s+(\d+)\s+Loyalty\s+Pts:\s+Rs\.\s*([\d\.\,]+)\s+Discount/i', $order['TransactionDetails'], $matches)) {
        $loyalty_points_redeemed = (int)$matches[1];
        $loyalty_discount = (float)str_replace(',', '', $matches[2]);
    }
}
if ($loyalty_discount == 0 && $items_subtotal > (float)$order['TotalAmount']) {
    $loyalty_discount = $items_subtotal - (float)$order['TotalAmount'];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - <?php echo htmlspecialchars($order['OrderNumber']); ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; background: #eaeef3; color: #333; }
        .invoice-box { background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 5px 25px rgba(0,0,0,0.08); max-width: 850px; margin: 40px auto; }
        .invoice-header { border-bottom: 2px solid #f1f3f7; padding-bottom: 20px; margin-bottom: 30px; }
        .company-logo { font-size: 26px; font-weight: 700; color: #0d6efd; text-decoration: none; }
        .invoice-title { font-size: 32px; font-weight: 700; color: #212529; text-transform: uppercase; letter-spacing: 1px; }
        .table th { background-color: #f8f9fa; border-top: none; font-weight: 600; font-size: 13px; text-transform: uppercase; color: #6c757d; }
        .table td { vertical-align: middle; }
        .text-primary-dark { color: #0056d2; }
        
        /* Print styling overrides */
        @media print {
            body { background: none; color: #000; padding: 0; margin: 0; }
            .invoice-box { box-shadow: none; border: none; padding: 0; margin: 0; max-width: 100%; }
            .no-print { display: none !important; }
            .card { border: none !important; }
        }
    </style>
</head>
<body class="<?php echo isset($_GET['print']) ? 'bg-white' : ''; ?>">

<div class="container">
    
    <?php
    $back_url = 'my-orders.php';
    if (isset($_GET['isAdmin']) && $_GET['isAdmin'] == '1') {
        if (isset($_GET['uid']) && $_GET['uid'] > 0) {
            $back_url = '../admin/user-orders.php?uid=' . (int)$_GET['uid'];
        } else {
            $back_url = '../admin/orders.php';
        }
    }
    ?>
    <!-- Action buttons (visible on screen only) -->
    <div class="no-print d-flex justify-content-between align-items-center my-4 mx-auto" style="max-width: 850px; margin: 20px auto;">
        <a href="<?php echo $back_url; ?>" class="btn btn-light rounded-pill px-4">
            <i class="fa-solid fa-arrow-left me-2"></i>Back to Orders
        </a>
        <div>
            <button onclick="window.print();" class="btn btn-primary rounded-pill px-4 shadow-sm me-2">
                <i class="fa-solid fa-print me-2"></i>Print Invoice
            </button>
        </div>
    </div>
    
    <!-- Invoice Container -->
    <div class="invoice-box">
        
        <!-- Header Section -->
        <div class="invoice-header d-flex justify-content-between align-items-start flex-wrap">
            <div>
                <span class="company-logo"><i class="fa-solid fa-bag-heart me-2"></i>Mobile Store</span>
                <p class="text-muted small mt-2">
                    123 Galle Road, Colombo 03, Sri Lanka<br>
                    Phone: +94 11 234 5678 | Email: support@mobilestore.com
                </p>
            </div>
            <div class="text-md-end">
                <span class="invoice-title d-block text-primary">Invoice</span>
                <span class="text-muted d-block small">Invoice Number: <strong class="text-dark"><?php echo htmlspecialchars($order['OrderNumber']); ?></strong></span>
                <span class="text-muted d-block small">Date: <strong class="text-dark"><?php echo date('M d, Y h:i A', strtotime($order['OrderDate'])); ?></strong></span>
                <span class="badge <?php echo ($order['OrderStatus'] == 'Completed') ? 'bg-success' : 'bg-warning'; ?> mt-2"><?php echo $order['OrderStatus']; ?></span>
            </div>
        </div>
        
        <!-- Billing & Shipping Details Section -->
        <div class="row mb-5">
            <div class="col-sm-6 mb-3 mb-sm-0">
                <h6 class="text-muted text-uppercase small mb-2 font-weight-bold">Billed To (Billing Address):</h6>
                <h6 class="fw-bold mb-1"><?php echo htmlspecialchars($order['BillingName'] ?? ($order['FirstName'] . ' ' . $order['LastName'])); ?></h6>
                <p class="text-muted small mb-0">
                    Address: <?php echo htmlspecialchars($order['BillingAddress'] ?? ''); ?><br>
                    Postal Code: <?php echo htmlspecialchars($order['BillingPostalCode'] ?? ''); ?><br>
                    Country: <?php echo htmlspecialchars($order['BillingCountry'] ?? ''); ?><br>
                    Phone: <?php echo htmlspecialchars($order['BillingPhone'] ?? $order['MobileNumber']); ?><br>
                    Email: <?php echo htmlspecialchars($order['Email']); ?>
                </p>
            </div>
            <div class="col-sm-6">
                <h6 class="text-muted text-uppercase small mb-2 font-weight-bold text-sm-start text-md-end">Shipped To (Shipping Address):</h6>
                <div class="text-sm-start text-md-end">
                    <h6 class="fw-bold mb-1"><?php echo htmlspecialchars($order['ShippingName'] ?? ($order['FirstName'] . ' ' . $order['LastName'])); ?></h6>
                    <p class="text-muted small mb-0">
                        Address: <?php echo htmlspecialchars($order['ShippingAddress'] ?? ''); ?><br>
                        Postal Code: <?php echo htmlspecialchars($order['ShippingPostalCode'] ?? ''); ?><br>
                        Country: <?php echo htmlspecialchars($order['ShippingCountry'] ?? ''); ?><br>
                        Phone: <?php echo htmlspecialchars($order['ShippingPhone'] ?? $order['MobileNumber']); ?>
                    </p>
                </div>
            </div>
        </div>
        
        <!-- Items Table -->
        <div class="table-responsive mb-4">
            <table class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Product / Model</th>
                        <th class="text-center">Unit Price</th>
                        <th class="text-center">Quantity</th>
                        <th class="text-end">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <?php $cnt = 1; foreach($items as $item): ?>
                        <tr>
                            <td><?php echo $cnt; ?></td>
                            <td>
                                <h6 class="mb-0 fw-semibold" style="font-size: 0.95rem;"><?php echo htmlspecialchars($item['ProductName']); ?></h6>
                                <span class="text-muted small">
                                    <?php echo htmlspecialchars($item['BrandName']); ?> &bull; <?php echo htmlspecialchars($item['ModelNumber']); ?> &bull; 
                                    <?php echo htmlspecialchars($item['Color']); ?>
                                    <?php if(!empty($item['ROM']) || !empty($item['RAM'])): ?>
                                        (<?php echo htmlspecialchars($item['ROM']); ?> / <?php echo htmlspecialchars($item['RAM']); ?>)
                                    <?php endif; ?>
                                </span>
                            </td>
                            <td class="text-center">
                                <?php if ($item['OriginalPrice'] > $item['ProductPrice']): ?>
                                    <span class="text-decoration-line-through text-muted small me-1">Rs. <?php echo number_format($item['OriginalPrice'], 2); ?></span><br>
                                <?php endif; ?>
                                <span class="fw-semibold text-dark">Rs. <?php echo number_format($item['ProductPrice'], 2); ?></span>
                            </td>
                            <td class="text-center"><?php echo $item['ProductQty']; ?></td>
                            <td class="text-end fw-semibold text-dark">Rs. <?php echo number_format($item['ProductPrice'] * $item['ProductQty'], 2); ?></td>
                        </tr>
                    <?php $cnt++; endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <!-- Summary Section -->
        <div class="row justify-content-end mb-4">
            <div class="col-md-8 col-lg-6">
                <div class="p-3 bg-light rounded-3 border">
                    <!-- Items Original Subtotal -->
                    <div class="d-flex justify-content-between mb-2 text-muted small">
                        <span>Items Subtotal</span>
                        <span class="text-nowrap">Rs. <?php echo number_format($catalog_subtotal, 2); ?></span>
                    </div>

                    <!-- Product / Promotional Discount -->
                    <?php if ($product_discount > 0): ?>
                    <div class="d-flex justify-content-between mb-2 text-danger small">
                        <span><i class="fa-solid fa-tag me-1"></i> Product / Promo Discount</span>
                        <span class="text-nowrap">- Rs. <?php echo number_format($product_discount, 2); ?></span>
                    </div>
                    <div class="d-flex justify-content-between mb-2 text-muted small fw-semibold">
                        <span>Subtotal (After Product Discount)</span>
                        <span class="text-nowrap">Rs. <?php echo number_format($items_subtotal, 2); ?></span>
                    </div>
                    <?php endif; ?>

                    <!-- Loyalty Points Discount -->
                    <?php if ($loyalty_discount > 0): ?>
                    <div class="d-flex justify-content-between mb-2 text-primary small fw-semibold">
                        <span><i class="fa-solid fa-crown text-warning me-1"></i> Loyalty Points Redeemed <?php echo ($loyalty_points_redeemed > 0) ? "({$loyalty_points_redeemed} Pts)" : ""; ?></span>
                        <span class="text-danger text-nowrap">- Rs. <?php echo number_format($loyalty_discount, 2); ?></span>
                    </div>
                    <?php endif; ?>

                    <!-- Shipping -->
                    <div class="d-flex justify-content-between mb-2 text-muted small">
                        <span>Shipping & Handling</span>
                        <span class="text-success fw-semibold text-nowrap">Free</span>
                    </div>

                    <hr class="my-2">

                    <!-- Grand Total -->
                    <div class="d-flex justify-content-between fw-bold text-primary-dark fs-5">
                        <span>Grand Total</span>
                        <span class="text-nowrap">Rs. <?php echo number_format($order['TotalAmount'], 2); ?></span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Payment Info Section -->
        <div class="card bg-light border-0 p-3 rounded-3 mt-4">
            <div class="row">
                <div class="col-sm-4 mb-2 mb-sm-0">
                    <span class="text-muted small d-block">Payment Method:</span>
                    <strong class="text-dark" style="font-size: 0.95rem;"><?php echo htmlspecialchars($order['PaymentMethod']); ?></strong>
                </div>
                <div class="col-sm-8">
                    <span class="text-muted small d-block">Transaction Details:</span>
                    <strong class="text-dark small" style="font-size: 0.9rem;"><?php echo htmlspecialchars($order['TransactionDetails']); ?></strong>
                </div>
            </div>
        </div>
        
        <div class="text-center text-muted mt-5 pt-4 border-top" style="font-size: 11px;">
            Thank you for shopping with us! This is a system-generated invoice.
        </div>
        
    </div>
</div>

<!-- Print invoice script if request print parameter exists -->
<?php if (isset($_GET['print']) && $_GET['print'] == '1'): ?>
<script>
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.print();
        }, 500);
    });
</script>
<?php endif; ?>
</body>
</html>
