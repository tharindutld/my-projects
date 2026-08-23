<?php
session_start();
error_reporting(0);
include('../config/db.php');
include_once('../includes/components/pricing_helper.php');

if(empty($_SESSION['msmsuid'])) {
    header('Location: login.php');
    exit();
}

$userid = $_SESSION['msmsuid'];

// Remove item from wishlist
if(isset($_GET['remove'])) {
    $rid = (int)$_GET['remove'];
    mysqli_query($conn, "DELETE FROM tblwish WHERE ID='$rid' AND UserId='$userid'");
    $_SESSION['success_msg'] = "Item removed from wishlist.";
    header("Location: wishlist.php");
    exit();
}

// Move item from wishlist to cart
if(isset($_GET['movetocart'])) {
    $wpid = (int)$_GET['movetocart'];
    $wid  = (int)$_GET['wid'];
    
    // Find the cheapest/first variant of this product
    $var_q = mysqli_query($conn, "SELECT ID FROM tblproduct_variants WHERE ProductId='$wpid' ORDER BY Price ASC LIMIT 1");
    if(mysqli_num_rows($var_q) > 0) {
        $vid = (int)mysqli_fetch_assoc($var_q)['ID'];
    } else {
        $_SESSION['error_msg'] = "This product configuration is currently unavailable.";
        header('Location: wishlist.php');
        exit();
    }
    
    // Check if item already exists in cart
    $check = mysqli_query($conn, "SELECT ID, Quantity FROM tblorders WHERE UserId='$userid' AND VariantId='$vid'");
    if(mysqli_num_rows($check) > 0) {
        $row = mysqli_fetch_assoc($check);
        $new_qty = $row['Quantity'] + 1;
        $query = mysqli_query($conn, "UPDATE tblorders SET Quantity='$new_qty' WHERE ID='{$row['ID']}'");
    } else {
        $query = mysqli_query($conn, "INSERT INTO tblorders (UserId, VariantId, Quantity) VALUES ('$userid', '$vid', 1)");
    }
    
    // Remove from wishlist
    mysqli_query($conn, "DELETE FROM tblwish WHERE ID='$wid' AND UserId='$userid'");
    $_SESSION['success_msg'] = "Item moved to cart!";
    header("Location: wishlist.php");
    exit();
}

// Fetch wishlist items with product details
$wish_query = mysqli_query($conn,
    "SELECT w.ID as WishID, p.ID as PID, p.ProductName, p.BrandName, p.ModelNumber, MIN(v.Price) as Price, p.DiscountPercent, p.DiscountStartDate, p.DiscountEndDate, p.Image1, SUM(v.Stock) as Stock
     FROM tblwish w
     JOIN tblproducts p ON w.ProductId = p.ID
     JOIN tblproduct_variants v ON p.ID = v.ProductId
     JOIN tblbrand b ON p.BrandName = b.BrandName
     JOIN tblcategory c ON p.CategoryName = c.CategoryName
     WHERE w.UserId = '$userid' AND p.Status = '1' AND b.Status = '1' AND c.Status = '1'
     GROUP BY p.ID
     ORDER BY w.Date DESC"
);

$wish_items = [];
while($row = mysqli_fetch_assoc($wish_query)) {
    $wish_items[] = $row;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mart | My Wishlist</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f8f9fa; }
        .navbar-custom { box-shadow: 0 2px 10px rgba(0,0,0,0.05); font-weight: 500; }
        .wish-product-card { border: none; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); transition: transform 0.25s, box-shadow 0.25s; height: 100%; }
        .wish-product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 28px rgba(0,0,0,0.1); }
        .product-img-wrap { background: #f7f7f7; border-radius: 12px 12px 0 0; padding: 20px; text-align: center; }
        .product-img-wrap img { max-height: 160px; object-fit: contain; width: 100%; }
        .empty-state { text-align: center; padding: 80px 20px; border: none; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .empty-state i { font-size: 5rem; color: #dee2e6; margin-bottom: 20px; }
        .page-title-bar { background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%); color: white; padding: 30px 0; margin-bottom: 30px; }
    </style>
</head>
<body>
<?php include_once('../includes/storefront/front_header.php'); ?>

<div class="page-title-bar">
    <div class="container">
        <h2 class="mb-0 fw-bold"><i class="fa-regular fa-heart me-3"></i>My Wishlist</h2>
        <small class="text-white-50"><?php echo count($wish_items); ?> saved item(s)</small>
    </div>
</div>

<div class="container pb-5">
    <?php if(empty($wish_items)): ?>
        <div class="card empty-state">
            <i class="fa-regular fa-heart"></i>
            <h4 class="text-muted fw-semibold">Your wishlist is empty</h4>
            <p class="text-muted">Save your favourite products to revisit them later.</p>
            <a href="shop-mobile.php" class="btn btn-danger rounded-pill px-5 mt-2">Browse Products</a>
        </div>
    <?php else: ?>
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
            <?php foreach($wish_items as $item): ?>
                <div class="col">
                    <div class="card wish-product-card">
                        <div class="product-img-wrap">
                            <a href="single.php?pid=<?php echo $item['PID']; ?>">
                                <img src="../uploads/products/<?php echo htmlspecialchars($item['Image1']); ?>" alt="<?php echo htmlspecialchars($item['ProductName']); ?>">
                            </a>
                        </div>
                        <div class="card-body p-3">
                            <p class="text-muted small text-uppercase mb-1"><?php echo htmlspecialchars($item['BrandName']); ?></p>
                            <h6 class="fw-bold mb-1">
                                <a href="single.php?pid=<?php echo $item['PID']; ?>" class="text-decoration-none text-dark">
                                    <?php echo htmlspecialchars($item['ProductName']); ?>
                                </a>
                            </h6>
                            <p class="text-muted small mb-2"><?php echo htmlspecialchars($item['ModelNumber']); ?></p>
                            <?php echo renderPriceHTML($item); ?>
                            <div class="d-flex flex-column gap-2">
                                <a href="wishlist.php?movetocart=<?php echo $item['PID']; ?>&wid=<?php echo $item['WishID']; ?>" class="btn btn-dark btn-sm rounded-pill confirm-link" data-confirm-message="Move '<?php echo htmlspecialchars($item['ProductName']); ?>' to your cart?">
                                    <i class="fa-solid fa-cart-shopping me-1"></i> Move to Cart
                                </a>
                                <a href="wishlist.php?remove=<?php echo $item['WishID']; ?>" class="btn btn-outline-danger btn-sm rounded-pill confirm-link confirm-delete" data-confirm-message="Remove '<?php echo htmlspecialchars($item['ProductName']); ?>' from wishlist?">
                                    <i class="fa-solid fa-trash-can me-1"></i> Remove
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<?php include_once('../includes/storefront/front_footer.php'); ?>
