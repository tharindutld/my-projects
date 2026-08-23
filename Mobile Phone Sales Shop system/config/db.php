<?php
$host = "localhost";
$username = "root";
$password = ""; // Your database password
$database = "mobile_store_db"; // Your database name

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Ensure character set is utf8mb4 for modern text support
$conn->set_charset("utf8mb4");

// Set default timezone to Sri Lanka Local Time (Asia/Colombo)
date_default_timezone_set('Asia/Colombo');
$conn->query("SET time_zone = '+05:30'");

// Ensure Status column exists in tbluser and SimType exists in tblproducts
if (!function_exists('ensureUserStatusColumn')) {
    function ensureUserStatusColumn($conn) {
        static $checked = false;
        if (!$checked && isset($conn)) {
            $chk_col = mysqli_query($conn, "SHOW COLUMNS FROM tbluser LIKE 'Status'");
            if ($chk_col && mysqli_num_rows($chk_col) == 0) {
                mysqli_query($conn, "ALTER TABLE tbluser ADD COLUMN Status enum('Active','Inactive') NOT NULL DEFAULT 'Active'");
            }
            $chk_sim = mysqli_query($conn, "SHOW COLUMNS FROM tblproducts LIKE 'SimType'");
            if ($chk_sim && mysqli_num_rows($chk_sim) == 0) {
                mysqli_query($conn, "ALTER TABLE tblproducts ADD COLUMN SimType varchar(50) NULL DEFAULT 'Dual SIM' AFTER ModelNumber");
            }
            
            // Check and update tbl_stock_imeis schema
            $chk_imei = mysqli_query($conn, "SHOW COLUMNS FROM tbl_stock_imeis LIKE 'IMEI'");
            if ($chk_imei && $row_imei = mysqli_fetch_assoc($chk_imei)) {
                if ($row_imei['Null'] === 'NO') {
                    mysqli_query($conn, "ALTER TABLE tbl_stock_imeis MODIFY COLUMN IMEI varchar(50) NULL");
                }
            }
            $chk_serial = mysqli_query($conn, "SHOW COLUMNS FROM tbl_stock_imeis LIKE 'SerialNumber'");
            if ($chk_serial && mysqli_num_rows($chk_serial) == 0) {
                mysqli_query($conn, "ALTER TABLE tbl_stock_imeis ADD COLUMN SerialNumber varchar(50) DEFAULT NULL AFTER IMEI");
                mysqli_query($conn, "ALTER TABLE tbl_stock_imeis ADD INDEX idx_serial (SerialNumber)");
            }

            // Check and add OrderRating column (1-5 customer rating for completed orders)
            $chk_rating = mysqli_query($conn, "SHOW COLUMNS FROM tbl_order_master LIKE 'OrderRating'");
            if ($chk_rating && mysqli_num_rows($chk_rating) == 0) {
                mysqli_query($conn, "ALTER TABLE tbl_order_master ADD COLUMN OrderRating TINYINT UNSIGNED NULL DEFAULT NULL AFTER DeliveryStatus");
            }
            $checked = true;
        }
    }
}
ensureUserStatusColumn($conn);

// Shared Order Number Generator
if (!function_exists('generateOrderNumber')) {
    function generateOrderNumber($prefix = 'ORD-') {
        return $prefix . date('Ymd') . "-" . rand(1000, 9999);
    }
}

// Shared Cart Processing Function
if (!function_exists('processAddToCart')) {
    function processAddToCart($conn, $pid, $vid = null, $qty = 1, $redirect_page = 'cart.php') {
        if (session_status() === PHP_SESSION_NONE) { session_start(); }
        $pid = (int)$pid;
        $qty = (int)$qty;
        if ($qty < 1) $qty = 1;

        if (empty($vid)) {
            $var_q = mysqli_query($conn, "SELECT ID, Stock FROM tblproduct_variants WHERE ProductId='$pid' AND Stock > 0 ORDER BY Price ASC LIMIT 1");
            if ($var_q && mysqli_num_rows($var_q) > 0) {
                $vrow = mysqli_fetch_assoc($var_q);
                $vid = (int)$vrow['ID'];
                $available_stock = (int)$vrow['Stock'];
            } else {
                $_SESSION['error_msg'] = "Sorry, this mobile is currently out of stock!";
                return false;
            }
        } else {
            $vid = (int)$vid;
            $v_check = mysqli_query($conn, "SELECT Stock FROM tblproduct_variants WHERE ID='$vid'");
            $v_data = mysqli_fetch_assoc($v_check);
            $available_stock = (int)($v_data['Stock'] ?? 0);
            if ($available_stock <= 0) {
                $_SESSION['error_msg'] = "Sorry, this selected configuration is currently out of stock!";
                return false;
            }
            if ($qty > $available_stock) {
                $_SESSION['error_msg'] = "Requested quantity exceeds available stock ({$available_stock} available).";
                return false;
            }
        }

        if (empty($_SESSION['msmsuid'])) {
            $_SESSION['pending_cart'] = ['vid' => $vid, 'qty' => $qty];
            $_SESSION['pending_action'] = 'cart';
            header('Location: login.php');
            exit();
        }
        $userid = $_SESSION['msmsuid'];

        $check = mysqli_query($conn, "SELECT ID, Quantity FROM tblorders WHERE UserId='$userid' AND VariantId='$vid'");
        if (mysqli_num_rows($check) > 0) {
            $row = mysqli_fetch_assoc($check);
            $new_qty = $row['Quantity'] + $qty;
            if ($new_qty > $available_stock) {
                $_SESSION['error_msg'] = "Stock limit reached. Only {$available_stock} item(s) available.";
                header("Location: $redirect_page");
                exit();
            }
            $query = mysqli_query($conn, "UPDATE tblorders SET Quantity='$new_qty' WHERE ID='{$row['ID']}'");
        } else {
            $query = mysqli_query($conn, "INSERT INTO tblorders (UserId, VariantId, Quantity) VALUES ('$userid', '$vid', '$qty')");
        }

        if ($query) {
            $_SESSION['success_msg'] = "Mobile added to your cart!";
        } else {
            $_SESSION['error_msg'] = "Something went wrong. Please try again.";
        }
        header("Location: $redirect_page");
        exit();
    }
}

// Shared Wishlist Processing Function
if (!function_exists('processAddToWishlist')) {
    function processAddToWishlist($conn, $wpid) {
        if (session_status() === PHP_SESSION_NONE) { session_start(); }
        $wpid = (int)$wpid;
        if (empty($_SESSION['msmsuid'])) {
            $_SESSION['pending_wishlist'] = $wpid;
            $_SESSION['pending_action'] = 'wishlist';
            header('Location: login.php');
            exit();
        }
        $userid = $_SESSION['msmsuid'];
        $check = mysqli_query($conn, "SELECT ID FROM tblwish WHERE UserId='$userid' AND ProductId='$wpid'");
        if (mysqli_num_rows($check) > 0) {
            $_SESSION['error_msg'] = "This item is already in your wishlist!";
        } else {
            $query = mysqli_query($conn, "INSERT INTO tblwish (UserId, ProductId) VALUES ('$userid', '$wpid')");
            if ($query) {
                $_SESSION['success_msg'] = "Mobile added to your wishlist!";
            } else {
                $_SESSION['error_msg'] = "Something went wrong. Please try again.";
            }
        }
        header('Location: wishlist.php');
        exit();
    }
}
?>