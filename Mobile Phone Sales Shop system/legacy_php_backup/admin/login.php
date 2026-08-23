<?php
session_start();
include('../config/db.php');

$error = '';

if(isset($_POST['login'])) {
    $email = trim($_POST['email']);
    $password = $_POST['password']; 
    
    // 1. Check the new staff_users table using the email
    $stmt = $conn->prepare("SELECT id, role, password, status FROM staff_users WHERE email=?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        
        // 2. Safely verify the hashed password
        if(password_verify($password, $row['password'])) {
            
            // 3. Optional but recommended: Check if the staff member is Active
            if($row['status'] === 'Active') {
                // Clear any stale session values (like previous admin logins on the same browser)
                session_unset();
                
                $_SESSION['imsaid'] = $row['id'];
                $_SESSION['admin_role'] = $row['role'];
                
                // Redirect to dashboard (assuming both are in the /admin/ folder)
                header('Location: dashboard.php');
                exit();
            } else {
                $error = "Your account is currently inactive. Please contact an admin.";
            }
        } else {
            $error = "Invalid Email or Password.";
        }
    } else {
        $error = "Invalid Email or Password.";
    }
    $stmt->close();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Mobile Mart Management || Login</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
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
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            background: rgba(30, 41, 59, 0.65);
            backdrop-filter: blur(16px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .login-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        }

        .login-header {
            background: rgba(15, 23, 42, 0.5);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            color: white;
            padding: 35px 30px;
            text-align: center;
        }
        
        .login-header h4 {
            font-weight: 700;
            font-size: 1.6rem;
            letter-spacing: -0.5px;
        }
        
        .login-header p {
            color: #94a3b8;
            font-size: 0.95rem;
            font-weight: 400;
            margin-bottom: 0;
            margin-top: 5px;
        }

        .form-label {
            font-weight: 600;
            color: #f1f5f9;
            font-size: 0.9rem;
            margin-bottom: 6px;
        }

        .input-group-text {
            background-color: rgba(15, 23, 42, 0.4);
            border: 1.5px solid rgba(255, 255, 255, 0.15);
            border-right: none;
            color: #94a3b8;
            border-top-left-radius: 12px;
            border-bottom-left-radius: 12px;
            padding: 12px 15px;
        }

        .form-control {
            background-color: rgba(15, 23, 42, 0.4);
            border: 1.5px solid rgba(255, 255, 255, 0.15);
            border-top-right-radius: 12px;
            border-bottom-right-radius: 12px;
            padding: 12px 15px;
            font-size: 0.95rem;
            color: #f8fafc;
            transition: all 0.25s ease;
        }

        .form-control::placeholder {
            color: #64748b;
        }

        .form-control:focus {
            background-color: rgba(15, 23, 42, 0.6);
            border-color: #06b6d4;
            box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.25);
            color: #ffffff;
            outline: none;
        }

        .btn-cyan {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            border: none;
            border-radius: 12px;
            padding: 13px;
            font-weight: 600;
            font-size: 1rem;
            color: white;
            box-shadow: 0 8px 20px rgba(6, 182, 212, 0.25);
            transition: all 0.25s ease;
        }

        .btn-cyan:hover, .btn-cyan:focus {
            background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
            transform: translateY(-1px);
            box-shadow: 0 10px 25px rgba(6, 182, 212, 0.35);
        }

        .link-cyan {
            color: #22d3ee;
            font-weight: 600;
            transition: color 0.2s ease;
            text-decoration: none;
        }
        
        .link-cyan:hover {
            color: #67e8f9;
            text-decoration: underline !important;
        }

        .link-secondary-dark {
            color: #94a3b8;
            font-weight: 500;
            transition: color 0.2s ease;
            text-decoration: none;
        }

        .link-secondary-dark:hover {
            color: #cbd5e1;
        }
        
        .divider {
            height: 1px;
            background-color: rgba(255, 255, 255, 0.1);
            margin: 25px 0;
            position: relative;
        }
        
        .divider-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #1e293b;
            padding: 0 10px;
            color: #64748b;
            font-size: 0.8rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .back-to-store {
            color: #94a3b8;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.2s ease;
            text-decoration: none;
        }
        
        .back-to-store:hover {
            color: #f1f5f9;
        }
    </style>
</head>
<body>

<div class="card login-card">
    <div class="login-header">
        <h4 class="mb-0"><i class="bi bi-phone me-2 text-cyan"></i> Mobile Mart</h4>
        <p>Admin Control Panel</p>
    </div>
    <div class="card-body p-4">
        <?php if($error): ?>
            <div class="alert alert-danger py-2"><?php echo $error; ?></div>
        <?php endif; ?>

        <form method="post">
            <div class="mb-3">
                <label class="form-label">Email Address</label>
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                    <input type="email" name="email" class="form-control" placeholder="admin@store.com" required>
                </div>
            </div>
            <div class="mb-4">
                <label class="form-label">Password</label>
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-lock"></i></span>
                    <input type="password" name="password" class="form-control" placeholder="••••••••" required>
                </div>
            </div>
            <div class="d-grid mb-3">
                <button type="submit" name="login" class="btn btn-cyan">Sign In</button>
            </div>
            <div class="text-center mt-3">
                <a href="lost-password.php" class="link-secondary-dark small d-block mb-2">Lost password?</a>
                <p class="small mb-2" style="color: #94a3b8;">Are you a customer? <a href="../storefront/login.php" class="link-cyan">Customer Login</a></p>
                <div class="divider"><span class="divider-text">or</span></div>
                <a href="../storefront/index.php" class="back-to-store"><i class="bi bi-arrow-left me-1"></i> Back to Store</a>
            </div>
        </form>
    </div>
</div>

</body>
</html>