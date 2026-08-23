<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');
include_once('../includes/components/pricing_helper.php');

if(empty($_SESSION['msmsuid'])) {
    header('Location: login.php');
    exit();
}

$userid = $_SESSION['msmsuid'];

// Fetch cart items
$cart_query = mysqli_query($conn,
    "SELECT o.ID as OrderID, o.Quantity, v.ID as VariantID, v.Color, v.RAM, v.ROM, v.Price as Price, v.Stock as Stock, 
            p.ID as PID, p.ProductName, p.BrandName, p.ModelNumber, p.DiscountPercent, p.DiscountStartDate, p.DiscountEndDate, p.Image1
     FROM tblorders o
     JOIN tblproduct_variants v ON o.VariantId = v.ID
     JOIN tblproducts p ON v.ProductId = p.ID
     WHERE o.UserId = '$userid'"
);

$cart_items = [];
$total = 0;
while($row = mysqli_fetch_assoc($cart_query)) {
    $cart_items[] = $row;
    $total += getDiscountedPrice($row) * $row['Quantity'];
}

// Redirect back to cart if empty
if(empty($cart_items)) {
    $_SESSION['error_msg'] = "Your cart is empty.";
    header("Location: cart.php");
    exit();
}

// Fetch user profile info
$user_query = mysqli_query($conn, "SELECT FirstName, LastName, MobileNumber, Email, LoyaltyPoints FROM tbluser WHERE ID='$userid'");
$user_info = mysqli_fetch_assoc($user_query);
$user_loyalty_points = (int)($user_info['LoyaltyPoints'] ?? 0);

// Fetch saved address if exists
$address_query = mysqli_query($conn, "SELECT RecipientName, Country, StreetAddress, City, District, PostalCode, MobilePhone FROM tbluseraddress WHERE UserId='$userid' ORDER BY ID DESC LIMIT 1");
$saved_address = mysqli_fetch_assoc($address_query);

$default_name = ($saved_address && !empty($saved_address['RecipientName'])) ? $saved_address['RecipientName'] : ($user_info['FirstName'] . ' ' . $user_info['LastName']);
$default_phone = $saved_address ? $saved_address['MobilePhone'] : $user_info['MobileNumber'];
$default_country = $saved_address ? $saved_address['Country'] : "Sri Lanka";
$default_address = $saved_address ? trim($saved_address['StreetAddress'] . ($saved_address['City'] ? ', ' . $saved_address['City'] : '') . ($saved_address['District'] ? ', ' . $saved_address['District'] : '')) : "";
$default_postal = $saved_address ? $saved_address['PostalCode'] : "";

// Server-side card expiry check (no Luhn — simple 16-digit + expiry + CVV rules)
function validateCardExpiryPHP($cardExpiry) {
    if (!preg_match('/^(0[1-9]|1[0-2])\/([0-9]{2})$/', $cardExpiry, $matches)) {
        return false;
    }
    $expMonth = (int)$matches[1];
    $expYear  = (int)('20' . $matches[2]);
    $currentMonth = (int)date('m');
    $currentYear  = (int)date('Y');
    if ($expYear < $currentYear || ($expYear === $currentYear && $expMonth < $currentMonth)) {
        return false;
    }
    return true;
}

// Process Checkout Form
if(isset($_POST['submit'])) {
    $shipping_name = trim($_POST['shipping_name']);
    $shipping_phone = trim($_POST['shipping_phone']);
    $shipping_country = trim($_POST['shipping_country']);
    $shipping_address = trim($_POST['shipping_address']);
    $shipping_postal_code = trim($_POST['shipping_postal_code']);
    
    if (isset($_POST['billing_same'])) {
        $billing_name = $shipping_name;
        $billing_phone = $shipping_phone;
        $billing_country = $shipping_country;
        $billing_address = $shipping_address;
        $billing_postal_code = $shipping_postal_code;
    } else {
        $billing_name = trim($_POST['billing_name']);
        $billing_phone = trim($_POST['billing_phone']);
        $billing_country = trim($_POST['billing_country']);
        $billing_address = trim($_POST['billing_address']);
        $billing_postal_code = trim($_POST['billing_postal_code']);
    }

    // 1. Phone number validation (exactly 10 digits starting with 0)
    if (!preg_match('/^0[0-9]{9}$/', $shipping_phone) || (!isset($_POST['billing_same']) && !preg_match('/^0[0-9]{9}$/', $billing_phone))) {
        $_SESSION['error_msg'] = "Phone number must be exactly 10 digits starting with 0.";
        header("Location: checkout.php");
        exit();
    }

    // 2. Postal code validation (exactly 5 digits)
    if (!preg_match('/^[0-9]{5}$/', $shipping_postal_code) || (!isset($_POST['billing_same']) && !preg_match('/^[0-9]{5}$/', $billing_postal_code))) {
        $_SESSION['error_msg'] = "Postal code must be exactly 5 digits.";
        header("Location: checkout.php");
        exit();
    }

    // 3. Street Address validation (alphanumeric and spaces/comma/period/hyphen/slash only)
    if (!preg_match('/^[a-zA-Z0-9\s,\.\-\/]+$/', $shipping_address) || (!isset($_POST['billing_same']) && !preg_match('/^[a-zA-Z0-9\s,\.\-\/]+$/', $billing_address))) {
        $_SESSION['error_msg'] = "Street address contains invalid characters. Only letters, numbers, spaces, commas, periods, hyphens, and slashes are allowed.";
        header("Location: checkout.php");
        exit();
    }

    // 4. Recipient Name validation (letters and spaces only)
    if (!preg_match('/^[a-zA-Z\s]+$/', $shipping_name) || (!isset($_POST['billing_same']) && !preg_match('/^[a-zA-Z\s]+$/', $billing_name))) {
        $_SESSION['error_msg'] = "Recipient full name must contain only letters and spaces. Numbers, decimals, hyphens/minus signs, and special characters are not allowed.";
        header("Location: checkout.php");
        exit();
    }

    // 5. Country validation (letters and spaces only)
    if (!preg_match('/^[a-zA-Z\s]+$/', $shipping_country) || (!isset($_POST['billing_same']) && !preg_match('/^[a-zA-Z\s]+$/', $billing_country))) {
        $_SESSION['error_msg'] = "Country name must contain only letters and spaces. Numbers, decimals, hyphens/minus signs, and special characters are not allowed.";
        header("Location: checkout.php");
        exit();
    }

    // Sanitize for database queries
    $shipping_name = mysqli_real_escape_string($conn, $shipping_name);
    $shipping_phone = mysqli_real_escape_string($conn, $shipping_phone);
    $shipping_country = mysqli_real_escape_string($conn, $shipping_country);
    $shipping_address = mysqli_real_escape_string($conn, $shipping_address);
    $shipping_postal_code = mysqli_real_escape_string($conn, $shipping_postal_code);
    
    $billing_name = mysqli_real_escape_string($conn, $billing_name);
    $billing_phone = mysqli_real_escape_string($conn, $billing_phone);
    $billing_country = mysqli_real_escape_string($conn, $billing_country);
    $billing_address = mysqli_real_escape_string($conn, $billing_address);
    $billing_postal_code = mysqli_real_escape_string($conn, $billing_postal_code);
    
    $payment_method = 'Card'; 
    
    // Server-side validation of Card details
    $card_name = $_POST['card_name'] ?? '';
    $card_number = $_POST['card_number'] ?? '';
    $card_expiry = $_POST['card_expiry'] ?? '';
    $card_cvv = $_POST['card_cvv'] ?? '';
    
    if (empty($card_name) || empty($card_number) || empty($card_expiry) || empty($card_cvv)) {
        $_SESSION['error_msg'] = "All card information fields are required.";
        header("Location: checkout.php");
        exit();
    }

    // Cardholder name: letters and spaces only
    if (!preg_match('/^[a-zA-Z\s]+$/', $card_name)) {
        $_SESSION['error_msg'] = "Cardholder name must contain letters and spaces only.";
        header("Location: checkout.php");
        exit();
    }

    // Card number: exactly 16 digits (strip spaces first)
    $card_number_digits = preg_replace('/\s/', '', $card_number);
    if (!preg_match('/^\d{16}$/', $card_number_digits)) {
        $_SESSION['error_msg'] = "Card number must be exactly 16 digits.";
        header("Location: checkout.php");
        exit();
    }

    // Expiry: MM/YY and not expired
    if (!validateCardExpiryPHP($card_expiry)) {
        $_SESSION['error_msg'] = "Invalid expiration date. Use MM/YY format and ensure it is not expired.";
        header("Location: checkout.php");
        exit();
    }

    // CVV: exactly 3 digits
    if (!preg_match('/^\d{3}$/', $card_cvv)) {
        $_SESSION['error_msg'] = "CVV must be exactly 3 digits.";
        header("Location: checkout.php");
        exit();
    }
    
    // Calculate Loyalty Points Redemption Discount
    $redeem_points = isset($_POST['redeem_points']) ? (int)$_POST['redeem_points'] : 0;
    if ($redeem_points > $user_loyalty_points) $redeem_points = $user_loyalty_points;
    if ($redeem_points < 0) $redeem_points = 0;
    
    $loyalty_discount = min((float)$redeem_points, $total);
    $final_total = max(0, $total - $loyalty_discount);

    // Do NOT store cardholder name, card number, or expiry date in database for security compliance
    $transaction_details = "Paid via Credit / Debit Card";
    if ($loyalty_discount > 0) {
        $transaction_details .= " (Redeemed {$redeem_points} Loyalty Pts: Rs. " . number_format($loyalty_discount, 2) . " Discount)";
    }
    
    // Save address if checked
    if(isset($_POST['save_address'])) {
        mysqli_query($conn, "INSERT INTO tbluseraddress (UserId, RecipientName, Country, StreetAddress, PostalCode, MobilePhone) VALUES ('$userid', '$shipping_name', '$shipping_country', '$shipping_address', '$shipping_postal_code', '$shipping_phone')");
    }
    
    // Start Transaction for Order Processing
    $conn->begin_transaction();
    try {
        // 1. Generate Order Number & Timestamp
        $order_number = generateOrderNumber();
        $order_date = date('Y-m-d H:i:s');
        
        // 2. Insert into tbl_order_master
        $stmt = $conn->prepare("INSERT INTO tbl_order_master (OrderNumber, UserId, ShippingName, ShippingPhone, ShippingCountry, ShippingAddress, ShippingPostalCode, BillingName, BillingPhone, BillingCountry, BillingAddress, BillingPostalCode, TotalAmount, PaymentMethod, TransactionDetails, OrderStatus, OrderDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)");
        $stmt->bind_param("sissssssssssdsss", $order_number, $userid, $shipping_name, $shipping_phone, $shipping_country, $shipping_address, $shipping_postal_code, $billing_name, $billing_phone, $billing_country, $billing_address, $billing_postal_code, $final_total, $payment_method, $transaction_details, $order_date);
        $stmt->execute();
        $order_id = $stmt->insert_id;

        // Deduct redeemed points from customer account
        if ($redeem_points > 0) {
            $stmt_loyalty = $conn->prepare("UPDATE tbluser SET LoyaltyPoints = GREATEST(0, LoyaltyPoints - ?) WHERE ID=?");
            $stmt_loyalty->bind_param("ii", $redeem_points, $userid);
            $stmt_loyalty->execute();
        }
        
        // 3. Insert items and update stock & tblcart (selledqty)
        foreach($cart_items as $item) {
            $vid = $item['VariantID'];
            $qty = $item['Quantity'];
            $price = getDiscountedPrice($item);
            
            // Insert line item
            $stmt_item = $conn->prepare("INSERT INTO tbl_order_items (OrderMasterId, VariantId, ProductQty, ProductPrice) VALUES (?, ?, ?, ?)");
            $stmt_item->bind_param("iiid", $order_id, $vid, $qty, $price);
            $stmt_item->execute();
            
            // Deduct stock
            $new_stock = $item['Stock'] - $qty;
            if($new_stock < 0) $new_stock = 0; // Prevent negative stock
            mysqli_query($conn, "UPDATE tblproduct_variants SET Stock='$new_stock' WHERE ID='$vid'");
            
            // Log stock movement (sale)
            mysqli_query($conn, "INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES ('$vid', '-$qty', 'Sale', 'Sale (Order: $order_number)')");
            
            // Record to tblcart (sold quantity tracker)
            mysqli_query($conn, "INSERT INTO tblcart (VariantId, ProductQty) VALUES ('$vid', '$qty')");
        }
        
        // 4. Clear the cart
        mysqli_query($conn, "DELETE FROM tblorders WHERE UserId='$userid'");
        
        $conn->commit();
        
        // Send confirmation email
        if (!empty($user_info['Email'])) {
            include_once('../includes/components/email_helper.php');
            sendOrderConfirmationEmail($user_info['Email'], $order_number, $total);
        }
        
        $_SESSION['success_msg'] = "Order placed successfully! Order Number: $order_number";
        header("Location: my-orders.php");
        exit();
        
    } catch(Exception $e) {
        $conn->rollback();
        $_SESSION['error_msg'] = "Unable to process order. Please try again.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart | Checkout</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; }
        .checkout-card { border: none; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .order-summary-sticky { position: sticky; top: 90px; }
        .page-title-bar { background: linear-gradient(135deg, #0d6efd 0%, #0056d2 100%); color: white; padding: 30px 0; margin-bottom: 30px; }
    </style>
</head>
<body>
<?php include_once('../includes/storefront/front_header.php'); ?>

<div class="page-title-bar">
    <div class="container">
        <h2 class="mb-0 fw-bold"><i class="fa-solid fa-credit-card me-3"></i>Checkout</h2>
    </div>
</div>

<div class="container mb-5">
    <form method="post" action="checkout.php" class="confirm-submit" data-confirm-message="Confirm and place your order for Rs. <?php echo number_format($total, 2); ?>?">
        <div class="row g-4">
            
            <!-- Left Side: Shipping & Payment Details -->
            <div class="col-lg-8">
                <div class="card checkout-card p-4 mb-4 shadow-sm border-0">
                    <h5 class="fw-bold mb-4 text-primary"><i class="fa-solid fa-truck me-2"></i>Shipping Address</h5>
                    
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Recipient Full Name <span class="text-danger">*</span></label>
                            <input type="text" name="shipping_name" id="shipping_name" class="form-control" value="<?php echo htmlspecialchars($default_name); ?>" pattern="[a-zA-Z\s]+" title="Only letters and spaces are allowed. Numbers, decimals, hyphens/minus signs, and special characters are not permitted." required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Mobile Phone Number <span class="text-danger">*</span></label>
                            <input type="tel" name="shipping_phone" id="shipping_phone" class="form-control" value="<?php echo htmlspecialchars($default_phone); ?>" pattern="0[0-9]{9}" maxlength="10" minlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '')" title="Must be exactly 10 digits starting with 0" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label fw-semibold">Country <span class="text-danger">*</span></label>
                            <input type="text" name="shipping_country" id="shipping_country" class="form-control" value="<?php echo htmlspecialchars($default_country); ?>" pattern="[a-zA-Z\s]+" title="Only letters and spaces are allowed. Numbers, decimals, hyphens/minus signs, and special characters are not permitted." required>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label fw-semibold">Street Address <span class="text-danger">*</span></label>
                            <input type="text" name="shipping_address" id="shipping_address" class="form-control" value="<?php echo htmlspecialchars($default_address); ?>" placeholder="House/Apartment number, street name" pattern="[a-zA-Z0-9\s,\.\-\/]+" title="Only alphanumeric characters, spaces, commas, periods, hyphens, and slashes are allowed" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label fw-semibold">Postal / ZIP Code <span class="text-danger">*</span></label>
                            <input type="text" name="shipping_postal_code" id="shipping_postal_code" class="form-control" value="<?php echo htmlspecialchars($default_postal); ?>" pattern="[0-9]{5}" maxlength="5" minlength="5" oninput="this.value = this.value.replace(/[^0-9]/g, '')" title="Exactly 5 numbers" required>
                        </div>
                        <div class="col-12 mt-3">
                            <div class="form-check">
                                <input type="checkbox" name="save_address" class="form-check-input" id="saveAddress" value="1" checked>
                                <label class="form-check-label text-muted" for="saveAddress">Save this as my default shipping address</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-check mb-2">
                        <input type="checkbox" name="billing_same" class="form-check-input" id="billingSame" value="1" checked>
                        <label class="form-check-label fw-semibold text-dark" for="billingSame">Billing Address is the same as Shipping Address</label>
                    </div>

                    <!-- Billing Address Section (Initially Hidden) -->
                    <div id="billing-address-section" class="d-none border-top pt-4 mt-3">
                        <h5 class="fw-bold mb-4 text-primary"><i class="fa-solid fa-file-invoice-dollar me-2"></i>Billing Address</h5>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Billing Contact Name <span class="text-danger">*</span></label>
                                <input type="text" name="billing_name" id="billing_name" class="form-control" value="<?php echo htmlspecialchars($default_name); ?>" pattern="[a-zA-Z\s]+" title="Only letters and spaces are allowed. Numbers, decimals, hyphens/minus signs, and special characters are not permitted.">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Billing Phone Number <span class="text-danger">*</span></label>
                                <input type="tel" name="billing_phone" id="billing_phone" class="form-control" value="<?php echo htmlspecialchars($default_phone); ?>" pattern="0[0-9]{9}" maxlength="10" minlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '')" title="Must be exactly 10 digits starting with 0">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-semibold">Country <span class="text-danger">*</span></label>
                                <input type="text" name="billing_country" id="billing_country" class="form-control" value="<?php echo htmlspecialchars($default_country); ?>" pattern="[a-zA-Z\s]+" title="Only letters and spaces are allowed. Numbers, decimals, hyphens/minus signs, and special characters are not permitted.">
                            </div>
                            <div class="col-md-8">
                                <label class="form-label fw-semibold">Street Address <span class="text-danger">*</span></label>
                                <input type="text" name="billing_address" id="billing_address" class="form-control" value="<?php echo htmlspecialchars($default_address); ?>" placeholder="House/Apartment number, street name" pattern="[a-zA-Z0-9\s,\.\-\/]+" title="Only alphanumeric characters, spaces, commas, periods, hyphens, and slashes are allowed">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-semibold">Postal / ZIP Code <span class="text-danger">*</span></label>
                                <input type="text" name="billing_postal_code" id="billing_postal_code" class="form-control" value="<?php echo htmlspecialchars($default_postal); ?>" pattern="[0-9]{5}" maxlength="5" minlength="5" oninput="this.value = this.value.replace(/[^0-9]/g, '')" title="Exactly 5 numbers">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card checkout-card p-4 shadow-sm border-0">
                    <h5 class="fw-bold mb-4 text-primary"><i class="fa-solid fa-wallet me-2"></i>Payment Method</h5>
                    
                    <input type="hidden" name="payment_method" value="Card">
                    <div class="p-3 bg-light border rounded-3 mb-4 d-flex align-items-center justify-content-between">
                        <div>
                            <span class="fw-semibold text-dark"><i class="fa-solid fa-credit-card me-2 text-primary"></i>Credit / Debit Card</span>
                            <span class="badge bg-primary ms-2">Default</span>
                        </div>
                        <small class="text-muted"><i class="fa-solid fa-lock text-success me-1"></i>Secure checkout</small>
                    </div>

                    <!-- Card Details Fields (Always Required) -->
                    <div id="card-details-section">
                        <h6 class="fw-bold mb-3 border-bottom pb-2">Enter Card Information</h6>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Cardholder Name <span class="text-danger">*</span></label>
                                <input type="text" name="card_name" id="card_name" class="form-control" placeholder="John Doe" maxlength="60" required>
                                <div class="invalid-feedback">Letters and spaces only.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Card Number <span class="text-danger">*</span></label>
                                <input type="text" name="card_number" id="card_number" class="form-control" placeholder="1234 5678 1234 5678" maxlength="19" required inputmode="numeric">
                                <div class="invalid-feedback">Must be exactly 16 digits.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Expiration Date <span class="text-danger">*</span></label>
                                <input type="text" name="card_expiry" id="card_expiry" class="form-control" placeholder="MM/YY" maxlength="5" required inputmode="numeric">
                                <div class="invalid-feedback">Use MM/YY format.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">CVV <span class="text-danger">*</span></label>
                                <input type="text" name="card_cvv" id="card_cvv" class="form-control" placeholder="123" maxlength="3" required inputmode="numeric">
                                <div class="invalid-feedback">Must be exactly 3 digits.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Side: Order Summary -->
            <div class="col-lg-4">
                <div class="card checkout-card p-4 order-summary-sticky">
                    <h5 class="fw-bold mb-4 border-bottom pb-3">Review Items</h5>
                    
                    <div class="checkout-items mb-4" style="max-height: 250px; overflow-y: auto;">
                        <?php foreach($cart_items as $item): ?>
                            <div class="d-flex align-items-center gap-3 mb-3">
                                <img src="../uploads/products/<?php echo htmlspecialchars($item['Image1']); ?>" style="width: 50px; height: 50px; object-fit: contain; border: 1px solid #eee; padding: 3px; border-radius: 6px;" alt="">
                                <div class="flex-grow-1">
                                    <h6 class="fw-semibold mb-0" style="font-size: 0.95rem;"><?php echo htmlspecialchars($item['ProductName']); ?></h6>
                                    <div class="text-secondary" style="font-size: 0.8rem;">
                                        <?php echo htmlspecialchars($item['Color']); ?>
                                        <?php if(!empty($item['ROM']) || !empty($item['RAM'])): ?>
                                            (<?php echo htmlspecialchars($item['ROM']); ?> / <?php echo htmlspecialchars($item['RAM']); ?>)
                                        <?php endif; ?>
                                    </div>
                                    <span class="text-muted small">Qty: <?php echo $item['Quantity']; ?> &times; Rs. <?php echo number_format(getDiscountedPrice($item), 2); ?></span>
                                </div>
                                <div class="fw-bold text-dark small">
                                    Rs. <?php echo number_format(getDiscountedPrice($item) * $item['Quantity'], 2); ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                    
                    <div class="d-flex justify-content-between mb-2 text-muted small">
                        <span>Items Subtotal</span>
                        <span>Rs. <?php echo number_format($total, 2); ?></span>
                    </div>
                    <div class="d-flex justify-content-between mb-3 text-muted small">
                        <span>Delivery fee</span>
                        <span class="text-success fw-semibold">Free</span>
                    </div>

                    <?php if($user_loyalty_points > 0): ?>
                        <div class="card bg-warning bg-opacity-10 border-warning border-0 rounded-3 mb-3 p-3">
                            <div class="d-flex align-items-center justify-content-between mb-2">
                                <span class="fw-bold text-dark small"><i class="fa-solid fa-crown text-warning me-1"></i> Loyalty Points</span>
                                <span class="badge bg-warning text-dark font-monospace"><?php echo $user_loyalty_points; ?> pts</span>
                            </div>
                            <div class="form-check mb-0">
                                <input class="form-check-input" type="checkbox" id="useLoyaltyCheck" onchange="toggleLoyaltyPoints(this)">
                                <label class="form-check-label small fw-semibold text-dark" for="useLoyaltyCheck">
                                    Redeem points for discount (1 pt = Rs. 1.00)
                                </label>
                            </div>
                            <input type="hidden" name="redeem_points" id="redeemPointsInput" value="0">
                        </div>
                    <?php endif; ?>

                    <div id="loyaltyDiscountRow" class="d-flex justify-content-between mb-2 text-success small fw-bold d-none">
                        <span><i class="fa-solid fa-tag me-1"></i> Loyalty Discount</span>
                        <span id="loyaltyDiscountAmount">- Rs. 0.00</span>
                    </div>

                    <hr>
                    <div class="d-flex justify-content-between mb-4 fw-bold fs-5">
                        <span>Grand Total</span>
                        <span class="text-primary" id="grandTotalAmount">Rs. <?php echo number_format($total, 2); ?></span>
                    </div>
                    
                    <button type="submit" class="btn btn-primary w-100 rounded-pill py-2.5 fw-semibold fs-6 shadow-sm">
                        <i class="fa-solid fa-lock me-2"></i>Place Order
                    </button>
                    
                    <a href="cart.php" class="btn btn-light w-100 rounded-pill py-2 mt-2 text-muted small">
                        <i class="fa-solid fa-arrow-left me-2"></i>Modify Cart
                    </a>
                </div>
            </div>

        </div>
    </form>
</div>

<?php include_once('../includes/storefront/front_footer.php'); ?>
<?php include_once('../includes/components/confirmation.php'); ?>

<script>
// Sync and toggle Billing Address inputs
const billingSameCheckbox = document.getElementById('billingSame');
const billingSection = document.getElementById('billing-address-section');
const billingInputs = billingSection.querySelectorAll('input');

function syncBilling() {
    if (billingSameCheckbox.checked) {
        document.getElementById('billing_name').value = document.getElementById('shipping_name').value;
        document.getElementById('billing_phone').value = document.getElementById('shipping_phone').value;
        document.getElementById('billing_country').value = document.getElementById('shipping_country').value;
        document.getElementById('billing_address').value = document.getElementById('shipping_address').value;
        document.getElementById('billing_postal_code').value = document.getElementById('shipping_postal_code').value;
    }
}

const shippingFields = ['shipping_name', 'shipping_phone', 'shipping_country', 'shipping_address', 'shipping_postal_code'];
shippingFields.forEach(fieldId => {
    document.getElementById(fieldId).addEventListener('input', syncBilling);
});

billingSameCheckbox.addEventListener('change', function() {
    if (this.checked) {
        billingSection.classList.add('d-none');
        billingInputs.forEach(input => input.removeAttribute('required'));
        syncBilling();
    } else {
        billingSection.classList.remove('d-none');
        billingInputs.forEach(input => input.setAttribute('required', 'required'));
    }
});

// Run initial sync on DOM load
document.addEventListener('DOMContentLoaded', syncBilling);

// ── Card Field Validation 

// Cardholder Name: letters and spaces only, block numbers & special chars
const cardNameInput = document.getElementById('card_name');
cardNameInput.addEventListener('input', function () {
    // Strip any character that is not a letter or space
    this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
    this.setCustomValidity(this.value.trim().length < 2 ? 'Enter the cardholder name (letters only).' : '');
});

// Recipient Full Name: letters and spaces only, block numbers & special chars
const shippingNameInput = document.getElementById('shipping_name');
shippingNameInput.addEventListener('input', function () {
    this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
    this.setCustomValidity(this.value.trim().length < 2 ? 'Recipient name must contain only letters and spaces (at least 2 characters).' : '');
});

// Shipping Country: letters and spaces only, block numbers & special chars
const shippingCountryInput = document.getElementById('shipping_country');
shippingCountryInput.addEventListener('input', function () {
    this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
    this.setCustomValidity(this.value.trim().length < 2 ? 'Country name must contain only letters and spaces (at least 2 characters).' : '');
});

// Billing Contact Name: letters and spaces only, block numbers & special chars
const billingNameInput = document.getElementById('billing_name');
if (billingNameInput) {
    billingNameInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
        if (!billingSameCheckbox.checked) {
            this.setCustomValidity(this.value.trim().length < 2 ? 'Billing contact name must contain only letters and spaces (at least 2 characters).' : '');
        } else {
            this.setCustomValidity('');
        }
    });
}

// Billing Country: letters and spaces only, block numbers & special chars
const billingCountryInput = document.getElementById('billing_country');
if (billingCountryInput) {
    billingCountryInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
        if (!billingSameCheckbox.checked) {
            this.setCustomValidity(this.value.trim().length < 2 ? 'Billing country must contain only letters and spaces (at least 2 characters).' : '');
        } else {
            this.setCustomValidity('');
        }
    });
}

// Card Number: digits only, auto-format as XXXX XXXX XXXX XXXX
const cardNumberInput = document.getElementById('card_number');
cardNumberInput.addEventListener('input', function () {
    // Remove everything that is not a digit
    let digits = this.value.replace(/\D/g, '');
    // Limit to 16 digits
    digits = digits.substring(0, 16);
    // Insert space every 4 digits
    this.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    // Validate: must be exactly 16 digits
    const clean = this.value.replace(/\s/g, '');
    if (clean.length !== 16) {
        this.setCustomValidity('Card number must be exactly 16 digits.');
    } else {
        this.setCustomValidity('');
    }
});

// Expiry: auto-insert slash after 2-digit month, block non-digits
const cardExpiryInput = document.getElementById('card_expiry');
cardExpiryInput.addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '');  // digits only
    if (val.length > 4) val = val.substring(0, 4);
    // Insert slash after MM
    if (val.length >= 3) {
        val = val.substring(0, 2) + '/' + val.substring(2);
    }
    this.value = val;

    // Validate format and expiry
    const match = this.value.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
    if (!match) {
        this.setCustomValidity('Expiration date must be in MM/YY format.');
    } else {
        const expMonth = parseInt(match[1], 10);
        const expYear  = parseInt('20' + match[2], 10);
        const today    = new Date();
        if (expYear < today.getFullYear() || (expYear === today.getFullYear() && expMonth < today.getMonth() + 1)) {
            this.setCustomValidity('Card has already expired.');
        } else {
            this.setCustomValidity('');
        }
    }
});

// CVV: exactly 3 digits, block letters and special chars
const cardCvvInput = document.getElementById('card_cvv');
cardCvvInput.addEventListener('input', function () {
    // Strip non-digits
    this.value = this.value.replace(/\D/g, '').substring(0, 3);
    this.setCustomValidity(this.value.length !== 3 ? 'CVV must be exactly 3 digits.' : '');
});

// Toggle Loyalty Points Redemption
function toggleLoyaltyPoints(chk) {
    const userPts = <?php echo (int)$user_loyalty_points; ?>;
    const subtotal = <?php echo (float)$total; ?>;
    const ptsInput = document.getElementById('redeemPointsInput');
    const discountRow = document.getElementById('loyaltyDiscountRow');
    const discountAmountElem = document.getElementById('loyaltyDiscountAmount');
    const grandTotalElem = document.getElementById('grandTotalAmount');
    
    if (chk.checked) {
        const discount = Math.min(userPts, subtotal);
        ptsInput.value = discount;
        discountRow.classList.remove('d-none');
        discountAmountElem.innerText = '- Rs. ' + discount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        const finalTotal = Math.max(0, subtotal - discount);
        grandTotalElem.innerText = 'Rs. ' + finalTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } else {
        ptsInput.value = 0;
        discountRow.classList.add('d-none');
        grandTotalElem.innerText = 'Rs. ' + subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
}
</script>
</body>
</html>
