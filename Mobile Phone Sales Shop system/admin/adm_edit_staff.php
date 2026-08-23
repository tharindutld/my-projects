<?php
session_start();
include("../config/db.php");
$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");
include("../includes/admin/header.php");
?>
<!-- Custom Styles for Unified Password Component -->
<style>
.password-group {
    border: 1px solid #cbd5e1 !important;
    border-radius: 6px !important;
    overflow: hidden;
    background-color: #fff;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.password-group:focus-within {
    border-color: #0284c7 !important;
    box-shadow: 0 0 0 0.2rem rgba(2, 132, 199, 0.15) !important;
}
.was-validated .password-group:has(:invalid) {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.15) !important;
}
.was-validated .password-group:has(:valid) {
    border-color: #198754 !important;
}
.was-validated .password-group:has(:invalid) ~ .invalid-feedback {
    display: block;
}
</style>
<?php

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$stmt = $conn->prepare("SELECT * FROM staff_users WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row) {
    die("<div class='container mt-5'><div class='alert alert-danger'>User not found!</div></div>");
}
?>
<div class="container-fluid">
    <div class="row">
        <?php include '../includes/admin/sidebar.php'; ?>

        <div class="col-md-10 p-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="mb-0 fw-bold">Edit Staff Member</h4>
                <a href="adm_view_staff.php" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to List</a>
            </div>



            <div class="card shadow-sm border-0">
                <div class="card-header card-header-dark py-3">
                    <h5 class="mb-0"><i class="bi bi-pencil-square me-2"></i> Update Details for <?= htmlspecialchars($row['first_name']) ?></h5>
                </div>

                <div class="card-body p-4">
                    <form action="adm_update_staff.php" method="POST" class="confirm-submit" data-confirm-message="Are you sure you want to update this staff profile?">
                        <input type="hidden" name="id" value="<?= $row['id']; ?>">

                        <div class="row">
                            <div class="col-md-6 mb-4">
                                <label class="form-label">First Name <span class="required-asterisk">*</span></label>
                                <input type="text" name="first_name" class="form-control" value="<?= htmlspecialchars($row['first_name']); ?>" pattern="^[a-zA-Z\s]+$" minlength="2" maxlength="50" title="Only letters and spaces allowed (2-50 characters)" required>
                                <div class="invalid-feedback">First name must contain only letters and spaces (2-50 characters).</div>
                            </div>
                            <div class="col-md-6 mb-4">
                                <label class="form-label">Last Name <span class="required-asterisk">*</span></label>
                                <input type="text" name="last_name" class="form-control" value="<?= htmlspecialchars($row['last_name']); ?>" pattern="^[a-zA-Z\s]+$" minlength="2" maxlength="50" title="Only letters and spaces allowed (2-50 characters)" required>
                                <div class="invalid-feedback">Last name must contain only letters and spaces (2-50 characters).</div>
                            </div>
                            <div class="col-md-6 mb-4">
                                <label class="form-label">Email <span class="required-asterisk">*</span></label>
                                <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($row['email']); ?>" required>
                                <div class="invalid-feedback">Please enter a valid email address.</div>
                            </div>
                            <div class="col-md-6 mb-4">
                                <label class="form-label">Phone <span class="required-asterisk">*</span></label>
                                <input type="text" name="phone" class="form-control" value="<?= htmlspecialchars($row['phone']); ?>" pattern="^0[0-9]{9}$" title="Must be exactly 10 digits starting with 0" required>
                                <div class="invalid-feedback">Please enter a valid 10-digit phone number starting with 0.</div>
                            </div>
                            <div class="col-md-6 mb-4">
                                <label class="form-label">Gender <span class="required-asterisk">*</span></label>
                                <select name="gender" class="form-select" required>
                                    <option value="Male" <?= ($row['gender'] == "Male") ? "selected" : ""; ?>>Male</option>
                                    <option value="Female" <?= ($row['gender'] == "Female") ? "selected" : ""; ?>>Female</option>
                                </select>
                                <div class="invalid-feedback">Please select a gender.</div>
                            </div>
                            <div class="col-md-6 mb-4">
                                <label class="form-label">Birth Date <span class="required-asterisk">*</span></label>
                                <?php $max_date = date('Y-m-d', strtotime('-18 years')); ?>
                                <input type="date" name="birth_date" class="form-control" value="<?= $row['birth_date']; ?>" max="<?php echo $max_date; ?>" title="Staff member must be at least 18 years old" required>
                                <div class="invalid-feedback">Staff member must be at least 18 years old.</div>
                            </div>
                            <div class="col-md-6 mb-4">
                                <label class="form-label">Role <span class="required-asterisk">*</span></label>
                                <select name="role" class="form-select" required>
                                    <option value="Admin" <?= ($row['role'] == "Admin") ? "selected" : ""; ?>>Admin</option>
                                    <option value="Sales person" <?= ($row['role'] == "Sales person") ? "selected" : ""; ?>>Sales person</option>
                                    <option value="Technician" <?= ($row['role'] == "Technician") ? "selected" : ""; ?>>Technician</option>
                                </select>
                                <div class="invalid-feedback">Please select a role.</div>
                            </div>
                            <div class="col-md-6 mb-4">
                                <label class="form-label">Status <span class="required-asterisk">*</span></label>
                                <select name="status" class="form-select" required>
                                    <option value="Active" <?= ($row['status'] == "Active") ? "selected" : ""; ?>>Active</option>
                                    <option value="Inactive" <?= ($row['status'] == "Inactive") ? "selected" : ""; ?>>Inactive</option>
                                </select>
                                <div class="invalid-feedback">Please select a status.</div>
                            </div>

                            <div class="col-12 mt-3">
                                <h6 class="text-primary fw-bold mb-3 border-bottom pb-2">Security Settings</h6>
                            </div>
                            
                            <div class="col-md-6 mb-4">
                                <label class="form-label">New Password</label>
                                <div class="input-group password-group">
                                    <input type="password" name="new_password" id="new_password" class="form-control border-0" placeholder="Leave blank to keep current password" minlength="8" style="box-shadow: none;">
                                    <button class="btn btn-outline-secondary border-0 bg-transparent text-secondary" type="button" onclick="togglePassword()" style="box-shadow: none; height: auto !important; margin: 0 !important;">
                                        <i class="bi bi-eye fs-5" id="toggleIcon"></i>
                                    </button>
                                </div>
                                <div class="invalid-feedback">Password must be at least 8 characters.</div>
                                <small class="text-muted">Only fill this if you want to change the user's password.</small>
                            </div>
                        </div>

                        <hr class="text-muted mt-2 mb-4">
                        <div class="d-flex justify-content-end gap-2">
                            <a href="adm_view_staff.php" class="btn btn-outline-secondary px-4">Cancel</a>
                            <button type="submit" class="btn btn-primary px-4">Update Staff Profile</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function togglePassword() {
    const pwdInput = document.getElementById('new_password');
    const toggleIcon = document.getElementById('toggleIcon');
    if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        toggleIcon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        pwdInput.type = 'password';
        toggleIcon.classList.replace('bi-eye-slash', 'bi-eye');
    }
}
</script>

<?php include_once('../includes/components/confirmation.php'); ?>
<?php include '../includes/admin/footer.php'; ?>