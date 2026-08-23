<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

include("../includes/admin/auth_admin.php");

if (!isset($_GET['uid'])) {
    header('location:reg-users.php');
    exit();
}

$uid = (int)$_GET['uid'];

// Fetch user profile info
$user_q = mysqli_query($conn, "SELECT FirstName, LastName, Email, MobileNumber, LoyaltyPoints, RegDate FROM tbluser WHERE ID='$uid'");
$user = mysqli_fetch_assoc($user_q);
if (!$user) {
    header('location:reg-users.php');
    exit();
}

// Fetch stats for this user
$orders_count = $conn->query("SELECT COUNT(*) FROM tbl_order_master WHERE UserId='$uid'")->fetch_row()[0] ?? 0;
$total_spend = $conn->query("SELECT SUM(TotalAmount) FROM tbl_order_master WHERE UserId='$uid' AND OrderStatus='Completed'")->fetch_row()[0] ?? 0;

// Pagination configuration
$limit = 10;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$total_pages = ceil($orders_count / $limit);
if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
$offset = ($page - 1) * $limit;

// Fetch paginated orders for this user
$orders_res = mysqli_query($conn, 
    "SELECT ID, OrderNumber, TotalAmount, PaymentMethod, TransactionDetails, OrderStatus, OrderDate 
     FROM tbl_order_master 
     WHERE UserId='$uid' 
     ORDER BY OrderDate DESC
     LIMIT $limit OFFSET $offset"
);
?>
<?php include('../includes/admin/header.php'); ?>

<div class="container-fluid">
    <div class="row">
        <?php include '../includes/admin/sidebar.php'; ?>

        <div class="col-md-10 p-4">
            
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="mb-0 fw-bold text-dark">Customer Purchase History</h3>
                    <p class="text-muted small mb-0">Review completed orders, net spend metrics, and invoices for <?= htmlspecialchars($user['FirstName'] . ' ' . $user['LastName']); ?>.</p>
                </div>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0 bg-transparent p-0">
                        <li class="breadcrumb-item"><a href="dashboard.php" class="text-decoration-none">Dashboard</a></li>
                        <li class="breadcrumb-item"><a href="reg-users.php" class="text-decoration-none">Customers</a></li>
                        <li class="breadcrumb-item active">Purchase History</li>
                    </ol>
                </nav>
            </div>

            <!-- Customer Card -->
            <div class="card shadow-sm border-0 mb-4">
                <div class="card-body p-4">
                    <div class="row align-items-center">
                        <div class="col-md-6 border-end">
                            <h5 class="fw-bold mb-3"><i class="bi bi-person-circle text-primary me-2"></i><?= htmlspecialchars($user['FirstName'] . ' ' . $user['LastName']); ?></h5>
                            <div class="small text-muted mb-2"><strong>Email Address:</strong> <?= htmlspecialchars($user['Email']); ?></div>
                            <div class="small text-muted mb-2"><strong>Mobile Phone:</strong> <?= htmlspecialchars($user['MobileNumber']); ?></div>
                            <div class="small text-muted"><strong>Registered On:</strong> <?= date('F d, Y h:i A', strtotime($user['RegDate'])); ?></div>
                        </div>
                        <div class="col-md-6 ps-md-4 mt-3 mt-md-0">
                            <div class="row text-center">
                                <div class="col-4 border-end">
                                    <h6 class="text-muted small mb-1">Total Orders</h6>
                                    <h3 class="fw-bold text-dark"><?= $orders_count; ?></h3>
                                </div>
                                <div class="col-4 border-end">
                                    <h6 class="text-muted small mb-1">Loyalty Points</h6>
                                    <h3 class="fw-bold text-warning"><i class="bi bi-crown text-warning me-1"></i><?= (int)$user['LoyaltyPoints']; ?></h3>
                                </div>
                                <div class="col-4">
                                    <h6 class="text-muted small mb-1">Total Spent</h6>
                                    <h4 class="fw-bold text-success">Rs. <?= number_format($total_spend, 2); ?></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Orders Table -->
            <div class="card shadow-sm border-0 border-top border-primary border-4">
                <div class="card-header bg-white border-0 pt-4 pb-0">
                    <h5 class="fw-bold"><i class="bi bi-receipt me-2 text-secondary"></i>Order Ledger</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-4">S.NO</th>
                                    <th>Order Number</th>
                                    <th>Total Amount</th>
                                    <th>Payment Method</th>
                                    <th>Order Date</th>
                                    <th>Status</th>
                                    <th class="text-center">Invoice</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $cnt = $offset + 1;
                                if ($orders_count > 0 && mysqli_num_rows($orders_res) > 0) {
                                    while ($row = mysqli_fetch_assoc($orders_res)) {
                                        $order_id = $row['ID'];
                                        $status = $row['OrderStatus'];
                                ?>
                                <tr>
                                    <td class="ps-4"><?= $cnt; ?></td>
                                    <td class="fw-bold"><?= htmlspecialchars($row['OrderNumber']); ?></td>
                                    <td class="fw-bold text-primary">Rs. <?= number_format($row['TotalAmount'], 2); ?></td>
                                    <td><span class="badge bg-light text-dark border"><?= htmlspecialchars($row['PaymentMethod']); ?></span></td>
                                    <td><?= date('M d, Y h:i A', strtotime($row['OrderDate'])); ?></td>
                                    <td>
                                        <span class="badge <?= ($status === 'Completed') ? 'bg-success' : 'bg-warning text-dark'; ?>">
                                            <?= $status; ?>
                                        </span>
                                    </td>
                                    <td class="text-center">
                                        <a href="../storefront/invoice.php?oid=<?= $order_id; ?>&isAdmin=1&uid=<?= $uid; ?>" class="btn btn-sm btn-outline-primary rounded-pill px-3" target="_blank">
                                            <i class="bi bi-file-earmark-pdf me-1"></i> View Invoice
                                        </a>
                                    </td>
                                </tr>
                                <?php
                                        $cnt++;
                                    }
                                } else {
                                ?>
                                <tr>
                                    <td colspan="7" class="text-center text-muted py-5">
                                        No order history found for this customer.
                                    </td>
                                </tr>
                                <?php } ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination Controls -->
                    <?php if ($total_pages > 1): ?>
                    <nav class="d-flex justify-content-center py-3">
                        <ul class="pagination pagination-custom gap-1 mb-0">
                            <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?uid=<?php echo $uid; ?>&page=<?php echo $page - 1; ?>">&laquo;</a>
                            </li>
                            <?php for($i = 1; $i <= $total_pages; $i++): ?>
                                <li class="page-item <?php echo ($page == $i) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?uid=<?php echo $uid; ?>&page=<?php echo $i; ?>"><?php echo $i; ?></a>
                                </li>
                            <?php endfor; ?>
                            <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?uid=<?php echo $uid; ?>&page=<?php echo $page + 1; ?>">&raquo;</a>
                            </li>
                        </ul>
                    </nav>
                    <?php endif; ?>
                </div>
            </div>

        </div>
    </div>
</div>

<?php include '../includes/admin/footer.php'; ?>
