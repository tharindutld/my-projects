<?php
/**
 * auth_customer.php
 * Include at the top of any customer-protected page.
 * Redirects to login.php if the customer is not logged in.
 */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (empty($_SESSION['msmsuid'])) {
    // Store intended destination so we can redirect back after login
    $_SESSION['redirect_after_login'] = $_SERVER['REQUEST_URI'];
    header('Location: ' . str_repeat('../', substr_count($_SERVER['PHP_SELF'], '/') - 2) . 'login.php');
    exit();
}
