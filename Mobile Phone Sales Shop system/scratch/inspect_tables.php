<?php
include('config/db.php');

$tables = ['tbluser', 'tbl_order_master', 'tbl_order_items', 'tbl_repairs'];
foreach ($tables as $t) {
    echo "=== Table: $t ===\n";
    $res = mysqli_query($conn, "DESCRIBE $t");
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            echo "{$row['Field']} - {$row['Type']} - Null: {$row['Null']} - Key: {$row['Key']} - Default: {$row['Default']}\n";
        }
    } else {
        echo "Error: Could not describe table $t\n";
    }
    echo "\n";
}
