<?php
session_start();
include("../config/db.php");
$required_roles = ['Admin'];
include("../includes/admin/auth_admin.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $id = intval($_POST['id'] ?? 0);
    $first_name = trim($_POST['first_name'] ?? '');
    $last_name = trim($_POST['last_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $gender = $_POST['gender'] ?? '';
    $birth_date = $_POST['birth_date'] ?? '';
    $role = $_POST['role'] ?? '';
    $status = $_POST['status'] ?? '';
    $new_password = $_POST['new_password'] ?? '';

    // Server-Side Validations
    $error_msg = null;
    if (empty($id)) {
        $error_msg = "Invalid staff identifier.";
    } elseif (empty($first_name) || empty($last_name) || empty($email) || empty($phone) || empty($gender) || empty($birth_date) || empty($role) || empty($status)) {
        $error_msg = "All required fields must be filled.";
    } elseif (!preg_match("/^[a-zA-Z\s]+$/", $first_name) || strlen($first_name) < 2 || strlen($first_name) > 50) {
        $error_msg = "First name must contain only letters and spaces (2-50 characters).";
    } elseif (!preg_match("/^[a-zA-Z\s]+$/", $last_name) || strlen($last_name) < 2 || strlen($last_name) > 50) {
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
    } elseif (!empty($new_password) && strlen($new_password) < 8) {
        $error_msg = "New password must be at least 8 characters long.";
    } else {
        // Validate birth date
        try {
            $birth = new DateTime($birth_date);
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

    if ($error_msg !== null) {
        $_SESSION['error'] = $error_msg;
        header("Location: adm_edit_staff.php?id=$id");
        exit();
    }

    try {
        // Check for duplicate email manually first (excluding current user)
        $chk = $conn->prepare("SELECT id FROM staff_users WHERE email = ? AND id != ?");
        if ($chk) {
            $chk->bind_param("si", $email, $id);
            $chk->execute();
            $chk->store_result();
            if ($chk->num_rows > 0) {
                $_SESSION['error'] = "An account with this email already exists.";
                $chk->close();
                header("Location: adm_edit_staff.php?id=$id");
                exit();
            }
            $chk->close();
        }

        // Determine query based on whether password needs updating
        if (!empty($new_password)) {
            // Update WITH new password
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
            $sql = "UPDATE staff_users SET first_name=?, last_name=?, email=?, phone=?, gender=?, birth_date=?, role=?, status=?, password=? WHERE id=?";
            $stmt = $conn->prepare($sql);
            if ($stmt) {
                $stmt->bind_param("sssssssssi", $first_name, $last_name, $email, $phone, $gender, $birth_date, $role, $status, $hashed_password, $id);
            }
        } else {
            // Update WITHOUT touching the password
            $sql = "UPDATE staff_users SET first_name=?, last_name=?, email=?, phone=?, gender=?, birth_date=?, role=?, status=? WHERE id=?";
            $stmt = $conn->prepare($sql);
            if ($stmt) {
                $stmt->bind_param("ssssssssi", $first_name, $last_name, $email, $phone, $gender, $birth_date, $role, $status, $id);
            }
        }

        if ($stmt) {
            if ($stmt->execute()) {
                $_SESSION['success'] = "Staff profile updated successfully!";
                $stmt->close();
                header("Location: adm_view_staff.php");
                exit();
            } else {
                $_SESSION['error'] = "Update failed: " . $stmt->error;
                $stmt->close();
            }
        } else {
            $_SESSION['error'] = "Database preparation failed: " . $conn->error;
        }
    } catch (Exception $e) {
        if ($conn->errno == 1062) {
            $_SESSION['error'] = "An account with this email already exists.";
        } else {
            $_SESSION['error'] = "System error: " . $e->getMessage();
        }
    }

    header("Location: adm_edit_staff.php?id=$id");
    exit();
}
?>