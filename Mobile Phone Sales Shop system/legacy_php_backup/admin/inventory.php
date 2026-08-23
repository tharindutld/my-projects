<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include('../config/db.php');
$required_roles = ['Admin', 'Sales person'];
include("../includes/admin/auth_admin.php");

// Handle Manual Stock Update — Admin only (Fallback PHP submit)
if (isset($_POST['variant_id'])) {
    if ($admin_role !== 'Admin') {
        $_SESSION['error_msg'] = "Access Denied: Only Admins can manually adjust stock levels.";
        header("Location: inventory.php");
        exit();
    }
    $vid = (int)$_POST['variant_id'];
    $qty = (int)$_POST['qty_adjust'];
    $mtype = mysqli_real_escape_string($conn, $_POST['movement_type']);
    $notes = mysqli_real_escape_string($conn, $_POST['notes']);
    
    // Fetch current variant stock
    $var_q = mysqli_query($conn, "SELECT p.ProductName, v.Color, v.RAM, v.ROM, v.Stock FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.ID='$vid'");
    $var_row = mysqli_fetch_assoc($var_q);
    
    if ($var_row) {
        // Prevent stock going negative
        $new_stock = $var_row['Stock'] + $qty;
        if ($new_stock < 0) {
            $qty = -$var_row['Stock'];
            $new_stock = 0;
        }
        
        $upd = mysqli_query($conn, "UPDATE tblproduct_variants SET Stock='$new_stock' WHERE ID='$vid'");
        if ($upd) {
            // Log movement
            mysqli_query($conn, "INSERT INTO tbl_stock_log (VariantId, Quantity, MovementType, ReferenceInfo) VALUES ('$vid', '$qty', '$mtype', '$notes')");
            $desc = $var_row['ProductName'] . " - " . $var_row['Color'] . " (" . $var_row['ROM'] . " / " . $var_row['RAM'] . " RAM)";
            $_SESSION['success_msg'] = "Stock for " . htmlspecialchars($desc) . " updated to $new_stock units successfully.";
        } else {
            $_SESSION['error_msg'] = "Failed to update stock in database.";
        }
    } else {
        $_SESSION['error_msg'] = "Variant not found.";
    }
    header("Location: inventory.php");
    exit();
}

// Search handling
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$where_clause = "";
if ($search !== '') {
    $esc_search = mysqli_real_escape_string($conn, $search);
    $where_clause = " WHERE (p.ProductName LIKE '%$esc_search%' OR p.BrandName LIKE '%$esc_search%' OR p.ModelNumber LIKE '%$esc_search%' OR v.Color LIKE '%$esc_search%' OR v.RAM LIKE '%$esc_search%' OR v.ROM LIKE '%$esc_search%') ";
}

// Pagination settings
$limit = 10;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$offset = ($page - 1) * $limit;

// Count total variants matching search
$count_q = mysqli_query($conn, "SELECT COUNT(*) FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID $where_clause");
$total_rows = mysqli_fetch_row($count_q)[0] ?? 0;
$total_pages = ceil($total_rows / $limit);

// Fetch inventory data with pagination
$query = "SELECT v.ID as VariantId, p.ProductName, p.BrandName, p.ModelNumber, v.Color, v.RAM, v.ROM, v.Stock, p.Status, 
                 COALESCE(SUM(oi.ProductQty), 0) as soldqty
          FROM tblproduct_variants v
          JOIN tblproducts p ON v.ProductId = p.ID
          LEFT JOIN tbl_order_items oi ON v.ID = oi.VariantId
          LEFT JOIN tbl_order_master om ON oi.OrderMasterId = om.ID AND om.OrderStatus = 'Completed'
          $where_clause
          GROUP BY v.ID
          ORDER BY p.ProductName ASC, v.Color ASC, v.RAM ASC, v.ROM ASC
          LIMIT $limit OFFSET $offset";

$ret = mysqli_query($conn, $query);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mobile Mart || Inventory Management</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <style>
        .badge-fixed { min-width: 80px; text-align: center; }
        .stock-badge { font-size: 0.85rem; padding: 0.45em 0.75em; }
    </style>
</head>
<body>

<div class="d-flex">
    <?php include '../includes/admin/sidebar.php'; ?>

    <div class="flex-grow-1">
        <?php include '../includes/admin/header.php'; ?>
        
        <div class="container-fluid p-4">
            
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 class="mb-0 fw-bold text-dark"><i class="bi bi-box-seam me-2 text-primary"></i>Inventory Stock Management</h3>
                    <p class="text-muted small mb-0">Track stock levels, perform manual adjustments, and search products.</p>
                </div>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0 bg-transparent p-0">
                        <li class="breadcrumb-item"><a href="dashboard.php" class="text-decoration-none">Dashboard</a></li>
                        <li class="breadcrumb-item active">Inventory</li>
                    </ol>
                </nav>
            </div>

            <!-- Low Stock Visual Alert Banner -->
            <?php
            $low_stock_banner_q = mysqli_query($conn, "SELECT p.ProductName, v.ID as VariantId, v.Color, v.RAM, v.ROM, v.Stock FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID WHERE v.Stock <= 5 AND p.Status=1 ORDER BY v.Stock ASC");
            $inv_low_count = $low_stock_banner_q ? mysqli_num_rows($low_stock_banner_q) : 0;
            if ($inv_low_count > 0):
            ?>
                <div class="card border-0 shadow-sm mb-4 overflow-hidden" style="border-left: 4px solid #f59e0b !important; background: #fffdf2;">
                    <div class="card-body p-3">
                        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div class="d-flex align-items-center">
                                <div class="bg-warning bg-opacity-20 p-2 rounded-circle me-3 text-warning">
                                    <i class="bi bi-exclamation-triangle-fill fs-5"></i>
                                </div>
                                <div>
                                    <h6 class="mb-0 fw-bold text-dark">Low Stock Notification</h6>
                                    <small class="text-muted"><strong><?= $inv_low_count; ?></strong> product variant(s) are below reorder threshold (≤ 5 units left).</small>
                                </div>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-warning text-dark fw-semibold" id="btnToggleInvLowStock" type="button">
                                    <i class="bi bi-list-ul me-1"></i> View Low Stock Items (<?= $inv_low_count; ?>)
                                </button>
                            </div>
                        </div>
                        <div class="mt-3" id="invLowStockCollapse" style="display: none;">
                            <div class="table-responsive bg-white rounded border">
                                <table class="table table-sm table-hover align-middle mb-0">
                                    <thead class="table-light small">
                                        <tr>
                                            <th class="ps-3">Product Variant</th>
                                            <th class="text-center">Available Stock</th>
                                            <th class="text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody class="small">
                                        <?php while($ls = mysqli_fetch_assoc($low_stock_banner_q)): 
                                            $disp = htmlspecialchars($ls['ProductName'] . " — " . $ls['Color'] . " (" . $ls['ROM'] . " / " . $ls['RAM'] . ")");
                                        ?>
                                        <tr>
                                            <td class="ps-3 fw-semibold text-dark"><?= $disp; ?></td>
                                            <td class="text-center fw-bold <?= ($ls['Stock'] == 0) ? 'text-danger' : 'text-dark'; ?>"><?= $ls['Stock']; ?> units</td>
                                            <td class="text-center">
                                                <?php if($ls['Stock'] == 0): ?>
                                                    <span class="badge bg-danger bg-opacity-10 text-danger border border-danger px-2">Out of Stock</span>
                                                <?php else: ?>
                                                    <span class="badge bg-warning bg-opacity-20 text-dark border border-warning px-2">Low Stock</span>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                        <?php endwhile; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Common Search Bar Section -->
            <div class="card shadow-sm border-0 mb-4 bg-white rounded-3">
                <div class="card-body p-3">
                    <form method="GET" action="inventory.php" class="row g-2 align-items-center">
                        <div class="col-md-9 col-sm-8">
                            <div class="input-group">
                                <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-search"></i></span>
                                <input type="text" name="search" class="form-control border-start-0 ps-0" placeholder="Search inventory by Product Name, Brand, Model Number, Color, RAM, or Storage..." value="<?php echo htmlspecialchars($search); ?>">
                            </div>
                        </div>
                        <div class="col-md-3 col-sm-4 d-flex gap-2">
                            <button type="submit" class="btn btn-primary flex-grow-1 rounded-3 fw-semibold"><i class="bi bi-search me-1"></i>Search</button>
                            <?php if ($search !== ''): ?>
                                <a href="inventory.php" class="btn btn-outline-secondary rounded-3" title="Clear Search"><i class="bi bi-x-lg"></i> Clear</a>
                            <?php endif; ?>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Inventory Table -->
            <div class="card shadow-sm border-0 border-top border-primary border-4 rounded-3">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th class="ps-4">S.NO</th>
                                    <th>Product Name / Specification</th>
                                    <th>Brand</th>
                                    <th>Model Number</th>
                                    <th class="text-center">Initial Stock</th>
                                    <th class="text-center">Units Sold</th>
                                    <th class="text-center">Available Stock</th>
                                    <th>Status</th>
                                    <th class="text-center pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $cnt = $offset + 1;
                                if($ret && mysqli_num_rows($ret) > 0) {
                                    while ($row = mysqli_fetch_array($ret)) {
                                        $remaining = (int)$row['Stock'];
                                        $sold = (int)$row['soldqty'];
                                        $initial = $remaining + $sold;
                                        $fullName = htmlspecialchars($row['ProductName'] . " - " . $row['Color'] . " (" . $row['ROM'] . " / " . $row['RAM'] . ")");
                                ?>
                                <tr>
                                    <td class="ps-4 text-muted"><?= $cnt; ?></td>
                                    <td class="fw-bold text-dark">
                                        <?= htmlspecialchars($row['ProductName']); ?>
                                        <div class="text-muted small fw-normal"><?= htmlspecialchars($row['Color'] . " • " . $row['ROM'] . " / " . $row['RAM']); ?></div>
                                    </td>
                                    <td><?= htmlspecialchars($row['BrandName']); ?></td>
                                    <td><span class="text-muted small"><?= htmlspecialchars($row['ModelNumber']); ?></span></td>
                                    <td class="text-center text-secondary"><?= $initial; ?></td>
                                    <td class="text-center text-secondary"><?= $sold; ?></td>
                                    <td class="text-center">
                                         <span class="badge stock-badge <?php echo ($remaining === 0) ? 'bg-danger text-danger' : (($remaining <= 5) ? 'bg-warning text-warning' : 'bg-success text-success'); ?> bg-opacity-10 badge-fixed">
                                             <?= $remaining; ?> units
                                         </span>
                                     </td>
                                     <td>
                                         <?php echo ($row['Status'] == "1") ? "<span class='badge bg-success badge-fixed'>Active</span>" : "<span class='badge bg-danger badge-fixed'>Inactive</span>"; ?>
                                     </td>
                                    <td class="text-center pe-4">
                                        <?php if ($admin_role === 'Admin'): ?>
                                        <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3 btn-update-stock" 
                                                data-id="<?= $row['VariantId']; ?>" 
                                                data-name="<?= $fullName; ?>"
                                                data-stock="<?= $remaining; ?>">
                                            <i class="bi bi-arrow-down-up me-1"></i> Update Stock
                                        </button>
                                        <?php else: ?>
                                        <span class="text-muted small">View only</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <?php $cnt++; } } else { ?>
                                    <tr>
                                        <td colspan="9" class="text-center py-5 text-muted">No inventory products found.</td>
                                    </tr>
                                <?php } ?> 
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Pagination Controls -->
            <?php if ($total_pages > 1): 
                $search_param = ($search !== '') ? '&search=' . urlencode($search) : '';
            ?>
            <nav class="d-flex justify-content-center mt-4">
                <ul class="pagination pagination-custom gap-1">
                    <!-- Previous Page -->
                    <li class="page-item <?php echo ($page <= 1) ? 'disabled' : ''; ?>">
                        <a class="page-link" href="?page=<?php echo $page - 1 . $search_param; ?>" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                    
                    <!-- Page Numbers -->
                    <?php for($i = 1; $i <= $total_pages; $i++): ?>
                        <li class="page-item <?php echo ($page == $i) ? 'active' : ''; ?>">
                            <a class="page-link" href="?page=<?php echo $i . $search_param; ?>">
                                <?php echo $i; ?>
                            </a>
                        </li>
                    <?php endfor; ?>
                    
                    <!-- Next Page -->
                    <li class="page-item <?php echo ($page >= $total_pages) ? 'disabled' : ''; ?>">
                        <a class="page-link" href="?page=<?php echo $page + 1 . $search_param; ?>" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
            <?php endif; ?>

        </div>
    </div>
</div>

<!-- Update Stock Modal -->
<div class="modal fade" id="updateStockModal" tabindex="-1" aria-labelledby="updateStockModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content rounded-3">
            <div class="modal-header">
                <h5 class="modal-title fw-bold" id="updateStockModalLabel"><i class="bi bi-pencil-square text-primary me-2"></i>Adjust Inventory Stock</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="modal_variant_id">
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Variant Name / Spec</label>
                    <input type="text" id="modal_variant_name" class="form-control bg-light" readonly>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Current Available Stock</label>
                    <input type="text" id="modal_current_stock" class="form-control bg-light" readonly>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Quantity Adjustment *</label>
                    <input type="number" id="modal_qty_adjust" class="form-control" placeholder="e.g. 10 to add, -5 to subtract" required>
                    <div class="form-text small text-muted">Enter a positive number to add stock, or a negative number to write off damaged stock.</div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Movement Type *</label>
                    <select id="modal_movement_type" class="form-select" required>
                        <option value="Restock">Restock (Add Shipment)</option>
                        <option value="Correction">Correction (Inventory Audit / Damage)</option>
                    </select>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Log Notes / Reference Info *</label>
                    <input type="text" id="modal_notes" class="form-control" placeholder="e.g. Shipment #9201, or Audit write-off" required>
                </div>
                <div id="modal_error" class="alert alert-danger d-none py-2"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" id="btn_submit_stock" class="btn btn-primary rounded-pill px-4">Update Inventory</button>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<?php include_once('../includes/components/confirmation.php');?>

<script>
$(document).ready(function () {
    let invLowCount = <?= (int)($inv_low_count ?? 0); ?>;
    $('#btnToggleInvLowStock').on('click', function(e) {
        e.preventDefault();
        $('#invLowStockCollapse').stop(true, true).slideToggle(250, function() {
            if ($(this).is(':visible')) {
                $('#btnToggleInvLowStock').html('<i class="bi bi-chevron-up me-1"></i> Hide Low Stock Items');
            } else {
                $('#btnToggleInvLowStock').html('<i class="bi bi-list-ul me-1"></i> View Low Stock Items (' + invLowCount + ')');
            }
        });
    });

    let currentVariantId = null;

    // Open modal — populate fields
    $(document).on('click', '.btn-update-stock', function () {
        currentVariantId = $(this).data('id');
        $('#modal_variant_id').val(currentVariantId);
        $('#modal_variant_name').val($(this).data('name'));
        $('#modal_current_stock').val($(this).data('stock') + ' units');
        $('#modal_qty_adjust').val('');
        $('#modal_notes').val('');
        $('#modal_error').addClass('d-none').text('');
        
        const modalEl = document.getElementById('updateStockModal');
        const modalObj = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalObj.show();
    });

    // Submit stock update via AJAX
    $('#btn_submit_stock').on('click', function (e) {
        e.preventDefault();
        
        const qty   = $('#modal_qty_adjust').val();
        const mtype = $('#modal_movement_type').val();
        const notes = $('#modal_notes').val();

        if (!qty || qty == 0 || !notes.trim()) {
            $('#modal_error').removeClass('d-none').text('Please fill in quantity adjustment and log notes.');
            return;
        }

        const $btn = $(this).prop('disabled', true).text('Saving...');

        $.ajax({
            url: 'ajax/update_stock.php',
            method: 'POST',
            data: { 
                variant_id: currentVariantId, 
                qty_adjust: qty, 
                movement_type: mtype, 
                notes: notes 
            },
            dataType: 'json',
            success: function (resp) {
                $btn.prop('disabled', false).text('Update Inventory');
                if (resp.success) {
                    // Close modal
                    const modalEl = document.getElementById('updateStockModal');
                    const modalObj = bootstrap.Modal.getInstance(modalEl);
                    if (modalObj) modalObj.hide();

                    // Update badge in-place in the table row
                    const $targetBtn = $('.btn-update-stock[data-id="' + currentVariantId + '"]');
                    const $badge = $targetBtn.closest('tr').find('.stock-badge');
                    
                    $badge.text(resp.new_stock + ' units');
                    if (resp.new_stock === 0) {
                        $badge.removeClass('bg-success bg-warning text-success text-warning').addClass('bg-danger text-danger');
                    } else if (resp.new_stock <= 5) {
                        $badge.removeClass('bg-success bg-danger text-success text-danger').addClass('bg-warning text-warning');
                    } else {
                        $badge.removeClass('bg-danger bg-warning text-danger text-warning').addClass('bg-success text-success');
                    }

                    // Update data-stock attribute for subsequent modal opens
                    $targetBtn.data('stock', resp.new_stock);

                    // Show success SweetAlert
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'success',
                            title: 'Stock Updated!',
                            text: resp.message,
                            confirmButtonColor: '#0d6efd'
                        });
                    } else {
                        alert(resp.message);
                    }
                } else {
                    $('#modal_error').removeClass('d-none').text(resp.message || 'Update failed.');
                }
            },
            error: function (xhr, status, err) {
                $btn.prop('disabled', false).text('Update Inventory');
                $('#modal_error').removeClass('d-none').text('Error updating stock: ' + (xhr.responseJSON ? xhr.responseJSON.message : err));
            }
        });
    });
});
</script>
</body>
</html>