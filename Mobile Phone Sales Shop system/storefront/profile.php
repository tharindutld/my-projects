<?php
session_start();
error_reporting(0);
include('../config/db.php');
include_once('../includes/components/email_helper.php');

if(empty($_SESSION['msmsuid'])) {
    header('Location: login.php');
    exit();
}

$userid = $_SESSION['msmsuid'];

// ── 1. Update Personal Info ──────────────────────────────────────────────────
if(isset($_POST['submit']) && isset($_POST['section']) && $_POST['section'] === 'personal') {
    $fname     = trim($_POST['firstname']);
    $lname     = trim($_POST['lastname']);
    $mobno     = trim($_POST['mobilenumber']);
    $email     = trim($_POST['email']);
    $gender    = $_POST['gender'];
    $birthdate = $_POST['birthdate'];

    // 1. Mobile number validation (exactly 10 digits starting with 0)
    if (!preg_match('/^0[0-9]{9}$/', $mobno)) {
        $_SESSION['error_msg'] = "Mobile number must be exactly 10 digits starting with 0.";
        header("Location: profile.php#personal");
        exit();
    }

    // 2. Birthdate validation (must be 12 years or older)
    $dob = new DateTime($birthdate);
    $today = new DateTime();
    $age = $today->diff($dob)->y;
    if ($age < 12) {
        $_SESSION['error_msg'] = "You must be 12 years or older to register/update profile.";
        header("Location: profile.php#personal");
        exit();
    }

    // 3. Email unique check
    $check_email = $conn->prepare("SELECT ID FROM tbluser WHERE Email=? AND ID!=?");
    $check_email->bind_param("si", $email, $userid);
    $check_email->execute();
    $email_res = $check_email->get_result();
    $check_email->close();
    if ($email_res->num_rows > 0) {
        $_SESSION['error_msg'] = "This email is already in use by another account.";
        header("Location: profile.php#personal");
        exit();
    }

    // 4. Mobile number unique check
    $check_mobile = $conn->prepare("SELECT ID FROM tbluser WHERE MobileNumber=? AND ID!=?");
    $check_mobile->bind_param("si", $mobno, $userid);
    $check_mobile->execute();
    $mobile_res = $check_mobile->get_result();
    $check_mobile->close();
    if ($mobile_res->num_rows > 0) {
        $_SESSION['error_msg'] = "This mobile number is already in use by another account.";
        header("Location: profile.php#personal");
        exit();
    }

    $stmt = $conn->prepare("UPDATE tbluser SET FirstName=?, LastName=?, MobileNumber=?, Email=?, Gender=?, BirthDate=? WHERE ID=?");
    $stmt->bind_param("ssssssi", $fname, $lname, $mobno, $email, $gender, $birthdate, $userid);
    if($stmt->execute()) {
        $_SESSION['success_msg'] = "Profile updated successfully!";
    } else {
        $_SESSION['error_msg'] = "Something went wrong. Please try again.";
    }
    $stmt->close();
    header("Location: profile.php#personal");
    exit();
}

// ── 2. Save/Update Address ───────────────────────────────────────────────────
if(isset($_POST['submit']) && isset($_POST['section']) && $_POST['section'] === 'address') {
    $country   = $_POST['country'];
    $street    = trim($_POST['street_address']);
    $city      = trim($_POST['city']);
    $district  = trim($_POST['district']);
    $postal    = trim($_POST['postal_code']);
    $addr_mob  = trim($_POST['addr_mobile']);

    // Validations:
    // 1. Mobile phone starts with 0 and has 10 digits
    if (!preg_match('/^0[0-9]{9}$/', $addr_mob)) {
        $_SESSION['error_msg'] = "Mobile phone must be exactly 10 digits starting with 0.";
        header("Location: profile.php#address");
        exit();
    }

    // 2. District validation (Sri Lanka 25 districts)
    $districts = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Moneragala', 'Ratnapura', 'Kegalle'];
    if (!in_array($district, $districts)) {
        $_SESSION['error_msg'] = "Please select a valid district from the list.";
        header("Location: profile.php#address");
        exit();
    }

    // 3. Postal code exactly 5 numbers
    if (!preg_match('/^[0-9]{5}$/', $postal)) {
        $_SESSION['error_msg'] = "Postal code must be exactly 5 digits.";
        header("Location: profile.php#address");
        exit();
    }

    // 4. Street Address cannot enter any special characters (only letters, numbers, spaces, commas, periods, hyphens, and slashes)
    if (!preg_match('/^[a-zA-Z0-9\s,\.\-\/]+$/', $street)) {
        $_SESSION['error_msg'] = "Street address contains invalid characters. Only letters, numbers, spaces, commas, periods, hyphens, and slashes are allowed.";
        header("Location: profile.php#address");
        exit();
    }

    // 5. City must contain only letters and spaces
    if (!preg_match('/^[a-zA-Z\s]+$/', $city)) {
        $_SESSION['error_msg'] = "City name must contain only letters and spaces.";
        header("Location: profile.php#address");
        exit();
    }

    // Check if address already exists for this user
    $check = $conn->prepare("SELECT ID FROM tbluseraddress WHERE UserId=?");
    $check->bind_param("i", $userid);
    $check->execute();
    $check_res = $check->get_result();
    $check->close();

    if($check_res->num_rows > 0) {
        $stmt = $conn->prepare("UPDATE tbluseraddress SET Country=?, StreetAddress=?, City=?, District=?, PostalCode=?, MobilePhone=? WHERE UserId=?");
        $stmt->bind_param("ssssssi", $country, $street, $city, $district, $postal, $addr_mob, $userid);
    } else {
        $stmt = $conn->prepare("INSERT INTO tbluseraddress (UserId, Country, StreetAddress, City, District, PostalCode, MobilePhone) VALUES (?,?,?,?,?,?,?)");
        $stmt->bind_param("issssss", $userid, $country, $street, $city, $district, $postal, $addr_mob);
    }
    if($stmt->execute()) {
        $_SESSION['success_msg'] = "Delivery address saved successfully!";
    } else {
        $_SESSION['error_msg'] = "Failed to save address. Please try again.";
    }
    $stmt->close();
    header("Location: profile.php#address");
    exit();
}

// ── 3. Change Password (Initiate OTP) ────────────────────────────────────────
if(isset($_POST['submit']) && isset($_POST['section']) && $_POST['section'] === 'password') {
    $current_pw  = $_POST['current_password'];
    $new_pw      = $_POST['new_password'];
    $confirm_pw  = $_POST['confirm_password'];

    // Get user details
    $stmt = $conn->prepare("SELECT Password, Email FROM tbluser WHERE ID=?");
    $stmt->bind_param("i", $userid);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if(!password_verify($current_pw, $res['Password'])) {
        $_SESSION['error_msg'] = "Current password is incorrect.";
    } elseif($new_pw !== $confirm_pw) {
        $_SESSION['error_msg'] = "New passwords do not match.";
    } elseif(strlen($new_pw) < 8) {
        $_SESSION['error_msg'] = "New password must be at least 8 characters.";
    } else {
        // Generate 6-digit OTP
        $otp = rand(100000, 999999);
        $hashed = password_hash($new_pw, PASSWORD_DEFAULT);
        
        // Save to session
        $_SESSION['pwd_change_otp'] = $otp;
        $_SESSION['pwd_change_new_hash'] = $hashed;
        $_SESSION['pwd_change_otp_time'] = time();
        
        // Try sending email
        $to = $res['Email'];
        $mail_sent = sendOTPEmail($to, $otp);
        
        if($mail_sent) {
            $_SESSION['success_msg'] = "A 6-digit OTP code has been sent to your registered email ($to). Please enter it below to confirm.";
        } else {
            // Do NOT print OTP code on screen, raise error and stay on form page
            $_SESSION['error_msg'] = "Failed to send OTP verification email. Please check your SMTP settings in ../config/email.php.";
            unset($_SESSION['pwd_change_otp']);
            unset($_SESSION['pwd_change_new_hash']);
            unset($_SESSION['pwd_change_otp_time']);
        }
    }
    header("Location: profile.php#password");
    exit();
}

// ── 4. Verify Password Change OTP ───────────────────────────────────────────
if(isset($_POST['submit']) && isset($_POST['otp']) && isset($_SESSION['pwd_change_otp'])) {
    $entered_otp = trim($_POST['otp']);
    
    // Check if OTP is expired (5 mins)
    if(time() - $_SESSION['pwd_change_otp_time'] > 300) {
        unset($_SESSION['pwd_change_otp']);
        unset($_SESSION['pwd_change_new_hash']);
        unset($_SESSION['pwd_change_otp_time']);
        $_SESSION['error_msg'] = "OTP has expired. Please request a new password change.";
    } elseif($entered_otp === (string)$_SESSION['pwd_change_otp']) {
        // OTP matches! Update password in DB
        $hashed = $_SESSION['pwd_change_new_hash'];
        $stmt = $conn->prepare("UPDATE tbluser SET Password=? WHERE ID=?");
        $stmt->bind_param("si", $hashed, $userid);
        if($stmt->execute()) {
            $_SESSION['success_msg'] = "Password changed successfully!";
        } else {
            $_SESSION['error_msg'] = "Failed to update password. Please try again.";
        }
        $stmt->close();
        
        // Clear OTP sessions
        unset($_SESSION['pwd_change_otp']);
        unset($_SESSION['pwd_change_new_hash']);
        unset($_SESSION['pwd_change_otp_time']);
    } else {
        $_SESSION['error_msg'] = "Invalid OTP code. Please try again.";
    }
    header("Location: profile.php#password");
    exit();
}

// ── 5. Cancel Password Change OTP ───────────────────────────────────────────
if(isset($_GET['cancel_otp'])) {
    unset($_SESSION['pwd_change_otp']);
    unset($_SESSION['pwd_change_new_hash']);
    unset($_SESSION['pwd_change_otp_time']);
    header("Location: profile.php#password");
    exit();
}

// ── Fetch user data ──────────────────────────────────────────────────────────
$user_res = mysqli_query($conn, "SELECT * FROM tbluser WHERE ID='$userid'");
$user = mysqli_fetch_assoc($user_res);

// Fetch address
$addr_res  = mysqli_query($conn, "SELECT * FROM tbluseraddress WHERE UserId='$userid'");
$addr = mysqli_fetch_assoc($addr_res) ?: [];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart | My Profile</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f4f6f9; }
        .navbar-custom { box-shadow: 0 2px 10px rgba(0,0,0,.05); font-weight: 500; }

        /* Profile header */
        .profile-hero { background: linear-gradient(135deg, #0d6efd 0%, #0056d2 100%); color: white; padding: 40px 0 60px; }
        .avatar-circle { width: 90px; height: 90px; background: rgba(255,255,255,.2); border: 3px solid rgba(255,255,255,.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 15px; }

        /* Cards */
        .section-card { border: none; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,.06); margin-top: -35px; }

        /* Nav pills */
        .profile-nav .nav-link { color: #6c757d; border-radius: 8px; padding: 10px 18px; font-weight: 500; }
        .profile-nav .nav-link.active { background: #0d6efd; color: white; }
        .profile-nav .nav-link i { width: 20px; }

        .required-asterisk { color: #dc3545; }
        .section-title { font-size: 1.1rem; font-weight: 700; color: #212529; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 25px; }

        /* Fix Bootstrap input-group visual separation due to global .btn style overrides */
        .input-group .form-control {
            border-top-right-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
        }
        .input-group .btn {
            border-top-left-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
            border-top-right-radius: 8px !important;
            border-bottom-right-radius: 8px !important;
            padding: 0 15px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
    </style>
</head>
<body>
<?php include_once('../includes/storefront/front_header.php'); ?>

<div class="profile-hero">
    <div class="container text-center">
        <div class="avatar-circle"><i class="fa-regular fa-user"></i></div>
        <h3 class="fw-bold mb-1"><?php echo htmlspecialchars($user['FirstName'] . ' ' . $user['LastName']); ?></h3>
        <p class="text-white-50 mb-1"><?php echo htmlspecialchars($user['Email']); ?></p>
        <span class="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm"><i class="fa-solid fa-crown me-1"></i> <?php echo (int)($user['LoyaltyPoints'] ?? 0); ?> Loyalty Points</span>
    </div>
</div>

<div class="container pb-5">
    <div class="row g-4">

        <!-- Sidebar nav -->
        <div class="col-lg-3">
            <div class="card section-card p-3">
                <nav class="nav flex-column profile-nav gap-1" id="profileNav">
                    <a class="nav-link active" href="#personal" onclick="showTab('personal', this)">
                        <i class="fa-regular fa-id-card me-2"></i>Personal Info
                    </a>
                    <a class="nav-link" href="#address" onclick="showTab('address', this)">
                        <i class="fa-solid fa-location-dot me-2"></i>Delivery Address
                    </a>
                    <a class="nav-link" href="#password" onclick="showTab('password', this)">
                        <i class="fa-solid fa-lock me-2"></i>Change Password
                    </a>
                </nav>
            </div>
        </div>

        <!-- Content -->
        <div class="col-lg-9">
            <div class="card section-card p-4 p-md-5">

                <!-- ── PERSONAL INFO ─────────────────────────────────────── -->
                <div id="tab-personal">
                    <p class="section-title"><i class="fa-regular fa-id-card me-2 text-primary"></i>Personal Information</p>
                    <form method="post" class="confirm-submit" data-confirm-message="Save changes to your personal info?">
                        <input type="hidden" name="section" value="personal">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">First Name <span class="required-asterisk">*</span></label>
                                <input type="text" name="firstname" class="form-control" value="<?php echo htmlspecialchars($user['FirstName']); ?>" pattern="[a-zA-Z\s]+" required>
                                <div class="invalid-feedback">Letters only.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Last Name <span class="required-asterisk">*</span></label>
                                <input type="text" name="lastname" class="form-control" value="<?php echo htmlspecialchars($user['LastName']); ?>" pattern="[a-zA-Z\s]+" required>
                                <div class="invalid-feedback">Letters only.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Mobile Number <span class="required-asterisk">*</span></label>
                                <input type="text" name="mobilenumber" class="form-control" value="<?php echo htmlspecialchars($user['MobileNumber'] ?? ''); ?>" pattern="0[0-9]{9}" maxlength="10" minlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '')" title="Must be exactly 10 digits starting with 0" required>
                                <div class="invalid-feedback">Enter a valid 10-digit number starting with 0.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Gender <span class="required-asterisk">*</span></label>
                                <select name="gender" class="form-select" required>
                                    <option value="" disabled <?php echo empty($user['Gender']) ? 'selected' : ''; ?>>Choose...</option>
                                    <option value="Male"   <?php echo ($user['Gender'] === 'Male')   ? 'selected' : ''; ?>>Male</option>
                                    <option value="Female" <?php echo ($user['Gender'] === 'Female') ? 'selected' : ''; ?>>Female</option>
                                    <option value="Other"  <?php echo ($user['Gender'] === 'Other')  ? 'selected' : ''; ?>>Other</option>
                                </select>
                                <div class="invalid-feedback">Please select a gender.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Birth Date <span class="required-asterisk">*</span></label>
                                <input type="date" name="birthdate" class="form-control" value="<?php echo htmlspecialchars($user['BirthDate'] ?? ''); ?>" max="<?php echo date('Y-m-d', strtotime('-12 years')); ?>" required>
                                <div class="invalid-feedback">Please enter your birth date (must be 12 years or older).</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Email Address <span class="required-asterisk">*</span></label>
                                <input type="email" name="email" class="form-control" value="<?php echo htmlspecialchars($user['Email']); ?>" required>
                                <div class="invalid-feedback">Please enter a valid email address.</div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-end mt-4">
                            <button type="submit" name="submit" class="btn btn-primary px-5 rounded-pill">Save Changes</button>
                        </div>
                    </form>
                </div>

                <!-- ── DELIVERY ADDRESS ──────────────────────────────────── -->
                <div id="tab-address" style="display:none;">
                    <p class="section-title"><i class="fa-solid fa-location-dot me-2 text-primary"></i>Delivery Address</p>
                    <form method="post" class="confirm-submit" data-confirm-message="Save this delivery address?">
                        <input type="hidden" name="section" value="address">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Country <span class="required-asterisk">*</span></label>
                                <select name="country" class="form-select" required>
                                    <option value="" disabled <?php echo empty($addr['Country']) ? 'selected' : ''; ?>>Choose country...</option>
                                    <?php
                                    $countries = ['Sri Lanka','India','Australia','United Kingdom','United States','Canada','Singapore','Malaysia','Germany','France'];
                                    foreach($countries as $c) {
                                        $sel = (($addr['Country'] ?? '') === $c) ? 'selected' : '';
                                        echo "<option value=\"$c\" $sel>$c</option>";
                                    }
                                    ?>
                                </select>
                                <div class="invalid-feedback">Please select a country.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Mobile Phone <span class="required-asterisk">*</span></label>
                                <input type="text" name="addr_mobile" class="form-control" value="<?php echo htmlspecialchars($addr['MobilePhone'] ?? ''); ?>" placeholder="07xxxxxxxx" pattern="0[0-9]{9}" maxlength="10" minlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '')" title="Must be exactly 10 digits starting with 0" required>
                                <div class="invalid-feedback">Enter a valid 10-digit number starting with 0.</div>
                            </div>
                             <div class="col-12">
                                <label class="form-label">Street Address <span class="required-asterisk">*</span></label>
                                <input type="text" name="street_address" class="form-control" value="<?php echo htmlspecialchars($addr['StreetAddress'] ?? ''); ?>" placeholder="House/Apartment number, street name" pattern="[a-zA-Z0-9\s,\.\-\/]+" title="Only alphanumeric characters, spaces, commas, periods, hyphens, and slashes are allowed" required>
                                <div class="invalid-feedback">Please enter a valid street address.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">City <span class="required-asterisk">*</span></label>
                                <input type="text" name="city" class="form-control" value="<?php echo htmlspecialchars($addr['City'] ?? ''); ?>" placeholder="e.g. Colombo" pattern="[a-zA-Z\s]+" title="Only letters and spaces are allowed" required>
                                <div class="invalid-feedback">Please enter your city.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">District <span class="required-asterisk">*</span></label>
                                <select name="district" class="form-select" required>
                                    <option value="" disabled <?php echo empty($addr['District']) ? 'selected' : ''; ?>>Choose district...</option>
                                    <?php
                                    $districts = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Moneragala', 'Ratnapura', 'Kegalle'];
                                    foreach($districts as $d) {
                                        $sel = (($addr['District'] ?? '') === $d) ? 'selected' : '';
                                        echo "<option value=\"$d\" $sel>$d</option>";
                                    }
                                    ?>
                                </select>
                                <div class="invalid-feedback">Please select your district.</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Postal Code <span class="required-asterisk">*</span></label>
                                <input type="text" name="postal_code" class="form-control" value="<?php echo htmlspecialchars($addr['PostalCode'] ?? ''); ?>" placeholder="e.g. 10250" pattern="[0-9]{5}" maxlength="5" minlength="5" oninput="this.value = this.value.replace(/[^0-9]/g, '')" title="Exactly 5 numbers" required>
                                <div class="invalid-feedback">Enter a valid 5-digit numeric postal code.</div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-end mt-4">
                            <button type="submit" name="submit" class="btn btn-primary px-5 rounded-pill">
                                <?php echo empty($addr) ? 'Add Address' : 'Update Address'; ?>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- ── CHANGE PASSWORD ───────────────────────────────────── -->
                <div id="tab-password" style="display:none;">
                    <p class="section-title"><i class="fa-solid fa-lock me-2 text-primary"></i>Change Password</p>
                    
                    <?php if (isset($_SESSION['pwd_change_otp'])): ?>
                        <!-- OTP Verification Form -->
                        <div class="card border-0 shadow-sm rounded-3 p-4 text-center mx-auto mb-4" style="max-width: 500px; background: #ffffff; border: 1px solid #eef2f6 !important;">
                            <div class="mb-3">
                                <div class="d-inline-flex align-items-center justify-content-center rounded-circle" style="width: 70px; height: 70px; background-color: #e7f1ff; color: #0d6efd;">
                                    <i class="fa-solid fa-envelope-open-text fa-2x"></i>
                                </div>
                            </div>
                            <h5 class="fw-bold mb-2">Verify Your Email</h5>
                            <p class="text-muted small mb-4">
                                We have sent a 6-digit verification code (OTP) to your registered email:<br>
                                <strong class="text-dark"><?php echo htmlspecialchars($user['Email']); ?></strong>
                            </p>
                            
                            <form method="post" class="confirm-submit" data-confirm-message="Confirm code and update password?">
                                <div class="mb-4">
                                    <label class="form-label small text-uppercase fw-bold text-muted mb-2">Enter 6-Digit OTP</label>
                                    <input type="text" name="otp" class="form-control text-center fw-bold fs-3" 
                                           placeholder="------" maxlength="6" pattern="[0-9]{6}" required 
                                           style="letter-spacing: 8px; border-radius: 10px; border: 2px solid #dee2e6; max-width: 240px; margin: 0 auto;">
                                    <div class="invalid-feedback">Please enter the 6-digit code.</div>
                                </div>
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary btn-lg rounded-pill fs-6 py-2">Verify & Update Password</button>
                                    <a href="profile.php?cancel_otp=1#password" class="btn btn-link link-secondary btn-sm mt-1 text-decoration-none">Cancel Request</a>
                                </div>
                            </form>
                            <div class="mt-4 pt-3 border-top text-muted small">
                                <i class="fa-solid fa-circle-info me-1"></i> Didn't receive the email? Check your Spam or Junk folder.
                            </div>
                        </div>
                    <?php else: ?>
                        <!-- Security Info Alert -->
                        <div class="alert alert-light border rounded-3 shadow-sm mb-4">
                            <div class="d-flex align-items-center">
                                <div class="p-2 rounded-circle me-3" style="background-color: #fff3cd; color: #664d03; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fa-solid fa-shield-halved"></i>
                                </div>
                                <div class="small text-muted">
                                    For your security, a 6-digit One-Time Password (OTP) will be sent to your registered email address <strong>(<?php echo htmlspecialchars($user['Email']); ?>)</strong> to verify this request.
                                </div>
                            </div>
                        </div>

                        <!-- Password Update Request Form -->
                        <form method="post" class="confirm-submit" data-confirm-message="Request password change? An OTP will be sent to your email.">
                            <input type="hidden" name="section" value="password">
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label">Current Password <span class="required-asterisk">*</span></label>
                                    <div class="input-group">
                                        <input type="password" name="current_password" id="currentPwd" class="form-control" placeholder="Enter your current password" required>
                                        <button class="btn btn-outline-secondary" type="button" onclick="togglePwd('currentPwd', 'icon0')"><i class="fa-regular fa-eye" id="icon0"></i></button>
                                    </div>
                                    <div class="invalid-feedback">Current password is required.</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">New Password <span class="required-asterisk">*</span></label>
                                    <div class="input-group">
                                        <input type="password" name="new_password" id="newPwd" class="form-control" placeholder="At least 8 characters" minlength="8" required>
                                        <button class="btn btn-outline-secondary" type="button" onclick="togglePwd('newPwd', 'icon1')"><i class="fa-regular fa-eye" id="icon1"></i></button>
                                    </div>
                                    <div class="invalid-feedback">Minimum 8 characters required.</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Confirm New Password <span class="required-asterisk">*</span></label>
                                    <div class="input-group">
                                        <input type="password" name="confirm_password" id="confirmPwd" class="form-control" placeholder="Repeat new password" minlength="8" required>
                                        <button class="btn btn-outline-secondary" type="button" onclick="togglePwd('confirmPwd', 'icon2')"><i class="fa-regular fa-eye" id="icon2"></i></button>
                                    </div>
                                    <div class="invalid-feedback">Passwords must match.</div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-end mt-4">
                                <button type="submit" name="submit" class="btn btn-danger px-5 rounded-pill">Get OTP & Change Password</button>
                            </div>
                        </form>
                    <?php endif; ?>
                </div>

            </div><!-- /.card -->
        </div><!-- /.col -->
    </div><!-- /.row -->
</div><!-- /.container -->

<script>
function showTab(tab, el) {
    document.querySelectorAll('[id^="tab-"]').forEach(t => t.style.display = 'none');
    document.getElementById('tab-' + tab).style.display = 'block';
    document.querySelectorAll('#profileNav .nav-link').forEach(l => l.classList.remove('active'));
    el.classList.add('active');
}

function togglePwd(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(iconId);
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

// Auto-open tab based on URL hash
document.addEventListener('DOMContentLoaded', function() {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['personal', 'address', 'password'];
    if(validTabs.includes(hash)) {
        const link = document.querySelector('#profileNav a[href="#' + hash + '"]');
        if(link) showTab(hash, link);
    }
});
</script>

<?php include_once('../includes/storefront/front_footer.php'); ?>
