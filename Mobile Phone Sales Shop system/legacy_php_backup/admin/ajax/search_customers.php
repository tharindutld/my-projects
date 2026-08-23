<?php
session_start();
include('../../config/db.php');
$required_roles = ['Admin', 'Sales person'];
include('../../includes/admin/auth_admin.php');

header('Content-Type: application/json');

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if (strlen($q) < 1) {
    echo json_encode([]);
    exit();
}

$like = "%$q%";
$stmt = $conn->prepare(
    "SELECT ID, FirstName, LastName, Email, MobileNumber
     FROM tbluser
     WHERE Email != 'walkin@mobilestore.com'
       AND (FirstName LIKE ? OR LastName LIKE ? OR Email LIKE ? OR MobileNumber LIKE ?)
     ORDER BY FirstName ASC
     LIMIT 15"
);
$stmt->bind_param("ssss", $like, $like, $like, $like);
$stmt->execute();
$result = $stmt->get_result();

$customers = [];
while ($row = $result->fetch_assoc()) {
    $customers[] = [
        'id'    => (int)$row['ID'],
        'name'  => $row['FirstName'] . ' ' . $row['LastName'],
        'email' => $row['Email'],
        'phone' => $row['MobileNumber']
    ];
}
$stmt->close();

echo json_encode($customers);
