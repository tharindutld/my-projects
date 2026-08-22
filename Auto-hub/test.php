<?php
$host = "sql100.infinityfree.com";
$user = "if0_40565397_user";  // check exact username
$pass = "THlUmka4AjSHKLp";      // exact password
$db   = "if0_40565397_logs_db";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully!";
?>
