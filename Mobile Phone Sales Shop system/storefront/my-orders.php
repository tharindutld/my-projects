<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

if(empty($_SESSION['msmsuid'])) {
    header('Location: login.php');
    exit();
}

$userid = $_SESSION['msmsuid'];

// Active tab detection
$active_tab = isset($_GET['tab']) ? $_GET['tab'] : 'current';
if (!in_array($active_tab, ['current', 'history'])) {
    $active_tab = 'current';
}

$search = "";
$search_cond = "";
if ($active_tab === 'history') {
    if (isset($_GET['search']) && trim($_GET['search']) !== "") {
        $search = mysqli_real_escape_string($conn, trim($_GET['search']));
        $search_cond = " AND (
            m.OrderNumber LIKE '%$search%' OR 
            EXISTS (
                SELECT 1 FROM tbl_order_items oi 
                JOIN tblproduct_variants v ON oi.VariantId = v.ID 
                JOIN tblproducts p ON v.ProductId = p.ID 
                WHERE oi.OrderMasterId = m.ID AND (p.ProductName LIKE '%$search%' OR p.BrandName LIKE '%$search%')
            )
        )";
    }
}

// 1. Current Orders Query (Pending / Processing / etc.)
$current_query_str = "SELECT ID, OrderNumber, TotalAmount, PaymentMethod, TransactionDetails, OrderStatus, OrderDate, DeliveryStatus, OrderRating,
                             ShippingName, ShippingPhone, ShippingCountry, ShippingAddress, ShippingPostalCode,
                             BillingName, BillingPhone, BillingCountry, BillingAddress, BillingPostalCode
                      FROM tbl_order_master
                      WHERE UserId = '$userid' AND OrderStatus NOT IN ('Completed', 'Cancelled')
                      ORDER BY OrderDate DESC";

// 2. History Orders Count Query (Completed / Cancelled)
$count_query = mysqli_query($conn,
    "SELECT COUNT(DISTINCT m.ID) 
     FROM tbl_order_master m 
     WHERE m.UserId = '$userid' AND m.OrderStatus IN ('Completed', 'Cancelled') $search_cond"
);
$total_history_orders = mysqli_fetch_row($count_query)[0] ?? 0;

// History Pagination
$limit = 5;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$total_pages = ceil($total_history_orders / $limit);
if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
$offset = ($page - 1) * $limit;

$history_query_str = "SELECT m.ID, m.OrderNumber, m.TotalAmount, m.PaymentMethod, m.TransactionDetails, m.OrderStatus, m.OrderDate, m.DeliveryStatus, m.OrderRating,
                             m.ShippingName, m.ShippingPhone, m.ShippingCountry, m.ShippingAddress, m.ShippingPostalCode,
                             m.BillingName, m.BillingPhone, m.BillingCountry, m.BillingAddress, m.BillingPostalCode
                      FROM tbl_order_master m
                      WHERE m.UserId = '$userid' AND m.OrderStatus IN ('Completed', 'Cancelled') $search_cond
                      ORDER BY m.OrderDate DESC
                      LIMIT $limit OFFSET $offset";

// Execute appropriate query
$orders_query = mysqli_query($conn, ($active_tab === 'current') ? $current_query_str : $history_query_str);

$orders = [];
while($row = mysqli_fetch_assoc($orders_query)) {
    $order_id = $row['ID'];
    
    // Fetch items for this order
    $items_query = mysqli_query($conn,
        "SELECT oi.ProductQty, oi.ProductPrice, v.Color, v.RAM, v.ROM, p.ProductName, p.BrandName, p.ModelNumber, p.Image1
         FROM tbl_order_items oi
         JOIN tblproduct_variants v ON oi.VariantId = v.ID
         JOIN tblproducts p ON v.ProductId = p.ID
         WHERE oi.OrderMasterId = '$order_id'"
     );
    
    $items = [];
    while($item_row = mysqli_fetch_assoc($items_query)) {
        $items[] = $item_row;
    }
    
    $row['items'] = $items;
    $orders[] = $row;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart | My Orders</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; }
        .order-card { border: none; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); transition: transform 0.2s; }
        .order-card:hover { transform: translateY(-3px); }
        .page-title-bar { background: linear-gradient(135deg, #0d6efd 0%, #0056d2 100%); color: white; padding: 30px 0; margin-bottom: 30px; }
        
        /* Stepper tracker styling */
        .stepper-wrapper { display: flex; justify-content: space-between; margin-bottom: 20px; position: relative; }
        .stepper-wrapper::before { content: ""; position: absolute; top: 15px; left: 10%; right: 10%; height: 3px; background-color: #dee2e6; z-index: 1; }
        .stepper-item { display: flex; flex-direction: column; align-items: center; flex: 1; z-index: 2; position: relative; }
        .step-counter { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background-color: #dee2e6; color: #fff; font-weight: bold; margin-bottom: 6px; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .step-name { font-size: 11px; font-weight: 600; color: #6c757d; text-transform: uppercase; }
        
        .stepper-item.completed .step-counter { background-color: #198754; }
        .stepper-item.completed .step-name { color: #198754; }
        .stepper-item.pending .step-counter { background-color: #0d6efd; }
        .stepper-item.pending .step-name { color: #0d6efd; }
        
        .progress-line-fill { position: absolute; top: 15px; left: 10%; height: 3px; background-color: #198754; z-index: 1; transition: width 0.4s ease; }


        /* Order rating stars */
        .rating-stars { display: inline-flex; gap: 4px; }
        .rating-stars .rating-star { font-size: 1.2rem; color: #dee2e6; cursor: pointer; transition: color 0.15s ease, transform 0.1s ease; }
        .rating-stars .rating-star.filled { color: #ffc107; }
        .rating-stars.locked .rating-star { cursor: default; }
        .rating-stars:not(.locked) .rating-star:hover { transform: scale(1.15); }
    </style>



</head>
<body>
<?php include_once('../includes/storefront/front_header.php'); ?>

<div class="page-title-bar">
    <div class="container">
        <h2 class="mb-0 fw-bold"><i class="fa-solid fa-box-open me-3"></i>My Orders</h2>
    </div>
</div>

<div class="container mb-5">
    <!-- Tabs Navigation -->
    <ul class="nav nav-pills nav-fill mb-4 p-1 bg-white rounded-pill shadow-sm border" style="max-width: 500px; margin: 0 auto;">
        <li class="nav-item">
            <a class="nav-link rounded-pill py-2.5 fw-semibold <?php echo ($active_tab === 'current') ? 'active bg-primary text-white' : 'text-secondary'; ?>" 
               href="my-orders.php?tab=current">
                <i class="fa-solid fa-basket-shopping me-2"></i>Current Orders
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link rounded-pill py-2.5 fw-semibold <?php echo ($active_tab === 'history') ? 'active bg-primary text-white' : 'text-secondary'; ?>" 
               href="my-orders.php?tab=history">
                <i class="fa-solid fa-clock-rotate-left me-2"></i>Order History
            </a>
        </li>
    </ul>

    <!-- Search bar for Order History -->
    <?php if ($active_tab === 'history'): ?>
        <div class="card shadow-sm border-0 mb-4 rounded-4 bg-white p-3">
            <form method="get" action="my-orders.php" class="row g-2 align-items-center">
                <input type="hidden" name="tab" value="history">
                <div class="col-md-9">
                    <div class="input-group">
                        <span class="input-group-text bg-light border-0 text-muted"><i class="fa-solid fa-magnifying-glass"></i></span>
                        <input type="text" name="search" class="form-control bg-light border-0" placeholder="Search past orders by product name or brand..." value="<?php echo htmlspecialchars($search); ?>">
                    </div>
                </div>
                <div class="col-md-3 d-flex gap-2">
                    <button type="submit" class="btn btn-primary w-100 py-2"><i class="fa-solid fa-filter me-1"></i> Filter</button>
                    <?php if ($search !== ""): ?>
                        <a href="my-orders.php?tab=history" class="btn btn-outline-secondary w-50 py-2 d-flex align-items-center justify-content-center"><i class="fa-solid fa-xmark"></i></a>
                    <?php endif; ?>
                </div>
            </form>
        </div>
    <?php endif; ?>

    <?php if(empty($orders)): ?>
        <div class="card order-card p-5 text-center">
            <div class="py-4">
                <i class="fa-solid fa-receipt text-muted mb-3" style="font-size: 4rem;"></i>
                <?php if ($active_tab === 'current'): ?>
                    <h4 class="fw-bold">No Current Orders</h4>
                    <p class="text-muted">You do not have any pending or processing orders at the moment.</p>
                    <a href="shop-mobile.php" class="btn btn-primary rounded-pill px-4 mt-2">Start Shopping</a>
                <?php else: ?>
                    <h4 class="fw-bold">No Order History</h4>
                    <p class="text-muted"><?php echo ($search !== "") ? "No completed orders found matching '" . htmlspecialchars($search) . "'." : "You do not have any completed or cancelled orders."; ?></p>
                    <?php if ($search !== ""): ?>
                        <a href="my-orders.php?tab=history" class="btn btn-outline-primary rounded-pill px-4 mt-2">Clear Search</a>
                    <?php else: ?>
                        <a href="shop-mobile.php" class="btn btn-primary rounded-pill px-4 mt-2">Start Shopping</a>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        </div>
    <?php else: ?>
        <div class="row g-4">
            <div class="col-12">
                
                <?php foreach($orders as $order): ?>
                    <div class="card order-card mb-4 overflow-hidden">
                        
                        <!-- Order Header -->
                        <div class="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <span class="text-muted small text-uppercase">Order Number:</span>
                                <h6 class="fw-bold text-dark mb-0"><?php echo htmlspecialchars($order['OrderNumber']); ?></h6>
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <div>
                                    <span class="text-muted small text-uppercase d-block text-end">Order Date:</span>
                                    <span class="fw-semibold text-dark" style="font-size: 0.9rem;"><?php echo date('M d, Y h:i A', strtotime($order['OrderDate'])); ?></span>
                                </div>
                                <span class="border-start" style="height: 25px;"></span>
                                <div>
                                    <span class="text-muted small text-uppercase d-block text-end">Total Amount:</span>
                                    <span class="fw-bold text-primary" style="font-size: 1.05rem;">Rs. <?php echo number_format($order['TotalAmount'], 2); ?></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Order Body -->
                        <div class="card-body p-4">
                            <div class="row g-4 align-items-center">
                                
                                <!-- Product Items -->
                                <div class="col-md-7 border-end">
                                    <div class="pe-md-3">
                                        <?php foreach($order['items'] as $item): ?>
                                            <div class="d-flex align-items-center gap-3 mb-3">
                                                <img src="../uploads/products/<?php echo htmlspecialchars($item['Image1']); ?>" style="width: 55px; height: 55px; object-fit: contain; border: 1px solid #eee; padding: 3px; border-radius: 6px;" alt="">
                                                <div class="flex-grow-1">
                                                    <h6 class="fw-semibold mb-0" style="font-size: 0.95rem;"><?php echo htmlspecialchars($item['ProductName']); ?></h6>
                                                    <span class="text-muted small">
                                                        <?php echo htmlspecialchars($item['BrandName']); ?> &bull; <?php echo htmlspecialchars($item['ModelNumber']); ?> &bull; 
                                                        <?php echo htmlspecialchars($item['Color']); ?>
                                                        <?php if(!empty($item['ROM']) || !empty($item['RAM'])): ?>
                                                            (<?php echo htmlspecialchars($item['ROM']); ?> / <?php echo htmlspecialchars($item['RAM']); ?>)
                                                        <?php endif; ?>
                                                    </span>
                                                </div>
                                                <div class="text-end">
                                                    <span class="fw-semibold text-dark d-block" style="font-size: 0.9rem;">Rs. <?php echo number_format($item['ProductPrice'], 2); ?></span>
                                                    <span class="text-muted small">Qty: <?php echo $item['ProductQty']; ?></span>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                                
                                <!-- Order Tracking & Actions -->
                                <div class="col-md-5 ps-md-4">
                                    
                                    <!-- Stepper Tracker -->
                                    <?php
                                        $status = $order['OrderStatus'];
                                        $del_status = $order['DeliveryStatus'];
                                        
                                        if ($status === 'Cancelled'):
                                    ?>
                                        <div class="alert alert-danger py-2 text-center small rounded-pill mb-4">
                                            <i class="fa-solid fa-ban me-2"></i> This order has been Cancelled.
                                        </div>
                                    <?php else: ?>
                                        <div class="stepper-wrapper">
                                            <?php
                                                $step1 = 'completed'; // Placed is always completed
                                                $step2 = '';
                                                $step3 = '';
                                                $step4 = '';
                                                $fill_width = '0%';
                                                
                                                if ($del_status === 'Processing') {
                                                    $step2 = 'pending';
                                                    $fill_width = '16%';
                                                } elseif ($del_status === 'Shipped' || $del_status === 'In Transit') {
                                                    $step2 = 'completed';
                                                    $step3 = 'pending';
                                                    $fill_width = '50%';
                                                } elseif ($del_status === 'Delivered') {
                                                    $step2 = 'completed';
                                                    $step3 = 'completed';
                                                    $step4 = 'completed';
                                                    $fill_width = '100%';
                                                }
                                            ?>
                                            
                                            <!-- Fill line based on status -->
                                            <div class="progress-line-fill" style="width: <?php echo $fill_width; ?>"></div>
                                            
                                            <div class="stepper-item <?= $step1; ?>">
                                                <div class="step-counter"><i class="fa-solid fa-receipt" style="font-size: 0.8rem;"></i></div>
                                                <div class="step-name">Placed</div>
                                            </div>
                                            <div class="stepper-item <?= $step2; ?>">
                                                <div class="step-counter"><i class="fa-solid fa-spinner" style="font-size: 0.8rem;"></i></div>
                                                <div class="step-name">Processing</div>
                                            </div>
                                            <div class="stepper-item <?= $step3; ?>">
                                                <div class="step-counter"><i class="fa-solid fa-truck" style="font-size: 0.8rem;"></i></div>
                                                <div class="step-name">Shipped</div>
                                            </div>
                                            <div class="stepper-item <?= $step4; ?>">
                                                <div class="step-counter"><i class="fa-solid fa-house-chimney" style="font-size: 0.8rem;"></i></div>
                                                <div class="step-name">Delivered</div>
                                            </div>
                                        </div>
                                    <?php endif; ?>
                                   
                                    <div class="text-muted small mb-3">
                                        <strong>Payment Method:</strong> <?php echo htmlspecialchars($order['PaymentMethod']); ?><br>
                                        <span class="text-truncate d-block mb-2" title="<?php echo htmlspecialchars($order['TransactionDetails']); ?>">
                                            <strong>Details:</strong> <?php echo htmlspecialchars($order['TransactionDetails']); ?>
                                        </span>
                                        
                                        <!-- Shipping & Billing Details -->
                                        <div class="row g-2 mt-2 pt-2 border-top">
                                            <div class="col-6">
                                                <strong class="text-dark small d-block mb-1"><i class="fa-solid fa-truck me-1"></i> Shipping:</strong>
                                                <span class="d-block text-truncate" style="font-size: 0.8rem;"><?php echo htmlspecialchars($order['ShippingName'] ?? ''); ?></span>
                                                <span class="d-block text-muted text-truncate" style="font-size: 0.75rem;"><?php echo htmlspecialchars($order['ShippingAddress'] ?? ''); ?></span>
                                            </div>
                                            <div class="col-6 border-start ps-2">
                                                <strong class="text-dark small d-block mb-1"><i class="fa-solid fa-file-invoice-dollar me-1"></i> Billing:</strong>
                                                <span class="d-block text-truncate" style="font-size: 0.8rem;"><?php echo htmlspecialchars($order['BillingName'] ?? ''); ?></span>
                                                <span class="d-block text-muted text-truncate" style="font-size: 0.75rem;"><?php echo htmlspecialchars($order['BillingAddress'] ?? ''); ?></span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="d-flex gap-2">
                                        <a href="invoice.php?oid=<?php echo $order['ID']; ?>" target="_blank" class="btn btn-outline-dark btn-sm rounded-pill px-3 flex-grow-1 d-flex align-items-center justify-content-center">
                                            <i class="fa-solid fa-file-invoice-dollar me-2"></i>View Invoice
                                        </a>
                                        <a href="invoice.php?oid=<?php echo $order['ID']; ?>&print=1" target="_blank" class="btn btn-primary btn-sm rounded-pill px-3 flex-grow-1 d-flex align-items-center justify-content-center">
                                            <i class="fa-solid fa-print me-2"></i>Print Invoice
                                        </a>
                                    </div>

                                    <?php if ($status === 'Completed'): ?>
                                        <?php $current_rating = (int)($order['OrderRating'] ?? 0); ?>
                                        <div class="d-flex align-items-center justify-content-between mt-3 pt-3 border-top">
                                            <span class="text-muted small fw-semibold">Rate this order:</span>
                                            <div class="rating-stars" data-order-id="<?php echo (int)$order['ID']; ?>">
                                                <?php for ($s = 1; $s <= 5; $s++): ?>
                                                    <i class="fa-solid fa-star rating-star <?php echo ($s <= $current_rating) ? 'filled' : ''; ?>" data-value="<?php echo $s; ?>"></i>
                                                <?php endfor; ?>
                                            </div>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                
                            </div>
                        </div>
                        
                    </div>
                <?php endforeach; ?>
                
            </div>
        </div>

        <!-- Pagination Controls -->
        <?php if ($active_tab === 'history' && $total_pages > 1): ?>
            <nav class="d-flex justify-content-center mt-4">
                <ul class="pagination pagination-custom gap-1">
                    <!-- Previous Page -->
                    <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
                        <a class="page-link" href="?tab=history&search=<?php echo urlencode($search); ?>&page=<?php echo $page - 1; ?>" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                    
                    <!-- Page Numbers -->
                    <?php for($i = 1; $i <= $total_pages; $i++): ?>
                        <li class="page-item <?php echo ($page == $i) ? 'active' : ''; ?>">
                            <a class="page-link" href="?tab=history&search=<?php echo urlencode($search); ?>&page=<?php echo $i; ?>">
                                <?php echo $i; ?>
                            </a>
                        </li>
                    <?php endfor; ?>
                    
                    <!-- Next Page -->
                    <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
                        <a class="page-link" href="?tab=history&search=<?php echo urlencode($search); ?>&page=<?php echo $page + 1; ?>" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
        <?php endif; ?>
    <?php endif; ?>
</div>

<?php include_once('../includes/storefront/front_footer.php'); ?>
<?php include_once('../includes/components/confirmation.php'); ?>

<script>
document.querySelectorAll('.rating-stars').forEach(function(widget) {
    const orderId = widget.dataset.orderId;
    //const stars = widget.querySelectorAll('.rating-star');
    const stars = widget.querySelectorAll('.rating-star');
    function paint(upTo) {
        stars.forEach(function(star) {
            star.classList.toggle('filled', parseInt(star.dataset.value, 10) <= upTo);
        });
    }

    stars.forEach(function(star) {
        star.addEventListener('click', function() {
            const rating = parseInt(star.dataset.value, 10);
            if (widget.classList.contains('locked')) return;
            widget.classList.add('locked');

            fetch('ajax/rate-order.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'order_id=' + encodeURIComponent(orderId) + '&rating=' + encodeURIComponent(rating)
            })
            .then(res => res.json())
            .then(data => {
                widget.classList.remove('locked');
                if (data.success) {
                    paint(data.rating);
                    Swal.fire({ icon: 'success', title: 'Thanks!', text: data.message, timer: 1500, showConfirmButton: false });
                } else {
                    Swal.fire({ icon: 'error', title: 'Oops', text: data.message });
                }
            })
            .catch(function() {
                widget.classList.remove('locked');
                Swal.fire({ icon: 'error', title: 'Oops', text: 'Something went wrong. Please try again.' });
            });
        });
    });
});
</script>
</body>
</html>
