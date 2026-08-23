<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart | Terms & Conditions</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; color: #495057; line-height: 1.7; }
        .page-title-bar { background: linear-gradient(135deg, #0d6efd 0%, #0056d2 100%); color: white; padding: 40px 0; margin-bottom: 40px; }
        .terms-card { border: none; border-radius: 16px; box-shadow: 0 4px 25px rgba(0,0,0,0.05); background: white; padding: 40px; }
        .terms-section-title { font-size: 1.25rem; font-weight: 700; color: #212529; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #0d6efd; padding-left: 12px; }
        .loyalty-highlight-box { background: rgba(255, 193, 7, 0.08); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 10px; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
<?php include_once('../includes/storefront/front_header.php'); ?>

<div class="page-title-bar">
    <div class="container text-center text-md-start">
        <h2 class="mb-2 fw-bold"><i class="fa-solid fa-file-contract me-3"></i>Terms & Conditions</h2>
        <p class="mb-0 text-white-50">Please read our store policies and user agreement carefully before making purchases.</p>
    </div>
</div>

<div class="container mb-5">
    <div class="row">
        <div class="col-lg-12">
            <div class="terms-card">
                <p class="text-muted small">Last updated: May 24, 2026</p>
                <p>Welcome to Mobile Mart. By using our website and purchasing products from us, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.</p>

                <h5 class="terms-section-title">1. Introduction & General Agreement</h5>
                <p>These terms govern your use of the Mobile Mart storefront, including browsing, account creation, wishlist updates, cart operations, and checkouts. We reserve the right to amend these terms at any time without prior notification.</p>

                <h5 class="terms-section-title">2. User Registration & Accounts</h5>
                <p>To place orders, you must create a customer account. You are solely responsible for maintaining the confidentiality of your credentials (email and password) and all activities occurring under your account. Registration details must be accurate and valid.</p>

                <h5 class="terms-section-title">3. Pricing & Payments</h5>
                <p>All prices listed on Mobile Mart are displayed in local currency (Rs.) and are subject to change. Payment can be made using Cash on Delivery (COD) or other options listed during checkout. Orders are subject to verification and approval by our management staff.</p>

                <h5 class="terms-section-title">4. Loyalty Points Program</h5>
                <div class="loyalty-highlight-box">
                    <h6 class="fw-bold text-dark mb-3"><i class="fa-solid fa-crown text-warning me-2"></i>Customer Loyalty Points Terms</h6>
                    <p class="mb-2">We offer a rewarding Loyalty Points Program for registered customers shopping with Mobile Mart:</p>
                    <ul class="mb-0">
                        <li class="mb-2"><strong>Point Accumulation:</strong> Customers earn exactly <strong>1 loyalty point for every Rs. 100 spent</strong> on eligible purchases (calculated on the total order amount).</li>
                        <li class="mb-2"><strong>Status Requirement:</strong> Points are only credited to your account once your order status is marked as <strong>Completed</strong> by our store staff.</li>
                        <li class="mb-2"><strong>Reversals and Deductions:</strong> If a completed order is cancelled, returned, or reverted to a "Pending" status, the corresponding points earned from that order will be deducted from your loyalty balance.</li>
                        <li class="mb-0"><strong>Checking Balances:</strong> Your cumulative loyalty points balance is visible on your customer dashboard (<strong>My Profile</strong> page) and is updated automatically.</li>
                    </ul>
                </div>

                <h5 class="terms-section-title">5. Shipping & Order Fulfillment</h5>
                <p>We offer secure delivery services. Delivery timelines are estimates and are subject to courier handling. Customers are required to provide complete and accurate delivery addresses on their profiles.</p>

                <h5 class="terms-section-title">6. Limitation of Liability</h5>
                <p>Mobile Mart shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our products or services.</p>
            </div>
        </div>
    </div>
</div>

<?php include_once('../includes/storefront/front_footer.php'); ?>
</body>
</html>







    // Fetch products with variant base price fallback
    $filter_category = '';
    $where_clauses = [];

    // Check if a product filter is selected
    if (isset($_GET['product']) && !empty($_GET['product'])) {
        $filter_category = mysqli_real_escape_string($conn, $_GET['product']);
        $where_clauses[] = "tblproducts.ProductName = '$filter_category'";
    }

  

    // Assemble the WHERE clause
    $filter = '';
    if (!empty($where_clauses)) {
        $filter = "WHERE " . implode(" AND ", $where_clauses);
    }

    $query_pricing = "SELECT tblproducts.*, 
                             IFNULL(NULLIF(tblproducts.Price, 0), (SELECT MIN(v.Price) FROM tblproduct_variants v WHERE v.ProductId = tblproducts.ID)) AS Price 
                      FROM tblproducts 
                      $filter 
                      ORDER BY tblproducts.CreationDate DESC";
    $ret = mysqli_query($conn, $query_pricing);
    $total = mysqli_num_rows($ret);

    





  $filter_category = '';
    $where_clauses = [];

    // Check if a product filter is selected
    if (isset($_GET['product']) && !empty($_GET['product'])) {
        $filter_category = mysqli_real_escape_string($conn, $_GET['product']);
        $where_clauses[] = "tblproducts.ProductName = '$filter_category'";
    }

     $filter = '';
    if (!empty($where_clauses)) {
        $filter = "WHERE " . implode(" AND ", $where_clauses);
    }
