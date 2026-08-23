<?php
include('config/db.php');

$res = mysqli_query($conn, "SELECT id, first_name, last_name, role FROM staff_users");
while ($row = mysqli_fetch_assoc($res)) {
    echo "ID: {$row['id']} - Name: {$row['first_name']} {$row['last_name']} - Role: {$row['role']}\n";
}
