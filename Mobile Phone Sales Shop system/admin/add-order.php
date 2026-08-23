<?php
session_start();
include('../config/db.php');

$required_roles = ['Admin', 'Sales person'];
include("../includes/admin/auth_admin.php");

// Handle order submission
if (isset($_POST['submit_order'])) {
    $errors = [];
    $user_type = $_POST['user_type'] ?? 'walkin';
    $customer_id = 0;
    
    // Determine and validate customer details
    if ($user_type === 'registered') {
        $customer_id = intval($_POST['customer_id'] ?? 0);
        if ($customer_id <= 0) {
            $errors[] = "Please search and select a valid registered customer member.";
        } else {
            $chk_cust = mysqli_query($conn, "SELECT ID FROM tbluser WHERE ID = '$customer_id'");
            if (mysqli_num_rows($chk_cust) == 0) {
                $errors[] = "Selected registered customer account was not found.";
            }
        }
        $walkin_name = trim($_POST['reg_name'] ?? '');
        $walkin_phone = trim($_POST['reg_phone'] ?? '');
        $walkin_email = '';
        $walkin_address = trim($_POST['reg_address'] ?? 'Store Customer');
    } else {
        // Walk-in customer processing & MANDATORY strict validation
        $walkin_name = trim($_POST['walkin_name'] ?? 'walkin customer');
        $walkin_phone = trim($_POST['walkin_phone'] ?? '');
        $walkin_email = trim($_POST['walkin_email'] ?? '');
        $walkin_address = trim($_POST['walkin_address'] ?? '');
        
        // 1. Customer Name Validation (Mandatory)
        if (empty($walkin_name)) {
            $errors[] = "Customer Name is mandatory for walk-in orders.";
        } elseif (strlen($walkin_name) < 2) {
            $errors[] = "Customer Name must be at least 2 characters long.";
        } elseif (!preg_match("/^[a-zA-Z\s]+$/", $walkin_name)) {
            $errors[] = "Customer Name must contain only letters and spaces. Numbers, decimals, hyphens, plus signs, and special characters are not allowed.";
        }
        
        // 2. Phone Number Validation (Mandatory)
        if (empty($walkin_phone)) {
            $errors[] = "Phone Number is mandatory for walk-in orders.";
        } elseif (!preg_match("/^0[0-9]{9}$/", $walkin_phone)) {
            $errors[] = "Phone Number must be a valid 10-digit Sri Lankan phone number starting with 0 (e.g., 0771234567).";
        }
        
        // 3. Email Address Validation (Mandatory + Exactly one @ symbol)
        if (empty($walkin_email)) {
            $errors[] = "Email Address is mandatory for walk-in orders.";
        } elseif (substr_count($walkin_email, '@') !== 1) {
            $errors[] = "Email Address must contain exactly one '@' symbol.";
        } elseif (!filter_var($walkin_email, FILTER_VALIDATE_EMAIL) || !preg_match("/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/", $walkin_email)) {
            $errors[] = "Please enter a valid single-@ email address (e.g. customer@domain.com).";
        }
        
        // 4. Location / Address Validation (Mandatory)
        if (empty($walkin_address)) {
            $errors[] = "Location / Address is mandatory for walk-in orders.";
        } elseif (strlen($walkin_address) < 3) {
            $errors[] = "Location / Address must be at least 3 characters long.";
        } elseif (!preg_match("/^[a-zA-Z0-9\s\.\,\-\/]+$/", $walkin_address)) {
            $errors[] = "Location / Address contains invalid characters.";
        }
        
        if (empty($errors)) {
            // Find or create walk-in user account in tbluser
            $stmt = $conn->prepare("SELECT ID FROM tbluser WHERE Email = ?");
            $stmt->bind_param("s", $walkin_email);
            $stmt->execute();
            $res = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            
            if ($res) {
                $customer_id = $res['ID'];
            } else {
                // Create user account for walk-in customer
                $default_pass = password_hash('walkin_pass_123', PASSWORD_DEFAULT);
                $stmt = $conn->prepare("INSERT INTO tbluser (FirstName, LastName, Email, MobileNumber, Password, LoyaltyPoints) VALUES (?, '', ?, ?, ?, 0)");
                $stmt->bind_param("ssss", $walkin_name, $walkin_email, $walkin_phone, $default_pass);
                $stmt->execute();
                $customer_id = $stmt->insert_id;
                $stmt->close();
            }
        }
    }

    $payment_method = $_POST['payment_method'] ?? 'Cash';
    $order_status = $_POST['order_status'] ?? 'Completed';
    $transaction_details = trim($_POST['transaction_details'] ?? '');
    
    // Validate Payment Method and Order Status
    if (!in_array($payment_method, ['Cash', 'Card'])) {
        $errors[] = "Invalid payment method selected.";
    }
    if (!in_array($order_status, ['Completed', 'Pending'])) {
        $errors[] = "Invalid order status selected.";
    }
    
    // Validate Custom Order Date (Backdate)
    if (!empty($_POST['custom_order_date'])) {
        $cust_date_raw = trim($_POST['custom_order_date']);
        if ($cust_date_raw > date('Y-m-d')) {
            $errors[] = "Order Date cannot be set in the future.";
        }
    }
    
    // Prepare Shipping and Billing Info
    $shipping_name    = $walkin_name;
    $shipping_phone   = $walkin_phone;
    $shipping_address = $walkin_address;
    $shipping_postal  = ($user_type === 'registered') ? trim($_POST['reg_postal'] ?? '00000') : '00000';
    $shipping_country = 'Sri Lanka';
    
    $billing_name    = $shipping_name;
    $billing_phone   = $shipping_phone;
    $billing_address = $shipping_address;
    $billing_postal  = $shipping_postal;
    $billing_country = $shipping_country;
    
    $items = $_POST['items'] ?? [];
    if (empty($items)) {
        $errors[] = "Cannot create an empty order. Please select at least one product.";
    }
    
    if (!empty($errors)) {
        $_SESSION['error_msg'] = implode("<br>", $errors);
        header('Location: add-order.php');
        exit();
    }
    
    // Begin transaction
    $conn->begin_transaction();
    try {
        $order_number = generateOrderNumber('ORD-INST-');
        $processed_by = $_SESSION['imsaid'];
        
        // Calculate Total
        $grand_total = 0;
        $order_items_to_insert = [];
        
        foreach ($items as $item) {
            $vid = (int)$item['product_id'];
            $qty = (int)$item['qty'];
            $manual_discount = (float)$item['discount']; // In percent
            
            // Fetch variant info to verify stock and base price
            $prod_q = mysqli_query($conn, "SELECT p.ProductName, v.Color, v.RAM, v.ROM, v.Price, v.Stock FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.ID='$vid'");
            $prod = mysqli_fetch_assoc($prod_q);
            if (!$prod) {
                throw new Exception("Variant ID $vid not found.");
            }
            if ($prod['Stock'] < $qty) {
                throw new Exception("Insufficient stock for product variant " . $prod['ProductName'] . " " . $prod['Color']);
            }
            
            $base_price = (float)$prod['Price'];
            // Sales person cannot apply discounts
            $manual_discount = ($admin_role === 'Sales person') ? 0 : (float)$item['discount'];
            $discount_amt = $base_price * ($manual_discount / 100);
            $final_unit_price = $base_price - $discount_amt;
            $line_total = $final_unit_price * $qty;
            
            $grand_total += $line_total;
            $order_items_to_insert[] = [
                'vid' => $vid,
                'qty' => $qty,
                'price' => $final_unit_price,
                'base_stock' => $prod['Stock']
            ];
        }
        
        $custom_order_date = !empty($_POST['custom_order_date']) ? (trim($_POST['custom_order_date']) . ' ' . date('H:i:s')) : date('Y-m-d H:i:s');
        
        // 1. Insert into tbl_order_master
        $stmt = $conn->prepare("INSERT INTO tbl_order_master (OrderNumber, UserId, ShippingName, ShippingPhone, ShippingCountry, ShippingAddress, ShippingPostalCode, BillingName, BillingPhone, BillingCountry, BillingAddress, BillingPostalCode, TotalAmount, PaymentMethod, TransactionDetails, OrderStatus, ProcessedById, OrderDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sissssssssssdsssis", $order_number, $customer_id, $shipping_name, $shipping_phone, $shipping_country, $shipping_address, $shipping_postal, $billing_name, $billing_phone, $billing_country, $billing_address, $billing_postal, $grand_total, $payment_method, $transaction_details, $order_status, $processed_by, $custom_order_date);
        $stmt->execute();
        $order_id = $stmt->insert_id;
        $stmt->close();
        
        // 2. Insert items and update stock & tblcart (selledqty)
        foreach ($order_items_to_insert as $oi) {
            $vid = $oi['vid'];
            $qty = $oi['qty'];
            $price = $oi['price'];
            
            // Insert line item
            $stmt_item = $conn->prepare("INSERT INTO tbl_order_items (OrderMasterId, VariantId, ProductQty, ProductPrice) VALUES (?, ?, ?, ?)");
            $stmt_item->bind_param("iiid", $order_id, $vid, $qty, $price);
            $stmt_item->execute();
            $stmt_item->close();
            
            // Deduct stock
            $new_stock = $oi['base_stock'] - $qty;
            mysqli_query($conn, "UPDATE tblproduct_variants SET Stock='$new_stock' WHERE ID='$vid'");
            
            // Log stock movement (sale)
            mysqli_query($conn, "INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES ('$vid', '-$qty', 'Sale', 'In-store POS Sale (Order: $order_number)')");
            
            // Record to tblcart (sold quantity tracker)
            mysqli_query($conn, "INSERT INTO tblcart (VariantId, ProductQty) VALUES ('$vid', '$qty')");
        }
        
        // 3. Award loyalty points if customer is registered and status is Completed
        if ($order_status === 'Completed' && $user_type === 'registered') {
            $points = floor($grand_total / 1000);
            if ($points > 0) {
                mysqli_query($conn, "UPDATE tbluser SET LoyaltyPoints = LoyaltyPoints + $points WHERE ID='$customer_id'");
                mysqli_query($conn, "UPDATE tbl_order_master SET PointsAwarded=1 WHERE ID='$order_id'");
            }
        }
        
        $conn->commit();
        
        // Try sending confirmation email
        if ($user_type === 'registered') {
            $cust_email_q = mysqli_query($conn, "SELECT Email FROM tbluser WHERE ID='$customer_id'");
            if ($cust_email_row = mysqli_fetch_assoc($cust_email_q)) {
                include_once('../includes/components/email_helper.php');
                sendOrderConfirmationEmail($cust_email_row['Email'], $order_number, $grand_total);
            }
        }
        
        $_SESSION['success_msg'] = "In-store order $order_number has been successfully created.";
        header('Location: orders.php');
        exit();
        
    } catch (Exception $e) {
        $conn->rollback();
        $_SESSION['error_msg'] = "Failed to create order: " . $e->getMessage();
    }
}

// No longer pre-loading all products/customers — AJAX search used instead
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart | Create In-Store Order</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="../assets/css/admin.css">
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        .product-item { transition: background 0.15s; cursor: pointer; }
        .product-item:hover { background-color: #f1f3f5; }
        .search-results-box { max-height: 250px; overflow-y: auto; z-index: 1000; }
    </style>
</head>
<body class="bg-light">
<div class="d-flex">
    <?php include_once('../includes/admin/sidebar.php');?>
    
    <div class="flex-grow-1" style="min-height: 100vh;">
        <!-- Header -->
        <header class="bg-white border-bottom shadow-sm py-3 px-4 d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
                <h4 class="fw-bold text-dark mb-0"><i class="bi bi-cart-plus me-2 text-primary"></i> Create In-Store Order</h4>
            </div>
            <div class="d-flex align-items-center gap-3">
                <span class="badge bg-light text-dark border px-3 py-2"><i class="bi bi-person me-1"></i> Cashier: <?= htmlspecialchars($_SESSION['admin_role']); ?></span>
            </div>
        </header>

        <!-- Main Workspace -->
        <div class="container-fluid p-4">

            <?php if (isset($_SESSION['error_msg'])): ?>
                <div class="alert alert-danger alert-dismissible fade show shadow-sm border-0 mb-4" role="alert">
                    <i class="bi bi-exclamation-octagon-fill me-2 fs-5 align-middle"></i>
                    <strong>Validation Error:</strong><br><?php echo $_SESSION['error_msg']; unset($_SESSION['error_msg']); ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>

            <?php if (isset($_SESSION['success_msg'])): ?>
                <div class="alert alert-success alert-dismissible fade show shadow-sm border-0 mb-4" role="alert">
                    <i class="bi bi-check-circle-fill me-2 fs-5 align-middle"></i>
                    <?php echo $_SESSION['success_msg']; unset($_SESSION['success_msg']); ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>

            <form id="orderForm" method="post" action="add-order.php" class="needs-validation" novalidate>
                <div class="row g-4">
                    
                    <!-- Left Column: Customer and Products -->
                    <div class="col-lg-8">
                        
                        <!-- Customer Selection Card -->
                        <div class="card border-0 shadow-sm rounded-3 mb-4">
                            <div class="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                                <h5 class="fw-bold text-dark mb-0"><i class="bi bi-person-badge text-primary me-2"></i> Customer Details</h5>
                                <div class="d-flex gap-2">
                                    <input type="radio" class="btn-check" name="user_type" id="typeWalkin" value="walkin" checked autocomplete="off">
                                    <label class="btn btn-sm btn-outline-primary" for="typeWalkin">Walk-in Customer</label> 
                                    
                                    <input type="radio" class="btn-check" name="user_type" id="typeRegistered" value="registered" autocomplete="off">
                                    <label class="btn btn-sm btn-outline-primary" for="typeRegistered">Registered Member</label>
                                </div>
                            </div>
                            <div class="card-body p-4">
                                <!-- Walk-in Form -->
                                <div id="walkinSection" class="row g-3">
                                    <div class="col-md-6">
                                        <label class="form-label fw-semibold">Customer Name <span class="text-danger">*</span></label>
                                        <input type="text" name="walkin_name" id="walkinNameInput" class="form-control" placeholder="Enter customer name (e.g. Nimal Perera)" value="" required minlength="2" maxlength="100" pattern="[a-zA-Z\s]+" title="Only letters and spaces are allowed. Numbers, decimals, hyphens/minus signs, plus signs, and special characters are not permitted.">
                                        <div class="invalid-feedback">Please enter customer name (at least 2 letters, containing only letters and spaces).</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label fw-semibold">Phone Number <span class="text-danger">*</span></label>
                                        <input type="tel" name="walkin_phone" id="walkinPhoneInput" class="form-control" placeholder="Enter 10-digit mobile (e.g. 0771234567)" value="" required pattern="0[0-9]{9}" title="Must be a 10-digit phone number starting with 0">
                                        <div class="invalid-feedback">Please enter a valid 10-digit Sri Lankan phone number starting with 0 (e.g. 0771234567).</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label fw-semibold">Email Address <span class="text-danger">*</span></label>
                                        <input type="email" name="walkin_email" id="walkinEmailInput" class="form-control" placeholder="Enter email (e.g. customer@gmail.com)" value="" required pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" title="Must be a valid single-@ email address (e.g. name@domain.com)">
                                        <div class="invalid-feedback">Please enter a valid email address with exactly one @ symbol (e.g. name@domain.com).</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label fw-semibold">Location / Address <span class="text-danger">*</span></label>
                                        <input type="text" name="walkin_address" id="walkinAddressInput" class="form-control" placeholder="Enter city or address (e.g. Colombo 03)" value="" required minlength="3" maxlength="255" pattern="[a-zA-Z0-9\s\.\,\-\/]+" title="Only letters, numbers, spaces, commas, hyphens, slashes, and dots allowed.">
                                        <div class="invalid-feedback">Please enter location or city address (at least 3 characters).</div>
                                    </div>
                                </div>

                                <!-- Registered Form -->
                                <div id="registeredSection" class="row g-3 d-none">
                                    <div class="col-12 position-relative">
                                        <label class="form-label fw-semibold">Search Registered Customer</label>
                                        <div class="input-group">
                                            <span class="input-group-text bg-light"><i class="bi bi-search"></i></span>
                                            <input type="text" id="customerSearchInput" class="form-control" placeholder="Search by name, email, or mobile...">
                                        </div>
                                        <div id="customerResults" class="list-group position-absolute w-100 shadow-lg search-results-box mt-1 d-none"></div>
                                    </div>
                                    
                                    <!-- Selected Customer Info (hidden fields and visual card) -->
                                    <div id="selectedCustomerCard" class="col-12 d-none">
                                        <div class="p-3 bg-light border rounded-3 d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 id="selectedCustomerName" class="fw-bold mb-1 text-primary"></h6>
                                                <span id="selectedCustomerContact" class="text-muted small"></span>
                                            </div>
                                            <button type="button" class="btn btn-outline-danger btn-sm" onclick="clearSelectedCustomer()">Change</button>
                                        </div>
                                        <input type="hidden" name="customer_id" id="customerIdField" value="">
                                        <input type="hidden" name="reg_name" id="regNameField" value="">
                                        <input type="hidden" name="reg_phone" id="regPhoneField" value="">
                                        <input type="hidden" name="reg_address" id="regAddressField" value="Store Customer">
                                        <input type="hidden" name="reg_postal" id="regPostalField" value="00000">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Product Selector Card -->
                        <div class="card border-0 shadow-sm rounded-3">
                            <div class="card-header bg-white border-0 pt-4 px-4">
                                <h5 class="fw-bold text-dark mb-0"><i class="bi bi-box-seam text-primary me-2"></i> Add Products</h5>
                            </div>
                            <div class="card-body p-4">
                                <div class="position-relative mb-4">
                                    <div class="input-group">
                                        <span class="input-group-text bg-light"><i class="bi bi-search"></i></span>
                                        <input type="text" id="productSearchInput" class="form-control form-control-lg" placeholder="Type product name, brand, or model number to search...">
                                    </div>
                                    <div id="productResults" class="list-group position-absolute w-100 shadow-lg search-results-box mt-1 d-none"></div>
                                </div>

                                <!-- Selected Items Table -->
                                <div class="table-responsive">
                                    <table class="table align-middle" id="selectedItemsTable">
                                        <thead>
                                            <tr class="table-light">
                                                <th class="ps-3" style="width: 40%">Product</th>
                                                <th style="width: 15%">Price (Rs.)</th>
                                                <th style="width: 15%">Qty</th>
                                                <?php if ($admin_role === 'Admin'): ?>
                                                <th style="width: 15%">Discount (%)</th>
                                                <?php endif; ?>
                                                <th style="width: 15%">Total (Rs.)</th>
                                                <th style="width: 5%"></th>
                                            </tr>
                                        </thead>
                                        <tbody id="orderItemsContainer">
                                            <tr id="emptyCartRow">
                                                <td colspan="6" class="text-center py-4 text-muted">
                                                    <i class="bi bi-cart-x fs-3 d-block mb-2"></i>
                                                    No products added to the order yet.
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Right Column: Totals & Summary -->
                    <div class="col-lg-4">
                        <div class="card border-0 shadow-sm rounded-3 position-sticky" style="top: 90px;">
                            <div class="card-header bg-white border-0 pt-4 px-4">
                                <h5 class="fw-bold text-dark mb-0"><i class="bi bi-receipt-cutoff text-primary me-2"></i> Order Summary</h5>
                            </div>
                            <div class="card-body p-4">
                                
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Subtotal</span>
                                    <span class="fw-semibold text-dark" id="summarySubtotal">Rs. 0.00</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Discount</span>
                                    <span class="fw-semibold text-danger" id="summaryDiscount">- Rs. 0.00</span>
                                </div>
                                <hr>
                                <div class="d-flex justify-content-between mb-4">
                                    <span class="h6 fw-bold">Grand Total</span>
                                    <span class="h6 fw-bold text-primary" id="summaryTotal">Rs. 0.00</span>
                                </div>

                                <h6 class="fw-bold text-secondary mb-3"><i class="bi bi-credit-card me-2"></i> Transaction Details</h6>
                                
                                <div class="mb-3">
                                    <label class="form-label small fw-semibold">Payment Method</label>
                                    <select class="form-select" name="payment_method">
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Credit/Debit Card</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label small fw-semibold">Order Status</label>
                                    <select class="form-select" name="order_status">
                                        <option value="Completed">Completed (Deduct Stock & Close)</option>
                                        <option value="Pending">Pending (Awaiting Payment)</option>
                                    </select>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label small fw-semibold text-muted"><i class="bi bi-calendar-event me-1"></i> Order Date (Optional Backdate for Reports)</label>
                                    <input type="date" class="form-control form-control-sm" name="custom_order_date" max="<?php echo date('Y-m-d'); ?>">
                                    <div class="form-text extra-small text-muted">Leave blank for today's date. Pick a past date to create historical dummy reports.</div>
                                </div>

                                <div class="mb-4">
                                    <label class="form-label small fw-semibold">Notes / Transaction Reference</label>
                                    <textarea class="form-control" name="transaction_details" rows="2" placeholder="e.g. Card transaction ID, cash change details..."></textarea>
                                </div>

                                <button type="submit" name="submit_order" class="btn btn-primary w-100 py-2.5 fw-bold rounded-pill shadow-sm">
                                    <i class="bi bi-check2-circle me-1"></i> Finalize Order
                                </button>
                                
                                <a href="orders.php" class="btn btn-outline-secondary w-100 py-2 mt-2 rounded-pill small">
                                    Cancel
                                </a>

                            </div>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    </div>
</div>

<script>
let cart = [];
let _selectedCustomers = {}; // cache fetched customers by id
let _selectedProducts  = {}; // cache fetched products by id
let _custTimer = null;
let _prodTimer = null;

// Handle customer type toggle
document.getElementsByName('user_type').forEach(radio => {
    radio.addEventListener('change', function() {
        const walkinInputs = document.querySelectorAll('#walkinSection input');
        if(this.value === 'registered') {
            document.getElementById('walkinSection').classList.add('d-none');
            document.getElementById('registeredSection').classList.remove('d-none');
            walkinInputs.forEach(input => input.removeAttribute('required'));
        } else {
            document.getElementById('walkinSection').classList.remove('d-none');
            document.getElementById('registeredSection').classList.add('d-none');
            walkinInputs.forEach(input => input.setAttribute('required', 'required'));
            clearSelectedCustomer();
        }
    });
});

// Registered Customer Search — AJAX
const custSearch  = document.getElementById('customerSearchInput');
const custResults = document.getElementById('customerResults');

custSearch.addEventListener('input', function() {
    const val = this.value.trim();
    clearTimeout(_custTimer);
    if(val.length < 1) { custResults.classList.add('d-none'); return; }

    custResults.innerHTML = '<div class="list-group-item text-muted"><i class="bi bi-hourglass-split me-1"></i>Searching...</div>';
    custResults.classList.remove('d-none');

    _custTimer = setTimeout(function() {
        $.getJSON('ajax/search_customers.php', { q: val }, function(data) {
            if(data.length === 0) {
                custResults.innerHTML = '<div class="list-group-item text-muted">No customer found</div>';
            } else {
                data.forEach(c => { _selectedCustomers[c.id] = c; });
                custResults.innerHTML = data.map(c =>
                    `<a href="#" class="list-group-item list-group-item-action py-2" onclick="selectCustomer(${c.id}); return false;">
                        <div class="fw-bold">${c.name}</div>
                        <div class="text-muted small">${c.email} &bull; ${c.phone}</div>
                    </a>`
                ).join('');
            }
        });
    }, 250);
});

function selectCustomer(id) {
    const cust = _selectedCustomers[id];
    if(cust) {
        document.getElementById('customerIdField').value = cust.id;
        document.getElementById('regNameField').value    = cust.name;
        document.getElementById('regPhoneField').value   = cust.phone;
        document.getElementById('selectedCustomerName').innerText    = cust.name;
        document.getElementById('selectedCustomerContact').innerText = `${cust.email} | Phone: ${cust.phone}`;
        document.getElementById('selectedCustomerCard').classList.remove('d-none');
        custSearch.parentElement.classList.add('d-none');
        custResults.classList.add('d-none');
        custSearch.value = '';
    }
}

function clearSelectedCustomer() {
    document.getElementById('customerIdField').value = '';
    document.getElementById('regNameField').value    = '';
    document.getElementById('regPhoneField').value   = '';
    document.getElementById('selectedCustomerCard').classList.add('d-none');
    custSearch.parentElement.classList.remove('d-none');
}

// Product Search — AJAX
const prodSearch  = document.getElementById('productSearchInput');
const prodResults = document.getElementById('productResults');

prodSearch.addEventListener('input', function() {
    const val = this.value.trim();
    clearTimeout(_prodTimer);
    if(val.length < 1) { prodResults.classList.add('d-none'); return; }

    prodResults.innerHTML = '<div class="list-group-item text-muted"><i class="bi bi-hourglass-split me-1"></i>Searching...</div>';
    prodResults.classList.remove('d-none');

    _prodTimer = setTimeout(function() {
        $.getJSON('ajax/search_products.php', { q: val }, function(data) {
            if(data.length === 0) {
                prodResults.innerHTML = '<div class="list-group-item text-muted">No product found</div>';
            } else {
                data.forEach(p => { _selectedProducts[p.id] = p; });
                prodResults.innerHTML = data.map(p =>
                    `<a href="#" class="list-group-item list-group-item-action py-2 d-flex justify-content-between align-items-center product-item" onclick="addProductToOrder(${p.id}); return false;">
                        <div>
                            <div class="fw-bold">${p.name} <span class="badge bg-secondary font-monospace small">${p.model}</span></div>
                            <div class="text-muted small">Brand: ${p.brand} &bull; Stock: <span class="${p.stock < 5 ? 'text-danger fw-bold' : ''}">${p.stock}</span></div>
                        </div>
                        <div class="text-end">
                            <span class="fw-bold text-primary">Rs. ${p.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </a>`
                ).join('');
            }
        });
    }, 250);
});

// Close dropdowns on outside click
document.addEventListener('click', function(e) {
    if(!custSearch.contains(e.target) && !custResults.contains(e.target)) custResults.classList.add('d-none');
    if(!prodSearch.contains(e.target) && !prodResults.contains(e.target)) prodResults.classList.add('d-none');
});

function addProductToOrder(id) {
    const prod = _selectedProducts[id];
    if(prod) {
        const existing = cart.find(item => item.id === id);
        if(existing) {
            if(existing.qty < prod.stock) {
                existing.qty++;
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Stock Limit Reached',
                    text: `Cannot exceed available stock of ${prod.stock} for ${prod.name}`,
                    confirmButtonColor: '#0d6efd'
                });
            }
        } else {
            cart.push({
                id: prod.id,
                name: prod.name,
                model: prod.model,
                price: prod.price,
                stock: prod.stock,
                qty: 1,
                discount: 0
            });
        }
        prodResults.classList.add('d-none');
        prodSearch.value = '';
        renderCart();
    }
}

function updateQty(id, qty) {
    const item = cart.find(i => i.id === id);
    if(item) {
        qty = parseInt(qty);
        if(qty > item.stock) {
            Swal.fire({
                icon: 'warning',
                title: 'Stock Limit Reached',
                text: `Cannot exceed available stock of ${item.stock}`,
                confirmButtonColor: '#0d6efd'
            });
            item.qty = item.stock;
        } else if(qty < 1 || isNaN(qty)) {
            item.qty = 1;
        } else {
            item.qty = qty;
        }
        renderCart();
    }
}

function updateDiscount(id, discount) {
    const item = cart.find(i => i.id === id);
    if(item) {
        discount = parseFloat(discount);
        if(discount > 100) discount = 100;
        if(discount < 0 || isNaN(discount)) discount = 0;
        item.discount = discount;
        renderCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('orderItemsContainer');
    if(cart.length === 0) {
        container.innerHTML = `
            <tr id="emptyCartRow">
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="bi bi-cart-x fs-3 d-block mb-2"></i>
                    No products added to the order yet.
                </td>
            </tr>
        `;
        document.getElementById('summarySubtotal').innerText = 'Rs. 0.00';
        document.getElementById('summaryDiscount').innerText = '- Rs. 0.00';
        document.getElementById('summaryTotal').innerText = 'Rs. 0.00';
        return;
    }

    let subtotal = 0;
    let totalDiscount = 0;

    container.innerHTML = cart.map((item, index) => {
        const itemSubtotal = item.price * item.qty;
        const itemDiscount = itemSubtotal * (item.discount / 100);
        const itemTotal = itemSubtotal - itemDiscount;

        subtotal += itemSubtotal;
        totalDiscount += itemDiscount;

        return `
            <tr>
                <td class="ps-3">
                    <div class="fw-bold">${item.name}</div>
                    <small class="text-muted">Model: ${item.model} (Stock: ${item.stock})</small>
                    <input type="hidden" name="items[${index}][product_id]" value="${item.id}">
                </td>
                <td>Rs. ${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td>
                    <input type="number" name="items[${index}][qty]" class="form-control form-control-sm" value="${item.qty}" min="1" max="${item.stock}" style="width: 70px" onchange="updateQty(${item.id}, this.value)">
                </td>
                <?php if ($admin_role === 'Admin'): ?>
                <td>
                    <div class="input-group input-group-sm" style="width: 90px">
                        <input type="number" name="items[${index}][discount]" class="form-control" value="${item.discount}" min="0" max="100" onchange="updateDiscount(${item.id}, this.value)">
                        <span class="input-group-text">%</span>
                    </div>
                </td>
                <?php else: ?>
                <td><input type="hidden" name="items[${index}][discount]" value="0"><span class="text-muted small">—</span></td>
                <?php endif; ?>
                <td class="fw-bold text-dark">Rs. ${itemTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td>
                    <button type="button" class="btn btn-link text-danger p-0" onclick="removeFromCart(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    const grandTotal = subtotal - totalDiscount;

    document.getElementById('summarySubtotal').innerText = 'Rs. ' + subtotal.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('summaryDiscount').innerText = '- Rs. ' + totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('summaryTotal').innerText = 'Rs. ' + grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2});
}

// Client-side form submit check with Bootstrap validation styling & SweetAlert alerts
document.getElementById('orderForm').addEventListener('submit', function(e) {
    const form = this;
    const userType = document.querySelector('input[name="user_type"]:checked').value;

    if (cart.length === 0) {
        e.preventDefault();
        e.stopPropagation();
        Swal.fire({
            icon: 'warning',
            title: 'Cart is Empty',
            text: 'Please search and add at least one product to the order before finalizing.',
            confirmButtonColor: '#0d6efd'
        });
        return false;
    }
    
    if (userType === 'registered') {
        const custId = document.getElementById('customerIdField').value;
        if (!custId) {
            e.preventDefault();
            e.stopPropagation();
            Swal.fire({
                icon: 'warning',
                title: 'Registered Member Required',
                text: 'Please search and select a registered member profile.',
                confirmButtonColor: '#0d6efd'
            });
            document.getElementById('customerSearchInput').focus();
            return false;
        }
    } else {
        // Validate Walk-in Customer mandatory fields & strict input constraints
        const nameVal = document.getElementById('walkinNameInput').value.trim();
        const phoneVal = document.getElementById('walkinPhoneInput').value.trim();
        const emailVal = document.getElementById('walkinEmailInput').value.trim();
        const addressVal = document.getElementById('walkinAddressInput').value.trim();

        let errorMsg = '';

        if (!nameVal || nameVal.length < 2) {
            errorMsg = 'Customer Name is mandatory and must be at least 2 characters long.';
        } else if (!/^[a-zA-Z\s]+$/.test(nameVal)) {
            errorMsg = 'Customer Name must contain only letters and spaces. Numbers, decimals, hyphens, plus signs, and special characters are not allowed.';
        } else if (!phoneVal || !/^0[0-9]{9}$/.test(phoneVal)) {
            errorMsg = 'Phone Number is mandatory and must be a valid 10-digit Sri Lankan number starting with 0 (e.g. 0771234567).';
        } else if (!emailVal) {
            errorMsg = 'Email Address is mandatory.';
        } else if ((emailVal.match(/@/g) || []).length !== 1) {
            errorMsg = 'Email Address must contain exactly ONE "@" symbol (e.g. customer@domain.com). Double "@" is invalid.';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailVal)) {
            errorMsg = 'Please enter a valid email address format (e.g. customer@domain.com).';
        } else if (!addressVal || addressVal.length < 3) {
            errorMsg = 'Location / Address is mandatory and must be at least 3 characters long.';
        }

        if (errorMsg !== '' || !form.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
            form.classList.add('was-validated');
            Swal.fire({
                icon: 'error',
                title: 'Mandatory Details Missing',
                text: errorMsg || 'Please complete all mandatory customer details correctly before finalizing the order.',
                confirmButtonColor: '#d33'
            });
            return false;
        }
    }
    
    form.classList.add('was-validated');
});

// Sanitize and validate walk-in customer name in real-time
document.getElementById('walkinNameInput').addEventListener('input', function() {
    this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
    const val = this.value.trim();
    if (val.length < 2) {
        this.setCustomValidity('Customer Name must be at least 2 characters long.');
    } else {
        this.setCustomValidity('');
    }
});

// Validate walk-in customer email in real-time
document.getElementById('walkinEmailInput').addEventListener('input', function() {
    const val = this.value.trim();
    if (!val) {
        this.setCustomValidity('Email Address is mandatory.');
    } else if ((val.match(/@/g) || []).length !== 1) {
        this.setCustomValidity('Email Address must contain exactly ONE "@" symbol.');
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
        this.setCustomValidity('Please enter a valid email address format (e.g. customer@domain.com).');
    } else {
        this.setCustomValidity('');
    }
});

// Sanitize and validate walk-in customer phone in real-time
document.getElementById('walkinPhoneInput').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
    const val = this.value.trim();
    if (!/^0[0-9]{9}$/.test(val)) {
        this.setCustomValidity('Phone Number must be a valid 10-digit Sri Lankan number starting with 0.');
    } else {
        this.setCustomValidity('');
    }
});

// Validate walk-in customer address in real-time
document.getElementById('walkinAddressInput').addEventListener('input', function() {
    const val = this.value.trim();
    if (val.length < 3) {
        this.setCustomValidity('Location / Address must be at least 3 characters long.');
    } else if (!/^[a-zA-Z0-9\s\.\,\-\/]+$/.test(val)) {
        this.setCustomValidity('Location / Address contains invalid characters.');
    } else {
        this.setCustomValidity('');
    }
});
</script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
