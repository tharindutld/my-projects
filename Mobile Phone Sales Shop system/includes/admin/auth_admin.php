<?php
/**
 * auth_admin.php
 * Include at the top of every admin-protected page.
 *
 * Usage (basic – any logged-in staff):
 *   include('../includes/admin/auth_admin.php');
 *
 * Usage (role-restricted – Admin only):
 *   $required_roles = ['Admin'];
 *   include('../includes/admin/auth_admin.php');
 */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Calculate relative path to project root based on file depth
$depth = substr_count(str_replace('\\', '/', $_SERVER['PHP_SELF']), '/') - 2;
$rel   = str_repeat('../', $depth);

// 1. Check if staff session exists
if (empty($_SESSION['imsaid'])) {
    header('Location: ' . $rel . 'admin/login.php');
    exit();
}

// 2. Load role and name from DB if not already cached in session
if (empty($_SESSION['admin_role']) || empty($_SESSION['admin_name'])) {
    if (!isset($conn)) {
        include_once $rel . 'config/db.php';
    }
    $sid  = (int) $_SESSION['imsaid'];
    $stmt = $conn->prepare("SELECT first_name, last_name, role, status FROM staff_users WHERE id = ?");
    $stmt->bind_param("i", $sid);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$res || $res['status'] !== 'Active') {
        // Account deactivated – force logout
        session_destroy();
        header('Location: ' . $rel . 'admin/login.php');
        exit();
    }
    $_SESSION['admin_role'] = $res['role'];
    $_SESSION['admin_name'] = trim($res['first_name'] . ' ' . $res['last_name']);
}

// 3. Optional role restriction: set $required_roles = ['Admin'] before including this file
if (!empty($required_roles) && !in_array($_SESSION['admin_role'], $required_roles)) {
    // Forbidden – redirect to dashboard with an error
    $_SESSION['access_error'] = "You do not have permission to access that page.";
    header('Location: ' . $rel . 'admin/dashboard.php');
    exit();
}

$admin_role = $_SESSION['admin_role'] ?? '';
