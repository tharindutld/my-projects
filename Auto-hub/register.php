<?php
include 'db.php'; // Database connection

$register_error = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = trim($_POST['username']);
    $email = trim($_POST['email']);
    $password = trim($_POST['password']);
    $confirm_password = trim($_POST['confirm_password']);

    // Validation
    if (empty($name) || empty($email) || empty($password) || empty($confirm_password)) {
        $register_error = "All fields are required.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $register_error = "Invalid email format.";
    } elseif ($password !== $confirm_password) {
        $register_error = "Passwords do not match.";
    } else {
        // Check if email already exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            $register_error = "Email already registered.";
        } else {
            // Insert user
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $name, $email, $hashed_password);
            
            if ($stmt->execute()) {
                // Success message
                echo "<div class='custom-success' id='successMessage' style='
        background-color: #4caf50;
        color: #fff;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        margin: 10px auto 20px;
        max-width:420px;
        font-weight:bold;
    '>
                        ✅ Registration successful! Redirecting to login...
                      </div>";

                echo "<script>
                        setTimeout(() => {
                            window.location.href = 'login.php';
                        }, 2000);
                      </script>";
                exit;
            } else {
                $register_error = "Database error: Could not register.";
            }
        }
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Customer Registration - AutoHub</title>
    <style>
        body { 
            background: #121212; 
            color: #fff; 
            font-family: Arial, sans-serif; 
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .register-container {
            background: #1e1e1e;
            padding: 20px 30px;
            border-radius: 12px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0px 4px 15px rgba(0,0,0,0.6);
        }
        h2 { color: #00bcd4; text-align: center; margin-bottom: 25px; }
        label { display: block; margin-bottom: 6px; font-weight: bold; }
        input {
            width: 100%;
            padding: 12px;
            margin-bottom: 18px;
            border-radius: 8px;
            border: none;
            background: #2a2a2a;
            color: #fff;
            font-size: 14px;
            box-sizing: border-box;   /* NEW: includes padding/border in width */
            display: block;           /* NEW: ensures same layout */
            font-family: inherit;     /* NEW: matches fonts of both */
            line-height: normal;      /* NEW: fixes height differences */
        }
        button {
            width: 100%;
            padding: 12px;
            background: #00bcd4;
            color: #121212;
            font-weight: bold;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: 0.3s;
            box-sizing: border-box;   /* NEW: includes padding/border in width */
            display: block;           /* NEW: ensures same layout */
            font-family: inherit;     /* NEW: matches fonts of both */
            line-height: normal;      /* NEW: fixes height differences */
            margin-bottom: 18px;
        }
        button:hover { background: #0097a7; }
        .error, .custom-success {
            color: #fff;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .error { background-color: #f44336; }
        .custom-success { background-color: #4caf50; margin-top: 10px; }
        .custom-alert-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        .custom-alert {
            background: #fff;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 350px;
            font-family: Arial, sans-serif;
        }
        .custom-alert h3 { margin: 0 0 10px; font-size: 18px; font-weight: bold; color: #e53935; }
        .custom-alert p { font-size: 15px; color: #333; margin-bottom: 15px; }
        .custom-alert button {
            background: #e53935;
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        }
        .custom-alert button:hover { background: #c62828; }
    </style>
</head>
<body>

<div class="register-container">
    <h2>Customer Registration</h2>

    <?php
    if (!empty($register_error)) {
        echo "<div class='error'>$register_error</div>";
    }
    ?>

    <form method="POST" onsubmit="return validateRegistration()">
        <label>Name:</label>
        <input type="text" name="username" id="name" placeholder="Enter your full name">

        <label>Email:</label>
        <input type="email" name="email" id="email" placeholder="Enter your email">

        <label>Password:</label>
        <input type="password" name="password" id="password" placeholder="Enter password">

        <label>Confirm Password:</label>
        <input type="password" name="confirm_password" id="confirm_password" placeholder="Confirm password">

        <button type="submit">Register</button>
    </form>
</div>

<script>
function showAlert(title, message) {
    const overlay = document.createElement("div");
    overlay.className = "custom-alert-overlay";
    overlay.innerHTML = `
        <div class="custom-alert">
            <h3>${title}</h3>
            <p>${message}</p>
            <button onclick="this.closest('.custom-alert-overlay').remove()">OK</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function validateRegistration() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirm_password = document.getElementById("confirm_password").value.trim();

    if (!username) { showAlert("Validation Error", "Name is required."); return false; }
    if (!email) { showAlert("Validation Error", "Email is required."); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { showAlert("Validation Error", "Enter a valid email address."); return false; }
    if (!password) { showAlert("Validation Error", "Password is required."); return false; }
    if (!confirm_password) { showAlert("Validation Error", "Confirm password is required."); return false; }
    if (password !== confirm_password) { showAlert("Validation Error", "Passwords do not match."); return false; }

    return true;
}
</script>

<?php include 'footer.php'; ?>
</body>
</html>
