<?php 
session_start();
error_reporting(0);
include("../config/db.php");
$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");

if(isset($_POST['submit'])) {
    $first = trim($_POST['first_name'] ?? '');
    $last = trim($_POST['last_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $gender = $_POST['gender'] ?? '';
    $birthdate = $_POST['birth_date'] ?? '';
    $role = $_POST['role'] ?? '';
    $status = $_POST['status'] ?? '';
    $plain_password = $_POST['password'] ?? '';

    // Standard Validations
    if (empty($first) || empty($last) || empty($email) || empty($phone) || empty($gender) || empty($birthdate) || empty($role) || empty($status) || empty($plain_password)) {
        $error_msg = "All required fields must be filled.";
    } elseif (!preg_match("/^[a-zA-Z\s]+$/", $first) || strlen($first) < 2 || strlen($first) > 50) {
        $error_msg = "First name must contain only letters and spaces (2-50 characters).";
    } elseif (!preg_match("/^[a-zA-Z\s]+$/", $last) || strlen($last) < 2 || strlen($last) > 50) {
        $error_msg = "Last name must contain only letters and spaces (2-50 characters).";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error_msg = "Please enter a valid email address.";
    } elseif (!preg_match("/^0[0-9]{9}$/", $phone)) {
        $error_msg = "Phone number must be exactly 10 digits starting with 0.";
    } elseif (!in_array($gender, ['Male', 'Female'])) {
        $error_msg = "Please select a valid gender.";
    } elseif (!in_array($role, ['Admin', 'Sales person', 'Technician'])) {
        $error_msg = "Please select a valid role.";
    } elseif (!in_array($status, ['Active', 'Inactive'])) {
        $error_msg = "Please select a valid status.";
    } elseif (strlen($plain_password) < 8) {
        $error_msg = "Password must be at least 8 characters long.";
    } else {
        // Validate birth date
        try {
            $birth = new DateTime($birthdate);
            $today = new DateTime();
            if ($birth > $today) {
                $error_msg = "Birth date cannot be in the future.";
            } else {
                $age = $today->diff($birth)->y;
                if ($age < 18) {
                    $error_msg = "Staff member must be at least 18 years old.";
                }
            }
        } catch (Exception $e) {
            $error_msg = "Invalid birth date selected.";
        }
    }

    // If validations pass, proceed to insert
    if (!isset($error_msg)) {
        try {
            // Check for duplicate email manually first
            $chk = $conn->prepare("SELECT id FROM staff_users WHERE email = ?");
            if ($chk) {
                $chk->bind_param("s", $email);
                $chk->execute();
                $chk->store_result();
                if ($chk->num_rows > 0) {
                    $error_msg = "An account with this email already exists.";
                }
                $chk->close();
            }

            if (!isset($error_msg)) {
                $password = password_hash($plain_password, PASSWORD_DEFAULT);
                $stmt = $conn->prepare("INSERT INTO staff_users (first_name, last_name, email, phone, gender, birth_date, role, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                if ($stmt) {
                    $stmt->bind_param("sssssssss", $first, $last, $email, $phone, $gender, $birthdate, $role, $status, $password);
                    if ($stmt->execute()) {
                        $_SESSION['success_msg'] = "Staff member added successfully.";
                        header("Location: adm_add_staff.php");
                        exit();
                    } else {
                        $error_msg = "Database execution failed: " . $stmt->error;
                    }
                    $stmt->close();
                } else {
                    $error_msg = "Database preparation failed: " . $conn->error;
                }
            }
        } catch (Exception $e) {
            if ($conn->errno == 1062) {
                $error_msg = "An account with this email already exists.";
            } else {
                $error_msg = "System error: " . $e->getMessage();
            }
        }
    }
}
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

<div class="container-fluid">
    <div class="row">
        <?php include '../includes/admin/sidebar.php'; ?>

        <div class="col-md-10 p-4">
            
            <div class="card shadow-sm border-0">
                <div class="card-header card-header-dark py-3 d-flex align-items-center">
                    <i class="bi bi-person-plus me-2 fs-5"></i>
                    <h5 class="mb-0">Add New Staff Member</h5>
                </div>

                <div class="card-body p-4">
                    <form id="addStaffForm" method="post" class="confirm-submit" data-confirm-message="Are you sure you want to add this staff member?">
                        <div class="row">
                            <div class="col-md-6 mb-4">
                                <label class="form-label">First Name <span class="required-asterisk">*</span></label>
                                <input type="text" name="first_name" class="form-control" placeholder="Enter first name" pattern="^[a-zA-Z\s]+$" minlength="2" maxlength="50" title="Only letters and spaces allowed (2-50 characters)" required>
                                <div class="invalid-feedback">First name must contain only letters and spaces (2-50 characters).</div>
                            </div>

                            <div class="col-md-6 mb-4">
                                <label class="form-label">Last Name <span class="required-asterisk">*</span></label>
                                <input type="text" name="last_name" class="form-control" placeholder="Enter last name" pattern="^[a-zA-Z\s]+$" minlength="2" maxlength="50" title="Only letters and spaces allowed (2-50 characters)" required>
                                <div class="invalid-feedback">Last name must contain only letters and spaces (2-50 characters).</div>
                            </div>

                            <div class="col-md-6 mb-4">
                                <label class="form-label">Email Address <span class="required-asterisk">*</span></label>
                                <input type="email" name="email" class="form-control" placeholder="example@mail.com" required>
                                <div class="invalid-feedback">Please enter a valid email address.</div>
                            </div>

                            <div class="col-md-6 mb-4">
                                <label class="form-label">Phone Number <span class="required-asterisk">*</span></label>
                                <input type="text" name="phone" class="form-control" placeholder="07xxxxxxxx" pattern="^0[0-9]{9}$" title="Must be exactly 10 digits starting with 0" required>
                                <div class="invalid-feedback">Please enter a valid 10-digit phone number starting with 0.</div>
                            </div>

                            <div class="col-md-6 mb-4">
                                <label class="form-label">Gender <span class="required-asterisk">*</span></label>
                                <select name="gender" class="form-select" required>
                                    <option value="" selected disabled>Choose...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                <div class="invalid-feedback">Please select a gender.</div>
                            </div>

                            <div class="col-md-6 mb-4">
                                <label class="form-label">Birth Date <span class="required-asterisk">*</span></label>
                                <?php $max_date = date('Y-m-d', strtotime('-18 years')); ?>
                                <input type="date" name="birth_date" class="form-control" max="<?php echo $max_date; ?>" title="Staff member must be at least 18 years old" required>
                                <div class="invalid-feedback">Staff member must be at least 18 years old.</div>
                            </div>

                            <div class="col-md-6 mb-4">
                                <label class="form-label">Role <span class="required-asterisk">*</span></label>
                                <select name="role" class="form-select" required>
                                    <option value="" selected disabled>Choose...</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Sales person">Sales person</option>
                                    <option value="Technician">Technician</option>
                                </select>
                                <div class="invalid-feedback">Please select a role.</div>
                            </div>

                            <div class="col-md-6 mb-4">
                                <label class="form-label">Status <span class="required-asterisk">*</span></label>
                                <select name="status" class="form-select" required>
                                    <option value="" selected disabled>Choose...</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                                <div class="invalid-feedback">Please select a status.</div>
                            </div>

                            <div class="col-md-6 mb-4">
                                <label class="form-label">Password <span class="required-asterisk">*</span></label>
                                <div class="input-group password-group">
                                    <input type="password" name="password" id="password" class="form-control border-0" placeholder="At least 8 characters" minlength="8" required style="box-shadow: none;">
                                    <button class="btn btn-outline-secondary border-0 bg-transparent text-secondary" type="button" onclick="togglePassword()" style="box-shadow: none; height: auto !important; margin: 0 !important;">
                                        <i class="bi bi-eye fs-5" id="toggleIcon"></i>
                                    </button>
                                </div>
                                <div class="invalid-feedback">Password must be at least 8 characters.</div>
                            </div>
                        </div>

                        <hr class="text-muted mt-2 mb-4">

                        <div class="d-flex justify-content-end gap-2">
                            <button type="reset" class="btn btn-light border">Cancel</button>
                            <button type="submit" name="submit" class="btn btn-primary px-4">Save Staff Member</button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    </div>
</div>

<script>
// Toggle Password Visibility
function togglePassword() {
    const pwdInput = document.getElementById('password');
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

<?php include '../includes/admin/footer.php'; ?>