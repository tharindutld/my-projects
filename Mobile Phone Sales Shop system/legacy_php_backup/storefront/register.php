<?php
session_start();
error_reporting(0);
include('../config/db.php');

if(isset($_POST['submit'])) {
    $fname = trim($_POST['firstname']);
    $lname = trim($_POST['lastname']);
    $mobno = trim($_POST['mobilenumber']);
    $email = trim($_POST['email']);
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // 1. Mobile number validation (exactly 10 digits starting with 0)
    if (!preg_match('/^0[0-9]{9}$/', $mobno)) {
        $error_msg = "Mobile number must be exactly 10 digits starting with 0.";
    } else {
        // 2. Check if email or mobile number already exists
        $check_stmt = $conn->prepare("SELECT ID, Email, MobileNumber FROM tbluser WHERE Email=? OR MobileNumber=?");
        $check_stmt->bind_param("ss", $email, $mobno);
        $check_stmt->execute();
        $check_res = $check_stmt->get_result();
        
        if($check_res->num_rows > 0) {
            $existing = $check_res->fetch_assoc();
            if ($existing['Email'] === $email) {
                $error_msg = "An account with this email already exists.";
            } else {
                $error_msg = "An account with this mobile number already exists.";
            }
        } else {
            $stmt = $conn->prepare("INSERT INTO tbluser (FirstName, LastName, MobileNumber, Email, Password) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssss", $fname, $lname, $mobno, $email, $password);
            
            if ($stmt->execute()) {
                $_SESSION['success_msg'] = "Registration successful! You can now log in.";
                header("Location: login.php");
                exit();
            } else {
                $error_msg = "Something went wrong. Please try again.";
            }
            $stmt->close();
        }
        $check_stmt->close();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart || Customer Registration</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <style>
        body { background-color: #f4f6f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif; padding: 20px 0;}
        .login-card { width: 100%; max-width: 500px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px; }
        .login-header { background-color: #0d6efd; color: white; border-radius: 8px 8px 0 0; padding: 20px; text-align: center; }
    </style>
</head>
<body>

<div class="card login-card">
    <div class="login-header">
        <h4 class="mb-0"><i class="bi bi-person-plus me-2"></i> Mobile Store</h4>
        <small class="text-white-50">Create a New Account</small>
    </div>
    <div class="card-body p-4">
        <?php if(isset($error_msg)): ?>
            <div class="alert alert-danger py-2"><?php echo $error_msg; ?></div>
        <?php endif; ?>

        <form method="post" class="confirm-submit" data-confirm-message="Are you sure you want to register with these details?">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">First Name</label>
                    <input type="text" name="firstname" class="form-control" placeholder="John" pattern="[a-zA-Z\s]+" required>
                    <div class="invalid-feedback">Letters only.</div>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Last Name</label>
                    <input type="text" name="lastname" class="form-control" placeholder="Doe" pattern="[a-zA-Z\s]+" required>
                    <div class="invalid-feedback">Letters only.</div>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label">Email Address</label>
                <div class="input-group">
                    <span class="input-group-text bg-light"><i class="bi bi-envelope"></i></span>
                    <input type="email" name="email" class="form-control" placeholder="customer@gmail.com" required>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label">Mobile Number</label>
                <div class="input-group">
                    <span class="input-group-text bg-light"><i class="bi bi-phone"></i></span>
                    <input type="text" name="mobilenumber" class="form-control" placeholder="07xxxxxxxx" pattern="0[0-9]{9}" title="Must be exactly 10 digits starting with 0" required>
                </div>
            </div>

            <div class="mb-4">
                <label class="form-label">Password</label>
                <div class="input-group">
                    <span class="input-group-text bg-light"><i class="bi bi-lock"></i></span>
                    <input type="password" name="password" class="form-control" placeholder="At least 8 characters" minlength="8" required>
                </div>
            </div>

            <div class="d-grid mb-3">
                <button type="submit" name="register" class="btn btn-primary">Create Account</button>
            </div>
            <div class="text-center">
                <p class="small text-muted mb-0">Already have an account? <a href="login.php" class="text-decoration-none fw-bold">Sign In Here</a></p>
            </div>
        </form>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<?php include_once('../includes/components/confirmation.php'); ?>
</body>
</html>
