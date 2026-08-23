<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');

$required_roles = ['Admin', 'Sales person', 'Technician'];
include("../includes/admin/auth_admin.php");
$admin_role = $_SESSION['admin_role'];

// Deletion Logic — Admin only
if (isset($_GET['delid'])) {
    if ($admin_role !== 'Admin') {
        $_SESSION['error_msg'] = "Access Denied: Only Admins can delete repair records.";
        header("Location: manage-repairs.php");
        exit();
    }
    $delid = intval($_GET['delid']);
    $stmt = $conn->prepare("DELETE FROM tbl_repairs WHERE ID = ?");
    $stmt->bind_param("i", $delid);
    if ($stmt->execute()) {
        $_SESSION['success_msg'] = "Repair log deleted successfully.";
    } else {
        $_SESSION['error_msg'] = "Failed to delete repair log.";
    }
    $stmt->close();
    header("Location: manage-repairs.php");
    exit();
}

// Search & Status Filter
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$filter = isset($_GET['filter']) ? trim($_GET['filter']) : '';

// Pagination Configuration
$limit = 10;
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$offset = ($page - 1) * $limit;

// Query construction
$where_clauses = [];
$params = [];
$types = "";

// Technician sees only their own repair jobs
if ($admin_role === 'Technician') {
    $tech_id = (int)$_SESSION['imsaid'];
    $where_clauses[] = "r.TechnicianId = ?";
    $params[] = $tech_id;
    $types .= "i";
}

if ($filter !== '') {
    $status_map = [
        'pending' => 'Pending',
        'in-progress' => 'In-progress',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled'
    ];
    if (isset($status_map[$filter])) {
        $where_clauses[] = "r.Status = ?";
        $params[] = $status_map[$filter];
        $types .= "s";
    }
}

if ($search !== '') {
    $where_clauses[] = "(r.CustomerName LIKE ? OR r.DeviceName LIKE ? OR r.BrandName LIKE ? OR r.ProductName LIKE ? OR r.IMEINumber LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)";
    $search_val = "%$search%";
    $params[] = $search_val;
    $params[] = $search_val;
    $params[] = $search_val;
    $params[] = $search_val;
    $params[] = $search_val;
    $params[] = $search_val;
    $params[] = $search_val;
    $types .= "sssssss";
}

$where_sql = "";
if (!empty($where_clauses)) {
    $where_sql = "WHERE " . implode(" AND ", $where_clauses);
}

// Count total queries for pagination
$count_query = "SELECT COUNT(r.ID) FROM tbl_repairs r JOIN staff_users s ON r.TechnicianId = s.id $where_sql";
$count_stmt = $conn->prepare($count_query);
if (!empty($params)) {
    $count_stmt->bind_param($types, ...$params);
}
$count_stmt->execute();
$total_rows = $count_stmt->get_result()->fetch_row()[0];
$count_stmt->close();

$total_pages = ceil($total_rows / $limit);

// Fetch repairs
$data_query = "SELECT r.*, s.first_name, s.last_name, s.role 
               FROM tbl_repairs r 
               JOIN staff_users s ON r.TechnicianId = s.id 
               $where_sql 
               ORDER BY r.RepairDate DESC, r.ID DESC 
               LIMIT ? OFFSET ?";
$data_stmt = $conn->prepare($data_query);

$bind_params = array_merge($params, [$limit, $offset]);
$data_stmt->bind_param($types . "ii", ...$bind_params);

$data_stmt->execute();
$repairs_res = $data_stmt->get_result();
$data_stmt->close();
?>
<?php include_once('../includes/admin/header.php');?>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<style>
    body { font-family: 'Outfit', sans-serif; background-color: #f4f6f9; }
    .card-repairs { border: none; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .table th { font-weight: 600; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px; }
</style>

<div class="container-fluid">
    <div class="row">
        <?php include_once('../includes/admin/sidebar.php');?>
        
        <div class="col-md-10 p-4">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="dashboard.php" class="text-decoration-none">Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Manage Repairs<?= ($filter !== '') ? ' - ' . ucfirst($filter) : ''; ?></li>
                </ol>
            </nav>

            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="fw-bold text-dark mb-1"><i class="bi bi-wrench text-secondary me-2"></i>Manage Repairs<?= ($filter !== '') ? ' (' . ucfirst($filter) . ')' : ''; ?></h3>
                    <p class="text-muted mb-0 small"><?= $admin_role === 'Technician' ? 'Your assigned repair jobs and job status updates.' : 'Track hardware and device repairs, technician assignments, costs, and profits.'; ?></p>
                </div>
                <?php if ($admin_role !== 'Technician'): ?>
                <div>
                    <a href="add-repair.php" class="btn btn-primary rounded-pill px-4"><i class="bi bi-plus-circle me-1"></i> Log New Repair</a>
                </div>
                <?php endif; ?>
            </div>



            <!-- Table & Search Card -->
            <div class="card card-repairs shadow-sm border-0">
                <div class="card-header bg-white py-3 border-0">
                    <form method="get" class="row g-2 justify-content-end align-items-center">
                        <?php if ($filter !== ''): ?>
                            <input type="hidden" name="filter" value="<?= htmlspecialchars($filter); ?>">
                        <?php endif; ?>
                        <div class="col-auto">
                            <label for="search" class="col-form-label fw-semibold">Search Filter:</label>
                        </div>
                        <div class="col-auto">
                            <input type="text" class="form-control" name="search" id="search" value="<?= htmlspecialchars($search); ?>" placeholder="Customer, Device, or Technician">
                        </div>
                        <div class="col-auto">
                            <button type="submit" class="btn btn-primary"><i class="bi bi-search"></i></button>
                            <?php if ($search !== '' || $filter !== ''): ?>
                                <a href="manage-repairs.php<?= ($filter !== '') ? '?filter=' . urlencode($filter) : ''; ?>" class="btn btn-secondary"><i class="bi bi-x-circle"></i> Clear</a>
                            <?php endif; ?>
                        </div>
                    </form>
                </div>

                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light text-muted">
                                <tr>
                                    <th class="ps-4 text-center" style="width: 60px;">#</th>
                                    <th>Customer Name</th>
                                    <th>Device & Issue</th>
                                    <?php if ($admin_role !== 'Technician'): ?>
                                    <th>Cost / Income</th>
                                    <?php endif; ?>
                                    <th>Technician</th>
                                    <th class="text-center">Status</th>
                                    <th>Date</th>
                                    <th class="text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if ($repairs_res->num_rows > 0): ?>
                                    <?php 
                                    $cnt = $offset + 1;
                                    while($row = $repairs_res->fetch_assoc()): 
                                    ?>
                                        <tr>
                                            <td class="ps-4 text-center text-muted"><?= $cnt; ?></td>
                                            <td class="fw-semibold text-dark"><?= htmlspecialchars($row['CustomerName']); ?></td>
                                            <td>
                                                <div class="fw-semibold text-dark"><?= htmlspecialchars($row['DeviceName']); ?></div>
                                                <?php if (!empty($row['BrandName']) || !empty($row['ProductName'])): ?>
                                                    <div class="small text-muted" style="font-size:0.8rem;">
                                                        <i class="bi bi-tag-fill me-1 text-primary"></i><?= htmlspecialchars(trim(($row['BrandName'] ?? '') . ' ' . ($row['ProductName'] ?? ''))); ?>
                                                    </div>
                                                <?php endif; ?>
                                                <?php if (!empty($row['IMEINumber'])): ?>
                                                    <div class="small font-monospace text-secondary" style="font-size:0.78rem;">
                                                        <i class="bi bi-barcode me-1"></i><?= htmlspecialchars($row['IMEINumber']); ?>
                                                    </div>
                                                <?php endif; ?>
                                                <div class="text-muted small text-truncate mt-1" style="max-width: 220px;" title="<?= htmlspecialchars($row['Issue']); ?>">
                                                    <i class="bi bi-info-circle me-1 text-warning"></i><?= htmlspecialchars($row['Issue']); ?>
                                                </div>
                                            </td>
                                            <?php if ($admin_role !== 'Technician'): ?>
                                            <td>
                                                <div class="text-danger small">Cost: Rs. <?= number_format($row['Cost'], 2); ?></div>
                                                <div class="text-success fw-semibold small">Income: Rs. <?= number_format($row['Income'], 2); ?></div>
                                            </td>
                                            <?php endif; ?>
                                            <td>
                                                <?= htmlspecialchars($row['first_name'] . ' ' . $row['last_name']); ?>
                                                <span class="small text-muted d-block" style="font-size: 0.75rem;"><?= htmlspecialchars($row['role']); ?></span>
                                            </td>
                                            <td class="text-center" id="status-cell-<?= $row['ID']; ?>">
                                                <?php if ($admin_role === 'Admin' || $admin_role === 'Technician'): ?>
                                                <select class="form-select form-select-sm status-select rounded-pill px-2"
                                                        data-repair-id="<?= $row['ID']; ?>"
                                                        style="font-size:0.8rem; min-width:120px;">
                                                    <option value="Pending"      <?= $row['Status']==='Pending'      ? 'selected':'' ?>>Pending</option>
                                                    <option value="In-progress"  <?= $row['Status']==='In-progress'  ? 'selected':'' ?>>In Progress</option>
                                                    <option value="Completed"    <?= $row['Status']==='Completed'    ? 'selected':'' ?>>Completed</option>
                                                    <option value="Cancelled"    <?= $row['Status']==='Cancelled'    ? 'selected':'' ?>>Cancelled</option>
                                                </select>
                                                <?php else: ?>
                                                <?php
                                                    $badge = match($row['Status']) {
                                                        'Completed'   => 'bg-success text-success',
                                                        'Pending'     => 'bg-warning text-warning',
                                                        'In-progress' => 'bg-info text-info',
                                                        default       => 'bg-secondary text-muted'
                                                    };
                                                ?>
                                                <span class="badge <?= $badge ?> bg-opacity-10 px-2 py-1 rounded-pill"><?= htmlspecialchars($row['Status']); ?></span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="small"><?= date('M d, Y', strtotime($row['RepairDate'])); ?></td>
                                            <td class="text-end pe-4">
                                                <div class="d-flex justify-content-end gap-1">
                                                    <a href="edit-repair.php?id=<?= $row['ID']; ?>" class="btn btn-sm btn-primary"><i class="bi bi-pencil"></i> Edit</a>
                                                    <?php if ($admin_role === 'Admin'): ?>
                                                    <a href="manage-repairs.php?delid=<?= $row['ID']; ?>" class="btn btn-sm btn-danger confirm-link confirm-delete" data-confirm-message="Are you sure you want to permanently delete this repair record?"><i class="bi bi-trash"></i> Delete</a>
                                                    <?php endif; ?>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php 
                                    $cnt++; 
                                    endwhile; 
                                    ?>
                                <?php else: ?>
                                    <tr>
                                        <td colspan="<?= ($admin_role !== 'Technician') ? 8 : 7; ?>" class="text-center py-5 text-muted">
                                            <i class="bi bi-wrench fs-2 mb-2 d-block"></i>
                                            No repair records match your search criteria.
                                        </td>
                                    </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination Controls -->
                    <?php if ($total_pages > 1): ?>
                    <nav class="d-flex justify-content-center my-4">
                        <ul class="pagination pagination-custom gap-1">
                            <!-- Previous Page -->
                            <li class="page-item <?= ($page <= 1) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?page=<?= $page - 1; ?>&search=<?= urlencode($search); ?>&filter=<?= urlencode($filter); ?>" aria-label="Previous">
                                    <span aria-hidden="true">&laquo;</span>
                                </a>
                            </li>
                            
                            <?php
                            $range = 2;
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
                            <li class="page-item <?= ($page == 1) ? 'active' : ''; ?>">
                                <a class="page-link" href="?page=1&search=<?= urlencode($search); ?>&filter=<?= urlencode($filter); ?>">1</a>
                            </li>
                            
                            <?php if ($start_page > 2): ?>
                                <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                            <?php endif; ?>
                            
                            <?php for($i = $start_page; $i <= $end_page; $i++): ?>
                                <li class="page-item <?= ($page == $i) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?page=<?= $i; ?>&search=<?= urlencode($search); ?>&filter=<?= urlencode($filter); ?>"><?= $i; ?></a>
                                </li>
                            <?php endfor; ?>
                            
                            <?php if ($end_page < $total_pages - 1): ?>
                                <li class="page-item disabled"><span class="page-link">&hellip;</span></li>
                            <?php endif; ?>
                            
                            <?php if ($total_pages > 1): ?>
                                <li class="page-item <?= ($page == $total_pages) ? 'active' : ''; ?>">
                                    <a class="page-link" href="?page=<?= $total_pages; ?>&search=<?= urlencode($search); ?>&filter=<?= urlencode($filter); ?>"><?= $total_pages; ?></a>
                                </li>
                            <?php endif; ?>
                            
                            <!-- Next Page -->
                            <li class="page-item <?= ($page >= $total_pages) ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?page=<?= $page + 1; ?>&search=<?= urlencode($search); ?>&filter=<?= urlencode($filter); ?>" aria-label="Next">
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

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<?php include_once('../includes/components/confirmation.php'); ?>

<!-- AJAX Toast -->
<div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index:9999">
    <div id="statusToast" class="toast align-items-center border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
            <div class="toast-body fw-semibold" id="statusToastMsg"></div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    </div>
</div>

<script>
$(document).ready(function () {
    // Inline repair status update via AJAX
    $(document).on('change', '.status-select', function () {
        const repairId = $(this).data('repair-id');
        const newStatus = $(this).val();
        const $select = $(this);

        $.ajax({
            url: 'ajax/update_repair_status.php',
            method: 'POST',
            data: { repair_id: repairId, status: newStatus },
            dataType: 'json',
            success: function (resp) {
                const $toast = $('#statusToast');
                if (resp.success) {
                    $toast.removeClass('bg-danger').addClass('text-white bg-success');
                    $('#statusToastMsg').text('Status updated to "' + resp.status + '"');
                } else {
                    $toast.removeClass('bg-success').addClass('text-white bg-danger');
                    $('#statusToastMsg').text(resp.message || 'Update failed.');
                    // Revert select on failure
                    $select.val($select.find('option[selected]').val());
                }
                new bootstrap.Toast($toast[0], { delay: 3000 }).show();
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Network Error',
                    text: 'Network error. Please try again.',
                    confirmButtonColor: '#0d6efd'
                });
            }
        });
    });
});
</script>
<?php include '../includes/admin/footer.php'; ?>
