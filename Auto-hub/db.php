<?php
// ============================
// Database connection for Railway
// ============================

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Railway DB credentials
$host = "metro.proxy.rlwy.net";          // Your Railway host
$port = 31032;                            // Railway port
$user = "root";                           // Railway username
$password = "WtYTURoPxNfeJErihIWtzZsUMJTgkiGM"; // Railway password
$dbname = "railway";                      // Exact database name from Railway dashboard

// Create connection
$conn = new mysqli($host, $user, $password, $dbname, $port);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to UTF-8
$conn->set_charset("utf8");

// Optional: test connection
// echo "Connected successfully!";
?>
