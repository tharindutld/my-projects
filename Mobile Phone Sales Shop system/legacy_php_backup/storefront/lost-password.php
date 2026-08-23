<?php
session_start();
include('../config/db.php');

$error = '';
$success = '';

if(isset($_POST['reset_password'])) {
    $email = trim($_POST['email']);
    $phone = trim($_POST['phone']);
    $new_password = $_POST['new_password'];
    $confirm_password = $_POST['confirm_password'];

    if(empty($email) || empty($phone) || empty($new_password) || empty($confirm_password)) {
        $error = "All fields are required.";
    } elseif($new_password !== $confirm_password) {
        $error = "New passwords do not match.";
    } elseif(strlen($new_password) < 8) {
        $error = "Password must be at least 8 characters long.";
    } else {
        // Verify customer exists
        $stmt = $conn->prepare("SELECT ID FROM tbluser WHERE Email=? AND MobileNumber=?");
        $stmt->bind_param("ss", $email, $phone);
        $stmt->execute();
        $result = $stmt->get_result();

        if($result->num_rows > 0) {
            // Update password
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt_update = $conn->prepare("UPDATE tbluser SET Password=? WHERE Email=? AND MobileNumber=?");
            $stmt_update->bind_param("sss", $hashed_password, $email, $phone);
            
            if($stmt_update->execute()) {
                $success = "Password reset successfully! You can now sign in.";
            } else {
                $error = "Failed to reset password. Please try again.";
            }
            $stmt_update->close();
        } else {
            $error = "Invalid Email Address or Mobile Number.";
        }
        $stmt->close();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart || Customer Password Recovery</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 20px;
        }

        .login-card {
            width: 100%;
            max-width: 440px;
            border: none;
            border-radius: 20px;
            background: #ffffff;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .login-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        .login-header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 35px 30px;
            text-align: center;
            position: relative;
        }
        
        .login-header h4 {
            font-weight: 700;
            font-size: 1.6rem;
            letter-spacing: -0.5px;
        }
        
        .login-header p {
            color: rgba(255, 255, 255, 0.85);
            font-size: 0.95rem;
            font-weight: 400;
            margin-bottom: 0;
            margin-top: 5px;
        }

        .form-label {
            font-weight: 600;
            color: #374151;
            font-size: 0.9rem;
            margin-bottom: 6px;
        }

        .input-group-text {
            background-color: #f9fafb;
            border: 1.5px solid #d1d5db;
            border-right: none;
            color: #6b7280;
            border-top-left-radius: 12px;
            border-bottom-left-radius: 12px;
            padding: 12px 15px;
        }

        .form-control {
            border: 1.5px solid #d1d5db;
            border-top-right-radius: 12px;
            border-bottom-right-radius: 12px;
            padding: 12px 15px;
            font-size: 0.95rem;
            transition: all 0.25s ease;
        }

        .form-control:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
            outline: none;
        }

        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: none;
            border-radius: 12px;
            padding: 13px;
            font-weight: 600;
            font-size: 1rem;
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2);
            transition: all 0.25s ease;
            color: white;
        }

        .btn-primary:hover, .btn-primary:focus {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-1px);
            box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
        }

        .back-to-login {
            color: #6b7280;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.2s ease;
            text-decoration: none;
        }
        
        .back-to-login:hover {
            color: #374151;
        }
    </style>
</head>
<body>

<div class="card login-card">
    <div class="login-header">
        <h4 class="mb-0"><i class="bi bi-shield-lock me-2"></i> Reset Password</h4>
        <p>Customer Account Recovery</p>
    </div>
    <div class="card-body p-4">
        <?php if($error): ?>
            <div class="alert alert-danger py-2"><?php echo $error; ?></div>
        <?php endif; ?>

        <?php if($success): ?>
            <div class="alert alert-success py-2"><?php echo $success; ?></div>
            <div class="text-center mt-4">
                <a href="login.php" class="btn btn-primary w-100">Go to Sign In</a>
            </div>
        <?php else: ?>
            <form method="post">
                <div class="mb-3">
                    <label class="form-label">Email Address</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                        <input type="email" name="email" class="form-control" placeholder="customer@gmail.com" required value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Registered Mobile Number</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-telephone"></i></span>
                        <input type="text" name="phone" class="form-control" placeholder="0719108628" required value="<?php echo isset($_POST['phone']) ? htmlspecialchars($_POST['phone']) : ''; ?>">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">New Password</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-lock-fill"></i></span>
                        <input type="password" name="new_password" class="form-control" placeholder="••••••••" minlength="8" required>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="form-label">Confirm New Password</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-lock-fill"></i></span>
                        <input type="password" name="confirm_password" class="form-control" placeholder="••••••••" minlength="8" required>
                    </div>
                </div>
                <div class="d-grid mb-3">
                    <button type="submit" name="reset_password" class="btn btn-primary">Reset Password</button>
                </div>
                <div class="text-center mt-3">
                    <a href="login.php" class="back-to-login"><i class="bi bi-arrow-left me-1"></i> Back to Login</a>
                </div>
            </form>
        <?php endif; ?>
    </div>
</div>

</body>
</html>
