<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include("../config/db.php");
$required_roles = ['Admin', 'Sales person'];
include("../includes/admin/auth_admin.php");

// 1. Toggle Customer Status (Soft Delete / Deactivate)
if (isset($_GET['toggle_status'])) {
    if ($_SESSION['admin_role'] !== 'Admin') {
        $_SESSION['error_msg'] = "Access Denied: Only Admins can deactivate or activate customers.";
        header("Location: reg-users.php");
        exit();
    }
    $uid = (int)$_GET['toggle_status'];
    $u_res = mysqli_query($conn, "SELECT Status FROM tbluser WHERE ID='$uid'");
    if ($u_row = mysqli_fetch_assoc($u_res)) {
        $new_status = ($u_row['Status'] === 'Inactive') ? 'Active' : 'Inactive';
        mysqli_query($conn, "UPDATE tbluser SET Status='$new_status' WHERE ID='$uid'");
        $_SESSION['success_msg'] = "Customer account status updated to " . $new_status . ". Data preserved for auditing.";
    }
    header("Location: reg-users.php");
    exit();
}

// 2. Edit Customer Profile
if (isset($_POST['edit_user'])) {
    $uid = (int)$_POST['user_id'];
    $fname = trim(mysqli_real_escape_string($conn, $_POST['firstname']));
    $lname = trim(mysqli_real_escape_string($conn, $_POST['lastname']));
    $email = trim(mysqli_real_escape_string($conn, $_POST['email']));
    $mobile = trim(mysqli_real_escape_string($conn, $_POST['mobilenumber']));
    $loyalty = (int)$_POST['loyaltypoints'];
    $status = isset($_POST['status']) && in_array($_POST['status'], ['Active', 'Inactive']) ? $_POST['status'] : 'Active';

    if ($_SESSION['admin_role'] !== 'Admin') {
        // Enforce the current status for non-admins
        $status_check_q = mysqli_query($conn, "SELECT Status FROM tbluser WHERE ID='$uid'");
        if ($status_row = mysqli_fetch_assoc($status_check_q)) {
            $status = $status_row['Status'];
        }
    }

    // 1. Mobile number validation (exactly 10 digits starting with 0)
    if (!preg_match('/^0[0-9]{9}$/', $mobile)) {
        $_SESSION['error_msg'] = "Mobile number must be exactly 10 digits starting with 0.";
    } else {
        // 2. Check for duplicate email or mobile number
        $check = mysqli_query($conn, "SELECT ID, Email, MobileNumber FROM tbluser WHERE (Email='$email' OR MobileNumber='$mobile') AND ID!='$uid'");
        if (mysqli_num_rows($check) > 0) {
            $existing = mysqli_fetch_assoc($check);
            if ($existing['Email'] === $email) {
                $_SESSION['error_msg'] = "Failed to update profile. Email is already in use by another customer.";
            } else {
                $_SESSION['error_msg'] = "Failed to update profile. Mobile number is already in use by another customer.";
            }
        } else {
            $upd = mysqli_query($conn, "UPDATE tbluser SET FirstName='$fname', LastName='$lname', Email='$email', MobileNumber='$mobile', LoyaltyPoints='$loyalty', Status='$status' WHERE ID='$uid'");
            if ($upd) {
                $_SESSION['success_msg'] = "Customer profile updated successfully.";
            } else {
                $_SESSION['error_msg'] = "Failed to update profile. Please try again.";
            }
        }
    }
    header("Location: reg-users.php");
    exit();
}

// 3. Search and filter query
$search_query = "";
$where_clause = "";
if (isset($_GET['search_query']) && trim($_GET['search_query']) !== "") {
    $search_query = mysqli_real_escape_string($conn, trim($_GET['search_query']));
    $where_clause = "WHERE FirstName LIKE '%$search_query%' OR LastName LIKE '%$search_query%' OR Email LIKE '%$search_query%' OR MobileNumber LIKE '%$search_query%'";
}

$count_res = mysqli_query($conn, "SELECT COUNT(*) as total FROM tbluser $where_clause");
$total_rows = mysqli_fetch_assoc($count_res)['total'] ?? 0;

$limit = 10;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$total_pages = ceil($total_rows / $limit);
if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
$offset = ($page - 1) * $limit;

$ret = mysqli_query($conn, "SELECT * FROM tbluser $where_clause ORDER BY RegDate DESC LIMIT $limit OFFSET $offset");
?>
<?php include('../includes/admin/header.php'); ?>

<div class="container-fluid">
    <div class="row">
        <?php include '../includes/admin/sidebar.php'; ?>

        <div class="col-md-10 p-4">
            
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="mb-0 fw-bold text-dark">Customer Directory</h3>
                    <p class="text-muted small mb-0">Search registered store users, view their purchase log, or manage account status.</p>
                </div>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0 bg-transparent p-0">
                        <li class="breadcrumb-item"><a href="dashboard.php" class="text-decoration-none">Dashboard</a></li>
                        <li class="breadcrumb-item active">Customers</li>
                    </ol>
                </nav>
            </div>

            <!-- Search Filter Panel -->
            <div class="card shadow-sm border-0 mb-4">
                <div class="card-body">
                    <form method="get" action="reg-users.php" class="row g-3 align-items-center">
                        <div class="col-md-9">
                            <div class="input-group">
                                <span class="input-group-text bg-light border-end-0"><i class="bi bi-search text-muted"></i></span>
                                <input type="text" name="search_query" class="form-control border-start-0 ps-0" placeholder="Search by name, email or phone number..." value="<?= htmlspecialchars($search_query); ?>">
                            </div>
                        </div>
                        <div class="col-md-3 d-flex gap-2">
                            <button type="submit" class="btn btn-primary w-100"><i class="bi bi-funnel"></i> Search</button>
                            <?php if($search_query !== ""): ?>
                                <a href="reg-users.php" class="btn btn-outline-secondary">Clear</a>
                            <?php endif; ?>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Customer Grid -->
            <div class="card shadow-sm border-0 border-top border-primary border-4">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-4">S.NO</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Mobile Number</th>
                                    <th class="text-center">Status</th>
                                    <th class="text-center">Loyalty Points</th>
                                    <th>Registration Date</th>
                                    <th class="text-center pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $cnt = $offset + 1;
                                if($total_rows > 0) {
                                    while ($row = mysqli_fetch_array($ret)) {
                                        $uStatus = $row['Status'] ?? 'Active';
                                ?>
                                <tr>
                                    <td class="ps-4 text-muted"><?= $cnt; ?></td>
                                    <td class="fw-bold text-dark"><?= htmlspecialchars($row['FirstName'] . " " . $row['LastName']); ?></td>
                                    <td><?= htmlspecialchars($row['Email']); ?></td>
                                    <td><?= htmlspecialchars($row['MobileNumber']); ?></td>
                                    <td class="text-center">
                                        <?php if($uStatus === 'Active'): ?>
                                            <span class="badge bg-success bg-opacity-10 text-success border border-success-subtle px-3 py-1">Active</span>
                                        <?php else: ?>
                                            <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle px-3 py-1">Inactive</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge bg-warning bg-opacity-10 text-dark border border-warning-subtle px-3 py-1.5 fs-7 fw-bold">
                                            <i class="bi bi-crown text-warning me-1"></i><?= $row['LoyaltyPoints']; ?>
                                        </span>
                                    </td>
                                    <td><span class="text-muted small"><?= date('M d, Y h:i A', strtotime($row['RegDate'])); ?></span></td>
                                    <td class="text-center pe-4">
                                        <div class="d-flex justify-content-center gap-2">
                                            <a href="user-orders.php?uid=<?= $row['ID']; ?>" class="btn btn-sm btn-info text-white">
                                                <i class="bi bi-journal-text"></i> Purchases
                                            </a>
                                            <button type="button" class="btn btn-sm btn-primary btn-edit-user" 
                                                    data-id="<?= $row['ID']; ?>" 
                                                    data-fname="<?= htmlspecialchars($row['FirstName']); ?>"
                                                    data-lname="<?= htmlspecialchars($row['LastName']); ?>"
                                                    data-email="<?= htmlspecialchars($row['Email']); ?>"
                                                    data-mobile="<?= htmlspecialchars($row['MobileNumber']); ?>"
                                                    data-loyalty="<?= $row['LoyaltyPoints']; ?>"
                                                    data-status="<?= htmlspecialchars($uStatus); ?>">
                                                <i class="bi bi-pencil"></i> Edit
                                            </button>
                                            <?php if ($_SESSION['admin_role'] === 'Admin'): ?>
                                                <?php if($uStatus === 'Active'): ?>
                                                    <a href="reg-users.php?toggle_status=<?= $row['ID']; ?>" class="btn btn-sm btn-warning confirm-link confirm-action" data-confirm-message="Are you sure you want to mark this customer account as Inactive? Their order history will be safely preserved.">
                                                        <i class="bi bi-person-x"></i> Deactivate
                                                    </a>
                                                <?php else: ?>
                                                    <a href="reg-users.php?toggle_status=<?= $row['ID']; ?>" class="btn btn-sm btn-success confirm-link confirm-action" data-confirm-message="Are you sure you want to reactivate this customer account?">
                                                        <i class="bi bi-person-check"></i> Activate
                                                    </a>
                                                <?php endif; ?>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                                <?php $cnt++; } } else { ?>
                                    <tr>
                                        <td colspan="8" class="text-center py-5 text-muted">No registered customers found.</td>
                                    </tr>
                                <?php } ?> 
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination Controls -->
                    <?php if ($total_pages > 1): ?>
                    <nav class="d-flex justify-content-center py-3">
                        <ul class="pagination pagination-custom gap-1 mb-0">
                            <?php $query_params = !empty($search_query) ? ['search_query' => $search_query] : []; ?>
                            <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?<?php echo http_build_query(array_merge($query_params, ['page' => $page - 1])); ?>">&laquo;</a>
                            </li>
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
                                <a class="page-link" href="?<?php echo http_build_query(array_merge($query_params, ['page' => 1])); ?>">1</a>
                            </li>
                            
                            <?php if ($start_page > 2): ?>
                                <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                            <?php endif; ?>
                            
                            <?php for($i = $start_page; $i <= $end_page; $i++): ?>
                                <li class="page-item <?php echo ($page == $i) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?<?php echo http_build_query(array_merge($query_params, ['page' => $i])); ?>">
                                        <?php echo $i; ?>
                                    </a>
                                </li>
                            <?php endfor; ?>
                            
                            <?php if ($end_page < $total_pages - 1): ?>
                                <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                            <?php endif; ?>
                            
                            <?php if ($total_pages > 1): ?>
                                <li class="page-item <?php echo ($page == $total_pages) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?<?php echo http_build_query(array_merge($query_params, ['page' => $total_pages])); ?>"><?php echo $total_pages; ?></a>
                                </li>
                            <?php endif; ?>
                            <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?<?php echo http_build_query(array_merge($query_params, ['page' => $page + 1])); ?>">&raquo;</a>
                            </li>
                        </ul>
                    </nav>
                    <?php endif; ?>
                </div>
            </div>

        </div>
    </div>
</div>

<!-- Edit User Modal -->
<div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <form method="post" action="reg-users.php" class="modal-content confirm-submit" data-confirm-message="Are you sure you want to save changes to this customer profile?">
            <div class="modal-header">
                <h5 class="modal-title fw-bold" id="editUserModalLabel"><i class="bi bi-pencil-square text-primary me-2"></i>Edit Customer Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <input type="hidden" name="user_id" id="edit_user_id">
                
                <div class="row g-2 mb-3">
                    <div class="col-md-6">
                        <label class="form-label small fw-semibold">First Name</label>
                        <input type="text" name="firstname" id="edit_firstname" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small fw-semibold">Last Name</label>
                        <input type="text" name="lastname" id="edit_lastname" class="form-control" required>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Email Address</label>
                    <input type="email" name="email" id="edit_email" class="form-control" required>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Mobile Number</label>
                    <input type="text" name="mobilenumber" id="edit_mobile" class="form-control" pattern="0[0-9]{9}" title="Must be exactly 10 digits starting with 0" required>
                </div>

                <div class="mb-3">
                    <label class="form-label small fw-semibold">Account Status</label>
                    <select name="status" id="edit_status" class="form-select" required <?php echo ($_SESSION['admin_role'] !== 'Admin') ? 'disabled' : ''; ?>>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                    <?php if ($_SESSION['admin_role'] !== 'Admin'): ?>
                        <input type="hidden" name="status" id="edit_status_hidden">
                    <?php endif; ?>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Loyalty Points</label>
                    <input type="number" name="loyaltypoints" id="edit_loyalty" class="form-control" min="0" required>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" name="edit_user" class="btn btn-primary rounded-pill px-4">Save Changes</button>
            </div>
        </form>
    </div>
</div>

<?php include_once('../includes/components/confirmation.php');?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const editModal = new bootstrap.Modal(document.getElementById('editUserModal'));
    
    document.querySelectorAll('.btn-edit-user').forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('edit_user_id').value = this.dataset.id;
            document.getElementById('edit_firstname').value = this.dataset.fname;
            document.getElementById('edit_lastname').value = this.dataset.lname;
            document.getElementById('edit_email').value = this.dataset.email;
            document.getElementById('edit_mobile').value = this.dataset.mobile;
            document.getElementById('edit_loyalty').value = this.dataset.loyalty;
            const statusSelect = document.getElementById('edit_status');
            statusSelect.value = this.dataset.status || 'Active';
            const hiddenStatus = document.getElementById('edit_status_hidden');
            if (hiddenStatus) {
                hiddenStatus.value = this.dataset.status || 'Active';
            }
            editModal.show();
        });
    });
});
</script>
<?php include '../includes/admin/footer.php'; ?>