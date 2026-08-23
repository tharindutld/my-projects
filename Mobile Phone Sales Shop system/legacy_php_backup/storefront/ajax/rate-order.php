<?php
session_start();
header('Content-Type: application/json');

include('../../config/db.php');

if (empty($_SESSION['msmsuid'])) {
    echo json_encode(['success' => false, 'message' => 'Please log in to rate your order.']);
    exit();
}

$userid = $_SESSION['msmsuid'];
$order_id = isset($_POST['order_id']) ? (int)$_POST['order_id'] : 0;
$rating = isset($_POST['rating']) ? (int)$_POST['rating'] : 0;

if ($order_id <= 0 || $rating < 1 || $rating > 5) {
    echo json_encode(['success' => false, 'message' => 'Invalid rating request.']);
    exit();
}

// Only allow rating orders that belong to this user and are Completed
$stmt = $conn->prepare("SELECT ID FROM tbl_order_master WHERE ID = ? AND UserId = ? AND OrderStatus = 'Completed'");
$stmt->bind_param("ii", $order_id, $userid);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();
    echo json_encode(['success' => false, 'message' => 'Order not found or not eligible for rating.']);
    exit();
}
$stmt->close();

$update = $conn->prepare("UPDATE tbl_order_master SET OrderRating = ? WHERE ID = ? AND UserId = ?");
$update->bind_param("iii", $rating, $order_id, $userid);

if ($update->execute()) {
    echo json_encode(['success' => true, 'message' => 'Thank you for rating your order!', 'rating' => $rating]);
} else {
    echo json_encode(['success' => false, 'message' => 'Something went wrong. Please try again.']);
}
$update->close();
