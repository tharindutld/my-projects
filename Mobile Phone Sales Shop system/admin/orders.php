<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

$required_roles = ['Admin', 'Sales person'];
include("../includes/admin/auth_admin.php");

// Update Order Status
if (isset($_GET['action']) && $_GET['action'] == 'status' && isset($_GET['oid']) && isset($_GET['status'])) {
    $oid = (int)$_GET['oid'];
    $status = mysqli_real_escape_string($conn, $_GET['status']);
    if (in_array($status, ['Pending', 'Completed', 'Cancelled'])) {
        // Fetch order details for loyalty point adjustments
        $order_q = mysqli_query($conn, "SELECT UserId, TotalAmount, PointsAwarded, OrderStatus FROM tbl_order_master WHERE ID='$oid'");
        if ($order_row = mysqli_fetch_assoc($order_q)) {
            $user_id = $order_row['UserId'];
            $total = $order_row['TotalAmount'];
            $awarded = $order_row['PointsAwarded'];
            $old_status = $order_row['OrderStatus'];
            $points = floor($total / 1000);

            // Fetch Walk-in Customer ID to skip loyalty points
            $walkin_q = mysqli_query($conn, "SELECT ID FROM tbluser WHERE Email='walkin@mobilestore.com'");
            $walkin_row = mysqli_fetch_assoc($walkin_q);
            $walkin_id = $walkin_row ? $walkin_row['ID'] : 0;

            // Handle loyalty points adjustments
            if ($status === 'Completed' && $awarded == 0 && $user_id != $walkin_id) {
                // Award points
                mysqli_query($conn, "UPDATE tbluser SET LoyaltyPoints = LoyaltyPoints + $points WHERE ID='$user_id'");
                mysqli_query($conn, "UPDATE tbl_order_master SET OrderStatus='Completed', PointsAwarded=1 WHERE ID='$oid'");
            } elseif ($status !== 'Completed' && $awarded == 1 && $user_id != $walkin_id) {
                // Deduct points (revert)
                mysqli_query($conn, "UPDATE tbluser SET LoyaltyPoints = GREATEST(0, LoyaltyPoints - $points) WHERE ID='$user_id'");
                mysqli_query($conn, "UPDATE tbl_order_master SET OrderStatus='$status', PointsAwarded=0 WHERE ID='$oid'");
            } else {
                mysqli_query($conn, "UPDATE tbl_order_master SET OrderStatus='$status' WHERE ID='$oid'");
            }

            // Handle stock adjustments for Cancelled state
            if ($status === 'Cancelled' && $old_status !== 'Cancelled') {
                // Returning stock to inventory
                $items_q = mysqli_query($conn, "SELECT VariantId, ProductQty FROM tbl_order_items WHERE OrderMasterId='$oid'");
                while ($item = mysqli_fetch_assoc($items_q)) {
                    $vid = $item['VariantId'];
                    $qty = $item['ProductQty'];
                    mysqli_query($conn, "UPDATE tblproduct_variants SET Stock = Stock + $qty WHERE ID='$vid'");
                    mysqli_query($conn, "INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES ('$vid', '$qty', 'Correction', 'Stock returned from Cancelled Order #$oid')");
                }
            }
            // If moving away from Cancelled
            elseif ($status !== 'Cancelled' && $old_status === 'Cancelled') {
                // Re-deduct stock
                $items_q = mysqli_query($conn, "SELECT VariantId, ProductQty FROM tbl_order_items WHERE OrderMasterId='$oid'");
                while ($item = mysqli_fetch_assoc($items_q)) {
                    $vid = $item['VariantId'];
                    $qty = $item['ProductQty'];
                    mysqli_query($conn, "UPDATE tblproduct_variants SET Stock = GREATEST(0, Stock - $qty) WHERE ID='$vid'");
                    mysqli_query($conn, "INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES ('$vid', '-$qty', 'Sale', 'Stock re-deducted for restored Order #$oid')");
                }
            }
            $_SESSION['success_msg'] = "Order status updated to $status successfully.";
        }
    }
    header('Location: orders.php');
    exit();
}

// Update Delivery Status
if (isset($_GET['action']) && $_GET['action'] == 'delivery' && isset($_GET['oid']) && isset($_GET['delivery'])) {
    $oid = (int)$_GET['oid'];
    $delivery = mysqli_real_escape_string($conn, $_GET['delivery']);
    if (in_array($delivery, ['Processing', 'Shipped', 'In Transit', 'Delivered', 'Returned'])) {
        mysqli_query($conn, "UPDATE tbl_order_master SET DeliveryStatus='$delivery' WHERE ID='$oid'");
        $_SESSION['success_msg'] = "Delivery status updated to $delivery successfully.";
        
        // Send email notification
        $email_q = mysqli_query($conn, "SELECT u.Email, m.OrderNumber FROM tbl_order_master m JOIN tbluser u ON m.UserId = u.ID WHERE m.ID = '$oid'");
        if ($email_row = mysqli_fetch_assoc($email_q)) {
            $cust_email = $email_row['Email'];
            $ord_num = $email_row['OrderNumber'];
            if ($cust_email !== 'walkin@mobilestore.com') {
                include_once('../includes/components/email_helper.php');
                sendDeliveryStatusEmail($cust_email, $ord_num, $delivery);
            }
        }
    }
    header('Location: orders.php');
    exit();
}

// Delete Order
if (isset($_GET['delid'])) {
    if ($_SESSION['admin_role'] !== 'Admin') {
        $_SESSION['error_msg'] = "Access Denied: Only Admins can delete orders.";
        header('Location: orders.php');
        exit();
    }
    $oid = (int)$_GET['delid'];
    mysqli_query($conn, "DELETE FROM tbl_order_master WHERE ID='$oid'");
    $_SESSION['success_msg'] = "Order deleted successfully.";
    header('Location: orders.php');
    exit();
}

// Filter Status
$filter_status = "";
$where_clause = "";
if (isset($_GET['status']) && $_GET['status'] !== "") {
    $filter_status = mysqli_real_escape_string($conn, $_GET['status']);
    $where_clause = "WHERE m.OrderStatus = '$filter_status'";
}

// Fetch all orders
$query = "SELECT m.ID, m.OrderNumber, m.TotalAmount, m.PaymentMethod, m.TransactionDetails, m.OrderStatus, m.OrderDate, m.UserId, m.DeliveryStatus,
                 m.ShippingName, m.ShippingPhone, m.ShippingCountry, m.ShippingAddress, m.ShippingPostalCode,
                 m.BillingName, m.BillingPhone, m.BillingCountry, m.BillingAddress, m.BillingPostalCode,
                 u.FirstName, u.LastName, u.Email, u.MobileNumber
          FROM tbl_order_master m
          JOIN tbluser u ON m.UserId = u.ID
          $where_clause
          ORDER BY m.OrderDate DESC";

$orders_res = mysqli_query($conn, $query);
$total_results = mysqli_num_rows($orders_res);

// Filter params
$all_params = [];
if ($filter_status !== "") $all_params['status'] = $filter_status;

// Pagination
$limit = 10;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$total_pages = ceil($total_results / $limit);
if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
$offset = ($page - 1) * $limit;

$paginated_query = "SELECT m.ID, m.OrderNumber, m.TotalAmount, m.PaymentMethod, m.TransactionDetails, m.OrderStatus, m.OrderDate, m.UserId, m.DeliveryStatus,
                     m.ShippingName, m.ShippingPhone, m.ShippingCountry, m.ShippingAddress, m.ShippingPostalCode,
                     m.BillingName, m.BillingPhone, m.BillingCountry, m.BillingAddress, m.BillingPostalCode,
                     u.FirstName, u.LastName, u.Email, u.MobileNumber
              FROM tbl_order_master m
              JOIN tbluser u ON m.UserId = u.ID
              $where_clause
              ORDER BY m.OrderDate DESC LIMIT $limit OFFSET $offset";
$orders_res_paginated = mysqli_query($conn, $paginated_query);
?>
<?php include_once('../includes/admin/header.php');?>
<style>
    .table-responsive {
        min-height: 280px;
    }
</style>

<div class="container-fluid">
    <div class="row">
        <?php include_once('../includes/admin/sidebar.php');?>
        
        <div class="col-md-10 p-4">
            
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 class="mb-0 fw-bold">Order Management</h3>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item"><a href="dashboard.php" class="text-decoration-none">Dashboard</a></li>
                        <li class="breadcrumb-item active">Orders</li>
                    </ol>
                </nav>
            </div>



            <!-- Filters -->
            <div class="card shadow-sm border-0 mb-4">
                <div class="card-body">
                    <form method="get" action="orders.php" class="row g-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label small fw-semibold">Filter by Order Status</label>
                            <select name="status" class="form-select">
                                <option value="">All Orders</option>
                                <option value="Pending" <?php echo ($filter_status === 'Pending') ? 'selected' : ''; ?>>Pending</option>
                                <option value="Completed" <?php echo ($filter_status === 'Completed') ? 'selected' : ''; ?>>Completed</option>
                                <option value="Cancelled" <?php echo ($filter_status === 'Cancelled') ? 'selected' : ''; ?>>Cancelled</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button type="submit" class="btn btn-primary w-100"><i class="bi bi-funnel me-1"></i> Filter</button>
                        </div>
                        <?php if($filter_status !== ""): ?>
                            <div class="col-md-2">
                                <a href="orders.php" class="btn btn-outline-secondary w-100">Clear</a>
                            </div>
                        <?php endif; ?>
                    </form>
                </div>
            </div>

            <!-- Orders Table -->
            <div class="card shadow-sm border-0 border-top border-primary border-4">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-4">S.NO</th>
                                    <th>Order Number</th>
                                    <th>Customer</th>
                                    <th>Total Amount</th>
                                    <th>Payment Method</th>
                                    <th>Order Date</th>
                                    <th>Status</th>
                                    <th>Delivery Status</th>
                                    <th class="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $cnt = $offset + 1;
                                if ($total_results > 0) {
                                    while ($row = mysqli_fetch_assoc($orders_res_paginated)) {
                                        $order_id = $row['ID'];
                                        $status = $row['OrderStatus'];
                                        
                                        // Fetch line items for collapsible detail
                                        $items_q = mysqli_query($conn, 
                                            "SELECT oi.ProductQty, oi.ProductPrice, v.Color, v.RAM, v.ROM, p.ProductName, p.ModelNumber 
                                             FROM tbl_order_items oi 
                                             JOIN tblproduct_variants v ON oi.VariantId = v.ID 
                                             JOIN tblproducts p ON v.ProductId = p.ID 
                                             WHERE oi.OrderMasterId = '$order_id'"
                                        );
                                        $items_list = [];
                                        while($item = mysqli_fetch_assoc($items_q)) {
                                            $items_list[] = $item;
                                        }
                                        
                                        // Setup fallback values for addresses (backward compatibility)
                                        $shipping_name = !empty($row['ShippingName']) ? $row['ShippingName'] : ($row['FirstName'] . ' ' . $row['LastName']);
                                        $shipping_phone = !empty($row['ShippingPhone']) ? $row['ShippingPhone'] : $row['MobileNumber'];
                                        $shipping_address = !empty($row['ShippingAddress']) ? $row['ShippingAddress'] : '';
                                        $shipping_postal = $row['ShippingPostalCode'] ?? '';
                                        $shipping_country = $row['ShippingCountry'] ?? '';
                                        
                                        $billing_name = !empty($row['BillingName']) ? $row['BillingName'] : ($row['FirstName'] . ' ' . $row['LastName']);
                                        $billing_phone = !empty($row['BillingPhone']) ? $row['BillingPhone'] : $row['MobileNumber'];
                                        $billing_address = !empty($row['BillingAddress']) ? $row['BillingAddress'] : '';
                                        $billing_postal = $row['BillingPostalCode'] ?? '';
                                        $billing_country = $row['BillingCountry'] ?? '';
                                ?>
                                <!-- Main Row -->
                                <tr>
                                    <td class="ps-4"><?= $cnt; ?></td>
                                    <td>
                                        <button class="btn btn-link text-decoration-none fw-bold p-0 text-primary" type="button" data-bs-toggle="collapse" data-bs-target="#detail-<?= $order_id; ?>">
                                            <?= htmlspecialchars($row['OrderNumber']); ?> <i class="bi bi-chevron-down small"></i>
                                        </button>
                                    </td>
                                    <td>
                                        <div class="fw-bold"><?= htmlspecialchars($row['FirstName'] . ' ' . $row['LastName']); ?></div>
                                        <div class="text-muted small"><?= htmlspecialchars($row['Email']); ?></div>
                                    </td>
                                    <td class="fw-bold text-primary">Rs. <?= number_format($row['TotalAmount'], 2); ?></td>
                                    <td>
                                        <span class="badge bg-light text-dark border"><i class="bi bi-credit-card me-1"></i> <?= htmlspecialchars($row['PaymentMethod']); ?></span>
                                    </td>
                                    <td><?= date('M d, Y h:i A', strtotime($row['OrderDate'])); ?></td>
                                    <td>
                                        <?php
                                        $badge_class = 'bg-warning text-dark';
                                        if ($status === 'Completed') $badge_class = 'bg-success';
                                        elseif ($status === 'Cancelled') $badge_class = 'bg-danger';
                                        ?>
                                        <span class="badge <?= $badge_class; ?>">
                                            <?= $status; ?>
                                        </span>
                                    </td>
                                    <td>
                                        <?php
                                        $del_status = $row['DeliveryStatus'];
                                        $del_badge = 'bg-secondary';
                                        if ($del_status === 'Shipped') $del_badge = 'bg-primary';
                                        elseif ($del_status === 'In Transit') $del_badge = 'bg-info text-dark';
                                        elseif ($del_status === 'Delivered') $del_badge = 'bg-success';
                                        elseif ($del_status === 'Returned') $del_badge = 'bg-danger';
                                        ?>
                                        <span class="badge <?= $del_badge; ?>">
                                            <?= $del_status; ?>
                                        </span>
                                    </td>
                                    <td class="text-center">
                                        <div class="dropdown">
                                            <button class="btn btn-outline-secondary btn-sm rounded-pill px-3 dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport">
                                                Manage
                                            </button>
                                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                                <li><a class="dropdown-item" href="../storefront/invoice.php?oid=<?= $order_id; ?>&isAdmin=1" target="_blank"><i class="bi bi-file-earmark-pdf me-2"></i> View Invoice</a></li>
                                                <li><a class="dropdown-item" href="../storefront/invoice.php?oid=<?= $order_id; ?>&print=1&isAdmin=1" target="_blank"><i class="bi bi-printer me-2"></i> Print Invoice</a></li>
                                                
                                                <li><hr class="dropdown-divider"></li>
                                                <li><h6 class="dropdown-header">Order Status</h6></li>
                                                <?php if($status !== 'Completed'): ?>
                                                    <li><a class="dropdown-item text-success confirm-link" data-confirm-message="Mark order <?= $row['OrderNumber']; ?> as Completed?" href="orders.php?action=status&oid=<?= $order_id; ?>&status=Completed"><i class="bi bi-check-circle me-2"></i> Mark Completed</a></li>
                                                <?php endif; ?>
                                                <?php if($status !== 'Pending'): ?>
                                                    <li><a class="dropdown-item text-warning confirm-link" data-confirm-message="Revert order <?= $row['OrderNumber']; ?> to Pending?" href="orders.php?action=status&oid=<?= $order_id; ?>&status=Pending"><i class="bi bi-clock me-2"></i> Mark Pending</a></li>
                                                <?php endif; ?>
                                                <?php if($status !== 'Cancelled'): ?>
                                                    <li><a class="dropdown-item text-danger confirm-link" data-confirm-message="Cancel order <?= $row['OrderNumber']; ?>? This will return items to stock." href="orders.php?action=status&oid=<?= $order_id; ?>&status=Cancelled"><i class="bi bi-x-circle me-2"></i> Cancel Order</a></li>
                                                <?php endif; ?>
                                                
                                                <?php if ($status !== 'Cancelled'): ?>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li><h6 class="dropdown-header">Delivery Status</h6></li>
                                                    <li><a class="dropdown-item" href="orders.php?action=delivery&oid=<?= $order_id; ?>&delivery=Processing"><i class="bi bi-gear me-2"></i> Processing</a></li>
                                                    <li><a class="dropdown-item" href="orders.php?action=delivery&oid=<?= $order_id; ?>&delivery=Shipped"><i class="bi bi-truck me-2"></i> Shipped</a></li>
                                                    <li><a class="dropdown-item" href="orders.php?action=delivery&oid=<?= $order_id; ?>&delivery=In Transit"><i class="bi bi-compass me-2"></i> In Transit</a></li>
                                                    <li><a class="dropdown-item" href="orders.php?action=delivery&oid=<?= $order_id; ?>&delivery=Delivered"><i class="bi bi-check2-all me-2"></i> Delivered</a></li>
                                                    <li><a class="dropdown-item text-danger" href="orders.php?action=delivery&oid=<?= $order_id; ?>&delivery=Returned"><i class="bi bi-arrow-return-left me-2"></i> Returned</a></li>
                                                <?php endif; ?>
                                                
                                                <?php if ($_SESSION['admin_role'] === 'Admin'): ?>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li><a class="dropdown-item text-danger confirm-link confirm-delete" data-confirm-message="Permanently delete order <?= $row['OrderNumber']; ?>?" href="orders.php?delid=<?= $order_id; ?>"><i class="bi bi-trash me-2"></i> Delete Order</a></li>
                                                <?php endif; ?>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Collapsible Details Row -->
                                <tr>
                                    <td colspan="9" class="p-0 border-0">
                                        <div id="detail-<?= $order_id; ?>" class="collapse">
                                            <div class="p-4 bg-light border-bottom">
                                                <div class="row g-3">
                                                    <div class="col-md-6 border-end">
                                                        <h6 class="fw-bold text-secondary mb-3"><i class="bi bi-bag-check me-2"></i> Ordered Products</h6>
                                                        <ul class="list-group list-group-flush bg-transparent">
                                                            <?php foreach($items_list as $item): ?>
                                                                <li class="list-group-item bg-transparent d-flex justify-content-between align-items-center px-0 py-2">
                                                                    <div>
                                                                        <span class="fw-semibold text-dark"><?= htmlspecialchars($item['ProductName']); ?></span>
                                                                        <span class="text-muted small">
                                                                            (<?= htmlspecialchars($item['ModelNumber']); ?>) &bull; <?= htmlspecialchars($item['Color']); ?>
                                                                            <?php if(!empty($item['ROM']) || !empty($item['RAM'])): ?>
                                                                                (<?= htmlspecialchars($item['ROM']); ?> / <?= htmlspecialchars($item['RAM']); ?>)
                                                                            <?php endif; ?>
                                                                        </span>
                                                                    </div>
                                                                    <div class="text-end">
                                                                        <span class="text-dark fw-bold small">Rs. <?= number_format($item['ProductPrice'], 2); ?></span>
                                                                        <span class="text-muted small d-block">Qty: <?= $item['ProductQty']; ?></span>
                                                                    </div>
                                                                </li>
                                                            <?php endforeach; ?>
                                                        </ul>
                                                    </div>
                                                    <div class="col-md-6 ps-md-4">
                                                        <h6 class="fw-bold text-secondary mb-3"><i class="bi bi-geo-alt me-2"></i> Shipping & Billing Addresses</h6>
                                                        <div class="row g-2 mb-3">
                                                            <div class="col-6">
                                                                <div class="small">
                                                                    <strong class="text-primary">Shipping Address:</strong><br>
                                                                    <strong>Name:</strong> <?= htmlspecialchars($shipping_name); ?><br>
                                                                    <strong>Address:</strong> <?= htmlspecialchars($shipping_address); ?><br>
                                                                    <strong>ZIP/Country:</strong> <?= htmlspecialchars($shipping_postal . ' ' . $shipping_country); ?><br>
                                                                    <strong>Phone:</strong> <?= htmlspecialchars($shipping_phone); ?>
                                                                </div>
                                                            </div>
                                                            <div class="col-6 border-start ps-3">
                                                                <div class="small">
                                                                    <strong class="text-success">Billing Address:</strong><br>
                                                                    <strong>Name:</strong> <?= htmlspecialchars($billing_name); ?><br>
                                                                    <strong>Address:</strong> <?= htmlspecialchars($billing_address); ?><br>
                                                                    <strong>ZIP/Country:</strong> <?= htmlspecialchars($billing_postal . ' ' . $billing_country); ?><br>
                                                                    <strong>Phone:</strong> <?= htmlspecialchars($billing_phone); ?>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div class="p-3 bg-white border rounded small">
                                                            <strong>Transaction Notes:</strong><br>
                                                            <span class="text-muted"><?= htmlspecialchars($row['TransactionDetails']); ?></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <?php
                                        $cnt++;
                                    }
                                } else {
                                ?>
                                <tr>
                                    <td colspan="9" class="text-center text-muted py-5">
                                        <i class="bi bi-receipt fs-1 d-block mb-3 text-secondary"></i>
                                        No orders found matching the filter.
                                    </td>
                                </tr>
                                <?php } ?>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination Controls -->
                    <?php if ($total_pages > 1): ?>
                    <nav class="d-flex justify-content-center my-4">
                        <ul class="pagination pagination-custom gap-1">
                            <!-- Previous Page -->
                            <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?<?php echo http_build_query(array_merge($all_params, ['page' => $page - 1])); ?>" aria-label="Previous">
                                    <span aria-hidden="true">&laquo;</span>
                                </a>
                            </li>
                            
                            <!-- Page Numbers -->
                            <?php
                            $range = 2; // number of pages to show before and after current page
                            $start_page = $page - $range;
                            $end_page = $page + $range;
                            
                            if ($start_page <= 2) {
                                $end_page += (3 - $start_page);
                                $start_page = 2;
                            }
                            if ($end_page >= $total_pages - 1) {
                                $start_page -= ($end_page - ($total_pages - 2));
                                $end_page = $total_pages - 1;
                            }
                            
                            $start_page = max(2, $start_page);
                            $end_page = min($total_pages - 1, $end_page);
                            
                            // Page 1
                            ?>
                            <li class="page-item <?php echo ($page == 1) ? 'active' : ''; ?>">
                                <a class="page-link" href="?<?php echo http_build_query(array_merge($all_params, ['page' => 1])); ?>">1</a>
                            </li>
                            
                            <?php if ($start_page > 2): ?>
                                <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                            <?php endif; ?>
                            
                            <?php for($i = $start_page; $i <= $end_page; $i++): ?>
                                <li class="page-item <?php echo ($page == $i) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?<?php echo http_build_query(array_merge($all_params, ['page' => $i])); ?>">
                                        <?php echo $i; ?>
                                    </a>
                                </li>
                            <?php endfor; ?>
                            
                            <?php if ($end_page < $total_pages - 1): ?>
                                <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                            <?php endif; ?>
                            
                            <?php if ($total_pages > 1): ?>
                                <li class="page-item <?php echo ($page == $total_pages) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?<?php echo http_build_query(array_merge($all_params, ['page' => $total_pages])); ?>"><?php echo $total_pages; ?></a>
                                </li>
                            <?php endif; ?>
                            
                            <!-- Next Page -->
                            <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?<?php echo http_build_query(array_merge($all_params, ['page' => $page + 1])); ?>" aria-label="Next">
                                    <span aria-hidden="true">&raquo;</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                    <?php endif; ?>
                </div>
            </div>

        </div>
    </div>
</div>

<?php include_once('../includes/components/confirmation.php');?>
<?php include_once('../includes/admin/footer.php');?>
