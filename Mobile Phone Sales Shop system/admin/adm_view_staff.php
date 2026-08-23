<?php
session_start();
include("../config/db.php");
$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");
include("../includes/admin/header.php");

// Initialize search and filter variables
$search = $_GET['search'] ?? "";
$searchTerm = "%$search%";
$roleFilter = $_GET['role'] ?? "";

// Build dynamic SQL query safely
$where_sql = " WHERE 1=1";
$types = "";
$params = [];

if (!empty($search)) {
    $where_sql .= " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
    $types .= "sss";
    $params[] = $searchTerm;
    $params[] = $searchTerm;
    $params[] = $searchTerm;
}

if (!empty($roleFilter)) {
    $where_sql .= " AND role = ?";
    $types .= "s";
    $params[] = $roleFilter;
}

// Count total
$count_sql = "SELECT COUNT(*) as total FROM staff_users" . $where_sql;
$stmt_count = $conn->prepare($count_sql);
if (!empty($params)) {
    $stmt_count->bind_param($types, ...$params);
}
$stmt_count->execute();
$total_rows = $stmt_count->get_result()->fetch_assoc()['total'] ?? 0;
$stmt_count->close();

$limit = 10;
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$total_pages = ceil($total_rows / $limit);
if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
$offset = ($page - 1) * $limit;

$sql = "SELECT * FROM staff_users" . $where_sql . " ORDER BY id DESC LIMIT ? OFFSET ?";
$types_pag = $types . "ii";
$params_pag = array_merge($params, [$limit, $offset]);

$stmt = $conn->prepare($sql);
$stmt->bind_param($types_pag, ...$params_pag);
$stmt->execute();
$result = $stmt->get_result();
?>

<div class="container-fluid">
    <div class="row">
        <?php include '../includes/admin/sidebar.php'; ?>

        <div class="col-md-10 p-4">
            
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="mb-0 fw-bold">Staff Management</h4>
                <a href="adm_add_staff.php" class="btn btn-primary d-flex align-items-center gap-2">
                    <i class="bi bi-person-plus"></i> Add New Staff
                </a>
            </div>



            <div class="card shadow-sm border-0">
                <div class="card-header bg-white py-3">
                    <form method="GET" class="row g-2 align-items-center">
                        <div class="col-md-5">
                            <div class="input-group">
                                <span class="input-group-text bg-light border-end-0"><i class="bi bi-search"></i></span>
                                <input type="text" name="search" class="form-control border-start-0 ps-0" placeholder="Search by name or email..." value="<?= htmlspecialchars($search); ?>">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <select name="role" class="form-select">
                                <option value="">All Roles</option>
                                <option value="Admin" <?= ($roleFilter == 'Admin') ? 'selected' : '' ?>>Admin</option>
                                <option value="Sales person" <?= ($roleFilter == 'Sales person') ? 'selected' : '' ?>>Sales person</option>
                                <option value="Technician" <?= ($roleFilter == 'Technician') ? 'selected' : '' ?>>Technician</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-secondary w-100" type="submit">Filter</button>
                        </div>
                    </form>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th class="ps-3">ID</th>
                                <th>Staff Member</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th class="text-end pe-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if($result->num_rows > 0): ?>
                                <?php while ($row = $result->fetch_assoc()): 
                                    // Encode row data to pass to JavaScript safely
                                    $jsonData = htmlspecialchars(json_encode($row), ENT_QUOTES, 'UTF-8');
                                ?>
                                    <tr>
                                        <td class="ps-3 text-muted">#<?= $row['id'] ?></td>
                                        <td class="fw-medium text-primary" style="cursor: pointer;" onclick="viewStaffDetails(<?= $jsonData ?>)"><?= htmlspecialchars($row['first_name'] . " " . $row['last_name']) ?></td>
                                        <td><?= htmlspecialchars($row['email']) ?></td>
                                        <td><?= htmlspecialchars($row['phone'] ?? 'N/A') ?></td>
                                        <td><span class="badge bg-light text-dark border"><?= $row['role'] ?></span></td>
                                        <td>
                                            <?php if($row['status'] == 'Active'): ?>
                                                <span class="badge bg-success bg-opacity-10 text-success">Active</span>
                                            <?php else: ?>
                                                <span class="badge bg-secondary bg-opacity-10 text-secondary">Inactive (Resigned)</span>
                                            <?php endif; ?>
                                        </td>
                                        <td class="text-end pe-3">
                                            <a href="adm_edit_staff.php?id=<?= $row['id']; ?>" class="btn btn-sm btn-primary">
                                                <i class="bi bi-pencil"></i> Edit Profile / Status
                                            </a>
                                        </td>
                                    </tr>
                                <?php endwhile; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="7" class="text-center py-4 text-muted">No staff members found matching criteria.</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination Controls -->
                <?php if ($total_pages > 1): ?>
                <nav class="d-flex justify-content-center py-3">
                    <ul class="pagination pagination-custom gap-1 mb-0">
                        <?php 
                        $url_params = [];
                        if (!empty($search)) $url_params['search'] = $search;
                        if (!empty($roleFilter)) $url_params['role'] = $roleFilter;
                        ?>
                        <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
                            <a class="page-link" href="?<?php echo http_build_query(array_merge($url_params, ['page' => $page - 1])); ?>">&laquo;</a>
                        </li>
                        <?php for($i = 1; $i <= $total_pages; $i++): ?>
                            <li class="page-item <?php echo ($page == $i) ? 'active' : ''; ?>">
                                <a class="page-link" href="?<?php echo http_build_query(array_merge($url_params, ['page' => $i])); ?>"><?php echo $i; ?></a>
                            </li>
                        <?php endfor; ?>
                        <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
                            <a class="page-link" href="?<?php echo http_build_query(array_merge($url_params, ['page' => $page + 1])); ?>">&raquo;</a>
                        </li>
                    </ul>
                </nav>
                <?php endif; ?>
            </div>

        </div>
    </div>
</div>

<div class="modal fade" id="staffDetailsModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow">
      <div class="modal-header bg-dark text-white">
        <h5 class="modal-title"><i class="bi bi-person-badge me-2"></i> Staff Details</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body p-4">
        <div class="text-center mb-4">
            <div class="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style="width: 80px; height: 80px;">
                <i class="bi bi-person text-primary fs-1"></i>
            </div>
            <h4 id="modalName" class="mb-0 fw-bold">Name</h4>
            <span id="modalRole" class="badge bg-secondary mt-1">Role</span>
            <span id="modalStatus" class="badge mt-1 ms-1">Status</span>
        </div>

        <table class="table table-sm table-borderless">
            <tr><th class="text-muted w-25">Email</th><td id="modalEmail" class="fw-medium"></td></tr>
            <tr><th class="text-muted w-25">Phone</th><td id="modalPhone"></td></tr>
            <tr><th class="text-muted w-25">Gender</th><td id="modalGender"></td></tr>
            <tr><th class="text-muted w-25">DOB</th><td id="modalDob"></td></tr>
        </table>
      </div>
      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <a href="#" id="modalEditBtn" class="btn btn-primary"><i class="bi bi-pencil-square me-1"></i> Edit Profile</a>
      </div>
    </div>
  </div>
</div>

<script>
// Function to populate and show the modal
function viewStaffDetails(data) {
    document.getElementById('modalName').textContent = data.first_name + ' ' + data.last_name;
    document.getElementById('modalRole').textContent = data.role;
    
    // Status Badge Logic
    let statusBadge = document.getElementById('modalStatus');
    statusBadge.textContent = data.status;
    if(data.status === 'Active') {
        statusBadge.className = 'badge bg-success';
    } else {
        statusBadge.className = 'badge bg-secondary';
    }

    document.getElementById('modalEmail').textContent = data.email;
    document.getElementById('modalPhone').textContent = data.phone || 'N/A';
    document.getElementById('modalGender').textContent = data.gender;
    document.getElementById('modalDob').textContent = data.birth_date;
    
    // Set Edit Button Link dynamically
    document.getElementById('modalEditBtn').href = 'adm_edit_staff.php?id=' + data.id;

    // Show Modal using Bootstrap JS
    var myModal = new bootstrap.Modal(document.getElementById('staffDetailsModal'));
    myModal.show();
}
</script>

<?php include_once('../includes/components/confirmation.php'); ?>
<?php include '../includes/admin/footer.php'; ?>