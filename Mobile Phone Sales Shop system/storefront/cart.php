<?php
session_start();
error_reporting(0);
include('../config/db.php');
include_once('../includes/components/pricing_helper.php');

if(empty($_SESSION['msmsuid'])) {
    header('Location: login.php');
    exit();
}

$userid = $_SESSION['msmsuid'];

// Remove item from cart
if(isset($_GET['remove'])) {
    $rid = (int)$_GET['remove'];
    mysqli_query($conn, "DELETE FROM tblorders WHERE ID='$rid' AND UserId='$userid'");
    $_SESSION['success_msg'] = "Item removed from cart.";
    header("Location: cart.php");
    exit();
}

// Update item quantity in cart
if(isset($_POST['qty']) && isset($_POST['oid'])) {
    $oid = (int)$_POST['oid'];
    $new_qty = (int)$_POST['qty'];
    
    if($new_qty > 0) {
        $chk_q = mysqli_query($conn, "SELECT v.Stock FROM tblorders o JOIN tblproduct_variants v ON o.VariantId = v.ID WHERE o.ID='$oid' AND o.UserId='$userid'");
        $chk_row = mysqli_fetch_assoc($chk_q);
        $avail_stock = (int)($chk_row['Stock'] ?? 0);
        
        if($new_qty > $avail_stock) {
            $_SESSION['error_msg'] = "Cannot increase quantity beyond available stock ({$avail_stock} available).";
            header("Location: cart.php");
            exit();
        }
        mysqli_query($conn, "UPDATE tblorders SET Quantity='$new_qty' WHERE ID='$oid' AND UserId='$userid'");
    } else {
        mysqli_query($conn, "DELETE FROM tblorders WHERE ID='$oid' AND UserId='$userid'");
    }
    $_SESSION['success_msg'] = "Cart updated successfully.";
    header("Location: cart.php");
    exit();
}

// Fetch cart items with product details
$cart_query = mysqli_query($conn,
    "SELECT o.ID as OrderID, o.Quantity, v.ID as VariantID, v.Color, v.RAM, v.ROM, v.Price as Price, v.Stock as Stock, 
            p.ID as PID, p.ProductName, p.BrandName, p.ModelNumber, p.DiscountPercent, p.DiscountStartDate, p.DiscountEndDate, p.Image1
     FROM tblorders o
     JOIN tblproduct_variants v ON o.VariantId = v.ID
     JOIN tblproducts p ON v.ProductId = p.ID
     WHERE o.UserId = '$userid'
     ORDER BY o.OrderDate DESC"
);

$total = 0;
$cart_items = [];
while($row = mysqli_fetch_assoc($cart_query)) {
    $cart_items[] = $row;
    $total += getDiscountedPrice($row) * $row['Quantity'];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart | My Cart</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; }
        .navbar-custom { box-shadow: 0 2px 10px rgba(0,0,0,0.05); font-weight: 500; }
        .cart-card { border: none; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .product-thumb { width: 80px; height: 80px; object-fit: contain; border-radius: 8px; background: #f1f1f1; padding: 6px; }
        .summary-card { border: none; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); position: sticky; top: 90px; }
        .empty-state { text-align: center; padding: 80px 20px; }
        .empty-state i { font-size: 5rem; color: #dee2e6; margin-bottom: 20px; }
        .page-title-bar { background: linear-gradient(135deg, #0d6efd 0%, #0056d2 100%); color: white; padding: 30px 0; margin-bottom: 30px; }
        
        /* Custom Quantity Buttons (independent of global .btn) */
        .qty-btn {
            background-color: #ffffff !important;
            border: 1px solid #dee2e6 !important;
            color: #495057 !important;
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.15s ease-in-out !important;
            cursor: pointer !important;
            padding: 0 !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
        }
        .qty-btn:hover:not(:disabled) {
            background-color: #f8f9fa !important;
            border-color: #adb5bd !important;
            color: #0d6efd !important;
        }
        .qty-btn:disabled {
            color: #cbd5e1 !important;
            background-color: #f8f9fa !important;
            border-color: #e9ecef !important;
            cursor: not-allowed !important;
        }
        
        /* Custom Remove Button (independent of global .btn) */
        .remove-btn {
            font-size: 13px !important;
            padding: 6px 14px !important;
            border-radius: 30px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            font-weight: 600 !important;
            border: 1px solid #dc3545 !important;
            color: #dc3545 !important;
            background-color: transparent !important;
            text-decoration: none !important;
            transition: all 0.2s ease-in-out !important;
            cursor: pointer !important;
        }
        .remove-btn:hover {
            color: #ffffff !important;
            background-color: #dc3545 !important;
            transform: scale(1.03) !important;
        }
    </style>
</head>
<body>
<?php include_once('../includes/storefront/front_header.php'); ?>

<div class="page-title-bar">
    <div class="container">
        <h2 class="mb-0 fw-bold"><i class="fa-solid fa-cart-shopping me-3"></i>My Cart</h2>
        <small class="text-white-50"><?php echo count($cart_items); ?> item(s) in your cart</small>
    </div>
</div>

<div class="container pb-5">
    <?php if(empty($cart_items)): ?>
        <div class="cart-card card empty-state">
            <i class="fa-solid fa-cart-shopping"></i>
            <h4 class="text-muted fw-semibold">Your cart is empty</h4>
            <p class="text-muted">Looks like you haven't added any items yet.</p>
            <a href="shop-mobile.php" class="btn btn-primary rounded-pill px-5 mt-2">Browse Products</a>
        </div>
    <?php else: ?>
        <div class="row g-4">
            <div class="col-lg-8">
                <div class="card cart-card p-3">
                    <?php foreach($cart_items as $item): ?>
                        <div class="row align-items-center p-3 mb-3 bg-white border rounded-3 g-3">
                            <!-- Product Image & Details -->
                            <div class="col-12 col-md-6 d-flex align-items-center gap-3">
                                <img src="../uploads/products/<?php echo htmlspecialchars($item['Image1']); ?>" class="product-thumb flex-shrink-0" alt="<?php echo htmlspecialchars($item['ProductName']); ?>">
                                <div>
                                    <p class="text-muted small mb-0"><?php echo htmlspecialchars($item['BrandName']); ?></p>
                                    <h6 class="fw-bold mb-1" style="font-size: 0.95rem;"><?php echo htmlspecialchars($item['ProductName']); ?> <span class="text-muted fw-normal">(<?php echo htmlspecialchars($item['ModelNumber']); ?>)</span></h6>
                                    <p class="text-secondary small mb-1">
                                        <strong>Specs:</strong> <?php echo htmlspecialchars($item['Color']); ?> 
                                        <?php if(!empty($item['ROM']) || !empty($item['RAM'])): ?>
                                            (<?php echo htmlspecialchars($item['ROM']); ?> / <?php echo htmlspecialchars($item['RAM']); ?>)
                                        <?php endif; ?>
                                    </p>
                                    <?php if(isDiscountActive($item)): ?>
                                        <span class="text-decoration-line-through text-muted small me-1">Rs. <?php echo number_format($item['Price'], 2); ?></span>
                                        <span class="badge bg-danger me-1" style="font-size: 0.75rem;"><?php echo number_format($item['DiscountPercent'], 0); ?>% OFF</span>
                                        <span class="badge bg-primary d-block d-sm-inline-block mt-1 mt-sm-0" style="font-size: 0.8rem;">Rs. <?php echo number_format(getDiscountedPrice($item), 2); ?></span>
                                    <?php else: ?>
                                        <span class="badge bg-primary" style="font-size: 0.8rem;">Rs. <?php echo number_format($item['Price'], 2); ?></span>
                                    <?php endif; ?>
                                </div>
                            </div>
                            
                            <!-- Quantity Controls -->
                            <div class="col-6 col-md-3 d-flex justify-content-start justify-content-md-center">
                                <form method="post" action="cart.php" class="d-flex align-items-center border rounded-pill bg-light p-1">
                                    <input type="hidden" name="oid" value="<?php echo $item['OrderID']; ?>">
                                    <button type="submit" name="qty" value="<?php echo $item['Quantity'] - 1; ?>" class="qty-btn" <?php echo ($item['Quantity'] <= 1) ? 'disabled' : ''; ?>>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    </button>
                                    <span class="fw-bold px-2 text-center text-dark" style="min-width: 28px; font-size: 0.95rem;"><?php echo $item['Quantity']; ?></span>
                                    <button type="submit" name="qty" value="<?php echo $item['Quantity'] + 1; ?>" class="qty-btn" <?php echo ($item['Quantity'] >= $item['Stock']) ? 'disabled' : ''; ?>>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    </button>
                                </form>
                            </div>
                            
                            <!-- Remove Button -->
                            <div class="col-6 col-md-3 d-flex justify-content-end">
                                <a href="cart.php?remove=<?php echo $item['OrderID']; ?>" class="remove-btn confirm-link confirm-delete" data-confirm-message="Remove '<?php echo htmlspecialchars($item['ProductName']); ?>' from your cart?">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    <span>Remove</span>
                                </a>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="col-lg-4">
                <div class="card summary-card p-4">
                    <h5 class="fw-bold mb-4 border-bottom pb-3">Order Summary</h5>
                    <div class="d-flex justify-content-between mb-2 text-muted">
                        <span>Subtotal (<?php echo count($cart_items); ?> items)</span>
                        <span>Rs. <?php echo number_format($total, 2); ?></span>
                    </div>
                    <div class="d-flex justify-content-between mb-3 text-muted">
                        <span>Delivery</span>
                        <span class="text-success fw-semibold">Free</span>
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between mb-4 fw-bold fs-5">
                        <span>Total</span>
                        <span class="text-primary">Rs. <?php echo number_format($total, 2); ?></span>
                    </div>
                    <a href="checkout.php" class="btn btn-primary w-100 rounded-pill py-2 fw-semibold">
                        <i class="fa-solid fa-lock me-2"></i>Proceed to Checkout
                    </a>
                    <a href="shop-mobile.php" class="btn btn-light w-100 rounded-pill py-2 mt-2">
                        <i class="fa-solid fa-arrow-left me-2"></i>Continue Shopping
                    </a>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>

<?php include_once('../includes/storefront/front_footer.php'); ?>
<?php include_once('../includes/components/confirmation.php'); ?>
