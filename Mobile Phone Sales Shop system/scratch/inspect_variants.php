<?php
include('config/db.php');

$res = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM tblproduct_variants");
$cnt = mysqli_fetch_assoc($res)['cnt'];
echo "Total Product Variants: $cnt\n\n";

$res2 = mysqli_query($conn, "SELECT v.ID, p.ProductName, v.Price, v.Stock FROM tblproduct_variants v JOIN tblproducts p ON v.ProductId = p.ID LIMIT 10");
while ($row = mysqli_fetch_assoc($res2)) {
    echo "ID: {$row['ID']} - Name: {$row['ProductName']} - Price: {$row['Price']} - Stock: {$row['Stock']}\n";
}
