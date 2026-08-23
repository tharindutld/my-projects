<?php
include('config/db.php');

$res = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM tbluser");
$cnt = mysqli_fetch_assoc($res)['cnt'];
echo "Total Registered Users: $cnt\n";
