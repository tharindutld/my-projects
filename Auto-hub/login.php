<?php
    session_start();
    include 'db.php'; // Database connection

$login_error = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
    $password = trim($_POST['password']);

    if (empty($email) || empty($password)) {
        $login_error = "Both fields are required.";
    } else {
        $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();

            if (password_verify($password, $user['password'])) {
                // Login success
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['username'];

                header("Location: daily_log.php"); // Redirect after login
                exit;
            } else {
                $login_error = "Invalid password.";
            }
        } else {
            $login_error = "No account found with that email.";
        }
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Customer Login - AutoHub</title>
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

        .login-container {
            background: #1e1e1e;
            padding: 40px 35px;
            border-radius: 12px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0px 4px 15px rgba(0,0,0,0.6);
        }

        h2 {
            color: #00bcd4;
            text-align: center;
            margin-bottom: 25px;
        }

        label {
            display: block;
            margin-bottom: 6px;
            font-weight: bold;
        }

        input {
            width: 100%;
            padding: 12px;
            margin-bottom: 18px;
            border-radius: 8px;
            border: none;
            background: #2a2a2a;
            color: #fff;
            font-size: 16px;
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
            font-size: 14px;
            transition: 0.3s;
            box-sizing: border-box;   /* NEW: includes padding/border in width */
            display: block;           /* NEW: ensures same layout */
            font-family: inherit;     /* NEW: matches fonts of both */
            line-height: normal;      /* NEW: fixes height differences */
        }

        button:hover {
            background: #0097a7;
        }

        .error {
            background-color: #f44336;
            color: #fff;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
            font-weight: bold;
        }

        .register-link {
            text-align: center;
            margin-top: 15px;
            font-size: 14px;
        }

        .register-link a {
            color: #00bcd4;
            text-decoration: none;
            font-weight: bold;
        }

        .register-link a:hover {
            text-decoration: underline;
        }

        .custom-alert-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
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

        .custom-alert h3 {
            margin: 0 0 10px;
            font-size: 18px;
            font-weight: bold;
            color: #e53935;
        }

        .custom-alert p {
            font-size: 15px;
            color: #333;
            margin-bottom: 15px;
        }

        .custom-alert button {
            background: #e53935;
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        }

        .custom-alert button:hover {
            background: #c62828;
        }
    </style>
</head>
<body>

<div class="login-container">
    <h2>Customer Login</h2>

    <?php
    if (!empty($login_error)) {
        echo "<div class='error'>$login_error</div>";
    }
    ?>

    <form method="POST" onsubmit="return validateLogin()">
        <label>Email:</label>
        <input type="email" name="email" id="email" placeholder="Enter your email">

        <label>Password:</label>
        <input type="password" name="password" id="password" placeholder="Enter your password">

        <button type="submit">Login</button>
    </form>

    <div class="register-link">
        Don't have an account? <a href="register.php">Register Here</a>
    </div>
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

function validateLogin() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email) {
        showAlert("Validation Error", "Email is required.");
        return false;
    }
    if (!password) {
        showAlert("Validation Error", "Password is required.");
        return false;
    }
    return true;
}
</script>

</body>
</html>

<?php
include 'footer.php';
?>
