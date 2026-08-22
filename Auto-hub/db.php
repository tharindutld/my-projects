<?php


// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);


$host = "sql100.infinityfree.com";                                 
$user = "if0_40565397";                           
$password = "THlUmka4AjSHKLp"; 
$dbname = "if0_40565397_logs_db";                     

// Create connection
$conn = new mysqli($host, $user, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to UTF-8
$conn->set_charset("utf8");

// Optional: test connection
// echo "Connected successfully!";
?>
